-- ============================================================================
-- UPDATE TRADING FEES TO HONEST STRUCTURE
-- ============================================================================
-- Lighthouse Exchange Model: Ultra-low, transparent fees
-- No payment for order flow, no hidden spreads
-- ============================================================================

-- Update default trading fees to competitive, honest rates
ALTER TABLE trading_pairs 
  ALTER COLUMN maker_fee SET DEFAULT 0.0005, -- 0.05%
  ALTER COLUMN taker_fee SET DEFAULT 0.0010; -- 0.10%

-- Update existing trading pairs
UPDATE trading_pairs
SET 
  maker_fee = 0.0005,  -- 0.05%
  taker_fee = 0.0010,  -- 0.10%
  updated_at = NOW()
WHERE maker_fee > 0.0005 OR taker_fee > 0.0010;

-- Add transparency flag
ALTER TABLE trading_pairs ADD COLUMN IF NOT EXISTS no_pfof BOOLEAN DEFAULT TRUE;
ALTER TABLE trading_pairs ADD COLUMN IF NOT EXISTS fee_notes TEXT DEFAULT 'No payment for order flow. Orders go directly to the book.';

-- Update fee notes for all pairs
UPDATE trading_pairs
SET 
  no_pfof = TRUE,
  fee_notes = 'No payment for order flow. Orders go directly to the book.',
  updated_at = NOW();

-- Add volume-based fee tiers (optional, for high-volume traders)
CREATE TABLE IF NOT EXISTS trading_fee_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier_name VARCHAR(50) NOT NULL,
    min_30d_volume DECIMAL(20, 8) NOT NULL, -- Minimum 30-day volume in USD
    maker_fee DECIMAL(5, 4) NOT NULL,
    taker_fee DECIMAL(5, 4) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tier_name)
);

-- Honest fee tiers (no token requirements, just volume)
INSERT INTO trading_fee_tiers (tier_name, min_30d_volume, maker_fee, taker_fee, description) VALUES
('Base', 0, 0.0005, 0.0010, 'Default fee for all users'),
('Active', 50000, 0.0004, 0.0008, 'For users with $50k+ 30-day volume'),
('Professional', 500000, 0.0003, 0.0006, 'For users with $500k+ 30-day volume'),
('Institutional', 5000000, 0.0002, 0.0005, 'For users with $5M+ 30-day volume'),
('Market Maker', 50000000, 0.0000, 0.0003, 'For users with $50M+ 30-day volume')
ON CONFLICT (tier_name) DO UPDATE SET
  maker_fee = EXCLUDED.maker_fee,
  taker_fee = EXCLUDED.taker_fee,
  description = EXCLUDED.description;

-- User trading volume tracking (for fee tier assignment)
CREATE TABLE IF NOT EXISTS user_trading_volumes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    month_start DATE NOT NULL,
    total_volume_usd DECIMAL(30, 8) DEFAULT 0,
    trade_count INTEGER DEFAULT 0,
    current_tier VARCHAR(50) DEFAULT 'Base',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, month_start)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_trading_volumes ON user_trading_volumes(user_id, month_start DESC);

COMMENT ON TABLE trading_fee_tiers IS 'Honest, volume-based fee tiers. No token gating, no fake discounts';
COMMENT ON COLUMN trading_pairs.no_pfof IS 'TRUE means no payment for order flow - orders go directly to the book';
