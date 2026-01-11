import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabase } from '../database/connection';
import { AppError } from '../middleware/errorHandler';

// Get all mining pools
export async function getMiningPools(req: AuthRequest, res: Response) {
  try {
    const { currency, type, active } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM mining_pools WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (currency) {
      query += ` AND currency = $${paramCount}`;
      params.push(currency);
      paramCount++;
    }

    if (type) {
      query += ` AND pool_type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (active !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      params.push(active === 'true');
      paramCount++;
    }

    query += ' ORDER BY pool_hashrate DESC NULLS LAST, created_at DESC';

    const result = await db.query(query, params);

    res.json(result.rows);
  } catch (error) {
    throw error;
  }
}

// Get specific mining pool
export async function getMiningPool(req: AuthRequest, res: Response) {
  try {
    const { poolId } = req.params;
    const db = getDatabase();

    const result = await db.query('SELECT * FROM mining_pools WHERE id = $1', [poolId]);

    if (result.rows.length === 0) {
      throw new AppError('Mining pool not found', 404);
    }

    const pool = result.rows[0];

    // Get pool statistics
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT um.id) as total_miners,
        COALESCE(SUM(um.total_hashrate), 0) as total_hashrate,
        COUNT(DISTINCT mw.id) as total_workers,
        COALESCE(SUM(mw.shares_accepted), 0) as total_shares
      FROM user_miners um
      LEFT JOIN mining_workers mw ON mw.user_miner_id = um.id
      WHERE um.pool_id = $1 AND um.is_active = true
    `;
    const stats = await db.query(statsQuery, [poolId]);

    // Get recent blocks
    const blocksQuery = `
      SELECT COUNT(*) as blocks_24h
      FROM mining_shares
      WHERE pool_id = $1 AND is_block = true 
        AND submitted_at > NOW() - INTERVAL '24 hours'
    `;
    const blocks = await db.query(blocksQuery, [poolId]);

    res.json({
      ...pool,
      statistics: {
        totalMiners: parseInt(stats.rows[0].total_miners) || 0,
        totalHashrate: parseFloat(stats.rows[0].total_hashrate) || 0,
        totalWorkers: parseInt(stats.rows[0].total_workers) || 0,
        totalShares: parseInt(stats.rows[0].total_shares) || 0,
        blocks24h: parseInt(blocks.rows[0].blocks_24h) || 0,
      },
    });
  } catch (error) {
    throw error;
  }
}

// Get user's mining configurations
export async function getUserMiners(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const db = getDatabase();

    const query = `
      SELECT 
        um.*,
        mp.name as pool_name,
        mp.currency,
        mp.algorithm,
        mp.pool_type,
        mp.fee_percentage,
        (SELECT COUNT(*) FROM mining_workers WHERE user_miner_id = um.id) as worker_count,
        (SELECT COUNT(*) FROM mining_workers WHERE user_miner_id = um.id AND is_online = true) as online_workers
      FROM user_miners um
      JOIN mining_pools mp ON um.pool_id = mp.id
      WHERE um.user_id = $1
      ORDER BY um.is_active DESC, um.created_at DESC
    `;

    const result = await db.query(query, [userId]);

    // Calculate efficiency for each miner
    const miners = result.rows.map((miner) => {
      const efficiency =
        miner.total_shares_submitted > 0
          ? (miner.total_shares_accepted / miner.total_shares_submitted) * 100
          : 0;

      return {
        ...miner,
        efficiency: efficiency.toFixed(2),
        rejectionRate:
          miner.total_shares_submitted > 0
            ? ((miner.total_shares_rejected / miner.total_shares_submitted) * 100).toFixed(2)
            : 0,
      };
    });

    res.json(miners);
  } catch (error) {
    throw error;
  }
}

