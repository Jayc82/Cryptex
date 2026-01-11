-- ============================================================================
-- LIGHTHOUSE TRANSPARENCY LAYER - Schema Migration
-- ============================================================================
-- This migration adds the trust infrastructure that differentiates Cryptex
-- from traditional exchanges: validator choice, yield transparency, airdrops
-- ============================================================================

-- ============================================================================
-- 1. VALIDATOR REGISTRY
-- ============================================================================

-- Validators that can be selected for staking
CREATE TABLE validators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    chain VARCHAR(50) NOT NULL, -- ETH, SOL, COSMOS, etc.
    address VARCHAR(255) NOT NULL, -- On-chain validator address
    commission_rate DECIMAL(5, 4) NOT NULL, -- e.g., 0.0500 = 5%
    
    -- Performance metrics
    uptime_percentage DECIMAL(5, 2) DEFAULT 100.00,
    total_stake DECIMAL(30, 8) DEFAULT 0,
    delegator_count INTEGER DEFAULT 0,
    
    -- Slashing history
    slashing_events INTEGER DEFAULT 0,
    last_slashing_date TIMESTAMP,
    total_slashed_amount DECIMAL(20, 8) DEFAULT 0,
    
    -- Metadata
    description TEXT,
    website VARCHAR(255),
    region VARCHAR(100), -- Geographic location
    esg_compliant BOOLEAN DEFAULT FALSE,
    security_contact VARCHAR(255),
    
    -- Decentralization score (0-100)
    decentralization_score INTEGER DEFAULT 50,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_exchange_validator BOOLEAN DEFAULT FALSE, -- If owned by exchange
    verified_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(chain, address)
);

CREATE INDEX idx_validators_chain ON validators(chain, is_active);
CREATE INDEX idx_validators_performance ON validators(uptime_percentage DESC, slashing_events ASC);

-- Validator performance history (for charting)
CREATE TABLE validator_performance_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    validator_id UUID REFERENCES validators(id) ON DELETE CASCADE,
    
    uptime_percentage DECIMAL(5, 2) NOT NULL,
    total_stake DECIMAL(30, 8) NOT NULL,
    delegator_count INTEGER NOT NULL,
    commission_rate DECIMAL(5, 4) NOT NULL,
    
    epoch_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(validator_id, epoch_date)
);

CREATE INDEX idx_validator_history ON validator_performance_history(validator_id, epoch_date DESC);

-- ============================================================================
-- 2. FEE CAP SYSTEM (Immutable After Initial Set)
-- ============================================================================

CREATE TABLE fee_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_type VARCHAR(50) NOT NULL, -- 'POS_L1', 'ETH', 'LONG_TERM_LOCKUP', 'SPOT_TRADING'
    fee_type VARCHAR(50) NOT NULL, -- 'STAKING', 'MAKER', 'TAKER'
    
    -- Fee structure
    fee_percentage DECIMAL(7, 6) NOT NULL, -- Up to 6 decimals precision
    fee_cap_max DECIMAL(7, 6) NOT NULL, -- Maximum this can ever be
    
    -- Governance
    is_immutable BOOLEAN DEFAULT FALSE, -- Once true, can never change
    requires_vote BOOLEAN DEFAULT TRUE,
    vote_threshold_percentage DECIMAL(5, 2) DEFAULT 66.67, -- 2/3 majority
    
    -- Metadata
    description TEXT,
    rationale TEXT, -- Why this fee exists
    
    effective_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(asset_type, fee_type, effective_date)
);

-- Fee change proposals (governance)
CREATE TABLE fee_change_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_config_id UUID REFERENCES fee_configurations(id),
    
    proposed_fee_percentage DECIMAL(7, 6) NOT NULL,
    rationale TEXT NOT NULL,
    
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, expired
    
    votes_for INTEGER DEFAULT 0,
    votes_against INTEGER DEFAULT 0,
    total_voting_power BIGINT DEFAULT 0,
    
    proposed_by UUID REFERENCES users(id),
    proposed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    voting_ends_at TIMESTAMP NOT NULL,
    executed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. TRANSPARENT YIELD TRACKING
