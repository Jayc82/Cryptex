-- Subscription Plans Seed Data
-- Run this after the main schema to populate subscription tiers

-- Free Tier (Default)
INSERT INTO subscription_plans (
    tier, 
    name, 
    description, 
    price_monthly, 
    price_yearly,
    staking_bonus_percentage,
    platform_fee_percentage,
    trading_fee_discount,
    mining_fee_discount,
    withdrawal_limit_daily,
    max_stakes,
    priority_support,
    api_access,
    features,
    is_active
) VALUES (
    'free',
    'Free Plan',
    'Get started with Cryptex platform. Basic access to trading, staking, and mining features.',
    0.00,
    0.00,
    0.00, -- No premium bonus
    5.00, -- 5% platform fee on staking rewards
    0.00, -- No trading fee discount
    0.00, -- No mining fee discount
    1000.00, -- $1000 daily withdrawal limit
    10, -- Max 10 active stakes
    false,
    false,
    '{"features": ["Basic Trading", "Standard Staking", "Basic Mining", "Email Support", "Mobile App Access"]}'::jsonb,
    true
);

-- Premium Tier
INSERT INTO subscription_plans (
    tier, 
    name, 
    description, 
    price_monthly, 
    price_yearly,
    staking_bonus_percentage,
    platform_fee_percentage,
    trading_fee_discount,
    mining_fee_discount,
    withdrawal_limit_daily,
    max_stakes,
    priority_support,
    api_access,
    features,
    is_active
) VALUES (
    'premium',
    'Premium Plan',
    'Maximize your earnings with boosted staking rewards, reduced fees, and priority support.',
    29.99,
    299.99, -- 2 months free on yearly
    25.00, -- +25% bonus on staking rewards
    2.00, -- Only 2% platform fee (reduced from 5%)
    20.00, -- 20% discount on trading fees
    15.00, -- 15% discount on mining fees
    10000.00, -- $10,000 daily withdrawal limit
    50, -- Max 50 active stakes
    true,
    false,
    '{"features": ["Advanced Trading Tools", "Boosted Staking Rewards (+25%)", "Reduced Platform Fees (2%)", "Priority Mining", "24/7 Priority Support", "Advanced Analytics", "Early Access to New Features", "Lower Trading Fees", "Higher Withdrawal Limits"]}'::jsonb,
    true
);

-- VIP Tier
INSERT INTO subscription_plans (
    tier, 
    name, 
    description, 
    price_monthly, 
    price_yearly,
    staking_bonus_percentage,
    platform_fee_percentage,
    trading_fee_discount,
    mining_fee_discount,
    withdrawal_limit_daily,
    max_stakes,
    priority_support,
    api_access,
    features,
    is_active
) VALUES (
    'vip',
    'VIP Plan',
    'Ultimate trading experience with maximum rewards, zero platform fees on staking, and exclusive benefits.',
    99.99,
    999.99, -- 2 months free on yearly
    50.00, -- +50% bonus on staking rewards
    0.00, -- 0% platform fee - all rewards go to user!
    50.00, -- 50% discount on trading fees
    30.00, -- 30% discount on mining fees
    NULL, -- Unlimited daily withdrawals
    NULL, -- Unlimited active stakes
    true,
    true,
    '{"features": ["Pro Trading Suite", "Maximum Staking Rewards (+50%)", "Zero Platform Fees on Staking", "VIP Mining Priority", "Dedicated Account Manager", "24/7 VIP Support", "API Access", "Custom Trading Bots", "Institutional-Grade Analytics", "White-Glove Service", "Exclusive Market Insights", "Lowest Trading Fees", "Unlimited Withdrawals", "Private Telegram Channel"]}'::jsonb,
    true
);

-- Note: Platform fees are collected on rewards distribution
-- Example calculations:
-- 
-- FREE TIER (5% fee):
--   Base reward: 1 BTC
--   Platform fee: 0.05 BTC (5%)
--   User receives: 0.95 BTC
--
-- PREMIUM TIER (25% bonus, 2% fee):
--   Base reward: 1 BTC
--   Premium bonus: 0.25 BTC (25%)
--   Total: 1.25 BTC
--   Platform fee: 0.025 BTC (2% of 1.25)
--   User receives: 1.225 BTC
--
-- VIP TIER (50% bonus, 0% fee):
--   Base reward: 1 BTC
--   VIP bonus: 0.5 BTC (50%)
--   Total: 1.5 BTC
--   Platform fee: 0 BTC (0%)
--   User receives: 1.5 BTC
