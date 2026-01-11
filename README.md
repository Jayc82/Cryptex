# Cryptex - The Trust-First Exchange 🏛️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Transparency](https://img.shields.io/badge/Transparency-100%25-green.svg)](./LIGHTHOUSE_TRUST_LAYER.md)

## 🚀 Overview

**Cryptex is the first exchange that proves—on-chain—that it earns less so users earn more.**

While traditional exchanges take 15-25% of your staking rewards (and don't tell you), Cryptex caps fees at 3-5%, publishes everything, and gives you 100% of all airdrops. No hidden fees. No payment for order flow. No fake volume.

**This is not another CEX. This is the trust-first alternative.**

### 🧭 MVP Decision: US-Compliant First (Spot-Only Initially)

We will launch with a US-compliant-first approach: a single codebase, with US users limited to spot trading and transparency features (no yield promises) until licensing/registration permits. Non-US regions can enable staking/custody/airdrops where local laws allow, via region-aware feature flags.

Key implications:
- **US-first trust**: Spot-only, clear disclosures, audit trails, market integrity.
- **Feature gating**: Region-aware flags enforced at API and UI.
- **Custody minimized**: Non-custodial vaults where permissible; custody only post-licensing.
- **Transparent fees**: Immutable caps published and auditable across payouts.

### ✨ What Makes Cryptex Different

#### 🏛️ **Lighthouse Transparency Layer** (NEW)
- **Immutable Fee Caps**: 3-5% staking fees (vs industry 15-25%) — capped forever
- **Validator Choice**: See on-chain addresses, choose your validators, verify everything
- **100% Airdrop Pass-Through**: Every airdrop goes to users. Zero exceptions.
- **Proof of Reserves**: Real-time verification of 100%+ reserves
- **Public Transparency Dashboard**: No login required — see everything at `/transparency`

#### 🎯 Core Trading Features
- **⚡ Lightning-Fast Execution**: High-performance order matching engine
- **💰 Honest Trading Fees**: 0.05% maker / 0.10% taker (no payment for order flow)
- **🔒 Ultra-Secure**: Multi-layer authentication, encryption, and asset protection
- **🤖 AI-Driven Insights**: Machine learning-powered price predictions
- **📊 Real-Time Data**: WebSocket-based live market data
- **💼 Portfolio Management**: Comprehensive tracking and analytics

#### 💎 Staking & Yield
- **🪙 Transparent Staking**: See exactly where every dollar of yield goes
- **🛡️ Slashing Insurance**: Funded insurance protects against validator failures
- **📈 Premium Tiers**: Enhanced rewards with clear benefits (no token gating)

#### ⛏️ Additional Features
- **Mining Portal**: Pool and solo mining with profit tracking
- **📱 Intuitive Interface**: Modern, responsive UI built with React
- **🌐 Multi-Asset Support**: Trade and stake multiple cryptocurrencies

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API    │────▶│   PostgreSQL    │
│   (React)       │     │   (Node.js)      │     │   Database      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                          
        │                       ▼                          
        │               ┌──────────────────┐              
        │               │   Redis Cache    │              
        │               └──────────────────┘              
        │                       │                          
        ▼                       ▼                          
┌─────────────────┐     ┌──────────────────┐              
│   WebSocket     │     │   AI Service     │              
│   Server        │     │   (Python)       │              
└─────────────────┘     └──────────────────┘              
```

### MVP System Components (Hybrid Path)

- **Policy & Compliance Service**: Evaluates user jurisdiction, applies feature flags (staking, custody, airdrops), logs disclosures/consents.
- **Transparency Pipeline**: Aggregates validator rewards, reserves, and distributions; publishes public metrics and proofs.
- **Validator Registry**: Tracks validator profiles (uptime, slashing, commission, decentralization score); supports user selection.
- **Fee Policy Manager**: Enforces immutable caps (ETH 3%, POS 3–5%, long lockups 0–2%), auditable across payouts.
- **Insurance Fund Ledger**: Allocates a fee slice to slashing insurance; exposes coverage status and claims process.
- **Order Router (CEX-only)**: Honest matching, no PFOF/internalization, with auditable fee application.
- **Non-Custodial Staking Vaults** (optional by region): Smart-contract vaults with user keys; exchange supplies UI, routing, compliance.

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Query for data fetching
- Zustand for state management
- Recharts for data visualization
- WebSocket client for real-time updates

**Backend:**
- Node.js with Express
- TypeScript
- PostgreSQL database
- Redis for caching
- WebSocket for real-time communication
- JWT authentication
- Rate limiting and security middleware

**AI Service:**
- Python with Flask
- NumPy & Pandas for data processing
- Scikit-learn & TensorFlow for ML models
- Sentiment analysis
- Risk assessment algorithms

**Infrastructure:**
- Docker & Docker Compose
- Nginx reverse proxy
- Multi-stage builds for optimization
 - Region-aware feature flags via policy service
 - Audit logging for compliance events

## 📋 Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- PostgreSQL 16+
- Redis 7+
- Docker and Docker Compose (for containerized deployment)

## 🚀 Quick Start

### Option 1: Quick Setup with Transparency Layer

```bash
# Clone and setup
git clone https://github.com/Jayc82/Cryptex.git
cd Cryptex

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# Install transparency layer
./setup-transparency.sh

# Start services
docker-compose up -d

# Visit transparency dashboard (public, no login)
# http://localhost:5173/transparency
```

### Option 2: Docker Compose (Full Stack)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jayc82/Cryptex.git
   cd Cryptex
   ```

2. **Configure environment variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Setup transparency layer**
   ```bash
   ./setup-transparency.sh
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - **Transparency Dashboard**: http://localhost:5173/transparency (public)
   - AI Service: http://localhost:5000

### Manual Setup

#### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database and Redis credentials
npm run dev
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

#### AI Service Setup

```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

#### Database Setup

```bash
# Create database
createdb cryptex

# Run schema
psql cryptex < backend/src/database/schema.sql
```

## 📚 API Documentation

### Authentication

**POST `/api/v1/auth/register`**
```json
{
  "email": "user@example.com",
  "username": "trader123",
  "password": "SecurePass123!"
}
```

**POST `/api/v1/auth/login`**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Trading

**POST `/api/v1/trading/orders`**
```json
{
  "symbol": "BTCUSDT",
  "side": "buy",
  "type": "limit",
  "quantity": 0.5,
  "price": 45000
}
```

**GET `/api/v1/trading/orders`**
Get user's orders with optional filters.

**GET `/api/v1/trading/orderbook/:symbol`**
Get order book for a trading pair.

### Market Data

**GET `/api/v1/market/ticker/:symbol`**
Get ticker information for a symbol.

**GET `/api/v1/market/klines/:symbol`**
Get candlestick data.

### AI Services

**GET `/api/v1/ai/insights/:symbol`**
Get AI-generated trading insights.

**GET `/api/v1/ai/predictions/:symbol`**
Get price predictions.

**GET `/api/v1/ai/risk-assessment`**
Get portfolio risk assessment.

### Transparency APIs (Public)

**GET `/api/v1/transparency/validators`**
View all validators with performance metrics

**GET `/api/v1/transparency/fees`**
View immutable fee caps

**GET `/api/v1/transparency/reserves/current`**
View proof of reserves (updated hourly)

**GET `/api/v1/transparency/metrics`**
View public platform metrics

**GET `/api/v1/transparency/airdrops`**
View all airdrops with 100% pass-through

### Governance & Policy APIs (MVP)

**GET `/api/v1/policy/features`**
View region-aware feature flags (staking, custody, airdrops)

**GET `/api/v1/governance/fee-caps`**
View published, immutable fee caps (user-vote changes queued)

**POST `/api/v1/governance/votes`**
Submit votes on fee caps, validator inclusion, chain support (security-controlled)

### Tax & Reporting APIs (US-Compliant)

**GET `/api/v1/tax/report?year=YYYY&basis=fifo|lifo`**
Annual tax summary: capital gains (short/long-term), staking/mining income, fees, and missing-basis flags.

**GET `/api/v1/tax/exports/trades.csv`**
Trades export for the selected tax year.

**GET `/api/v1/tax/exports/staking.csv`**
Staking rewards export for the selected tax year.

**GET `/api/v1/tax/exports/mining.csv`**
Mining payouts export for the selected tax year.

---

## 🏛️ The Lighthouse Trust Layer

**What makes Cryptex different?** Read the full documentation: [LIGHTHOUSE_TRUST_LAYER.md](./LIGHTHOUSE_TRUST_LAYER.md)

### Quick Facts

| Traditional CEX | Cryptex |
|----------------|---------|
| 15-25% staking fee (hidden) | **3-5% (capped, published)** |
| Keeps most airdrops | **100% to users** |
| No validator choice | **You choose** |
| No reserve proof | **Hourly proof of reserves** |
| Opaque fees | **Immutable caps** |

### Key Files

- `backend/src/database/migrations/001-transparency-layer.sql` — Core schema
- `backend/src/controllers/transparency.controller.ts` — API endpoints
- `backend/src/services/yield-transparency.service.ts` — Yield calculations
- `frontend/src/pages/TransparencyPage.tsx` — Public dashboard
- `setup-transparency.sh` — One-command setup
 - `backend/src/middleware/policy.ts` — Region-aware feature gating (MVP)
 - `backend/src/controllers/governance.controller.ts` — Governance endpoints (MVP)
 - `backend/src/services/fee-policy.service.ts` — Fee cap enforcement (MVP)
- `backend/src/services/tax.service.ts` — Capital gains & income aggregation + CSV exports
- `backend/src/controllers/tax.controller.ts` — Tax reporting endpoints
- `backend/src/routes/tax.routes.ts` — Tax API routes

---

## 🔐 Security Features

- **JWT-based authentication** with refresh tokens
- **Bcrypt password hashing** (12 rounds)
- **Rate limiting** on all endpoints
- **CORS protection**
- **Helmet.js** for HTTP security headers
- **Input validation** with Joi
- **SQL injection protection** with parameterized queries
- **2FA support** (optional)
- **🆕 Proof of Reserves** with hourly updates
- **🆕 Slashing Insurance Fund** for validator protection

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# AI service tests
cd ai-service
pytest
```

## 📦 Deployment

### Production Build

```bash
# Build all services
docker-compose build

# Deploy
docker-compose up -d
```

### Environment Variables

Create a `.env` file in the backend directory - see `.env.example` for all options.

Tax & Policy:
- `DEFAULT_REGION` — Default region (US|OTHER)
- `FEATURE_STAKING_US/OTHER` — Region flags
- `FEATURE_CUSTODY_US/OTHER` — Region flags
- `FEATURE_AIRDROPS_US/OTHER` — Region flags
- `TAX_DEFAULT_BASIS` — `fifo` or `lifo`

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🗺️ Roadmap

### ✅ Completed
- [x] **Security Hardening** - Enterprise-grade security measures
- [x] **Staking Platform** - Earn passive income through crypto staking
- [x] **Mining Portal** - Pool and solo mining with integrated wallet storage
- [x] **🏛️ Lighthouse Trust Layer** - Validator choice, fee caps, proof of reserves
- [x] **Transparent Yield System** - Full breakdown of where rewards go
- [x] **100% Airdrop Pass-Through** - Complete user allocation
- [x] **Public Transparency Dashboard** - Zero-login trust verification

### 🚧 In Progress
- [ ] Additional chain validators (Avalanche, Polygon, Near)
- [ ] Automated reserve proof generation
- [ ] User governance voting system for fee changes
 - [ ] Region-aware compliance & feature gating service
 - [ ] Validator registry with user-selectable profiles
 - [ ] Slashing insurance fund ledger and public dashboard

### 🔮 Planned
- [ ] Mobile applications (iOS & Android)
- [ ] Non-custodial staking vaults (smart contracts)
- [ ] Decentralized governance token (utility only, no extraction)
- [ ] Multi-jurisdiction regulatory compliance automation
- [ ] Advanced validator auto-rebalancing
- [ ] Third-party audit reports integration
 - [ ] Institutional reporting tools & compliance APIs

---

## 🎯 Why Cryptex Will Win

**Traditional CEXs have a margin problem:**
- They take 15-25% of staking rewards
- They can't publish this without backlash
- They can't pivot without admitting wrongdoing

**Cryptex has a trust moat:**
- Fees are capped at 3-5% (immutable)
- Everything is published and provable
- Users choose validators
- 100% airdrop pass-through

**They can't copy this without destroying their business model.**

Read more: [LIGHTHOUSE_TRUST_LAYER.md](./LIGHTHOUSE_TRUST_LAYER.md)

---

## 📞 Contact & Support

- **Transparency Questions**: transparency@cryptex.io
- **Technical Support**: support@cryptex.io
- **Security Issues**: security@cryptex.io
- **Public Dashboard**: [/transparency](http://localhost:5173/transparency)

---

## 🏆 Recognition

*"The first exchange that proves—on-chain—that it earns less so users earn more."*

Built with ❤️ for a trust-first future.
- [ ] Advanced charting with TradingView integration
- [ ] Copy trading functionality
- [ ] Social trading features
- [ ] NFT marketplace integration
- [ ] Multi-language support
- [ ] Advanced order types (OCO, trailing stops)
- [ ] Automated trading bots
- [ ] API for third-party integrations
- [ ] WebSocket real-time updates for mining/staking

## 📚 Additional Documentation

- **[Security Guide](SECURITY.md)** - Security features and best practices
- **[Security Improvements](SECURITY_IMPROVEMENTS.md)** - Recent security enhancements
- **[Security Quick Start](SECURITY_QUICKSTART.md)** - Quick security setup
- **[Staking Feature](STAKING_FEATURE.md)** - Complete staking documentation
- **[Mining Feature](MINING_FEATURE.md)** - Complete mining portal guide
- **[Mining Setup](MINING_SETUP.md)** - Quick mining setup guide
- **[Premium Subscriptions](PREMIUM_SUBSCRIPTION.md)** - Subscription tiers and benefits
- **[Feature Summary](FEATURE_SUMMARY.md)** - Complete platform overview
- **[Getting Started](GETTING_STARTED.md)** - General setup instructions

---

**Made with ❤️ by the Cryptex Team**
“The ultimate crypto trading platform combining lightning-fast execution, ultra-low fees, and advanced AI-driven insights — empowering traders to maximize profits with unmatched speed, security, and precision.”
