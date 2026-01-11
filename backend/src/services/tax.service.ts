import { getDatabase } from '../database/connection';

export type BasisMethod = 'fifo' | 'lifo';

interface TradeRow {
  id: string;
  trading_pair_id: string;
  base_currency: string;
  quote_currency: string;
  price: number;
  quantity: number;
  fee: number;
  executed_at: string;
  role: 'buy' | 'sell';
}

interface Lot {
  quantity: number;
  cost: number; // total cost in quote currency
  acquired_at: Date;
}

interface GainEvent {
  asset: string;
  quantity: number;
  proceeds: number; // in quote currency
  costBasis: number; // in quote currency
  gain: number;
  longTerm: boolean;
  executed_at: Date;
}

export interface TaxReport {
  year: number;
  basisMethod: BasisMethod;
  capitalGains: {
    totalGain: number;
    shortTermGain: number;
    longTermGain: number;
    events: GainEvent[];
    missingBasisEvents: GainEvent[];
  };
  income: {
    stakingIncome: number;
    miningIncome: number;
    airdropsIncome: number;
  };
  fees: {
    tradingFees: number;
    platformFees: number;
  };
}

function isYear(dateStr: string, year: number): boolean {
  return new Date(dateStr).getUTCFullYear() === year;
}

export async function buildTaxReport(userId: string, year: number, basis: BasisMethod = (process.env.TAX_DEFAULT_BASIS as BasisMethod) || 'fifo'): Promise<TaxReport> {
  const db = getDatabase();

  // Fetch trades for user for the year
  const tradesRes = await db.query(
    `SELECT t.id, t.trading_pair_id, tp.base_currency, tp.quote_currency, t.price, t.quantity,
            CASE WHEN t.buyer_user_id = $1 THEN t.buyer_fee ELSE t.seller_fee END AS fee,
            t.executed_at,
            CASE WHEN t.buyer_user_id = $1 THEN 'buy' ELSE 'sell' END AS role
     FROM trades t
     JOIN trading_pairs tp ON tp.id = t.trading_pair_id
     WHERE (t.buyer_user_id = $1 OR t.seller_user_id = $1)
       AND EXTRACT(YEAR FROM t.executed_at) = $2
     ORDER BY t.executed_at ASC`,
    [userId, year]
  );

  const trades: TradeRow[] = tradesRes.rows.map((r: any) => ({
    id: r.id,
    trading_pair_id: r.trading_pair_id,
    base_currency: r.base_currency,
    quote_currency: r.quote_currency,
    price: Number(r.price),
    quantity: Number(r.quantity),
    fee: Number(r.fee || 0),
    executed_at: r.executed_at,
    role: r.role,
  }));

  // Build lots per asset (base_currency)
  const lotsPerAsset: Record<string, Lot[]> = {};
  const gains: GainEvent[] = [];
  const missingBasis: GainEvent[] = [];
  let tradingFees = 0;

  for (const tr of trades) {
    tradingFees += tr.fee || 0;
    const asset = tr.base_currency;
    lotsPerAsset[asset] = lotsPerAsset[asset] || [];

    if (tr.role === 'buy') {
      // Acquire base asset; cost in quote currency
      const cost = tr.price * tr.quantity + (tr.fee || 0);
      lotsPerAsset[asset].push({
        quantity: tr.quantity,
        cost,
        acquired_at: new Date(tr.executed_at),
      });
    } else {
      // Dispose base asset; compute proceeds and basis
      let qtyToSell = tr.quantity;
      const proceeds = tr.price * tr.quantity - (tr.fee || 0);
      const assetLots = lotsPerAsset[asset] || [];
      const consumedLots: Lot[] = [];
      let accumulatedCost = 0;

      // Order lots based on basis method
      const orderedLots = [...assetLots];
      orderedLots.sort((a, b) =>
        basis === 'fifo' ? a.acquired_at.getTime() - b.acquired_at.getTime() : b.acquired_at.getTime() - a.acquired_at.getTime()
      );

      for (const lot of orderedLots) {
        if (qtyToSell <= 0) break;
        const takeQty = Math.min(qtyToSell, lot.quantity);
        const unitCost = lot.cost / lot.quantity;
        accumulatedCost += unitCost * takeQty;
        consumedLots.push({ ...lot, quantity: takeQty, cost: unitCost * takeQty });
        qtyToSell -= takeQty;
      }

      const gainEvent: GainEvent = {
        asset,
        quantity: tr.quantity,
        proceeds,
        costBasis: accumulatedCost,
        gain: proceeds - accumulatedCost,
        longTerm: consumedLots.length > 0 ? consumedLots.every(l => {
          const days = (new Date(tr.executed_at).getTime() - l.acquired_at.getTime()) / (1000 * 60 * 60 * 24);
          return days >= 365;
        }) : false,
        executed_at: new Date(tr.executed_at),
      };

      if (accumulatedCost === 0 && tr.quantity > 0) {
        missingBasis.push(gainEvent);
      } else {
        gains.push(gainEvent);
        // Reduce lots
        let remaining = tr.quantity;
        const newLots: Lot[] = [];
        // Rebuild lots after sale
        const lotsSorted = lotsPerAsset[asset].sort((a, b) => a.acquired_at.getTime() - b.acquired_at.getTime());
        for (const lot of lotsSorted) {
          if (remaining <= 0) {
            newLots.push(lot);
            continue;
          }
          const take = Math.min(remaining, lot.quantity);
          const leftover = lot.quantity - take;
          if (leftover > 0) {
            const unitCost = lot.cost / lot.quantity;
            newLots.push({
              quantity: leftover,
              cost: unitCost * leftover,
              acquired_at: lot.acquired_at,
            });
          }
          remaining -= take;
        }
        lotsPerAsset[asset] = newLots;
      }
    }
  }

  // Staking income
  const stakingRes = await db.query(
    `SELECT SUM(net_amount) AS total
     FROM staking_rewards
     WHERE user_id = $1 AND EXTRACT(YEAR FROM calculation_date) = $2`,
    [userId, year]
  );
  const stakingIncome = Number(stakingRes.rows[0]?.total || 0);

  // Mining income
  const miningRes = await db.query(
    `SELECT SUM(amount) AS total
     FROM mining_payouts
     WHERE user_id = $1 AND EXTRACT(YEAR FROM created_at) = $2 AND status = 'completed'`,
    [userId, year]
  );
  const miningIncome = Number(miningRes.rows[0]?.total || 0);

  // Airdrops income (placeholder: requires dedicated table)
  const airdropsIncome = 0;

  // Platform fees
  const feesRes = await db.query(
    `SELECT SUM(fee_amount) AS total
     FROM platform_fees
     WHERE user_id = $1 AND EXTRACT(YEAR FROM collected_at) = $2`,
    [userId, year]
  );
  const platformFees = Number(feesRes.rows[0]?.total || 0);

  const totalGain = gains.reduce((sum, g) => sum + g.gain, 0);
  const shortTermGain = gains.filter(g => !g.longTerm).reduce((sum, g) => sum + g.gain, 0);
  const longTermGain = gains.filter(g => g.longTerm).reduce((sum, g) => sum + g.gain, 0);

  return {
    year,
    basisMethod: basis,
    capitalGains: {
      totalGain,
      shortTermGain,
      longTermGain,
      events: gains,
      missingBasisEvents: missingBasis,
    },
    income: {
      stakingIncome,
      miningIncome,
      airdropsIncome,
    },
    fees: {
      tradingFees,
      platformFees,
    },
  };
}

