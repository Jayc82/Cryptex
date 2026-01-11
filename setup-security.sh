#!/bin/bash
# Security setup script for Cryptex
# This script generates secure secrets and creates a .env file

set -e

echo "🔐 Cryptex Security Setup"
echo "=========================="
echo ""

# Check for required tools
command -v openssl >/dev/null 2>&1 || { echo "❌ openssl is required but not installed. Aborting." >&2; exit 1; }

# Create .env file if it doesn't exist
ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
    echo "⚠️  .env file already exists. Creating backup..."
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
fi

echo "Generating secure secrets..."
echo ""

# Generate secrets
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
ENCRYPTION_KEY=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')

# Create .env file
cat > "$ENV_FILE" << EOF
# Cryptex Environment Configuration
# Generated: $(date)
# WARNING: Keep this file secure and NEVER commit to version control!

# Server Configuration
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cryptex
DB_USER=postgres
DB_PASSWORD=${DB_PASSWORD}

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# WebSocket Configuration
WS_PORT=3001
WS_HEARTBEAT_INTERVAL=30000

# CORS Configuration (comma-separated origins)
CORS_ORIGIN=http://localhost,http://localhost:3000,http://localhost:5173

# External APIs (Exchange Integration)
BINANCE_API_KEY=
BINANCE_API_SECRET=
COINBASE_API_KEY=
COINBASE_API_SECRET=

# AI Service
AI_SERVICE_URL=http://localhost:5000
AI_SERVICE_TIMEOUT=30000

# Logging
LOG_LEVEL=info

# Frontend URLs
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3001/ws
EOF

echo "✅ Secrets generated successfully!"
echo ""
echo "📝 Created $ENV_FILE with secure random secrets"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "   1. Keep the .env file secure and never commit it to version control"
echo "   2. Change external API keys (BINANCE_API_KEY, etc.) as needed"
echo "   3. Update CORS_ORIGIN with your production domains"
echo "   4. For production, consider using a secrets manager (AWS Secrets Manager, etc.)"
echo "   5. Regularly rotate secrets and API keys"
echo ""
echo "🔒 Your JWT secrets are 64-byte random strings"
echo "🔒 Your encryption key is a 32-byte hex string for AES-256"
echo "🔒 Database and Redis passwords are 32-byte random strings"
echo ""
echo "Next steps:"
echo "  1. Review and customize $ENV_FILE"
echo "  2. Update external API keys if needed"
echo "  3. For Docker deployment, copy secrets to .env in project root"
echo "  4. Run 'docker-compose up -d' to start services"
echo ""