// Create mining configuration
export async function createMiner(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { poolId, minerName, walletId } = req.body;
    const db = getDatabase();

    // Verify pool exists and is active
    const poolResult = await db.query(
      'SELECT * FROM mining_pools WHERE id = $1 AND is_active = true',
      [poolId]
    );

    if (poolResult.rows.length === 0) {
      throw new AppError('Mining pool not found or inactive', 404);
    }

    const pool = poolResult.rows[0];

    // Verify wallet exists and matches currency
    const walletResult = await db.query(
      'SELECT * FROM wallets WHERE id = $1 AND user_id = $2 AND currency = $3',
      [walletId, userId, pool.currency]
    );

    if (walletResult.rows.length === 0) {
      throw new AppError(`Wallet not found or currency mismatch. Need ${pool.currency} wallet.`, 404);
    }

    // Check if user already has a miner for this pool
    const existingResult = await db.query(
      'SELECT id FROM user_miners WHERE user_id = $1 AND pool_id = $2',
      [userId, poolId]
    );

    if (existingResult.rows.length > 0) {
      throw new AppError('You already have a miner configured for this pool', 409);
    }

    // Create miner configuration
    const result = await db.query(
      `INSERT INTO user_miners (user_id, pool_id, wallet_id, miner_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, poolId, walletId, minerName || `Miner-${Date.now()}`]
    );

    // Update pool's active miners count
    await db.query(
      'UPDATE mining_pools SET active_miners = active_miners + 1 WHERE id = $1',
      [poolId]
    );

    res.status(201).json({
      message: 'Mining configuration created successfully',
      miner: result.rows[0],
    });
  } catch (error) {
    throw error;
  }
}

// Get mining workers
export async function getWorkers(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { minerId } = req.params;
    const db = getDatabase();

    // Verify miner belongs to user
    const minerResult = await db.query(
      'SELECT id FROM user_miners WHERE id = $1 AND user_id = $2',
      [minerId, userId]
    );

    if (minerResult.rows.length === 0) {
      throw new AppError('Miner not found', 404);
    }

    const result = await db.query(
      `SELECT * FROM mining_workers 
       WHERE user_miner_id = $1 
       ORDER BY is_online DESC, last_seen DESC`,
      [minerId]
    );

    res.json(result.rows);
  } catch (error) {
    throw error;
  }
}

// Add/register a worker
export async function addWorker(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { minerId } = req.params;
    const { workerName, workerPassword } = req.body;
    const db = getDatabase();

    // Verify miner belongs to user
    const minerResult = await db.query(
      'SELECT id FROM user_miners WHERE id = $1 AND user_id = $2',
      [minerId, userId]
    );

    if (minerResult.rows.length === 0) {
      throw new AppError('Miner not found', 404);
    }

    // Check if worker name already exists for this miner
    const existingResult = await db.query(
      'SELECT id FROM mining_workers WHERE user_miner_id = $1 AND worker_name = $2',
      [minerId, workerName]
    );

    if (existingResult.rows.length > 0) {
      throw new AppError('Worker name already exists', 409);
    }

    const result = await db.query(
      `INSERT INTO mining_workers (user_miner_id, worker_name, worker_password)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [minerId, workerName, workerPassword || null]
    );

    res.status(201).json({
      message: 'Worker added successfully',
      worker: result.rows[0],
    });
  } catch (error) {
    throw error;
  }
}

