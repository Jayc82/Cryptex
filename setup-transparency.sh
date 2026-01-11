#!/bin/bash

# ============================================================================
# LIGHTHOUSE TRUST LAYER - Setup Script
# ============================================================================
# Deploys the transparency infrastructure that makes Cryptex different
# ============================================================================

set -e

echo "🏛️  LIGHTHOUSE TRUST LAYER SETUP"
echo "=================================="
echo ""

# Check if database is accessible
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set your PostgreSQL connection string:"
    echo "export DATABASE_URL='postgresql://user:password@localhost:5432/cryptex'"
    exit 1
fi

echo "✓ Database URL configured"
echo ""

# Run migrations
echo "📦 Running migrations..."
echo ""

echo "  → Installing transparency layer schema..."
psql "$DATABASE_URL" -f backend/src/database/migrations/001-transparency-layer.sql
if [ $? -eq 0 ]; then
    echo "  ✓ Transparency layer installed"
else
    echo "  ⚠️  Transparency layer may already be installed (continuing...)"
fi

echo ""
echo "  → Updating trading fees..."
psql "$DATABASE_URL" -f backend/src/database/migrations/002-honest-trading-fees.sql
if [ $? -eq 0 ]; then
    echo "  ✓ Trading fees updated"
else
    echo "  ⚠️  Trading fees may already be updated (continuing...)"
fi

echo ""
echo "📊 Seeding transparency data..."
echo ""

echo "  → Adding validators, airdrops, and initial metrics..."
psql "$DATABASE_URL" -f backend/src/database/seed-transparency-data.sql
if [ $? -eq 0 ]; then
    echo "  ✓ Transparency data seeded"
else
    echo "  ⚠️  Some data may already exist (continuing...)"
fi

echo ""
echo "✅ SETUP COMPLETE!"
echo "=================="
echo ""
echo "🎯 What was installed:"
echo ""
echo "  📋 Validator Registry"
echo "     - Ethereum, Solana, Cosmos, Polkadot, Cardano validators"
echo "     - Performance tracking and user choice"
echo ""
echo "  💰 Immutable Fee Caps"
echo "     - Staking: 3-5% (vs industry 15-25%)"
echo "     - Trading: 0.05-0.10% maker/taker"
echo ""
echo "  🎁 100% Airdrop Pass-Through"
echo "     - Sample airdrops configured"
echo "     - Full user allocation policy"
echo ""
echo "  🔒 Proof of Reserves"
echo "     - Initial snapshots created"
echo "     - Hourly updates configured"
echo ""
echo "  📊 Public Transparency Dashboard"
echo "     - Available at /transparency (no auth required)"
echo ""
echo "🚀 Next steps:"
echo ""
echo "  1. Start your backend:"
echo "     cd backend && npm run dev"
echo ""
echo "  2. Start your frontend:"
echo "     cd frontend && npm run dev"
echo ""
echo "  3. Visit the transparency dashboard:"
echo "     http://localhost:5173/transparency"
echo ""
echo "  4. Read the full documentation:"
echo "     cat LIGHTHOUSE_TRUST_LAYER.md"
echo ""
echo "💡 API Endpoints:"
echo "   GET  /api/v1/transparency/validators"
echo "   GET  /api/v1/transparency/fees"
echo "   GET  /api/v1/transparency/reserves/current"
echo "   GET  /api/v1/transparency/metrics"
echo "   GET  /api/v1/transparency/airdrops"
echo ""
echo "🏛️  Welcome to the trust-first era."
echo ""
