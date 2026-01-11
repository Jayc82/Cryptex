# 🪙 Cryptex Staking Feature

## Overview

Users can now stake their cryptocurrency assets on Cryptex to earn passive rewards. The staking system supports both flexible and locked staking with various APY rates.

## Features Implemented

### ✅ Backend Components

1. **Database Schema** (`schema.sql`)
   - `staking_pools` - Available staking pools with APY, lock periods, limits
   - `user_stakes` - User staking positions with rewards tracking
   - `staking_rewards` - Historical reward records

2. **API Endpoints** (`staking.controller.ts`)
   - `GET /api/v1/staking/pools` - View all available staking pools
   - `GET /api/v1/staking/pools/:poolId` - Get specific pool details
   - `GET /api/v1/staking/stakes` - Get user's staking positions
   - `POST /api/v1/staking/stakes` - Create new stake
   - `POST /api/v1/staking/stakes/:stakeId/unstake` - Unstake and claim rewards
   - `POST /api/v1/staking/stakes/:stakeId/claim` - Claim rewards (flexible only)
   - `GET /api/v1/staking/rewards` - Get rewards history
   - `GET /api/v1/staking/stats` - Get staking statistics

3. **Validation** (`validation.ts`)
   - Stake amount validation
   - Pool ID validation (UUID format)
   - Minimum/maximum stake enforcement

4. **Security**
   - All staking operations require authentication
   - Transaction-based operations for data consistency
   - Wallet balance verification before staking
   - Lock period enforcement

### ✅ Frontend Components

1. **Staking Page** (`StakingPage.tsx`)
   - **Pools Tab**: Browse and stake into available pools
   - **My Stakes Tab**: Manage active stakes and view statistics
   - Modal for staking with real-time validation
   - Stake, unstake, and claim reward actions

2. **Navigation**
   - Added "Staking" menu item with Coins icon
   - Integrated into main app routing

3. **API Integration**
   - Complete `stakingApi` service in `api.ts`
   - Error handling and loading states

## How Staking Works

### Staking Process

1. **User views available pools** (no authentication required)
2. **User selects a pool** and clicks "Stake Now"
3. **System validates**:
   - User has sufficient balance
   - Amount meets minimum/maximum requirements
   - Pool has capacity (if limited)
4. **Funds are locked** from available balance to locked balance
5. **Stake is created** with:
   - Calculated unlock date (based on lock period)
   - Initial reward tracking
   - Status: "active"

### Reward Calculation

Rewards are calculated using the formula:
```
Daily Reward = (Staked Amount × APY) / 365
Pending Reward = Daily Reward × Days Since Last Calculation
```

### Unstaking Process

1. **System checks** if stake is unlocked (lock period expired)
2. **Calculates final rewards** including pending rewards
3. **Returns funds** to user's wallet:
   - Original staked amount
   - All earned rewards
4. **Updates pool statistics**
5. **Records transaction** for audit trail

### Reward Claims (Flexible Staking Only)

For pools with 0 lock period, users can:
- Claim rewards without unstaking
- Continue earning on the same stake
- Rewards are paid in the same currency (or reward_currency if specified)

## Staking Pool Types

### 1. Flexible Staking (0 days lock)
- ✅ Stake/unstake anytime
- ✅ Claim rewards without unstaking
- ⚠️ Lower APY (3-5%)
- Best for: Users who want liquidity

### 2. Short-Term Locked (30 days)
- ⏱️ 30-day lock period
- 💰 Medium APY (7-9%)
- Best for: Users comfortable with short commitment

### 3. Medium-Term Locked (90 days)
- ⏱️ 90-day lock period
- 💰 High APY (12-15%)
- Best for: Users planning to hold

### 4. Long-Term Locked (180 days)
- ⏱️ 180-day lock period
- 💰 Highest APY (18-22%)
- Best for: Long-term investors

### 5. Special/Limited Pools
- 🎁 Bonus rewards
- ⏰ Time-limited availability
- 🎯 Limited capacity
- Best for: Users who act quickly

## Database Setup

### 1. Run the main schema
```bash
psql -U postgres -d cryptex -f backend/src/database/schema.sql
```