export async function exportTradesCSV(userId: string, year: number): Promise<string> {
  const db = getDatabase();
  const res = await db.query(
    `SELECT t.id, tp.symbol, tp.base_currency, tp.quote_currency, t.price, t.quantity,
            t.buyer_fee, t.seller_fee, t.executed_at,
            CASE WHEN t.buyer_user_id = $1 THEN 'buy' ELSE 'sell' END AS role
     FROM trades t
     JOIN trading_pairs tp ON tp.id = t.trading_pair_id
     WHERE (t.buyer_user_id = $1 OR t.seller_user_id = $1)
       AND EXTRACT(YEAR FROM t.executed_at) = $2
     ORDER BY t.executed_at ASC`,
    [userId, year]
  );
  const header = 'trade_id,symbol,base,quote,price,quantity,role,buyer_fee,seller_fee,executed_at\n';
  const rows = res.rows.map((r: any) => [
    r.id,
    r.symbol,
    r.base_currency,
    r.quote_currency,
    r.price,
    r.quantity,
    r.role,
    r.buyer_fee || 0,
    r.seller_fee || 0,
    new Date(r.executed_at).toISOString(),
  ].join(','));
  return header + rows.join('\n');
}

export async function exportStakingCSV(userId: string, year: number): Promise<string> {
  const db = getDatabase();
  const res = await db.query(
    `SELECT id, stake_id, amount, platform_fee, premium_bonus, net_amount, currency, reward_type, calculation_date
     FROM staking_rewards
     WHERE user_id = $1 AND EXTRACT(YEAR FROM calculation_date) = $2
     ORDER BY calculation_date ASC`,
    [userId, year]
  );
  const header = 'reward_id,stake_id,amount,platform_fee,premium_bonus,net_amount,currency,reward_type,calculation_date\n';
  const rows = res.rows.map((r: any) => [
    r.id,
    r.stake_id,
    r.amount,
    r.platform_fee || 0,
    r.premium_bonus || 0,
    r.net_amount,
    r.currency,
    r.reward_type,
    new Date(r.calculation_date).toISOString(),
  ].join(','));
  return header + rows.join('\n');
}

export async function exportMiningCSV(userId: string, year: number): Promise<string> {
  const db = getDatabase();
  const res = await db.query(
    `SELECT id, amount, currency, shares_count, fee_amount, tx_hash, status, created_at, completed_at
     FROM mining_payouts
     WHERE user_id = $1 AND EXTRACT(YEAR FROM created_at) = $2
     ORDER BY created_at ASC`,
    [userId, year]
  );
  const header = 'payout_id,amount,currency,shares_count,fee_amount,tx_hash,status,created_at,completed_at\n';
  const rows = res.rows.map((r: any) => [
    r.id,
    r.amount,
    r.currency,
    r.shares_count || 0,
    r.fee_amount || 0,
    r.tx_hash || '',
    r.status,
    new Date(r.created_at).toISOString(),
    r.completed_at ? new Date(r.completed_at).toISOString() : '',
  ].join(','));
  return header + rows.join('\n');
}
