-- Sample Staking Pools Data
-- Run this after the main schema to populate initial staking pools

-- Flexible Staking Pools (0 lock period)
INSERT INTO staking_pools (currency, name, description, apy, min_stake, max_stake, lock_period_days, max_pool_size, is_active, start_date) VALUES
('BTC', 'Bitcoin Flexible Staking', 'Earn rewards with no lock-in period. Stake and unstake anytime.', 3.50, 0.001, 10, 0, 1000, true, NOW()),
('ETH', 'Ethereum Flexible Staking', 'Flexible ETH staking with daily rewards. No lock-in required.', 4.00, 0.01, 100, 0, 5000, true, NOW()),
('USDT', 'USDT Flexible Savings', 'Earn stable returns on USDT with instant withdrawal.', 5.00, 100, 100000, 0, 10000000, true, NOW());

-- 30-Day Locked Staking Pools
INSERT INTO staking_pools (currency, name, description, apy, min_stake, max_stake, lock_period_days, max_pool_size, is_active, start_date) VALUES
('BTC', 'Bitcoin 30-Day Locked', 'Higher APY for 30-day commitment. Premium rewards for Bitcoin holders.', 7.00, 0.001, 5, 30, 500, true, NOW()),
('ETH', 'Ethereum 30-Day Locked', 'Earn more by locking your ETH for 30 days. Better returns guaranteed.', 8.50, 0.01, 50, 30, 2500, true, NOW()),
('BNB', 'BNB 30-Day Staking', 'Lock BNB for 30 days and earn attractive rewards.', 9.00, 0.1, 1000, 30, 50000, true, NOW());

-- 90-Day Locked Staking Pools
INSERT INTO staking_pools (currency, name, description, apy, min_stake, max_stake, lock_period_days, max_pool_size, is_active, start_date) VALUES
('BTC', 'Bitcoin 90-Day Locked', 'Maximum APY for long-term Bitcoin stakers. 90-day lock period.', 12.00, 0.001, 3, 90, 300, true, NOW()),
('ETH', 'Ethereum 90-Day Locked', 'Best ETH staking rates for 90-day commitment. Top tier rewards.', 14.00, 0.01, 30, 90, 1500, true, NOW()),
('ADA', 'Cardano 90-Day Staking', 'Stake ADA for 90 days and maximize your returns.', 15.00, 10, 100000, 90, 1000000, true, NOW());

-- 180-Day Locked Staking Pools (Highest APY)
INSERT INTO staking_pools (currency, name, description, apy, min_stake, max_stake, lock_period_days, max_pool_size, is_active, start_date) VALUES
('BTC', 'Bitcoin 180-Day Premium', 'Premium staking pool with highest Bitcoin APY. 6-month commitment.', 18.00, 0.01, 2, 180, 200, true, NOW()),
('ETH', 'Ethereum 180-Day Premium', 'Elite ETH staking with maximum returns. 6-month lock period.', 20.00, 0.1, 20, 180, 1000, true, NOW()),
('DOT', 'Polkadot 180-Day Staking', 'Long-term DOT staking with exceptional rewards.', 22.00, 5, 50000, 180, 500000, true, NOW());

-- Special Pools
INSERT INTO staking_pools (currency, name, description, apy, min_stake, max_stake, lock_period_days, max_pool_size, is_active, start_date, end_date) VALUES
('USDT', 'USDT Holiday Special', 'Limited time offer! Higher APY for USDT staking.', 8.00, 500, 50000, 60, 5000000, true, NOW(), NOW() + INTERVAL '90 days'),
('BNB', 'BNB Launch Pool', 'Special launch pool with bonus rewards. Limited capacity!', 25.00, 1, 500, 90, 10000, true, NOW(), NOW() + INTERVAL '30 days');
