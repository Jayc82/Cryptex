import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';
import { getCache, setCache } from '../cache/redis';
import { AppError } from '../middleware/errorHandler';

export async function getTicker(req: Request, res: Response) {
  try {
    const { symbol } = req.params;

    // Try cache first
    const cached = await getCache(`ticker:${symbol}`);
    if (cached) {
      return res.json(cached);
    }

    const db = getDatabase();

    // Get 24hr stats
    const result = await db.query(
      `SELECT 
        tp.symbol,
        md.open_price,
        md.high_price,
        md.low_price,
        md.close_price,
        md.volume,
        (md.close_price - md.open_price) / md.open_price * 100 as price_change_percent
       FROM trading_pairs tp
       LEFT JOIN LATERAL (
         SELECT * FROM market_data 
         WHERE trading_pair_id = tp.id 
         AND timestamp >= NOW() - INTERVAL '24 hours'
         ORDER BY timestamp DESC 
         LIMIT 1
       ) md ON true
       WHERE tp.symbol = $1`,
      [symbol]
    );

    if (result.rows.length === 0) {
      throw new AppError('Trading pair not found', 404);
    }

    const ticker = result.rows[0];

    // Cache for 1 second
    await setCache(`ticker:${symbol}`, ticker, 1);

    res.json(ticker);
  } catch (error) {
    throw error;
  }
}

export async function getAllTickers(_req: Request, res: Response) {
  try {
    const cached = await getCache('tickers:all');
    if (cached) {
      return res.json(cached);
    }

    const db = getDatabase();
    const result = await db.query(`
      SELECT 
        tp.symbol,
        tp.base_currency,
        tp.quote_currency,
        md.open_price,
        md.high_price,
        md.low_price,
        md.close_price,
        md.volume
       FROM trading_pairs tp
       LEFT JOIN LATERAL (
         SELECT * FROM market_data 
         WHERE trading_pair_id = tp.id 
         AND timestamp >= NOW() - INTERVAL '24 hours'
         ORDER BY timestamp DESC 
         LIMIT 1
       ) md ON true
       WHERE tp.is_active = true
    `);

    await setCache('tickers:all', result.rows, 1);
    res.json({ tickers: result.rows });
  } catch (error) {
    throw error;
  }
}

export async function getKlines(req: Request, res: Response) {
  try {
    const { symbol } = req.params;
    const { interval = '1h', limit = 100, startTime, endTime } = req.query;

    const db = getDatabase();

    let query = `
      SELECT md.* 
      FROM market_data md
      JOIN trading_pairs tp ON md.trading_pair_id = tp.id
      WHERE tp.symbol = $1 AND md.interval = $2
    `;
    const params: any[] = [symbol, interval];
    let paramCount = 2;

    if (startTime) {
      paramCount++;
      query += ` AND md.timestamp >= to_timestamp($${paramCount})`;
      params.push(Number(startTime) / 1000);
    }

    if (endTime) {
      paramCount++;
      query += ` AND md.timestamp <= to_timestamp($${paramCount})`;
      params.push(Number(endTime) / 1000);
    }

    query += ` ORDER BY md.timestamp DESC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await db.query(query, params);

    res.json({ 
      symbol,
      interval,
      klines: result.rows.reverse() 
    });
  } catch (error) {
    throw error;
  }
}

export async function getDepth(req: Request, res: Response) {
  try {
    const { symbol } = req.params;
    const { limit = 20 } = req.query;

    const db = getDatabase();

    const bidsResult = await db.query(
      `SELECT price, SUM(quantity - filled_quantity) as quantity
       FROM orders o
       JOIN trading_pairs tp ON o.trading_pair_id = tp.id
       WHERE tp.symbol = $1 AND o.side = 'buy' AND o.status = 'pending'
       GROUP BY price
       ORDER BY price DESC
       LIMIT $2`,
      [symbol, limit]
    );

    const asksResult = await db.query(
      `SELECT price, SUM(quantity - filled_quantity) as quantity
       FROM orders o
       JOIN trading_pairs tp ON o.trading_pair_id = tp.id
       WHERE tp.symbol = $1 AND o.side = 'sell' AND o.status = 'pending'
       GROUP BY price
       ORDER BY price ASC
       LIMIT $2`,
      [symbol, limit]
    );

    res.json({
      symbol,
      bids: bidsResult.rows,
      asks: asksResult.rows,
      timestamp: Date.now()
    });
  } catch (error) {
    throw error;
  }
}

export async function getRecentTrades(req: Request, res: Response) {
  try {
    const { symbol } = req.params;
    const { limit = 50 } = req.query;

    const db = getDatabase();
    const result = await db.query(
      `SELECT t.price, t.quantity, t.executed_at
       FROM trades t
       JOIN trading_pairs tp ON t.trading_pair_id = tp.id
       WHERE tp.symbol = $1
       ORDER BY t.executed_at DESC
       LIMIT $2`,
      [symbol, limit]
    );

    res.json({ 
      symbol,
      trades: result.rows 
    });
  } catch (error) {
    throw error;
  }
}

export async function getTradingPairs(_req: Request, res: Response) {
  try {
    const db = getDatabase();
    const result = await db.query(
      'SELECT * FROM trading_pairs WHERE is_active = true ORDER BY symbol'
    );

    res.json({ pairs: result.rows });
  } catch (error) {
    throw error;
  }
}

export async function get24hrStats(req: Request, res: Response) {
  try {
    const { symbol } = req.params;

    const db = getDatabase();
    const result = await db.query(
      `SELECT 
        COUNT(*) as trade_count,
        SUM(quantity) as volume,
        MIN(price) as low,
        MAX(price) as high,
        (SELECT price FROM trades t2 
         JOIN trading_pairs tp2 ON t2.trading_pair_id = tp2.id 
         WHERE tp2.symbol = $1 
         ORDER BY executed_at ASC LIMIT 1) as open,
        (SELECT price FROM trades t2 
         JOIN trading_pairs tp2 ON t2.trading_pair_id = tp2.id 
         WHERE tp2.symbol = $1 
         ORDER BY executed_at DESC LIMIT 1) as close
       FROM trades t
       JOIN trading_pairs tp ON t.trading_pair_id = tp.id
       WHERE tp.symbol = $1 
       AND t.executed_at >= NOW() - INTERVAL '24 hours'`,
      [symbol]
    );

    const stats = result.rows[0];
    const priceChange = stats.close && stats.open 
      ? ((Number(stats.close) - Number(stats.open)) / Number(stats.open) * 100).toFixed(2)
      : '0.00';

    res.json({
      symbol,
      ...stats,
      priceChange,
      priceChangePercent: priceChange
    });
  } catch (error) {
    throw error;
  }
}
