-- Cryptex Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    kyc_status VARCHAR(20) DEFAULT 'pending',
    kyc_level INTEGER DEFAULT 0,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallets
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL,
    balance DECIMAL(20, 8) DEFAULT 0,
    available_balance DECIMAL(20, 8) DEFAULT 0,
    locked_balance DECIMAL(20, 8) DEFAULT 0,
    wallet_address VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, currency)
);

-- Trading pairs
CREATE TABLE trading_pairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) UNIQUE NOT NULL,
    base_currency VARCHAR(10) NOT NULL,
    quote_currency VARCHAR(10) NOT NULL,
    min_order_size DECIMAL(20, 8) NOT NULL,
    max_order_size DECIMAL(20, 8),
    price_precision INTEGER DEFAULT 8,
    quantity_precision INTEGER DEFAULT 8,
    maker_fee DECIMAL(5, 4) DEFAULT 0.001,
    taker_fee DECIMAL(5, 4) DEFAULT 0.002,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    trading_pair_id UUID REFERENCES trading_pairs(id),
    order_type VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    price DECIMAL(20, 8),
    quantity DECIMAL(20, 8) NOT NULL,
    filled_quantity DECIMAL(20, 8) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    time_in_force VARCHAR(20) DEFAULT 'GTC',
    stop_price DECIMAL(20, 8),
    client_order_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    INDEX idx_user_orders (user_id, created_at),
    INDEX idx_trading_pair (trading_pair_id, status)
);

-- Trades
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    trading_pair_id UUID REFERENCES trading_pairs(id),
    buyer_user_id UUID REFERENCES users(id),
    seller_user_id UUID REFERENCES users(id),
    price DECIMAL(20, 8) NOT NULL,
    quantity DECIMAL(20, 8) NOT NULL,
    buyer_fee DECIMAL(20, 8) DEFAULT 0,
    seller_fee DECIMAL(20, 8) DEFAULT 0,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_trades (buyer_user_id, executed_at),
    INDEX idx_trading_pair_trades (trading_pair_id, executed_at)
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES wallets(id),
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    tx_hash VARCHAR(255),
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    fee DECIMAL(20, 8) DEFAULT 0,
    confirmations INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    INDEX idx_user_transactions (user_id, created_at)
);

-- AI insights
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    trading_pair_id UUID REFERENCES trading_pairs(id),
    insight_type VARCHAR(50) NOT NULL,
    prediction JSONB,
    confidence_score DECIMAL(5, 4),
    timeframe VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    INDEX idx_user_insights (user_id, created_at)
);

-- Risk assessments
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    risk_score DECIMAL(5, 2) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    portfolio_value DECIMAL(20, 8),
    volatility_score DECIMAL(5, 2),
    diversification_score DECIMAL(5, 2),
    recommendations JSONB,
    assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Market data cache
CREATE TABLE market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trading_pair_id UUID REFERENCES trading_pairs(id),
    open_price DECIMAL(20, 8),
    high_price DECIMAL(20, 8),
    low_price DECIMAL(20, 8),
    close_price DECIMAL(20, 8),
    volume DECIMAL(20, 8),
    timestamp TIMESTAMP NOT NULL,
    interval VARCHAR(10) NOT NULL,
    UNIQUE(trading_pair_id, timestamp, interval)
);

-- Audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_logs (user_id, created_at),
    INDEX idx_action_logs (action, created_at)
);

-- Create indexes for performance
CREATE INDEX idx_orders_status ON orders(status, created_at);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_trades_time ON trades(executed_at);
CREATE INDEX idx_market_data_pair_time ON market_data(trading_pair_id, timestamp);

