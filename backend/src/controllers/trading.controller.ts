import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabase } from '../database/connection';
import Decimal from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/errorHandler';
import { broadcast } from '../websocket/server';

export async function createOrder(req: AuthRequest, res: Response) {
  try {
    const { symbol, side, type, quantity, price, stopPrice, timeInForce } = req.body;
    const userId = req.userId!;

    // Validation
    if (!symbol || !side || !type || !quantity) {
      throw new AppError('Missing required fields', 400);
    }

    if (!['buy', 'sell'].includes(side)) {
      throw new AppError('Invalid side. Must be "buy" or "sell"', 400);
    }

    if (!['market', 'limit', 'stop_limit'].includes(type)) {
      throw new AppError('Invalid order type', 400);
    }

    const db = getDatabase();

    // Get trading pair
    const pairResult = await db.query(
      'SELECT * FROM trading_pairs WHERE symbol = $1 AND is_active = true',
      [symbol]
    );

    if (pairResult.rows.length === 0) {
      throw new AppError('Invalid trading pair', 400);
    }

    const tradingPair = pairResult.rows[0];

    // Validate quantities
    const qty = new Decimal(quantity);
    if (qty.lessThan(tradingPair.min_order_size)) {
      throw new AppError(`Minimum order size is ${tradingPair.min_order_size}`, 400);
    }

    if (tradingPair.max_order_size && qty.greaterThan(tradingPair.max_order_size)) {
      throw new AppError(`Maximum order size is ${tradingPair.max_order_size}`, 400);
    }

    // Check balance
    const currency = side === 'buy' ? tradingPair.quote_currency : tradingPair.base_currency;
    const walletResult = await db.query(
      'SELECT * FROM wallets WHERE user_id = $1 AND currency = $2',
      [userId, currency]
    );

    if (walletResult.rows.length === 0) {
      throw new AppError('Wallet not found', 404);
    }

    const wallet = walletResult.rows[0];
    const requiredAmount = side === 'buy' 
      ? qty.times(price || 0) 
      : qty;

    if (new Decimal(wallet.available_balance).lessThan(requiredAmount)) {
      throw new AppError('Insufficient balance', 400);
    }

    // Create order
    const orderResult = await db.query(
      `INSERT INTO orders (
        user_id, trading_pair_id, order_type, side, price, quantity,
        status, time_in_force, stop_price, client_order_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        userId,
        tradingPair.id,
        type,
        side,
        price,
        quantity,
        'pending',
        timeInForce || 'GTC',
        stopPrice,
        uuidv4()
      ]
    );

    const order = orderResult.rows[0];

    // Lock funds
    await db.query(
      `UPDATE wallets 
       SET available_balance = available_balance - $1,
           locked_balance = locked_balance + $1
       WHERE id = $2`,
      [requiredAmount.toString(), wallet.id]
    );

    // Broadcast order update
    broadcast(`orders:${userId}`, {
      type: 'order_created',
      order
    });

    res.status(201).json({ order });
  } catch (error) {
    throw error;
  }
}

export async function getOrders(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { symbol, status, limit = 50, offset = 0 } = req.query;

    const db = getDatabase();
    let query = `
      SELECT o.*, tp.symbol, tp.base_currency, tp.quote_currency
      FROM orders o
      JOIN trading_pairs tp ON o.trading_pair_id = tp.id
      WHERE o.user_id = $1
    `;
    const params: any[] = [userId];
    let paramCount = 1;

    if (symbol) {
      paramCount++;
      query += ` AND tp.symbol = $${paramCount}`;
      params.push(symbol);
    }

    if (status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({ orders: result.rows });
  } catch (error) {
    throw error;
  }
}

export async function getOrderById(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { orderId } = req.params;

    const db = getDatabase();
    const result = await db.query(
      `SELECT o.*, tp.symbol, tp.base_currency, tp.quote_currency
       FROM orders o
       JOIN trading_pairs tp ON o.trading_pair_id = tp.id
       WHERE o.id = $1 AND o.user_id = $2`,
      [orderId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Order not found', 404);
    }

    res.json({ order: result.rows[0] });
  } catch (error) {
    throw error;
  }
}

export async function cancelOrder(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { orderId } = req.params;

    const db = getDatabase();

    // Get order
    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError('Order not found', 404);
    }

    const order = orderResult.rows[0];

    if (!['pending', 'partially_filled'].includes(order.status)) {
      throw new AppError('Order cannot be cancelled', 400);
    }

    // Cancel order
    await db.query(
      `UPDATE orders 
       SET status = 'cancelled', cancelled_at = NOW() 
       WHERE id = $1`,
      [orderId]
    );

    // Unlock funds
    // Implementation depends on exact locking mechanism

    broadcast(`orders:${userId}`, {
      type: 'order_cancelled',
      orderId
    });

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    throw error;
  }
}

export async function cancelAllOrders(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { symbol } = req.query;

    const db = getDatabase();

    let query = `
      UPDATE orders 
      SET status = 'cancelled', cancelled_at = NOW()
      WHERE user_id = $1 AND status IN ('pending', 'partially_filled')
    `;
    const params: any[] = [userId];

    if (symbol) {
      query += ` AND trading_pair_id IN (
        SELECT id FROM trading_pairs WHERE symbol = $2
      )`;
      params.push(symbol);
    }

    const result = await db.query(query, params);

    res.json({ 
      message: 'Orders cancelled successfully',
      cancelledCount: result.rowCount 
    });
  } catch (error) {
    throw error;
  }
}

export async function getTrades(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { symbol, limit = 50, offset = 0 } = req.query;

    const db = getDatabase();
    let query = `
      SELECT t.*, tp.symbol, tp.base_currency, tp.quote_currency
      FROM trades t
      JOIN trading_pairs tp ON t.trading_pair_id = tp.id
      WHERE (t.buyer_user_id = $1 OR t.seller_user_id = $1)
    `;
    const params: any[] = [userId];

    if (symbol) {
      query += ` AND tp.symbol = $2 LIMIT $3 OFFSET $4`;
      params.push(symbol, limit, offset);
    } else {
      query += ` LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const result = await db.query(query, params);

    res.json({ trades: result.rows });
  } catch (error) {
    throw error;
  }
}

export async function getTradeById(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { tradeId } = req.params;

    const db = getDatabase();
    const result = await db.query(
      `SELECT t.*, tp.symbol
       FROM trades t
       JOIN trading_pairs tp ON t.trading_pair_id = tp.id
       WHERE t.id = $1 AND (t.buyer_user_id = $2 OR t.seller_user_id = $2)`,
      [tradeId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Trade not found', 404);
    }

    res.json({ trade: result.rows[0] });
  } catch (error) {
    throw error;
  }
}

export async function getOrderBook(req: AuthRequest, res: Response) {
  try {
    const { symbol } = req.params;
    const { depth = 20 } = req.query;

    const db = getDatabase();

    // Get bids (buy orders)
    const bidsResult = await db.query(
      `SELECT price, SUM(quantity - filled_quantity) as quantity
       FROM orders o
       JOIN trading_pairs tp ON o.trading_pair_id = tp.id
       WHERE tp.symbol = $1 
       AND o.side = 'buy' 
       AND o.status = 'pending'
       GROUP BY price
       ORDER BY price DESC
       LIMIT $2`,
      [symbol, depth]
    );

    // Get asks (sell orders)
    const asksResult = await db.query(
      `SELECT price, SUM(quantity - filled_quantity) as quantity
       FROM orders o
       JOIN trading_pairs tp ON o.trading_pair_id = tp.id
       WHERE tp.symbol = $1 
       AND o.side = 'sell' 
       AND o.status = 'pending'
       GROUP BY price
       ORDER BY price ASC
       LIMIT $2`,
      [symbol, depth]
    );

    res.json({
      symbol,
      bids: bidsResult.rows,
      asks: asksResult.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw error;
  }
}
