import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../database/connection';
import { AppError } from '../middleware/errorHandler';

interface AuthRequest extends Request {
  user?: { userId: string; username: string; email: string };
}

// Get all subscription plans
export const getSubscriptionPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    
    const result = await db.query(`
      SELECT 
        id, tier, name, description,
        price_monthly, price_yearly,
        staking_bonus_percentage,
        platform_fee_percentage,
        trading_fee_discount,
        mining_fee_discount,
        withdrawal_limit_daily,
        max_stakes,
        priority_support,
        api_access,
        features
      FROM subscription_plans
      WHERE is_active = true
      ORDER BY 
        CASE tier
          WHEN 'free' THEN 1
          WHEN 'premium' THEN 2
          WHEN 'vip' THEN 3
          ELSE 4
        END
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// Get user's current subscription
export const getUserSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const db = getDatabase();

    // Get user's current tier and expiry
    const userResult = await db.query(`
      SELECT subscription_tier, subscription_expires_at
      FROM users
      WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = userResult.rows[0];
    const tier = user.subscription_tier || 'free';
    const expiresAt = user.subscription_expires_at;

    // Check if subscription is expired
    const isExpired = expiresAt && new Date(expiresAt) < new Date();
    const effectiveTier = isExpired ? 'free' : tier;

    // Get plan details
    const planResult = await db.query(`
      SELECT 
        id, tier, name, description,
        price_monthly, price_yearly,
        staking_bonus_percentage,
        platform_fee_percentage,
        trading_fee_discount,
        mining_fee_discount,
        withdrawal_limit_daily,
        max_stakes,
        priority_support,
        api_access,
        features
      FROM subscription_plans
      WHERE tier = $1
    `, [effectiveTier]);

    // Get subscription history
    const historyResult = await db.query(`
      SELECT 
        id, tier, billing_cycle,
        amount_paid, currency,
        status, started_at, expires_at,
        auto_renew
      FROM user_subscriptions
      WHERE user_id = $1
      ORDER BY started_at DESC
      LIMIT 5
    `, [userId]);

    res.json({
      success: true,
      data: {
        currentTier: effectiveTier,
        expiresAt: expiresAt,
        isExpired: isExpired,
        plan: planResult.rows[0],
        history: historyResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

// Upgrade subscription (simplified - no payment processing)
export const upgradeSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { planId, billingCycle } = req.body;

    if (!planId || !billingCycle) {
      throw new AppError('Plan ID and billing cycle are required', 400);
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      throw new AppError('Billing cycle must be monthly or yearly', 400);
    }

    const db = getDatabase();

    // Get plan details
    const planResult = await db.query(`
      SELECT * FROM subscription_plans
      WHERE id = $1 AND is_active = true
    `, [planId]);

    if (planResult.rows.length === 0) {
      throw new AppError('Subscription plan not found', 404);
    }

    const plan = planResult.rows[0];
    const amount = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
    const duration = billingCycle === 'monthly' ? '1 month' : '1 year';

    // In production, integrate payment gateway here
    // For now, we'll simulate successful payment

    await db.query('BEGIN');

    try {
      // Update user's subscription tier
      const expiresAt = new Date();
      if (billingCycle === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      await db.query(`
        UPDATE users
        SET subscription_tier = $1,
            subscription_expires_at = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [plan.tier, expiresAt, userId]);

      // Create subscription record
      const subscriptionResult = await db.query(`
        INSERT INTO user_subscriptions (
          user_id, plan_id, tier,
          payment_method, billing_cycle,
          amount_paid, currency,
          status, expires_at,
          auto_renew
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        userId, planId, plan.tier,
        'platform_credit', billingCycle,
        amount, 'USD',
        'active', expiresAt,
        true
      ]);

      await db.query('COMMIT');

      res.json({
        success: true,
        message: `Successfully upgraded to ${plan.name}!`,
        data: {
          subscription: subscriptionResult.rows[0],
          expiresAt: expiresAt
        }
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Cancel subscription (will continue until expiry)
export const cancelSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const db = getDatabase();

    // Get current active subscription
    const subResult = await db.query(`
      SELECT * FROM user_subscriptions
      WHERE user_id = $1 AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `, [userId]);

    if (subResult.rows.length === 0) {
      throw new AppError('No active subscription found', 404);
    }

    const subscription = subResult.rows[0];

    // Update subscription to cancelled
    await db.query(`
      UPDATE user_subscriptions
      SET status = 'cancelled',
          auto_renew = false,
          cancelled_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [subscription.id]);

    res.json({
      success: true,
      message: 'Subscription cancelled. Access will continue until expiry date.',
      data: {
        expiresAt: subscription.expires_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get subscription benefits comparison
export const getSubscriptionComparison = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();

    const result = await db.query(`
      SELECT 
        tier, name, description,
        price_monthly, price_yearly,
        staking_bonus_percentage,
        platform_fee_percentage,
        trading_fee_discount,
        mining_fee_discount,
        withdrawal_limit_daily,
        max_stakes,
        priority_support,
        api_access,
        features
      FROM subscription_plans
      WHERE is_active = true
      ORDER BY 
        CASE tier
          WHEN 'free' THEN 1
          WHEN 'premium' THEN 2
          WHEN 'vip' THEN 3
          ELSE 4
        END
    `);

    // Calculate potential earnings examples
    const stakingExample = {
      amount: 1.0, // 1 BTC staked
      poolApy: 12.0, // 12% APY
      free: {
        baseReward: 0.12,
        bonus: 0,
        platformFee: 0.006,
        netReward: 0.114
      },
      premium: {
        baseReward: 0.12,
        bonus: 0.03, // 25% bonus
        platformFee: 0.003,
        netReward: 0.147
      },
      vip: {
        baseReward: 0.12,
        bonus: 0.06, // 50% bonus
        platformFee: 0,
        netReward: 0.18
      }
    };

    res.json({
      success: true,
      data: {
        plans: result.rows,
        examples: {
          staking: stakingExample
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get platform fee statistics (admin)
export const getPlatformFeeStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const { startDate, endDate, sourceType } = req.query;

    let query = `
      SELECT 
        source_type,
        currency,
        COUNT(*) as transaction_count,
        SUM(fee_amount) as total_fees,
        AVG(fee_percentage) as avg_fee_percentage
      FROM platform_fees
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND collected_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND collected_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (sourceType) {
      query += ` AND source_type = $${paramIndex}`;
      params.push(sourceType);
      paramIndex++;
    }

    query += `
      GROUP BY source_type, currency
      ORDER BY total_fees DESC
    `;

    const result = await db.query(query, params);

    // Get total revenue
    const totalResult = await db.query(`
      SELECT 
        SUM(fee_amount) as total_revenue,
        COUNT(DISTINCT user_id) as unique_users
      FROM platform_fees
      WHERE collected_at >= CURRENT_DATE - INTERVAL '30 days'
    `);

    res.json({
      success: true,
      data: {
        breakdown: result.rows,
        summary: totalResult.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};