// Update worker status (typically called by mining software or monitoring)
export async function updateWorkerStatus(req: AuthRequest, res: Response) {
  try {
    const { workerId } = req.params;
    const { hashrate, isOnline, minerSoftware, ipAddress } = req.body;
    const db = getDatabase();

    const result = await db.query(
      `UPDATE mining_workers 
       SET hashrate = $1, 
           is_online = $2, 
           last_seen = NOW(),
           miner_software = COALESCE($3, miner_software),
           ip_address = COALESCE($4, ip_address)
       WHERE id = $5
       RETURNING *`,
      [hashrate || 0, isOnline !== false, minerSoftware, ipAddress, workerId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Worker not found', 404);
    }

    // Update parent miner's total hashrate
    await updateMinerHashrate(result.rows[0].user_miner_id);

    res.json({
      message: 'Worker status updated',
      worker: result.rows[0],
    });
  } catch (error) {
    throw error;
  }
}

// Submit mining share (called by mining software)
export async function submitShare(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { minerId, workerId, difficulty, isValid, isBlock, blockHeight } = req.body;
    const db = getDatabase();

    // Verify miner belongs to user
    const minerResult = await db.query(
      'SELECT pool_id FROM user_miners WHERE id = $1 AND user_id = $2',
      [minerId, userId]
    );

    if (minerResult.rows.length === 0) {
      throw new AppError('Miner not found', 404);
    }

    const poolId = minerResult.rows[0].pool_id;

    await db.query('BEGIN');

    try {
      // Record the share
      await db.query(
        `INSERT INTO mining_shares (user_miner_id, worker_id, pool_id, difficulty, is_valid, is_block, block_height)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [minerId, workerId, poolId, difficulty, isValid !== false, isBlock || false, blockHeight]
      );

      // Update miner statistics
      if (isValid !== false) {
        await db.query(
          `UPDATE user_miners 
           SET total_shares_submitted = total_shares_submitted + 1,
               total_shares_accepted = total_shares_accepted + 1,
               last_share_time = NOW()
           WHERE id = $1`,
          [minerId]
        );

        // Update worker statistics
        await db.query(
          `UPDATE mining_workers 
           SET shares_submitted = shares_submitted + 1,
               shares_accepted = shares_accepted + 1,
               last_seen = NOW()
           WHERE id = $1`,
          [workerId]
        );
      } else {
        await db.query(
          `UPDATE user_miners 
           SET total_shares_submitted = total_shares_submitted + 1,
               total_shares_rejected = total_shares_rejected + 1
           WHERE id = $1`,
          [minerId]
        );

        await db.query(
          `UPDATE mining_workers 
           SET shares_submitted = shares_submitted + 1,
               shares_rejected = shares_rejected + 1
           WHERE id = $1`,
          [workerId]
        );
      }

      // If it's a block, update pool statistics
      if (isBlock) {
        await db.query(
          `UPDATE mining_pools 
           SET blocks_found = blocks_found + 1,
               last_block_time = NOW()
           WHERE id = $1`,
          [poolId]
        );
      }

      await db.query('COMMIT');

      res.json({
        message: 'Share submitted successfully',
        accepted: isValid !== false,
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

// Get mining statistics
export async function getMiningStats(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { minerId, period = '24h' } = req.query;
    const db = getDatabase();

    let interval = '24 hours';
    if (period === '7d') interval = '7 days';
    else if (period === '30d') interval = '30 days';

    const query = minerId
      ? `
      SELECT 
        DATE_TRUNC('hour', hour_timestamp) as time,
        AVG(avg_hashrate) as hashrate,
        SUM(shares_accepted) as shares_accepted,
        SUM(shares_rejected) as shares_rejected,
        SUM(earnings) as earnings
      FROM mining_stats
      WHERE user_miner_id = $1 
        AND hour_timestamp > NOW() - INTERVAL '${interval}'
      GROUP BY DATE_TRUNC('hour', hour_timestamp)
      ORDER BY time DESC
    `
      : `
      SELECT 
        DATE_TRUNC('hour', ms.hour_timestamp) as time,
        AVG(ms.avg_hashrate) as hashrate,
        SUM(ms.shares_accepted) as shares_accepted,
        SUM(ms.shares_rejected) as shares_rejected,
        SUM(ms.earnings) as earnings
      FROM mining_stats ms
      JOIN user_miners um ON ms.user_miner_id = um.id
      WHERE um.user_id = $1 
        AND ms.hour_timestamp > NOW() - INTERVAL '${interval}'
      GROUP BY DATE_TRUNC('hour', ms.hour_timestamp)
      ORDER BY time DESC
    `;

    const result = await db.query(query, minerId ? [minerId] : [userId]);

    res.json(result.rows);
  } catch (error) {
    throw error;
  }
}

// Get payouts
export async function getPayouts(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { status, limit = 50, offset = 0 } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        mp.*,
        mpool.name as pool_name,
        mpool.currency
      FROM mining_payouts mp
      JOIN mining_pools mpool ON mp.pool_id = mpool.id
      WHERE mp.user_id = $1
    `;
    const params: any[] = [userId];
    let paramCount = 2;

    if (status) {
      query += ` AND mp.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` ORDER BY mp.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM mining_payouts WHERE user_id = $1',
      [userId]
    );

    res.json({
      payouts: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    throw error;
  }
}

// Request payout (manual payout request)
export async function requestPayout(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { minerId } = req.body;
    const db = getDatabase();

    // Get miner details
    const minerResult = await db.query(
      `SELECT um.*, mp.min_payout, mp.currency, mp.fee_percentage
       FROM user_miners um
       JOIN mining_pools mp ON um.pool_id = mp.id
       WHERE um.id = $1 AND um.user_id = $2`,
      [minerId, userId]
    );

    if (minerResult.rows.length === 0) {
      throw new AppError('Miner not found', 404);
    }

    const miner = minerResult.rows[0];

    if (parseFloat(miner.pending_balance) < parseFloat(miner.min_payout)) {
      throw new AppError(
        `Minimum payout is ${miner.min_payout} ${miner.currency}. Your pending balance: ${miner.pending_balance}`,
        400
      );
    }

    const amount = parseFloat(miner.pending_balance);
    const fee = (amount * parseFloat(miner.fee_percentage)) / 100;
    const netAmount = amount - fee;

    await db.query('BEGIN');

    try {
      // Create payout record
      const payoutResult = await db.query(
        `INSERT INTO mining_payouts (user_miner_id, user_id, wallet_id, pool_id, amount, currency, fee_amount, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
         RETURNING *`,
        [minerId, userId, miner.wallet_id, miner.pool_id, netAmount, miner.currency, fee]
      );

      // Update miner balances
      await db.query(
        `UPDATE user_miners 
         SET pending_balance = 0,
             paid_balance = paid_balance + $1
         WHERE id = $2`,
        [netAmount, minerId]
      );

      // Add to wallet (simulated - in production, this would trigger actual blockchain transaction)
      await db.query(
        `UPDATE wallets 
         SET available_balance = available_balance + $1
         WHERE id = $2`,
        [netAmount, miner.wallet_id]
      );

      // Create transaction record
      await db.query(
        `INSERT INTO transactions (user_id, wallet_id, type, amount, currency, status)
         VALUES ($1, $2, 'mining_payout', $3, $4, 'completed')`,
        [userId, miner.wallet_id, netAmount, miner.currency]
      );

      // Update payout status
      await db.query(
        `UPDATE mining_payouts 
         SET status = 'completed', 
             processed_at = NOW(),
             completed_at = NOW()
         WHERE id = $1`,
        [payoutResult.rows[0].id]
      );

      await db.query('COMMIT');

      res.json({
        message: 'Payout processed successfully',
        payout: payoutResult.rows[0],
        netAmount,
        fee,
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

// Get mining dashboard overview
export async function getDashboard(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const db = getDatabase();

    // Get overall statistics
    const statsResult = await db.query(
      `SELECT 
        COUNT(DISTINCT um.id) as total_miners,
        COALESCE(SUM(um.total_hashrate), 0) as total_hashrate,
        COALESCE(SUM(um.total_earnings), 0) as total_earnings,
        COALESCE(SUM(um.pending_balance), 0) as pending_balance,
        COUNT(DISTINCT mw.id) as total_workers,
        COUNT(DISTINCT CASE WHEN mw.is_online = true THEN mw.id END) as online_workers
       FROM user_miners um
       LEFT JOIN mining_workers mw ON mw.user_miner_id = um.id
       WHERE um.user_id = $1 AND um.is_active = true`,
      [userId]
    );

    // Get earnings by currency
    const earningsResult = await db.query(
      `SELECT mp.currency, SUM(um.total_earnings) as total, SUM(um.pending_balance) as pending
       FROM user_miners um
       JOIN mining_pools mp ON um.pool_id = mp.id
       WHERE um.user_id = $1
       GROUP BY mp.currency`,
      [userId]
    );

    // Get recent payouts
    const payoutsResult = await db.query(
      `SELECT mp.*, mpool.name as pool_name
       FROM mining_payouts mp
       JOIN mining_pools mpool ON mp.pool_id = mpool.id
       WHERE mp.user_id = $1
       ORDER BY mp.created_at DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      overview: statsResult.rows[0],
      earningsByCurrency: earningsResult.rows,
      recentPayouts: payoutsResult.rows,
    });
  } catch (error) {
    throw error;
  }
}

// Helper function to update miner's total hashrate
async function updateMinerHashrate(minerId: string) {
  const db = getDatabase();
  await db.query(
    `UPDATE user_miners 
     SET total_hashrate = (
       SELECT COALESCE(SUM(hashrate), 0) 
       FROM mining_workers 
       WHERE user_miner_id = $1 AND is_online = true
     )
     WHERE id = $1`,
    [minerId]
  );
}