-- Staking pools
CREATE TABLE staking_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    currency VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    apy DECIMAL(5, 2) NOT NULL, -- Annual Percentage Yield
    min_stake DECIMAL(20, 8) NOT NULL,
    max_stake DECIMAL(20, 8),
    lock_period_days INTEGER NOT NULL, -- 0 for flexible staking
    total_staked DECIMAL(20, 8) DEFAULT 0,
    max_pool_size DECIMAL(20, 8),
    reward_currency VARCHAR(10), -- NULL means same as staking currency
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User stakes
CREATE TABLE user_stakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pool_id UUID REFERENCES staking_pools(id),
    wallet_id UUID REFERENCES wallets(id),
    amount DECIMAL(20, 8) NOT NULL,
    reward_earned DECIMAL(20, 8) DEFAULT 0,
    platform_fee_paid DECIMAL(20, 8) DEFAULT 0,
    premium_bonus_earned DECIMAL(20, 8) DEFAULT 0,
    last_reward_calculation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active', -- active, unstaking, completed, cancelled
    stake_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unlock_date TIMESTAMP,
    unstake_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_stakes (user_id, status),
    INDEX idx_pool_stakes (pool_id, status)
);

-- Staking rewards history
CREATE TABLE staking_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stake_id UUID REFERENCES user_stakes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pool_id UUID REFERENCES staking_pools(id),
    amount DECIMAL(20, 8) NOT NULL,
    platform_fee DECIMAL(20, 8) DEFAULT 0,
    premium_bonus DECIMAL(20, 8) DEFAULT 0,
    net_amount DECIMAL(20, 8) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    reward_type VARCHAR(20) NOT NULL, -- daily, claimed, penalty
    calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMP,
    transaction_id UUID REFERENCES transactions(id),
    INDEX idx_user_rewards (user_id, calculation_date),
    INDEX idx_stake_rewards (stake_id, calculation_date)
);

-- Subscription Plans
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier VARCHAR(20) UNIQUE NOT NULL, -- free, premium, vip
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL,
    price_yearly DECIMAL(10, 2) NOT NULL,
    staking_bonus_percentage DECIMAL(5, 2) DEFAULT 0, -- Premium bonus on staking rewards
    platform_fee_percentage DECIMAL(5, 2) NOT NULL, -- Fee taken from rewards
    trading_fee_discount DECIMAL(5, 2) DEFAULT 0,
    mining_fee_discount DECIMAL(5, 2) DEFAULT 0,
    withdrawal_limit_daily DECIMAL(20, 8),
    max_stakes INTEGER, -- NULL = unlimited
    priority_support BOOLEAN DEFAULT FALSE,
    api_access BOOLEAN DEFAULT FALSE,
    features JSONB, -- Additional features as JSON
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Subscriptions History
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    tier VARCHAR(20) NOT NULL,
    payment_method VARCHAR(50),
    billing_cycle VARCHAR(20), -- monthly, yearly
    amount_paid DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    cancelled_at TIMESTAMP,
    auto_renew BOOLEAN DEFAULT TRUE,
    transaction_id UUID REFERENCES transactions(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_subscriptions (user_id, status),
    INDEX idx_subscription_expiry (expires_at, status)
);

-- Platform Revenue Tracking
CREATE TABLE platform_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    source_type VARCHAR(50) NOT NULL, -- staking, mining, trading, withdrawal
    source_id UUID, -- Reference to stake, miner, trade, etc.
    fee_amount DECIMAL(20, 8) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    fee_percentage DECIMAL(5, 2),
    transaction_type VARCHAR(50),
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_platform_fees_date (collected_at),
    INDEX idx_platform_fees_source (source_type, source_id)
);

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staking_pools_updated_at BEFORE UPDATE ON staking_pools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stakes_updated_at BEFORE UPDATE ON user_stakes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Mining Pools
CREATE TABLE mining_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    currency VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    algorithm VARCHAR(50) NOT NULL, -- SHA-256, Ethash, RandomX, etc.
    pool_type VARCHAR(20) NOT NULL, -- solo, pool
    pool_url VARCHAR(255), -- Stratum URL for pool mining
    pool_port INTEGER,
    fee_percentage DECIMAL(5, 2) DEFAULT 0, -- Pool fee (0 for solo)
    min_payout DECIMAL(20, 8) NOT NULL,
    payout_interval_hours INTEGER DEFAULT 24,
    network_hashrate DECIMAL(30, 2), -- Network hashrate in H/s
    pool_hashrate DECIMAL(30, 2), -- Pool hashrate in H/s
    active_miners INTEGER DEFAULT 0,
    blocks_found INTEGER DEFAULT 0,
    last_block_time TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Mining Configurations
