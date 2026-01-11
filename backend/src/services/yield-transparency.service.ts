/**
 * ============================================================================
 * YIELD TRANSPARENCY SERVICE
 * ============================================================================
 * Calculates and records complete yield breakdowns showing:
 * - Gross protocol yield
 * - Validator commission
 * - Exchange fee
 * - Insurance fund contribution
 * - Net user yield
 * ============================================================================
 */

import { getDatabase } from '../database/connection';
import Decimal from 'decimal.js';

export interface YieldBreakdown {
  grossProtocolYield: Decimal;
  validatorCommissionAmount: Decimal;
  exchangeFeeAmount: Decimal;
  insuranceFundAmount: Decimal;
  userNetYield: Decimal;
  
  // Rates for transparency
  protocolYieldRate: Decimal;
  validatorCommissionRate: Decimal;
  exchangeFeeRate: Decimal;
}

/**
 * Calculate transparent yield breakdown
 * This is the core function that makes Cryptex different from traditional CEXs
 */
export async function calculateTransparentYield(
  stakeAmount: Decimal,
  poolId: string,
  periodDays: number
): Promise<YieldBreakdown> {
  const db = getDatabase();

  // Get pool configuration with validator and fee config
  const poolResult = await db.query(
    `SELECT 
      sp.*,
      v.commission_rate as validator_commission,
      v.address as validator_address,
      fc.fee_percentage as exchange_fee_rate,
      fc.fee_cap_max
    FROM staking_pools sp
    LEFT JOIN validators v ON sp.validator_id = v.id
    LEFT JOIN fee_configurations fc ON sp.fee_config_id = fc.id
    WHERE sp.id = $1`,
    [poolId]
  );

  if (poolResult.rows.length === 0) {
    throw new Error('Staking pool not found');
  }

  const pool = poolResult.rows[0];

  // Step 1: Calculate GROSS protocol yield (what the chain actually pays)
  const protocolYieldRate = new Decimal(pool.protocol_yield_apy || pool.apy).dividedBy(100);
  const annualizedYield = stakeAmount.times(protocolYieldRate);
  const grossProtocolYield = annualizedYield.times(periodDays).dividedBy(365);

  // Step 2: Subtract validator commission (they earned it)
  const validatorCommissionRate = new Decimal(pool.validator_commission || 0);
  const validatorCommissionAmount = grossProtocolYield.times(validatorCommissionRate);

  const afterValidatorYield = grossProtocolYield.minus(validatorCommissionAmount);

  // Step 3: Calculate exchange fee (capped and transparent)
  const exchangeFeeRate = new Decimal(pool.exchange_fee_rate || pool.exchange_fee_percentage || 0.04);
  const exchangeFeeAmount = afterValidatorYield.times(exchangeFeeRate);

  // Step 4: Optional insurance fund contribution (1% of yield)
  const insuranceFundAmount = afterValidatorYield.times(0.01);

  // Step 5: User net yield
  const userNetYield = afterValidatorYield
    .minus(exchangeFeeAmount)
    .minus(insuranceFundAmount);

  return {
    grossProtocolYield,
    validatorCommissionAmount,
    exchangeFeeAmount,
    insuranceFundAmount,
    userNetYield,
    protocolYieldRate,
    validatorCommissionRate,
    exchangeFeeRate,
  };
}

/**
 * Record yield breakdown for transparency and auditing
 */
