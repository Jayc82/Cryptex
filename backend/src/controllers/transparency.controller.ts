import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabase } from '../database/connection';
import { AppError } from '../middleware/errorHandler';

/**
 * ============================================================================
 * TRANSPARENCY CONTROLLER
 * ============================================================================
 * Public endpoints that prove the exchange's trust model:
 * - Validator performance and selection
 * - Fee structures (immutable caps)
 * - Yield breakdowns
 * - Proof of reserves
 * - Airdrop distributions
 * ============================================================================
 */

// ============================================================================
// VALIDATOR REGISTRY
// ============================================================================

/**
 * Get all validators (PUBLIC - no auth required)
 * Shows on-chain addresses, performance, commission rates
 */
export async function getValidators(req: AuthRequest, res: Response) {
  try {
    const { chain, sortBy = 'uptime', minUptime, maxCommission } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM validators WHERE is_active = true';
    const params: any[] = [];
    let paramCount = 1;

    if (chain) {
      query += ` AND chain = $${paramCount}`;
      params.push(chain);
      paramCount++;
    }

    if (minUptime) {
      query += ` AND uptime_percentage >= $${paramCount}`;
      params.push(parseFloat(minUptime as string));
      paramCount++;
    }

    if (maxCommission) {
      query += ` AND commission_rate <= $${paramCount}`;
      params.push(parseFloat(maxCommission as string));
      paramCount++;
    }

    // Sorting
    const validSorts: Record<string, string> = {
      uptime: 'uptime_percentage DESC, slashing_events ASC',
      commission: 'commission_rate ASC',
      decentralization: 'decentralization_score DESC',
      stake: 'total_stake DESC',
    };

    query += ` ORDER BY ${validSorts[sortBy as string] || validSorts.uptime}`;

    const result = await db.query(query, params);

    res.json({
      validators: result.rows,
      count: result.rows.length,
      transparency_note: 'All validator addresses are publicly verifiable on-chain',
    });
  } catch (error) {
    throw new AppError('Failed to fetch validators', 500);
  }
}

/**
 * Get validator performance history (PUBLIC)
 */
export async function getValidatorHistory(req: AuthRequest, res: Response) {
  try {
    const { validatorId } = req.params;
    const { days = 30 } = req.query;
    const db = getDatabase();

    const result = await db.query(
      `SELECT 
        epoch_date,
        uptime_percentage,
        commission_rate,
        total_stake,
        delegator_count
      FROM validator_performance_history
      WHERE validator_id = $1
        AND epoch_date >= NOW() - INTERVAL '${parseInt(days as string)} days'
      ORDER BY epoch_date DESC`,
      [validatorId]
    );

    res.json({
      validator_id: validatorId,
      history: result.rows,
      period_days: days,
    });
  } catch (error) {
    throw new AppError('Failed to fetch validator history', 500);
  }
}

/**
 * Get user's validator preferences
 */