-- ============================================================================

-- Enhanced staking pool with validator support
ALTER TABLE staking_pools ADD COLUMN IF NOT EXISTS validator_id UUID REFERENCES validators(id);
ALTER TABLE staking_pools ADD COLUMN IF NOT EXISTS protocol_yield_apy DECIMAL(7, 4); -- Raw protocol yield
ALTER TABLE staking_pools ADD COLUMN IF NOT EXISTS validator_commission DECIMAL(5, 4); -- Validator's cut
ALTER TABLE staking_pools ADD COLUMN IF NOT EXISTS exchange_fee_percentage DECIMAL(5, 4); -- Exchange fee
ALTER TABLE staking_pools ADD COLUMN IF NOT EXISTS fee_config_id UUID REFERENCES fee_configurations(id);

-- Detailed yield breakdown for every reward calculation
CREATE TABLE yield_breakdowns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stake_id UUID REFERENCES user_stakes(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES staking_rewards(id) ON DELETE CASCADE,
    
    -- Yield components
    gross_protocol_yield DECIMAL(20, 8) NOT NULL, -- Raw yield from protocol
    validator_commission_amount DECIMAL(20, 8) NOT NULL, -- Validator's share
    exchange_fee_amount DECIMAL(20, 8) NOT NULL, -- Exchange's share
    insurance_fund_amount DECIMAL(20, 8) DEFAULT 0, -- Optional insurance contribution
    user_net_yield DECIMAL(20, 8) NOT NULL, -- What user receives
    
    -- Transparency fields
    protocol_yield_rate DECIMAL(7, 4) NOT NULL,
    validator_commission_rate DECIMAL(5, 4) NOT NULL,
    exchange_fee_rate DECIMAL(5, 4) NOT NULL,
    
    calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_yield_breakdowns_stake (stake_id, calculation_date DESC)
);

-- ============================================================================
-- 4. AIRDROP TRACKING & DISTRIBUTION
-- ============================================================================

CREATE TABLE airdrops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    token_symbol VARCHAR(20) NOT NULL,
    chain VARCHAR(50) NOT NULL,
    
    -- Eligibility
    eligible_asset VARCHAR(20) NOT NULL, -- Asset that qualifies (e.g., 'ATOM')
    snapshot_date TIMESTAMP NOT NULL,
    distribution_date TIMESTAMP,
    
    -- Amounts
    total_airdrop_amount DECIMAL(30, 8) NOT NULL,
    exchange_allocation DECIMAL(30, 8) NOT NULL, -- Total allocated to exchange users
    user_passthrough_percentage DECIMAL(5, 2) DEFAULT 100.00, -- Should always be 100%
    
    -- Distribution method
    distribution_type VARCHAR(50) DEFAULT 'proportional', -- proportional, fixed_per_holder
    contract_address VARCHAR(255),
    
    -- Status
    status VARCHAR(30) DEFAULT 'announced', -- announced, snapshot_taken, distributing, completed
    
    description TEXT,
    official_announcement_url VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_airdrops_asset ON airdrops(eligible_asset, snapshot_date);

-- User airdrop allocations
CREATE TABLE user_airdrop_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airdrop_id UUID REFERENCES airdrops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Eligibility
    qualifying_balance DECIMAL(20, 8) NOT NULL, -- Balance at snapshot
    allocation_amount DECIMAL(20, 8) NOT NULL, -- Airdrop amount for this user
    
    -- Distribution
    status VARCHAR(30) DEFAULT 'pending', -- pending, distributed, claimed
    distributed_at TIMESTAMP,
    transaction_id UUID REFERENCES transactions(id),
    
    wallet_id UUID REFERENCES wallets(id), -- Where it was distributed
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(airdrop_id, user_id)
);

