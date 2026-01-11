import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabase } from '../database/connection';
import { AppError } from '../middleware/errorHandler';

// Get all staking pools
export async function getStakingPools(req: AuthRequest, res: Response) {
  try {
    const { currency, active } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM staking_pools WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (currency) {
      query += ` AND currency = $${paramCount}`;
      params.push(currency);
      paramCount++;
    }

    if (active !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      params.push(active === 'true');
      paramCount++;
    }

    query += ' ORDER BY apy DESC, created_at DESC';

    const result = await db.query(query, params);

    // Enrich with pool statistics
    const pools = await Promise.all(
      result.rows.map(async (pool) => {
        const statsQuery = `
          SELECT 
            COUNT(*) as active_stakers,
            SUM(amount) as total_staked
          FROM user_stakes
          WHERE pool_id = $1 AND status = 'active'
        `;
        const stats = await db.query(statsQuery, [pool.id]);

        return {
          ...pool,
          activeStakers: parseInt(stats.rows[0].active_stakers) || 0,
          totalStaked: parseFloat(stats.rows[0].total_staked) || 0,
          utilization: pool.max_pool_size
            ? (parseFloat(stats.rows[0].total_staked) / parseFloat(pool.max_pool_size)) * 100
            : null,
        };
      })
    );

    res.json(pools);
  } catch (error) {
    throw error;
  }
}