export async function getUserValidatorPreferences(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { chain } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        uvp.*,
        v1.name as validator_1_name,
        v2.name as validator_2_name,
        v3.name as validator_3_name
      FROM user_validator_preferences uvp
      LEFT JOIN validators v1 ON uvp.preferred_validator_1 = v1.id
      LEFT JOIN validators v2 ON uvp.preferred_validator_2 = v2.id
      LEFT JOIN validators v3 ON uvp.preferred_validator_3 = v3.id
      WHERE uvp.user_id = $1
    `;

    const params: any[] = [userId];

    if (chain) {
      query += ' AND uvp.chain = $2';
      params.push(chain);
    }

    const result = await db.query(query, params);

    res.json({
      preferences: result.rows,
    });
  } catch (error) {
    throw new AppError('Failed to fetch validator preferences', 500);
  }
}

/**
 * Set user's validator preferences
 */
export async function setValidatorPreferences(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const {
      chain,
      preferred_validator_1,
      preferred_validator_2,
      preferred_validator_3,
      uptime_weight,
      decentralization_weight,
      commission_weight,
      esg_weight,
      auto_rebalance,
    } = req.body;

    if (!chain) {
      throw new AppError('Chain is required', 400);
    }

    const db = getDatabase();

    // Verify validators exist
    if (preferred_validator_1) {
      const v = await db.query('SELECT id FROM validators WHERE id = $1 AND is_active = true', [
        preferred_validator_1,
      ]);
      if (v.rows.length === 0) throw new AppError('Invalid validator 1', 400);
    }

    const result = await db.query(
      `INSERT INTO user_validator_preferences (
        user_id, chain, preferred_validator_1, preferred_validator_2, preferred_validator_3,
        uptime_weight, decentralization_weight, commission_weight, esg_weight, auto_rebalance
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id, chain) 
      DO UPDATE SET
        preferred_validator_1 = EXCLUDED.preferred_validator_1,
        preferred_validator_2 = EXCLUDED.preferred_validator_2,
        preferred_validator_3 = EXCLUDED.preferred_validator_3,
        uptime_weight = EXCLUDED.uptime_weight,
        decentralization_weight = EXCLUDED.decentralization_weight,
        commission_weight = EXCLUDED.commission_weight,
        esg_weight = EXCLUDED.esg_weight,
        auto_rebalance = EXCLUDED.auto_rebalance,
        updated_at = NOW()
      RETURNING *`,
      [
        userId,
        chain,
        preferred_validator_1 || null,
        preferred_validator_2 || null,
        preferred_validator_3 || null,
        uptime_weight || 40,
        decentralization_weight || 30,
        commission_weight || 20,
        esg_weight || 10,
        auto_rebalance || false,
      ]
    );

    res.json({
      message: 'Validator preferences updated',
      preferences: result.rows[0],
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to set validator preferences', 500);
  }
}

// ============================================================================
// FEE TRANSPARENCY
// ============================================================================

/**
 * Get all fee configurations (PUBLIC)
 * Shows maximum possible fees - immutable caps
 */
export async function getFeeConfigurations(req: AuthRequest, res: Response) {
  try {
    const db = getDatabase();

    const result = await db.query(
      `SELECT 
        asset_type,
        fee_type,
        fee_percentage,
        fee_cap_max,
        is_immutable,
        description,
        rationale,
        effective_date
      FROM fee_configurations
      WHERE effective_date <= NOW()
      ORDER BY asset_type, fee_type`
    );

    res.json({
      fee_configurations: result.rows,
      trust_statement:
        'These fees are capped and published. Immutable fees cannot be changed without user governance vote.',
      comparison: {
        typical_cex_staking_fee: '15-25%',
        our_max_staking_fee: '3-5%',
        typical_trading_fees: '0.1-0.2%',
        our_trading_fees: '0.05-0.1%',
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch fee configurations', 500);
  }
}

/**
 * Get yield breakdown for a stake (shows where every dollar goes)
 */
export async function getYieldBreakdown(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { stakeId } = req.params;
    const db = getDatabase();

    // Verify stake ownership
    const stakeCheck = await db.query('SELECT id FROM user_stakes WHERE id = $1 AND user_id = $2', [
      stakeId,
      userId,
    ]);

    if (stakeCheck.rows.length === 0) {
      throw new AppError('Stake not found', 404);
    }

    const result = await db.query(
      `SELECT 
        yb.*,
        sr.calculation_date as reward_date,
        sr.amount as total_reward,
        v.name as validator_name,
        v.address as validator_address
      FROM yield_breakdowns yb
      LEFT JOIN staking_rewards sr ON yb.reward_id = sr.id
      LEFT JOIN user_stakes us ON yb.stake_id = us.id
      LEFT JOIN staking_pools sp ON us.pool_id = sp.id
      LEFT JOIN validators v ON sp.validator_id = v.id
      WHERE yb.stake_id = $1
      ORDER BY yb.calculation_date DESC
      LIMIT 100`,
      [stakeId]
    );

    // Calculate totals
    const totals = result.rows.reduce(
      (acc, row) => {
        acc.gross_yield += parseFloat(row.gross_protocol_yield);
        acc.validator_commission += parseFloat(row.validator_commission_amount);
        acc.exchange_fee += parseFloat(row.exchange_fee_amount);
        acc.user_net += parseFloat(row.user_net_yield);
        return acc;
      },
      { gross_yield: 0, validator_commission: 0, exchange_fee: 0, user_net: 0 }
    );

    res.json({
      stake_id: stakeId,
      breakdown_history: result.rows,
      totals,
      transparency_note:
        'Every reward calculation shows exact protocol yield, validator commission, and exchange fee',
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to fetch yield breakdown', 500);
  }
}

// ============================================================================
// PROOF OF RESERVES
// ============================================================================

/**
 * Get latest reserve snapshots (PUBLIC)
 */
export async function getReserveSnapshots(req: AuthRequest, res: Response) {
  try {
    const { currency } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        currency,
        total_user_balances,
        total_exchange_holdings,
        reserve_ratio,
        total_staked_amount,
        total_rewards_owed,
        blockchain_addresses,
        verification_tx_hash,
        audited,
        audit_report_url,
        snapshot_date
      FROM reserve_snapshots
    `;

    const params: any[] = [];

    if (currency) {
      query += ' WHERE currency = $1';
      params.push(currency);
    }

    query += ` 
      ORDER BY snapshot_date DESC
      LIMIT 50
    `;

    const result = await db.query(query, params);

    res.json({
      reserves: result.rows,
      last_updated: result.rows[0]?.snapshot_date,
      trust_statement:
        'Reserve ratios must be >= 100%. All blockchain addresses are publicly verifiable.',
    });
  } catch (error) {
    throw new AppError('Failed to fetch reserve snapshots', 500);
  }
}