CREATE INDEX idx_user_airdrops ON user_airdrop_allocations(user_id, status);

-- ============================================================================
-- 5. PROOF OF RESERVES
-- ============================================================================

CREATE TABLE reserve_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    snapshot_date TIMESTAMP NOT NULL,
    currency VARCHAR(20) NOT NULL,
    
    -- Holdings
    total_user_balances DECIMAL(30, 8) NOT NULL, -- Sum of all user balances
    total_exchange_holdings DECIMAL(30, 8) NOT NULL, -- Actual holdings
    reserve_ratio DECIMAL(7, 4) NOT NULL, -- Should be >= 1.00 (100%)
    
    -- Staking specific
    total_staked_amount DECIMAL(30, 8) DEFAULT 0,
    total_rewards_owed DECIMAL(30, 8) DEFAULT 0,
    
    -- On-chain verification
    blockchain_addresses JSONB, -- Array of addresses with balances
    verification_tx_hash VARCHAR(255),
    merkle_root VARCHAR(255), -- For cryptographic proof
    
    -- Auditor attestation
    audited BOOLEAN DEFAULT FALSE,
    auditor_signature TEXT,
    audit_report_url VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(snapshot_date, currency)
);

CREATE INDEX idx_reserve_snapshots ON reserve_snapshots(currency, snapshot_date DESC);

-- ============================================================================
-- 6. PUBLIC TRANSPARENCY METRICS
-- ============================================================================

CREATE TABLE transparency_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    
    -- User statistics
    total_active_users INTEGER DEFAULT 0,
    total_staking_users INTEGER DEFAULT 0,
    new_users_today INTEGER DEFAULT 0,
    
    -- Volume statistics
    total_trading_volume_24h DECIMAL(30, 8) DEFAULT 0,
    total_staked_value_usd DECIMAL(30, 8) DEFAULT 0,
    
    -- Fee transparency
    total_trading_fees_collected DECIMAL(20, 8) DEFAULT 0,
    total_staking_fees_collected DECIMAL(20, 8) DEFAULT 0,
    total_rewards_distributed DECIMAL(20, 8) DEFAULT 0,
    
    -- Insurance fund
    insurance_fund_balance DECIMAL(20, 8) DEFAULT 0,
    slashing_events_covered INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(metric_date)
);

CREATE INDEX idx_transparency_metrics_date ON transparency_metrics(metric_date DESC);

-- ============================================================================
-- 7. SLASHING INSURANCE FUND
-- ============================================================================

CREATE TABLE insurance_fund (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    currency VARCHAR(20) NOT NULL,
    balance DECIMAL(20, 8) DEFAULT 0,
    
    -- Funding sources
    total_from_fees DECIMAL(20, 8) DEFAULT 0,
    total_from_premiums DECIMAL(20, 8) DEFAULT 0,
    total_from_donations DECIMAL(20, 8) DEFAULT 0,
    
    -- Payouts
    total_claims_paid DECIMAL(20, 8) DEFAULT 0,
    claims_count INTEGER DEFAULT 0,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(currency)
);

CREATE TABLE insurance_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    stake_id UUID REFERENCES user_stakes(id),
    validator_id UUID REFERENCES validators(id),
    
    -- Claim details
    claim_type VARCHAR(30) NOT NULL, -- 'slashing', 'downtime'
    amount_lost DECIMAL(20, 8) NOT NULL,
    amount_claimed DECIMAL(20, 8) NOT NULL,
    amount_paid DECIMAL(20, 8),
    
    -- Evidence
    slashing_tx_hash VARCHAR(255),
    evidence_url VARCHAR(500),
    
    status VARCHAR(30) DEFAULT 'submitted', -- submitted, reviewing, approved, paid, rejected
    
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    paid_at TIMESTAMP,
    
    reviewer_notes TEXT
);

CREATE INDEX idx_insurance_claims ON insurance_claims(user_id, status);

-- ============================================================================
-- 8. USER VALIDATOR PREFERENCES
-- ============================================================================

