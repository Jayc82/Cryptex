# ⛏️ Cryptex Mining Portal

## Overview

The Mining Portal allows users to mine cryptocurrency using both **pool mining** and **solo mining** methods. Mined coins are automatically stored in users' secure wallets on the Cryptex platform.

## Features Implemented

### ✅ Complete Mining System

#### 1. **Database Schema** (`schema.sql`)
- `mining_pools` - Available mining pools (pool & solo options)
- `user_miners` - User mining configurations
- `mining_workers` - Individual mining devices/rigs
- `mining_shares` - Submitted mining shares tracking
- `mining_payouts` - Payout history and processing
- `mining_stats` - Hourly aggregated statistics

#### 2. **Mining Pools Support**
- **Pool Mining**: Join mining pools to earn steady rewards
- **Solo Mining**: Mine independently for full block rewards
- Multiple algorithms: SHA-256, Ethash, Scrypt, RandomX, KAWPOW, Equihash, Autolykos
- Supported coins: BTC, ETH, LTC, XMR, RVN, ZEC, ERG, DOGE

#### 3. **API Endpoints** (`mining.controller.ts`)
- `GET /api/v1/mining/pools` - Browse all mining pools
- `GET /api/v1/mining/pools/:poolId` - Get pool details
- `GET /api/v1/mining/miners` - Get user's mining configurations
- `POST /api/v1/mining/miners` - Create new mining configuration
- `GET /api/v1/mining/miners/:minerId/workers` - Get workers
- `POST /api/v1/mining/miners/:minerId/workers` - Add worker
- `PUT /api/v1/mining/workers/:workerId/status` - Update worker status
- `POST /api/v1/mining/shares` - Submit mining share
- `GET /api/v1/mining/stats` - Get mining statistics
- `GET /api/v1/mining/dashboard` - Dashboard overview
- `GET /api/v1/mining/payouts` - Get payout history
- `POST /api/v1/mining/payouts/request` - Request manual payout

#### 4. **Frontend Features** (`MiningPage.tsx`)
- **Dashboard Tab**: Overview of mining operations
  - Total hashrate across all miners
  - Active miners and workers count
  - Total earnings and pending balance
  - Earnings breakdown by currency
  - Recent payouts list
  
- **Mining Pools Tab**: Browse and select pools
  - Pool information (algorithm, fees, hashrate)
  - Pool type badges (POOL/SOLO)
  - Connection details (stratum URLs)
  - One-click pool selection
  
- **My Miners Tab**: Manage mining configurations
  - Miner status and statistics
  - Hashrate monitoring per miner
  - Worker management (add, view, monitor)
  - Efficiency tracking
  - Manual payout requests

#### 5. **Worker Management**
- Add multiple workers per miner
- Real-time worker status (online/offline)
- Individual hashrate tracking
- Share acceptance/rejection rates
- Worker software identification
- IP address tracking
- Last seen timestamps

#### 6. **Security Features**
- Authentication required for all mining operations
- Input validation for configuration
- Wallet verification before setup
- Transaction-based payout processing
- Rate limiting on API endpoints

## How Mining Works

### Setup Process

1. **Select a Mining Pool**
   - Browse available pools (Dashboard → Mining Pools)
   - Choose between pool mining (steady rewards) or solo mining (full blocks)
   - Review pool details: algorithm, fees, minimum payout

2. **Configure Miner**
   - Click "Start Mining" on chosen pool
   - Provide wallet ID (matching pool currency)
   - Optional: Set custom miner name
   - System creates mining configuration

3. **Add Workers**
   - Navigate to "My Miners" tab
   - Click "Add Worker" on your miner
   - Set worker name (e.g., rig01, gpu-worker-1)
   - Optional: Set worker password

4. **Connect Mining Software**
   - Use provided stratum URL and port
   - Configure your mining software (CGMiner, PhoenixMiner, etc.)
   - Worker name: `your_username.worker_name`
   - Worker password: Set in Cryptex or 'x'

### Mining Process

```
1. Mining software connects to pool
2. Receives work from pool/blockchain
3. Computes hashes to find valid shares
4. Submits shares to Cryptex pool
5. Shares validated and recorded
6. Earnings calculated based on shares
7. Periodic payouts to wallet
```

### Payout System

#### Automatic Payouts
- Triggered when pending balance ≥ minimum payout threshold
- Configurable payout intervals (default: 24 hours)
- Pool fee deducted automatically
- Direct deposit to configured wallet