CREATE TABLE user_miners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pool_id UUID REFERENCES mining_pools(id),
    wallet_id UUID REFERENCES wallets(id),
    miner_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    total_hashrate DECIMAL(30, 2) DEFAULT 0, -- Total hashrate from all workers
    total_shares_submitted BIGINT DEFAULT 0,
    total_shares_accepted BIGINT DEFAULT 0,
    total_shares_rejected BIGINT DEFAULT 0,
    total_earnings DECIMAL(20, 8) DEFAULT 0,
    pending_balance DECIMAL(20, 8) DEFAULT 0,
    paid_balance DECIMAL(20, 8) DEFAULT 0,
    last_share_time TIMESTAMP,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, pool_id)
);

-- Mining Workers (individual devices/rigs)
CREATE TABLE mining_workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_miner_id UUID REFERENCES user_miners(id) ON DELETE CASCADE,
    worker_name VARCHAR(100) NOT NULL,
    worker_password VARCHAR(255), -- Optional worker password
    hashrate DECIMAL(30, 2) DEFAULT 0, -- Current hashrate in H/s
    shares_submitted BIGINT DEFAULT 0,
    shares_accepted BIGINT DEFAULT 0,
    shares_rejected BIGINT DEFAULT 0,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP,
    ip_address VARCHAR(45),
    miner_software VARCHAR(100), -- e.g., "CGMiner 4.12.0"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_miner_workers (user_miner_id),
    INDEX idx_worker_status (is_online, last_seen)
);

-- Mining Shares (submitted work)
CREATE TABLE mining_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_miner_id UUID REFERENCES user_miners(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES mining_workers(id),
    pool_id UUID REFERENCES mining_pools(id),
    difficulty DECIMAL(30, 2) NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    is_block BOOLEAN DEFAULT FALSE, -- True if share found a block
    block_height BIGINT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_miner_shares (user_miner_id, submitted_at),
    INDEX idx_pool_shares (pool_id, submitted_at),
    INDEX idx_block_shares (is_block, submitted_at)
);

-- Mining Payouts
CREATE TABLE mining_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_miner_id UUID REFERENCES user_miners(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES wallets(id),
    pool_id UUID REFERENCES mining_pools(id),
    amount DECIMAL(20, 8) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    shares_count BIGINT DEFAULT 0,
    fee_amount DECIMAL(20, 8) DEFAULT 0,
    tx_hash VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_payouts (user_id, created_at),
    INDEX idx_miner_payouts (user_miner_id, status)
);

-- Mining Statistics (hourly aggregation for analytics)
CREATE TABLE mining_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_miner_id UUID REFERENCES user_miners(id) ON DELETE CASCADE,
    pool_id UUID REFERENCES mining_pools(id),
    avg_hashrate DECIMAL(30, 2),
    shares_submitted INTEGER DEFAULT 0,
    shares_accepted INTEGER DEFAULT 0,
    shares_rejected INTEGER DEFAULT 0,
    earnings DECIMAL(20, 8) DEFAULT 0,
    hour_timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_miner_id, hour_timestamp),
    INDEX idx_miner_stats_time (user_miner_id, hour_timestamp),
    INDEX idx_pool_stats_time (pool_id, hour_timestamp)
);

CREATE TRIGGER update_mining_pools_updated_at BEFORE UPDATE ON mining_pools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_miners_updated_at BEFORE UPDATE ON user_miners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mining_workers_updated_at BEFORE UPDATE ON mining_workers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