/**
 * Get current reserve ratios (PUBLIC - summary view)
 */
export async function getCurrentReserveRatios(req: AuthRequest, res: Response) {
  try {
    const db = getDatabase();

    const result = await db.query(`
      SELECT * FROM current_reserve_ratios
      ORDER BY currency
    `);

    const adequatelyReserved = result.rows.every((r) => parseFloat(r.reserve_ratio) >= 1.0);

    res.json({
      reserves: result.rows,
      all_adequately_reserved: adequatelyReserved,
      minimum_required_ratio: 1.0,
      trust_statement: 'Updated hourly. All holdings are verifiable on-chain.',
    });
  } catch (error) {
    throw new AppError('Failed to fetch current reserve ratios', 500);
  }
}

// ============================================================================
// AIRDROP TRANSPARENCY
// ============================================================================

/**
 * Get all airdrops (PUBLIC)
 */
export async function getAirdrops(req: AuthRequest, res: Response) {
  try {
    const { status, chain } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM airdrops WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (chain) {
      query += ` AND chain = $${paramCount}`;
      params.push(chain);
      paramCount++;
    }

    query += ' ORDER BY snapshot_date DESC';

    const result = await db.query(query, params);

    res.json({
      airdrops: result.rows,
      policy: '100% of all airdrops are passed through to users. Zero exceptions.',
    });
  } catch (error) {
    throw new AppError('Failed to fetch airdrops', 500);
  }
}

/**
 * Get user's airdrop allocations
 */