#### Manual Payouts
- Available anytime pending balance ≥ minimum
- Click "Request Payout" in My Miners
- Instant processing and wallet crediting
- Transaction recorded for audit

## Mining Pool Types

### 🔹 Pool Mining

**Advantages:**
- Steady, predictable income
- Lower variance
- Regular small payouts
- Suitable for small miners
- Share-based rewards

**How It Works:**
- Join pool with other miners
- Submit shares (proof of work)
- Rewards distributed proportionally
- Pay pool fee (0.5% - 1.5%)

**Best For:**
- Beginners
- Small mining operations
- Consistent earnings preference

### 🔹 Solo Mining

**Advantages:**
- Full block rewards (minus platform fee)
- No pool fees
- Complete control
- Maximum potential earnings

**Risks:**
- High variance
- May not find blocks for long periods
- Requires significant hashpower
- Unpredictable income

**Best For:**
- Large mining operations
- High hashrate miners
- Risk-tolerant miners
- Experienced operators

## Supported Cryptocurrencies

| Currency | Algorithm | Pool Fee | Min Payout | Difficulty |
|----------|-----------|----------|------------|------------|
| Bitcoin (BTC) | SHA-256 | 1.0% | 0.001 BTC | Very High |
| Ethereum (ETH) | Ethash | 1.0% | 0.01 ETH | High |
| Litecoin (LTC) | Scrypt | 1.5% | 0.1 LTC | High |
| Monero (XMR) | RandomX | 1.0% | 0.1 XMR | Medium |
| Ravencoin (RVN) | KAWPOW | 1.0% | 10 RVN | Medium |
| Zcash (ZEC) | Equihash | 1.0% | 0.01 ZEC | High |
| Ergo (ERG) | Autolykos | 1.0% | 1.0 ERG | Medium |
| Dogecoin (DOGE) | Scrypt | 1.5% | 100 DOGE | Low |

## Mining Software Compatibility

### Bitcoin (SHA-256)
- **CGMiner** - GPU/FPGA/ASIC
- **BFGMiner** - Modular ASIC/FPGA
- **Awesome Miner** - Multi-pool management

### Ethereum (Ethash)
- **PhoenixMiner** - High performance
- **T-Rex Miner** - NVIDIA GPUs
- **TeamRedMiner** - AMD GPUs
- **lolMiner** - AMD/NVIDIA

### Monero (RandomX)
- **XMRig** - CPU/GPU mining
- **SRBMiner-MULTI** - CPU/AMD GPU

### Generic
- **NiceHash** - Auto-switching
- **Hive OS** - Mining OS
- **RaveOS** - Mining management

## Configuration Examples

### CGMiner (Bitcoin)
```bash
cgminer --url stratum+tcp://btc.cryptex.pool:3333 \
        --user username.worker01 \
        --pass x \
        --algo sha256d
```

### PhoenixMiner (Ethereum)
```bash
PhoenixMiner.exe -pool stratum+tcp://eth.cryptex.pool:4444 \
                 -wal username.worker01 \
                 -pass x \
                 -coin eth
```

### XMRig (Monero)
```json
{
  "pools": [{
    "url": "stratum+tcp://xmr.cryptex.pool:6666",
    "user": "username.worker01",
    "pass": "x",
    "keepalive": true
  }]
}
```

## Database Setup

### 1. Run main schema
```bash
docker exec -i cryptex-postgres psql -U postgres -d cryptex < backend/src/database/schema.sql
```

### 2. Seed mining pools (optional)
```bash
docker exec -i cryptex-postgres psql -U postgres -d cryptex < backend/src/database/seed-mining-pools.sql
```

## API Usage Examples

### Browse Pools
```bash
curl http://localhost:3000/api/v1/mining/pools?currency=BTC
```

### Create Miner Configuration
```bash
curl -X POST http://localhost:3000/api/v1/mining/miners \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "poolId": "pool-uuid",
    "walletId": "wallet-uuid",
    "minerName": "My Mining Rig"
  }'
```

### Add Worker
```bash
curl -X POST http://localhost:3000/api/v1/mining/miners/miner-id/workers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workerName": "rig01",
    "workerPassword": "optional-password"
  }'
```

### Request Payout
```bash
curl -X POST http://localhost:3000/api/v1/mining/payouts/request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"minerId": "miner-uuid"}'
```

## Security Best Practices

### For Users
1. **Use strong worker passwords**
2. **Verify pool URLs** before connecting
3. **Monitor worker activity** regularly
4. **Enable 2FA** on account
5. **Use separate wallets** for mining
6. **Keep mining software updated**