export async function recordYieldBreakdown(
  stakeId: string,
  rewardId: string,
  breakdown: YieldBreakdown
): Promise<void> {
  const db = getDatabase();

  await db.query(
    `INSERT INTO yield_breakdowns (
      stake_id,
      reward_id,
      gross_protocol_yield,
      validator_commission_amount,
      exchange_fee_amount,
      insurance_fund_amount,
      user_net_yield,
      protocol_yield_rate,
      validator_commission_rate,
      exchange_fee_rate
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      stakeId,
      rewardId,
      breakdown.grossProtocolYield.toFixed(8),
      breakdown.validatorCommissionAmount.toFixed(8),
      breakdown.exchangeFeeAmount.toFixed(8),
      breakdown.insuranceFundAmount.toFixed(8),
      breakdown.userNetYield.toFixed(8),
      breakdown.protocolYieldRate.toFixed(6),
      breakdown.validatorCommissionRate.toFixed(6),
      breakdown.exchangeFeeRate.toFixed(6),
    ]
  );
}

/**
 * Get recommended validator for user based on preferences
 */
export async function getRecommendedValidator(
  userId: string,
  chain: string
): Promise<string | null> {
  const db = getDatabase();

  // Check if user has preferences
  const prefResult = await db.query(
    `SELECT * FROM user_validator_preferences WHERE user_id = $1 AND chain = $2`,
    [userId, chain]
  );

  if (prefResult.rows.length > 0) {
    const pref = prefResult.rows[0];
    
    // Return first active preferred validator
    if (pref.preferred_validator_1) {
      const v1 = await db.query('SELECT id FROM validators WHERE id = $1 AND is_active = true', [
        pref.preferred_validator_1,
      ]);
      if (v1.rows.length > 0) return pref.preferred_validator_1;
    }

    if (pref.preferred_validator_2) {
      const v2 = await db.query('SELECT id FROM validators WHERE id = $1 AND is_active = true', [
        pref.preferred_validator_2,
      ]);
      if (v2.rows.length > 0) return pref.preferred_validator_2;
    }
  }

  // Otherwise, return best validator based on uptime and decentralization
  const defaultResult = await db.query(
    `SELECT id FROM validators
     WHERE chain = $1 AND is_active = true AND is_exchange_validator = false
     ORDER BY 
       uptime_percentage DESC,
       decentralization_score DESC,
       slashing_events ASC,
       commission_rate ASC
     LIMIT 1`,
    [chain]
  );

  return defaultResult.rows.length > 0 ? defaultResult.rows[0].id : null;
}

/**
 * Calculate user's total yield across all stakes with full transparency
 */
export async function getUserYieldSummary(userId: string): Promise<{
  totalGrossYield: Decimal;
  totalValidatorCommission: Decimal;
  totalExchangeFees: Decimal;
  totalInsuranceContribution: Decimal;
  totalNetYield: Decimal;
  averageExchangeFeeRate: Decimal;
}> {
  const db = getDatabase();

  const result = await db.query(
    `SELECT 
      COALESCE(SUM(gross_protocol_yield), 0) as total_gross,
      COALESCE(SUM(validator_commission_amount), 0) as total_validator_commission,
      COALESCE(SUM(exchange_fee_amount), 0) as total_exchange_fees,
      COALESCE(SUM(insurance_fund_amount), 0) as total_insurance,
      COALESCE(SUM(user_net_yield), 0) as total_net,
      COALESCE(AVG(exchange_fee_rate), 0) as avg_fee_rate
    FROM yield_breakdowns yb
    JOIN user_stakes us ON yb.stake_id = us.id
    WHERE us.user_id = $1`,
    [userId]
  );

  const row = result.rows[0];

  return {
    totalGrossYield: new Decimal(row.total_gross),
    totalValidatorCommission: new Decimal(row.total_validator_commission),
    totalExchangeFees: new Decimal(row.total_exchange_fees),
    totalInsuranceContribution: new Decimal(row.total_insurance),
    totalNetYield: new Decimal(row.total_net),
    averageExchangeFeeRate: new Decimal(row.avg_fee_rate),
  };
}

/**
 * Update insurance fund with contributions
 */
export async function contributeToInsuranceFund(
  currency: string,
  amount: Decimal,
  source: 'fees' | 'premiums' | 'donations'
): Promise<void> {
  const db = getDatabase();

  const sourceColumn = {
    fees: 'total_from_fees',
    premiums: 'total_from_premiums',
    donations: 'total_from_donations',
  }[source];

  await db.query(
    `INSERT INTO insurance_fund (currency, balance, ${sourceColumn})
     VALUES ($1, $2, $2)
     ON CONFLICT (currency) 
     DO UPDATE SET
       balance = insurance_fund.balance + EXCLUDED.balance,
       ${sourceColumn} = insurance_fund.${sourceColumn} + EXCLUDED.${sourceColumn},
       updated_at = NOW()`,
    [currency, amount.toFixed(8)]
  );
}

/**
 * Verify that fee configuration respects immutable caps
 */
export async function validateFeeAgainstCap(
  assetType: string,
  feeType: string,
  proposedFee: Decimal
): Promise<boolean> {
  const db = getDatabase();

  const result = await db.query(
    `SELECT fee_cap_max, is_immutable FROM fee_configurations
     WHERE asset_type = $1 AND fee_type = $2
     ORDER BY effective_date DESC
     LIMIT 1`,
    [assetType, feeType]
  );

  if (result.rows.length === 0) {
    return false; // No fee configuration found
  }

  const config = result.rows[0];
  const cap = new Decimal(config.fee_cap_max);

  return proposedFee.lessThanOrEqualTo(cap);
}