export async function getUserAirdrops(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { status } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        uaa.*,
        a.name as airdrop_name,
        a.token_symbol,
        a.chain,
        a.snapshot_date,
        a.distribution_date
      FROM user_airdrop_allocations uaa
      JOIN airdrops a ON uaa.airdrop_id = a.id
      WHERE uaa.user_id = $1
    `;

    const params: any[] = [userId];

    if (status) {
      query += ' AND uaa.status = $2';
      params.push(status);
    }

    query += ' ORDER BY a.snapshot_date DESC';

    const result = await db.query(query, params);

    const totals = {
      pending: 0,
      distributed: 0,
      total_value_usd: 0,
    };

    result.rows.forEach((row) => {
      if (row.status === 'pending') totals.pending += parseFloat(row.allocation_amount);
      if (row.status === 'distributed' || row.status === 'claimed')
        totals.distributed += parseFloat(row.allocation_amount);
    });

    res.json({
      airdrops: result.rows,
      totals,
      trust_statement: 'You receive 100% of your airdrop allocation. No platform fees.',
    });
  } catch (error) {
    throw new AppError('Failed to fetch user airdrops', 500);
  }
}

// ============================================================================
// INSURANCE FUND
// ============================================================================

/**
 * Get insurance fund status (PUBLIC)
 */
export async function getInsuranceFund(req: AuthRequest, res: Response) {
  try {
    const db = getDatabase();

    const result = await db.query(`
      SELECT 
        currency,
        balance,
        total_from_fees,
        total_from_premiums,
        total_claims_paid,
        claims_count,
        updated_at
      FROM insurance_fund
      ORDER BY currency
    `);

    res.json({
      insurance_funds: result.rows,
      purpose: 'Protects users against validator slashing and downtime losses',
      funding: 'Funded by platform fees and optional user premiums',
    });
  } catch (error) {
    throw new AppError('Failed to fetch insurance fund', 500);
  }
}

/**
 * Get user's insurance claims
 */
export async function getUserInsuranceClaims(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const db = getDatabase();

    const result = await db.query(
      `
      SELECT 
        ic.*,
        v.name as validator_name,
        us.amount as stake_amount
      FROM insurance_claims ic
      LEFT JOIN validators v ON ic.validator_id = v.id
      LEFT JOIN user_stakes us ON ic.stake_id = us.id
      WHERE ic.user_id = $1
      ORDER BY ic.submitted_at DESC
    `,
      [userId]
    );

    res.json({
      claims: result.rows,
    });
  } catch (error) {
    throw new AppError('Failed to fetch insurance claims', 500);
  }
}

/**
 * Submit insurance claim
 */
export async function submitInsuranceClaim(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { stake_id, claim_type, amount_lost, slashing_tx_hash, evidence_url } = req.body;

    if (!stake_id || !claim_type || !amount_lost) {
      throw new AppError('Missing required fields', 400);
    }

    const db = getDatabase();

    // Verify stake ownership and get validator
    const stakeResult = await db.query(
      `SELECT us.*, sp.validator_id 
       FROM user_stakes us 
       JOIN staking_pools sp ON us.pool_id = sp.id
       WHERE us.id = $1 AND us.user_id = $2`,
      [stake_id, userId]
    );

    if (stakeResult.rows.length === 0) {
      throw new AppError('Stake not found', 404);
    }

    const stake = stakeResult.rows[0];

    const result = await db.query(
      `INSERT INTO insurance_claims (
        user_id, stake_id, validator_id, claim_type, 
        amount_lost, amount_claimed, slashing_tx_hash, evidence_url
      ) VALUES ($1, $2, $3, $4, $5, $5, $6, $7)
      RETURNING *`,
      [
        userId,
        stake_id,
        stake.validator_id,
        claim_type,
        amount_lost,
        slashing_tx_hash || null,
        evidence_url || null,
      ]
    );

    res.json({
      message: 'Insurance claim submitted successfully',
      claim: result.rows[0],
      note: 'Claims are typically reviewed within 48 hours',
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to submit insurance claim', 500);
  }
}

// ============================================================================
// PUBLIC TRANSPARENCY DASHBOARD METRICS
// ============================================================================

/**
 * Get transparency metrics (PUBLIC)
 */
export async function getTransparencyMetrics(req: AuthRequest, res: Response) {
  try {
    const { days = 30 } = req.query;
    const db = getDatabase();

    const result = await db.query(
      `SELECT * FROM transparency_metrics
       WHERE metric_date >= NOW() - INTERVAL '${parseInt(days as string)} days'
       ORDER BY metric_date DESC`,
      []
    );

    // Get latest
    const latest = result.rows[0];

    res.json({
      latest_metrics: latest,
      historical: result.rows,
      trust_statement:
        'All metrics are auditable and updated daily. No hidden fees, no wash trading, no fake volume.',
    });
  } catch (error) {
    throw new AppError('Failed to fetch transparency metrics', 500);
  }
}