### For Platform
1. ✅ Authentication required for all operations
2. ✅ Input validation and sanitization
3. ✅ Rate limiting on API endpoints
4. ✅ Transaction-based payout processing
5. ✅ Wallet ownership verification
6. ✅ Share validation and anti-cheating measures

## Monitoring & Analytics

### Dashboard Metrics
- **Total Hashrate**: Combined power of all miners
- **Active Miners**: Number of configured miners
- **Workers Status**: Online/offline worker count
- **Earnings**: Total and pending balance by currency
- **Efficiency**: Share acceptance rate

### Worker Monitoring
- Real-time hashrate per worker
- Online/offline status indicators
- Share statistics (accepted/rejected)
- Last seen timestamp
- Mining software identification

### Historical Data
- Hourly statistics aggregation
- Hashrate trends over time
- Earnings history by period
- Payout transaction log

## Troubleshooting

### "Miner not found"
- Ensure miner configuration exists
- Check pool ID is valid
- Verify authentication token

### "Insufficient balance for payout"
- Check pending balance
- Compare with minimum payout threshold
- Continue mining to reach minimum

### "Worker offline"
- Verify mining software is running
- Check pool URL and port
- Confirm worker name format: `username.workername`
- Check firewall/network settings

### "Shares rejected"
- Check mining software configuration
- Verify algorithm matches pool
- Update mining software
- Check overclock settings

### Low hashrate
- Check GPU/CPU temperatures
- Verify power settings
- Update drivers
- Optimize mining software settings

## Revenue Estimation

### Factors Affecting Earnings
1. **Hashrate**: Your mining power
2. **Network Difficulty**: Changes every block
3. **Pool Luck**: Variance in block finding
4. **Pool Fee**: Deducted from rewards
5. **Hardware Efficiency**: Power consumption
6. **Uptime**: Mining duration

### Calculation Formula

**Pool Mining:**
```
Daily Earnings = (Your Hashrate / Pool Hashrate) × 
                 Blocks Found × Block Reward × 
                 (1 - Pool Fee)
```

**Solo Mining:**
```
Expected Daily Earnings = (Your Hashrate / Network Hashrate) × 
                          Daily Blocks × Block Reward × 
                          (1 - Platform Fee)
```

## Future Enhancements

### Planned Features
1. **Auto-switching pools** - Optimize profitability
2. **Profit calculator** - Estimate earnings
3. **Alert system** - Worker offline notifications
4. **Mobile app** - Monitor mining on-the-go
5. **Overclocking profiles** - Optimize performance
6. **Temperature monitoring** - Hardware health
7. **Merged mining** - Mine multiple coins simultaneously
8. **NFT rewards** - Loyalty program for miners
9. **Referral bonuses** - Earn from referrals
10. **Advanced analytics** - Detailed charts and insights

### Technical Improvements
1. **WebSocket updates** - Real-time statistics
2. **Grafana dashboards** - Professional monitoring
3. **API webhooks** - External integrations
4. **Custom pool creation** - Private pools
5. **Load balancing** - Optimize server resources

## Support & Documentation

- **Schema**: `/backend/src/database/schema.sql`
- **Controller**: `/backend/src/controllers/mining.controller.ts`
- **Routes**: `/backend/src/routes/mining.routes.ts`
- **Frontend**: `/frontend/src/pages/MiningPage.tsx`
- **API Service**: `/frontend/src/services/api.ts`
- **Sample Pools**: `/backend/src/database/seed-mining-pools.sql`

## FAQ

**Q: Can I mine multiple coins simultaneously?**
A: Yes, create separate miners for each pool/currency.

**Q: What happens if I lose connection?**
A: Reconnect and continue. No earnings lost, shares tracked.

**Q: Can I change pools?**
A: Yes, create new miner configuration anytime.

**Q: How often are payouts?**
A: Automatic every 24h when minimum reached, or manual anytime.

**Q: Are my coins secure?**
A: Yes, stored in your Cryptex wallet with full security measures.

**Q: Can I withdraw mined coins?**
A: Yes, from your wallet to external addresses anytime.

**Q: What's the minimum hashrate needed?**
A: Any hashrate works. Pool mining recommended for small miners.

**Q: Do I need special hardware?**
A: Depends on algorithm. CPU, GPU, or ASIC based on coin.

---

**Status**: ✅ **Mining Portal fully implemented and ready for miners!**

Start earning cryptocurrency by mining on Cryptex today! ⛏️💰
