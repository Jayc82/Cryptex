# 🚀 Mining Portal Setup Guide

## Quick Start

### 1. Database Setup

The mining tables are already included in the main schema. If you need to recreate the database:

```bash
# Stop and remove existing database
docker-compose down -v

# Start services
docker-compose up -d

# The schema is automatically applied on first run
```

### 2. Seed Mining Pools (Optional but Recommended)

Load sample mining pools data:

```bash
docker exec -i cryptex-postgres psql -U postgres -d cryptex < backend/src/database/seed-mining-pools.sql
```

This creates 13 mining pools:
- **Bitcoin** (BTC): Pool + Solo mining
- **Ethereum** (ETH): Pool + Solo mining
- **Litecoin** (LTC): Pool + Solo mining
- **Monero** (XMR): Pool + Solo mining
- **Ravencoin** (RVN): Pool mining
- **Zcash** (ZEC): Pool mining
- **Ergo** (ERG): Pool mining
- **Dogecoin** (DOGE): Pool mining

### 3. Access Mining Portal

1. Start the application:
```bash
docker-compose up -d
```

2. Navigate to: `http://localhost:5173/mining`

3. Login with your account

### 4. Test Mining Features

#### Browse Pools
1. Click "Mining Pools" tab
2. Review available pools (algorithm, fees, hashrate)
3. Click "Start Mining" on any pool

#### Configure Miner
1. Select a wallet that matches the pool currency
2. Enter a miner name (e.g., "My Bitcoin Miner")
3. Click "Create Miner"

#### Add Workers
1. Go to "My Miners" tab
2. Find your miner and click "Add Worker"
3. Enter worker name (e.g., "rig01")
4. Optionally set worker password
5. Click "Add Worker"

#### View Dashboard
1. Click "Dashboard" tab
2. See total hashrate, active miners, earnings
3. Review payout history

## Mining Pool Configuration

### Stratum Connection Format

```
stratum+tcp://[pool-url]:[port]
Username: [your_username].[worker_name]
Password: [worker_password or 'x']
```

### Example Configurations

**Bitcoin Pool Mining:**
```
URL: stratum+tcp://btc.cryptex.pool:3333
User: alice.rig01
Pass: x
```

**Ethereum Pool Mining:**
```
URL: stratum+tcp://eth.cryptex.pool:4444
User: bob.gpu-miner-1
Pass: my-secure-password
```

**Monero Solo Mining:**
```
URL: stratum+tcp://xmr-solo.cryptex.pool:6667
User: charlie.cpu-worker
Pass: x
```

## Verify Installation

### Check Database Tables

```bash
docker exec -it cryptex-postgres psql -U postgres -d cryptex
```

```sql
-- List all mining tables
\dt mining_*

-- Count mining pools
SELECT COUNT(*) FROM mining_pools;

-- View pool summary
SELECT currency, name, pool_type, algorithm, fee_percentage 
FROM mining_pools 
ORDER BY currency;
```

Expected output: 13 pools across 8 cryptocurrencies

### Check API Endpoints

```bash
# Get all mining pools
curl http://localhost:3000/api/v1/mining/pools

# Filter by currency
curl http://localhost:3000/api/v1/mining/pools?currency=BTC

# Get specific pool
curl http://localhost:3000/api/v1/mining/pools/{pool-id}
```

### Frontend Routes

- `/mining` - Mining dashboard
- `/mining#pools` - Browse mining pools
- `/mining#miners` - Manage your miners

## Troubleshooting

### "No pools available"
- Run the seed-mining-pools.sql script
- Check database connection
- Verify mining_pools table exists

### "Cannot create miner"
- Ensure you have a wallet for the pool's currency
- Check authentication token is valid
- Verify pool_id exists in database

### "Worker not connecting"
- Verify stratum URL and port
- Check username format: `username.workername`
- Ensure mining software is configured correctly
- Check firewall rules

### Database errors
```bash
# Reset database completely
docker-compose down -v
docker-compose up -d

# Wait for database to initialize, then seed pools
sleep 10
docker exec -i cryptex-postgres psql -U postgres -d cryptex < backend/src/database/seed-mining-pools.sql
```

## API Testing with curl

### Create a miner
```bash
# Get your auth token first
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your-username","password":"your-password"}' \
  | jq -r '.token')

# Get a pool ID
POOL_ID=$(curl -s http://localhost:3000/api/v1/mining/pools | jq -r '.data[0].id')

# Get a wallet ID (matching pool currency)
WALLET_ID=$(curl -s http://localhost:3000/api/v1/portfolio/wallets \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

# Create miner
curl -X POST http://localhost:3000/api/v1/mining/miners \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "poolId": "'$POOL_ID'",
    "walletId": "'$WALLET_ID'",
    "minerName": "Test Miner"
  }'
```

### Add a worker
```bash
# Get miner ID
MINER_ID=$(curl -s http://localhost:3000/api/v1/mining/miners \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

# Add worker
curl -X POST http://localhost:3000/api/v1/mining/miners/$MINER_ID/workers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workerName": "test-worker-01",
    "workerPassword": "secure123"
  }'
```

### View dashboard
```bash
curl http://localhost:3000/api/v1/mining/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Production Considerations

### Before Going Live

1. **Update Pool URLs**: Replace `*.cryptex.pool` with actual stratum servers
2. **Set up real mining infrastructure**: Configure stratum servers for each pool
3. **Implement share validation**: Add proof-of-work verification
4. **Configure automatic payouts**: Set up cron job or scheduled task
5. **Add monitoring**: Set up alerts for pool health, worker issues
6. **Rate limiting**: Adjust rate limits for production traffic
7. **Security audit**: Review all endpoints and data flows
8. **Backup strategy**: Regular database backups for earnings data

### Recommended Infrastructure

- **Stratum Servers**: One per currency/pool type
- **Load Balancer**: Distribute worker connections
- **Redis Cache**: Cache pool statistics and hashrates
- **Monitoring**: Grafana + Prometheus for metrics
- **Alerts**: PagerDuty/Opsgenie for critical issues

## Next Steps

1. ✅ Database schema created
2. ✅ Backend API implemented
3. ✅ Frontend UI completed
4. ✅ Sample pools seeded
5. 🔄 Configure real stratum servers
6. 🔄 Set up share validation
7. 🔄 Implement automatic payouts
8. 🔄 Add WebSocket real-time updates
9. 🔄 Deploy to production

## Documentation

- **Feature Guide**: [MINING_FEATURE.md](MINING_FEATURE.md)
- **Database Schema**: [backend/src/database/schema.sql](backend/src/database/schema.sql)
- **Sample Data**: [backend/src/database/seed-mining-pools.sql](backend/src/database/seed-mining-pools.sql)
- **API Controller**: [backend/src/controllers/mining.controller.ts](backend/src/controllers/mining.controller.ts)
- **Frontend Page**: [frontend/src/pages/MiningPage.tsx](frontend/src/pages/MiningPage.tsx)

---

**Need Help?** Check [MINING_FEATURE.md](MINING_FEATURE.md) for detailed documentation and FAQ.