// Get specific staking pool
export async function getStakingPool(req: AuthRequest, res: Response) {
  try {
    const { poolId } = req.params;
    const db = getDatabase();

    const result = await db.query('SELECT * FROM staking_pools WHERE id = $1', [poolId]);

    if (result.rows.length === 0) {
      throw new AppError('Staking pool not found', 404);
    }

    const pool = result.rows[0];

    // Get pool statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as active_stakers,
        SUM(amount) as total_staked,
        AVG(amount) as avg_stake
      FROM user_stakes
      WHERE pool_id = $1 AND status = 'active'
    `;
    const stats = await db.query(statsQuery, [poolId]);

    res.json({
      ...pool,
      statistics: {
        activeStakers: parseInt(stats.rows[0].active_stakers) || 0,
        totalStaked: parseFloat(stats.rows[0].total_staked) || 0,
        averageStake: parseFloat(stats.rows[0].avg_stake) || 0,
        utilization: pool.max_pool_size
          ? (parseFloat(stats.rows[0].total_staked) / parseFloat(pool.max_pool_size)) * 100
          : null,
      },
    });
  } catch (error) {
    throw error;
  }
}

// Get user's stakes
export async function getUserStakes(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { status, poolId } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        us.*,
        sp.name as pool_name,
        sp.currency,
        sp.apy,
        sp.lock_period_days,
        sp.reward_currency
      FROM user_stakes us
      JOIN staking_pools sp ON us.pool_id = sp.id
      WHERE us.user_id = $1
    `;
    const params: any[] = [userId];
    let paramCount = 2;

    if (status) {
      query += ` AND us.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (poolId) {
      query += ` AND us.pool_id = $${paramCount}`;
      params.push(poolId);
      paramCount++;
    }

    query += ' ORDER BY us.created_at DESC';

    const result = await db.query(query, params);

    // Calculate current rewards for each stake
    const stakes = result.rows.map((stake) => {
      const currentReward = calculatePendingReward(
        parseFloat(stake.amount),
        parseFloat(stake.apy),
        new Date(stake.last_reward_calculation),
        new Date()
      );

      return {
        ...stake,
        currentReward: currentReward + parseFloat(stake.reward_earned),
        isLocked: stake.unlock_date && new Date(stake.unlock_date) > new Date(),
        daysUntilUnlock: stake.unlock_date
          ? Math.max(
              0,
              Math.ceil((new Date(stake.unlock_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            )
          : 0,
      };
    });

    res.json(stakes);
  } catch (error) {
    throw error;
  }
}

// Create a new stake
export async function createStake(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { poolId, amount } = req.body;
    const db = getDatabase();

    // Get pool details
    const poolResult = await db.query('SELECT * FROM staking_pools WHERE id = $1 AND is_active = true', [
      poolId,
    ]);

    if (poolResult.rows.length === 0) {
      throw new AppError('Staking pool not found or inactive', 404);
    }

    const pool = poolResult.rows[0];

    // Validate amount
    if (amount < parseFloat(pool.min_stake)) {
      throw new AppError(`Minimum stake amount is ${pool.min_stake} ${pool.currency}`, 400);
    }

    if (pool.max_stake && amount > parseFloat(pool.max_stake)) {
      throw new AppError(`Maximum stake amount is ${pool.max_stake} ${pool.currency}`, 400);
    }

    // Check pool capacity
    if (pool.max_pool_size) {
      const capacityResult = await db.query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM user_stakes WHERE pool_id = $1 AND status = \'active\'',
        [poolId]
      );
      const currentTotal = parseFloat(capacityResult.rows[0].total);
      if (currentTotal + amount > parseFloat(pool.max_pool_size)) {
        throw new AppError('Pool capacity exceeded', 400);
      }
    }

    // Get user's wallet
    const walletResult = await db.query(
      'SELECT * FROM wallets WHERE user_id = $1 AND currency = $2',
      [userId, pool.currency]
    );

    if (walletResult.rows.length === 0) {
      throw new AppError(`No ${pool.currency} wallet found`, 404);
    }

    const wallet = walletResult.rows[0];

    if (parseFloat(wallet.available_balance) < amount) {
      throw new AppError('Insufficient balance', 400);
    }

    // Start transaction
    await db.query('BEGIN');

    try {
      // Lock funds in wallet
      await db.query(
        `UPDATE wallets 
         SET available_balance = available_balance - $1,
             locked_balance = locked_balance + $1
         WHERE id = $2`,
        [amount, wallet.id]
      );

      // Calculate unlock date
      const unlockDate =
        pool.lock_period_days > 0
          ? new Date(Date.now() + pool.lock_period_days * 24 * 60 * 60 * 1000)
          : null;

      // Create stake
      const stakeResult = await db.query(
        `INSERT INTO user_stakes 
         (user_id, pool_id, wallet_id, amount, unlock_date)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, poolId, wallet.id, amount, unlockDate]
      );

      // Update pool total
      await db.query(
        'UPDATE staking_pools SET total_staked = total_staked + $1 WHERE id = $2',
        [amount, poolId]
      );

      // Create transaction record
      await db.query(
        `INSERT INTO transactions 
         (user_id, wallet_id, type, amount, currency, status)
         VALUES ($1, $2, 'stake', $3, $4, 'completed')`,
        [userId, wallet.id, amount, pool.currency]
      );

      await db.query('COMMIT');

      res.status(201).json({
        message: 'Stake created successfully',
        stake: stakeResult.rows[0],
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

// Unstake (withdraw)
export async function unstake(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { stakeId } = req.params;
    const db = getDatabase();

    // Get stake details
    const stakeResult = await db.query(
      `SELECT us.*, sp.apy, sp.currency, sp.lock_period_days, sp.reward_currency
       FROM user_stakes us
       JOIN staking_pools sp ON us.pool_id = sp.id
       WHERE us.id = $1 AND us.user_id = $2 AND us.status = 'active'`,
      [stakeId, userId]
    );

    if (stakeResult.rows.length === 0) {
      throw new AppError('Stake not found or already unstaked', 404);
    }

    const stake = stakeResult.rows[0];

    // Check if still locked
    if (stake.unlock_date && new Date(stake.unlock_date) > new Date()) {
      throw new AppError(
        `Stake is locked until ${new Date(stake.unlock_date).toISOString()}`,
        400
      );
    }

    // Calculate final rewards with premium bonus and platform fee
    const baseReward = calculatePendingReward(
      parseFloat(stake.amount),
      parseFloat(stake.apy),
      new Date(stake.last_reward_calculation),
      new Date()
    ) + parseFloat(stake.reward_earned);

    const rewardBreakdown = await calculateRewardWithBenefits(userId, baseReward);

    await db.query('BEGIN');

    try {
      // Update stake status with fee and bonus tracking
      await db.query(
        `UPDATE user_stakes 
         SET status = 'completed',
             reward_earned = $1,
             platform_fee_paid = platform_fee_paid + $2,
             premium_bonus_earned = premium_bonus_earned + $3,
             unstake_date = NOW(),
             completed_at = NOW()
         WHERE id = $4`,
        [rewardBreakdown.netReward, rewardBreakdown.platformFee, rewardBreakdown.premiumBonus, stakeId]
      );

      // Return staked amount + net reward to wallet
      await db.query(
        `UPDATE wallets 
         SET available_balance = available_balance + $1 + $2,
             locked_balance = locked_balance - $1
         WHERE id = $3`,
        [stake.amount, rewardBreakdown.netReward, stake.wallet_id]
      );

      // Update pool total
      await db.query(
        'UPDATE staking_pools SET total_staked = total_staked - $1 WHERE id = $2',
        [stake.amount, stake.pool_id]
      );

      // Record reward transaction
      const txResult = await db.query(
        `INSERT INTO transactions 
         (user_id, wallet_id, type, amount, currency, status)
         VALUES ($1, $2, 'unstake', $3, $4, 'completed')
         RETURNING id`,
        [userId, stake.wallet_id, parseFloat(stake.amount) + rewardBreakdown.netReward, stake.currency]
      );

      // Record reward with breakdown
      if (rewardBreakdown.netReward > 0) {
        await db.query(
          `INSERT INTO staking_rewards 
           (stake_id, user_id, pool_id, amount, platform_fee, premium_bonus, net_amount, currency, reward_type, claimed_at, transaction_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'claimed', NOW(), $9)`,
          [stakeId, userId, stake.pool_id, rewardBreakdown.baseReward, rewardBreakdown.platformFee, 
           rewardBreakdown.premiumBonus, rewardBreakdown.netReward, stake.reward_currency || stake.currency, txResult.rows[0].id]
        );
      }

      // Record platform fee
      if (rewardBreakdown.platformFee > 0) {
        await db.query(
          `INSERT INTO platform_fees 
           (user_id, source_type, source_id, fee_amount, currency, fee_percentage)
           VALUES ($1, 'staking', $2, $3, $4, $5)`,
          [userId, stakeId, rewardBreakdown.platformFee, stake.currency, rewardBreakdown.platformFee / rewardBreakdown.subtotal * 100]
        );
      }

      await db.query('COMMIT');

      res.json({
        message: 'Unstaked successfully',
        amount: parseFloat(stake.amount),
        rewardBreakdown: {
          baseReward: rewardBreakdown.baseReward,
          premiumBonus: rewardBreakdown.premiumBonus,
          platformFee: rewardBreakdown.platformFee,
          netReward: rewardBreakdown.netReward,
          tier: rewardBreakdown.tier
        },
        total: parseFloat(stake.amount) + rewardBreakdown.netReward,
        currency: stake.currency,
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

// Claim rewards without unstaking (for flexible staking)
export async function claimRewards(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { stakeId } = req.params;
    const db = getDatabase();

    // Get stake details
    const stakeResult = await db.query(
      `SELECT us.*, sp.apy, sp.currency, sp.lock_period_days, sp.reward_currency
       FROM user_stakes us
       JOIN staking_pools sp ON us.pool_id = sp.id
       WHERE us.id = $1 AND us.user_id = $2 AND us.status = 'active'`,
      [stakeId, userId]
    );

    if (stakeResult.rows.length === 0) {
      throw new AppError('Stake not found', 404);
    }

    const stake = stakeResult.rows[0];

    // Calculate pending rewards with premium bonus and platform fee
    const baseReward = calculatePendingReward(
      parseFloat(stake.amount),
      parseFloat(stake.apy),
      new Date(stake.last_reward_calculation),
      new Date()
    ) + parseFloat(stake.reward_earned);

    if (baseReward <= 0) {
      throw new AppError('No rewards to claim', 400);
    }

    const rewardBreakdown = await calculateRewardWithBenefits(userId, baseReward);

    await db.query('BEGIN');

    try {
      // Reset earned rewards, update calculation time, track fees and bonuses
      await db.query(
        `UPDATE user_stakes 
         SET reward_earned = 0,
             platform_fee_paid = platform_fee_paid + $1,
             premium_bonus_earned = premium_bonus_earned + $2,
             last_reward_calculation = NOW()
         WHERE id = $3`,
        [rewardBreakdown.platformFee, rewardBreakdown.premiumBonus, stakeId]
      );

      // Add net rewards to wallet
      const rewardCurrency = stake.reward_currency || stake.currency;
      await db.query(
        `UPDATE wallets 
         SET available_balance = available_balance + $1
         WHERE user_id = $2 AND currency = $3`,
        [rewardBreakdown.netReward, userId, rewardCurrency]
      );

      // Record transaction
      const txResult = await db.query(
        `INSERT INTO transactions 
         (user_id, wallet_id, type, amount, currency, status)
         VALUES ($1, $2, 'reward', $3, $4, 'completed')
         RETURNING id`,
        [userId, stake.wallet_id, rewardBreakdown.netReward, rewardCurrency]
      );

      // Record reward with breakdown
      await db.query(
        `INSERT INTO staking_rewards 
         (stake_id, user_id, pool_id, amount, platform_fee, premium_bonus, net_amount, currency, reward_type, claimed_at, transaction_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'claimed', NOW(), $9)`,
        [stakeId, userId, stake.pool_id, rewardBreakdown.baseReward, rewardBreakdown.platformFee,
         rewardBreakdown.premiumBonus, rewardBreakdown.netReward, rewardCurrency, txResult.rows[0].id]
      );

      // Record platform fee
      if (rewardBreakdown.platformFee > 0) {
        await db.query(
          `INSERT INTO platform_fees 
           (user_id, source_type, source_id, fee_amount, currency, fee_percentage)
           VALUES ($1, 'staking', $2, $3, $4, $5)`,
          [userId, stakeId, rewardBreakdown.platformFee, rewardCurrency, rewardBreakdown.platformFee / rewardBreakdown.subtotal * 100]
        );
      }

      await db.query('COMMIT');

      res.json({
        message: 'Rewards claimed successfully',
        rewardBreakdown: {
          baseReward: rewardBreakdown.baseReward,
          premiumBonus: rewardBreakdown.premiumBonus,
          platformFee: rewardBreakdown.platformFee,
          netReward: rewardBreakdown.netReward,
          tier: rewardBreakdown.tier
        },
        amount: rewardBreakdown.netReward,
        currency: rewardCurrency,
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

// Get staking rewards history
export async function getRewardsHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { limit = 50, offset = 0 } = req.query;
    const db = getDatabase();

    const result = await db.query(
      `SELECT 
        sr.*,
        sp.name as pool_name,
        sp.currency as pool_currency
       FROM staking_rewards sr
       JOIN staking_pools sp ON sr.pool_id = sp.id
       WHERE sr.user_id = $1
       ORDER BY sr.calculation_date DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) FROM staking_rewards WHERE user_id = $1',
      [userId]
    );

    res.json({
      rewards: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    throw error;
  }
}

// Get staking statistics
export async function getStakingStats(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const db = getDatabase();

    // Get active stakes summary
    const activeStakesResult = await db.query(
      `SELECT 
        COUNT(*) as total_stakes,
        SUM(amount) as total_staked,
        SUM(reward_earned) as total_rewards
       FROM user_stakes
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    // Get rewards by currency
    const rewardsByCurrencyResult = await db.query(
      `SELECT 
        currency,
        SUM(amount) as total_amount
       FROM staking_rewards
       WHERE user_id = $1 AND claimed_at IS NOT NULL
       GROUP BY currency`,
      [userId]
    );

    // Get recent stakes
    const recentStakesResult = await db.query(
      `SELECT us.*, sp.name as pool_name, sp.currency, sp.apy
       FROM user_stakes us
       JOIN staking_pools sp ON us.pool_id = sp.id
       WHERE us.user_id = $1
       ORDER BY us.created_at DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      activeStakes: {
        count: parseInt(activeStakesResult.rows[0].total_stakes) || 0,
        totalStaked: parseFloat(activeStakesResult.rows[0].total_staked) || 0,
        totalRewards: parseFloat(activeStakesResult.rows[0].total_rewards) || 0,
      },
      rewardsByCurrency: rewardsByCurrencyResult.rows,
      recentStakes: recentStakesResult.rows,
    });
  } catch (error) {
    throw error;
  }
}

// Helper function to calculate pending rewards
function calculatePendingReward(
  amount: number,
  apy: number,
  lastCalculation: Date,
  now: Date
): number {
  const daysPassed = (now.getTime() - lastCalculation.getTime()) / (1000 * 60 * 60 * 24);
  const dailyRate = apy / 100 / 365;
  return amount * dailyRate * daysPassed;
}

// Helper function to get user's subscription benefits
async function getUserSubscriptionBenefits(userId: string) {
  const db = getDatabase();
  
  const result = await db.query(`
    SELECT 
      u.subscription_tier,
      u.subscription_expires_at,
      sp.staking_bonus_percentage,
      sp.platform_fee_percentage
    FROM users u
    LEFT JOIN subscription_plans sp ON sp.tier = u.subscription_tier
    WHERE u.id = $1
  `, [userId]);

  if (result.rows.length === 0) {
    // Default free tier benefits
    return {
      tier: 'free',
      stakingBonus: 0,
      platformFee: 5.0 // 5% default
    };
  }

  const user = result.rows[0];
  const isExpired = user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date();

  if (isExpired) {
    // Subscription expired, revert to free tier
    return {
      tier: 'free',
      stakingBonus: 0,
      platformFee: 5.0
    };
  }

  return {
    tier: user.subscription_tier,
    stakingBonus: parseFloat(user.staking_bonus_percentage) || 0,
    platformFee: parseFloat(user.platform_fee_percentage) || 5.0
  };
}

// Helper function to calculate rewards with premium bonus and platform fee
async function calculateRewardWithBenefits(
  userId: string,
  baseReward: number
): Promise<{
  baseReward: number;
  premiumBonus: number;
  subtotal: number;
  platformFee: number;
  netReward: number;
  tier: string;
}> {
  const benefits = await getUserSubscriptionBenefits(userId);
  
  const premiumBonus = baseReward * (benefits.stakingBonus / 100);
  const subtotal = baseReward + premiumBonus;
  const platformFee = subtotal * (benefits.platformFee / 100);
  const netReward = subtotal - platformFee;

  return {
    baseReward,
    premiumBonus,
    subtotal,
    platformFee,
    netReward,
    tier: benefits.tier
  };
}