CREATE TABLE user_validator_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    chain VARCHAR(50) NOT NULL,
    
    -- Preference rankings (1 = highest preference)
    preferred_validator_1 UUID REFERENCES validators(id),
    preferred_validator_2 UUID REFERENCES validators(id),
    preferred_validator_3 UUID REFERENCES validators(id),
    
    -- Criteria weights (0-100)
    uptime_weight INTEGER DEFAULT 40,
    decentralization_weight INTEGER DEFAULT 30,
    commission_weight INTEGER DEFAULT 20,
    esg_weight INTEGER DEFAULT 10,
    
    auto_rebalance BOOLEAN DEFAULT FALSE, -- Automatically switch if validator degrades
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, chain)
);

-- ============================================================================
-- SEED DATA: Initial Fee Configurations
-- ============================================================================

-- Transparent, capped, competitive fees
INSERT INTO fee_configurations (asset_type, fee_type, fee_percentage, fee_cap_max, is_immutable, description, rationale, effective_date) VALUES
('ETH', 'STAKING', 0.030000, 0.030000, TRUE, 'Ethereum Staking Fee', 'Covers infrastructure, insurance, and compliance costs for ETH staking', NOW()),
('POS_L1', 'STAKING', 0.040000, 0.050000, FALSE, 'Layer 1 PoS Staking Fee', 'Standard fee for major PoS chains', NOW()),
('LONG_TERM_LOCKUP', 'STAKING', 0.015000, 0.020000, FALSE, 'Long-term Lockup Discount', 'Reduced fee for stakes > 180 days', NOW()),
('SPOT_TRADING', 'MAKER', 0.000500, 0.001000, FALSE, 'Spot Market Maker Fee', 'Honest maker fee with no PFOF', NOW()),
('SPOT_TRADING', 'TAKER', 0.001000, 0.002000, FALSE, 'Spot Market Taker Fee', 'Honest taker fee with no PFOF', NOW());

-- ============================================================================
-- VIEWS FOR PUBLIC TRANSPARENCY DASHBOARD
-- ============================================================================

-- Aggregated validator performance
CREATE OR REPLACE VIEW public_validator_rankings AS
SELECT 
    v.id,
    v.name,
    v.chain,
    v.address,
    v.commission_rate,
    v.uptime_percentage,
    v.slashing_events,
    v.decentralization_score,
    v.is_exchange_validator,
    COUNT(DISTINCT us.id) as active_stakes,
    COALESCE(SUM(us.amount), 0) as total_staked_by_users
FROM validators v
LEFT JOIN staking_pools sp ON sp.validator_id = v.id
LEFT JOIN user_stakes us ON us.pool_id = sp.id AND us.status = 'active'
WHERE v.is_active = TRUE
GROUP BY v.id
ORDER BY v.uptime_percentage DESC, v.slashing_events ASC;

-- Reserve ratio summary
CREATE OR REPLACE VIEW current_reserve_ratios AS
SELECT 
    rs.currency,
    rs.total_user_balances,
    rs.total_exchange_holdings,
    rs.reserve_ratio,
    rs.snapshot_date,
    rs.audited
FROM reserve_snapshots rs
INNER JOIN (
    SELECT currency, MAX(snapshot_date) as latest_date
    FROM reserve_snapshots
    GROUP BY currency
) latest ON rs.currency = latest.currency AND rs.snapshot_date = latest.latest_date;

COMMENT ON TABLE validators IS 'Public registry of all staking validators with performance metrics and on-chain addresses';
COMMENT ON TABLE fee_configurations IS 'Immutable fee caps - once set to immutable, cannot be changed without governance vote';
COMMENT ON TABLE yield_breakdowns IS 'Complete transparency: every dollar of yield is accounted for';
COMMENT ON TABLE airdrops IS 'All airdrops with 100% user pass-through policy';
COMMENT ON TABLE reserve_snapshots IS 'Proof of Reserves - cryptographically verifiable solvency';