### 2. Seed staking pools (optional)
```bash
psql -U postgres -d cryptex -f backend/src/database/seed-staking-pools.sql
```

## API Usage Examples

### Get All Pools
```bash
curl http://localhost:3000/api/v1/staking/pools
```

### Create Stake (requires authentication)
```bash
curl -X POST http://localhost:3000/api/v1/staking/stakes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "poolId": "pool-uuid-here",
    "amount": 0.5
  }'
```

### View My Stakes
```bash
curl http://localhost:3000/api/v1/staking/stakes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Unstake
```bash
curl -X POST http://localhost:3000/api/v1/staking/stakes/stake-id/unstake \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Claim Rewards (flexible pools)
```bash
curl -X POST http://localhost:3000/api/v1/staking/stakes/stake-id/claim \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend Usage

1. **Navigate to Staking** page from sidebar
2. **Browse pools** in the "Staking Pools" tab
3. **Click "Stake Now"** on desired pool
4. **Enter amount** and confirm
5. **View stakes** in "My Stakes" tab
6. **Claim rewards** (flexible) or **Unstake** (when unlocked)

## Testing Checklist

### Backend Tests
- [ ] Create stake with valid amount
- [ ] Reject stake below minimum
- [ ] Reject stake above maximum
- [ ] Reject stake with insufficient balance
- [ ] Reject unstake before lock period
- [ ] Calculate rewards correctly
- [ ] Update wallet balances correctly
- [ ] Update pool statistics
- [ ] Create transaction records
- [ ] Handle concurrent stakes

### Frontend Tests
- [ ] Display pools correctly
- [ ] Show APY and lock periods
- [ ] Validate stake amounts
- [ ] Handle stake success/error
- [ ] Show user stakes
- [ ] Calculate pending rewards
- [ ] Enable/disable unstake based on lock
- [ ] Show days until unlock
- [ ] Refresh data after actions

## Security Considerations

✅ **Implemented:**
- Authentication required for all stake operations
- Input validation (amount, pool ID)
- Transaction-based operations
- Balance verification
- Lock period enforcement
- Rate limiting (inherited from general API)

⚠️ **Recommendations:**
- Add daily reward calculation cron job
- Implement auto-compounding for locked stakes
- Add staking limits per user
- Monitor for unusual staking patterns
- Add emergency pause mechanism

## Future Enhancements

### Potential Features
1. **Auto-compounding** - Automatically restake rewards
2. **Reward Boosters** - NFT or token-based APY boosts
3. **Referral Rewards** - Earn bonus for referring stakers
4. **Staking Tiers** - VIP levels with better rates
5. **Liquidity Mining** - Earn additional tokens
6. **Governance Rights** - Vote with staked tokens
7. **Insurance** - Optional stake insurance
8. **Analytics Dashboard** - Detailed staking charts

### Technical Improvements
1. **Background Job** - Calculate and distribute daily rewards
2. **Notification System** - Alert when stakes unlock
3. **Mobile App** - Native staking interface
4. **Webhook Events** - Real-time staking notifications
5. **Historical Charts** - APY trends over time

## Support & Documentation

- **Schema**: `/backend/src/database/schema.sql`
- **Controller**: `/backend/src/controllers/staking.controller.ts`
- **Routes**: `/backend/src/routes/staking.routes.ts`
- **Frontend**: `/frontend/src/pages/StakingPage.tsx`
- **API Service**: `/frontend/src/services/api.ts`
- **Sample Data**: `/backend/src/database/seed-staking-pools.sql`

## Troubleshooting

### "Pool not found"
- Ensure pool exists and is active
- Check pool ID is valid UUID

### "Insufficient balance"
- User needs to deposit funds first
- Check available_balance (not locked_balance)

### "Stake is locked"
- Wait until unlock_date passes
- Check daysUntilUnlock in UI

### "Minimum stake amount"
- Increase stake amount
- Check pool's min_stake value

### Database errors
- Ensure schema is up to date
- Check foreign key constraints
- Verify wallet exists for currency

---

**Status**: ✅ **Staking feature fully implemented and ready for use!**

Users can now stake their crypto assets and earn passive rewards on the Cryptex platform! 🎉
