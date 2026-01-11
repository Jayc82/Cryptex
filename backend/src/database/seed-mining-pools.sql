-- Sample Mining Pools Data
-- Run this after the main schema to populate initial mining pools

-- Bitcoin Mining Pools
INSERT INTO mining_pools (currency, name, description, algorithm, pool_type, pool_url, pool_port, fee_percentage, min_payout, network_hashrate, pool_hashrate, is_active) VALUES
('BTC', 'Cryptex BTC Pool', 'Official Bitcoin mining pool with low fees and high reliability. Perfect for miners of all sizes.', 'SHA-256', 'pool', 'stratum+tcp://btc.cryptex.pool', 3333, 1.00, 0.001, 250000000000000000, 5000000000000000, true),
('BTC', 'BTC Solo Mining', 'Solo Bitcoin mining for maximum rewards. Keep 100% of block rewards minus platform fee.', 'SHA-256', 'solo', 'stratum+tcp://btc-solo.cryptex.pool', 3334, 0.50, 0.01, 250000000000000000, NULL, true);

-- Ethereum Mining Pools  
INSERT INTO mining_pools (currency, name, description, algorithm, pool_type, pool_url, pool_port, fee_percentage, min_payout, network_hashrate, pool_hashrate, is_active) VALUES
('ETH', 'Cryptex ETH Pool', 'High-performance Ethereum mining pool with instant payouts and detailed statistics.', 'Ethash', 'pool', 'stratum+tcp://eth.cryptex.pool', 4444, 1.00, 0.01, 900000000000000, 45000000000000, true),
('ETH', 'ETH Solo Mining', 'Solo Ethereum mining with full block rewards. High risk, high reward.', 'Ethash', 'solo', 'stratum+tcp://eth-solo.cryptex.pool', 4445, 0.50, 0.05, 900000000000000, NULL, true);

-- Litecoin Mining Pools
INSERT INTO mining_pools (currency, name, description, algorithm, pool_type, pool_url, pool_port, fee_percentage, min_payout, network_hashrate, pool_hashrate, is_active) VALUES
('LTC', 'Cryptex LTC Pool', 'Litecoin mining pool with merged mining support. Earn LTC and DOGE simultaneously.', 'Scrypt', 'pool', 'stratum+tcp://ltc.cryptex.pool', 5555, 1.50, 0.1, 500000000000, 25000000000, true),
('LTC', 'LTC Solo Mining', 'Solo Litecoin mining pool. Full control over your mining operations.', 'Scrypt', 'solo', 'stratum+tcp://ltc-solo.cryptex.pool', 5556, 0.50, 1.0, 500000000000, NULL, true);

-- Monero Mining Pools
INSERT INTO mining_pools (currency, name, description, algorithm, pool_type, pool_url, pool_port, fee_percentage, min_payout, network_hashrate, pool_hashrate, is_active) VALUES
('XMR', 'Cryptex XMR Pool', 'CPU-friendly Monero mining pool. Privacy-focused with low minimum payout.', 'RandomX', 'pool', 'stratum+tcp://xmr.cryptex.pool', 6666, 1.00, 0.1, 2500000000, 125000000, true),
('XMR', 'XMR Solo Mining', 'Solo Monero mining for privacy enthusiasts. Mine with full anonymity.', 'RandomX', 'solo', 'stratum+tcp://xmr-solo.cryptex.pool', 6667, 0.50, 1.0, 2500000000, NULL, true);

-- Ravencoin Mining Pools
INSERT INTO mining_pools (currency, name, description, algorithm, pool_type, pool_url, pool_port, fee_percentage, min_payout, network_hashrate, pool_hashrate, is_active) VALUES
('RVN', 'Cryptex RVN Pool', 'Ravencoin mining pool with ASIC resistance. GPU miners welcome.', 'KAWPOW', 'pool', 'stratum+tcp://rvn.cryptex.pool', 7777, 1.00, 10.0, 8000000000000, 400000000000, true);

-- Zcash Mining Pools
INSERT INTO mining_pools (currency, name, description, algorithm, pool_type, pool_url, pool_port, fee_percentage, min_payout, network_hashrate, pool_hashrate, is_active) VALUES
('ZEC', 'Cryptex ZEC Pool', 'Zcash Equihash mining pool with transparent and shielded address support.', 'Equihash', 'pool', 'stratum+tcp://zec.cryptex.pool', 8888, 1.00, 0.01, 5000000000, 250000000, true);

-- Ergo Mining Pools
INSERT INTO mining_pools (currency, name, description, algorithm, pool_type, pool_url, pool_port, fee_percentage, min_payout, network_hashrate, pool_hashrate, is_active) VALUES
('ERG', 'Cryptex ERG Pool', 'Ergo mining pool using Autolykos v2 algorithm. GPU mining optimized.', 'Autolykos', 'pool', 'stratum+tcp://erg.cryptex.pool', 9999, 1.00, 1.0, 30000000000000, 1500000000000, true);

-- Dogecoin Mining Pool (merged with LTC)
INSERT INTO mining_pools (currency, name, description, algorithm, pool_type, pool_url, pool_port, fee_percentage, min_payout, network_hashrate, pool_hashrate, is_active) VALUES
('DOGE', 'Cryptex DOGE Pool', 'Dogecoin mining pool with Litecoin merged mining. Earn both DOGE and LTC!', 'Scrypt', 'pool', 'stratum+tcp://doge.cryptex.pool', 10000, 1.50, 100.0, 400000000000, 20000000000, true);

-- Update blocks found for active pools (simulated historical data)
UPDATE mining_pools SET blocks_found = FLOOR(RANDOM() * 1000) + 100 WHERE pool_type = 'pool';
UPDATE mining_pools SET blocks_found = FLOOR(RANDOM() * 50) + 5 WHERE pool_type = 'solo';
UPDATE mining_pools SET last_block_time = NOW() - (RANDOM() * INTERVAL '24 hours');
UPDATE mining_pools SET active_miners = FLOOR(RANDOM() * 1000) + 50 WHERE pool_type = 'pool';
UPDATE mining_pools SET active_miners = FLOOR(RANDOM() * 50) + 1 WHERE pool_type = 'solo';
