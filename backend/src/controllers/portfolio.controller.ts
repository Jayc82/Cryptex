import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabase } from '../database/connection';
import Decimal from 'decimal.js';

export async function getPortfolio(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const db = getDatabase();

    // Get all wallets with balances
    const walletsResult = await db.query(
      'SELECT * FROM wallets WHERE user_id = $1 AND balance > 0',
      [userId]
    );

    // Calculate total value in USDT
    let totalValue = new Decimal(0);
    const holdings = [];

    for (const wallet of walletsResult.rows) {
      // Get current price (simplified - should fetch from market data)
      const price = new Decimal(1); // Mock price
      const value = new Decimal(wallet.balance).times(price);
      
      totalValue = totalValue.plus(value);
      
      holdings.push({
        currency: wallet.currency,
        balance: wallet.balance,
        availableBalance: wallet.available_balance,
        lockedBalance: wallet.locked_balance,
        value: value.toString()
      });
    }

    res.json({
      totalValue: totalValue.toString(),
      holdings
    });
  } catch (error) {
    throw error;
  }
}

export async function getBalance(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { currency } = req.query;

    const db = getDatabase();
    let query = 'SELECT * FROM wallets WHERE user_id = $1';
    const params: any[] = [userId];

    if (currency) {
      query += ' AND currency = $2';
      params.push(currency);
    }

    const result = await db.query(query, params);

    res.json({ balances: result.rows });
  } catch (error) {
    throw error;
  }
}

export async function getPerformance(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { period = '24h' } = req.query;

    const db = getDatabase();

    // Calculate performance metrics
    const tradesResult = await db.query(
      `SELECT 
        COUNT(*) as total_trades,
        SUM(CASE WHEN buyer_user_id = $1 THEN quantity * price ELSE 0 END) as total_bought,
        SUM(CASE WHEN seller_user_id = $1 THEN quantity * price ELSE 0 END) as total_sold,
        SUM(CASE WHEN buyer_user_id = $1 THEN buyer_fee WHEN seller_user_id = $1 THEN seller_fee ELSE 0 END) as total_fees
       FROM trades
       WHERE (buyer_user_id = $1 OR seller_user_id = $1)
       AND executed_at >= NOW() - INTERVAL '1 day'`,
      [userId]
    );

    const performance = tradesResult.rows[0];

    res.json({
      period,
      ...performance,
      profitLoss: new Decimal(performance.total_sold || 0)
        .minus(performance.total_bought || 0)
        .minus(performance.total_fees || 0)
        .toString()
    });
  } catch (error) {
    throw error;
  }
}

export async function getHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { type, limit = 50, offset = 0 } = req.query;

    const db = getDatabase();
    
    let query = `
      SELECT * FROM transactions 
      WHERE user_id = $1
    `;
    const params: any[] = [userId];

    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({ transactions: result.rows });
  } catch (error) {
    throw error;
  }
}

export async function getAllocations(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const db = getDatabase();

    const result = await db.query(
      `SELECT 
        currency,
        balance,
        balance / (SELECT SUM(balance) FROM wallets WHERE user_id = $1) * 100 as percentage
       FROM wallets
       WHERE user_id = $1 AND balance > 0
       ORDER BY balance DESC`,
      [userId]
    );

    res.json({ allocations: result.rows });
  } catch (error) {
    throw error;
  }
}
