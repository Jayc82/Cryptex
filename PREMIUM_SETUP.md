# 🚀 Premium Subscription Quick Setup

## What's New

Your Cryptex platform now has a **three-tier premium subscription system** that allows users to:
- 👑 Upgrade to Premium or VIP tiers
- ⚡ Get up to **+50% bonus** on staking rewards
- 💰 Reduce platform fees to **0%** (VIP tier)
- 📊 Support platform growth through subscription revenue

---

## Quick Setup (5 Minutes)

### 1. Apply Database Updates

The schema has been updated with new tables and columns. Run:

```bash
# Stop and recreate database (development only)
docker-compose down -v
docker-compose up -d

# Wait for PostgreSQL to initialize
sleep 10

# Seed subscription plans
docker exec -i cryptex-postgres psql -U postgres -d cryptex < backend/src/database/seed-subscription-plans.sql

# Optional: Seed staking pools
docker exec -i cryptex-postgres psql -U postgres -d cryptex < backend/src/database/seed-staking-pools.sql

# Optional: Seed mining pools
docker exec -i cryptex-postgres psql -U postgres -d cryptex < backend/src/database/seed-mining-pools.sql
```

### 2. Verify Database

```bash
docker exec -it cryptex-postgres psql -U postgres -d cryptex
```

```sql
-- Check subscription plans
SELECT tier, name, price_monthly, staking_bonus_percentage, platform_fee_percentage 
FROM subscription_plans;

-- Expected: 3 rows (free, premium, vip)

-- Check users table has new columns
\d users;
-- Should see: subscription_tier, subscription_expires_at

-- Check user_stakes has new columns
\d user_stakes;
-- Should see: platform_fee_paid, premium_bonus_earned

-- Exit
\q
```

### 3. Test the Features

1. **Start services** (if not running):
   ```bash
   docker-compose up -d
   ```

2. **Access Premium page**:
   - Navigate to: `http://localhost:5173/premium`
   - Should see 3 subscription tiers with pricing

3. **Test upgrade flow**:
   - Login to platform
   - Go to Premium page
   - Click "Upgrade Now" on Premium tier
   - Should see success message

4. **Test staking with premium bonus**:
   - Go to Staking page
   - Create a stake
   - Wait/simulate time passage
   - Claim rewards or unstake
   - Response should include `rewardBreakdown` with bonus and fee info

---

## What Changed

### Database Schema

**New Tables**:
- `subscription_plans` - 3 tiers (Free, Premium, VIP)
- `user_subscriptions` - User subscription history
- `platform_fees` - Revenue tracking

**Updated Tables**:
- `users` - Added `subscription_tier`, `subscription_expires_at`
- `user_stakes` - Added `platform_fee_paid`, `premium_bonus_earned`
- `staking_rewards` - Added `platform_fee`, `premium_bonus`, `net_amount`

### Backend

**New Files**:
- `backend/src/controllers/subscription.controller.ts` - Subscription management
- `backend/src/routes/subscription.routes.ts` - API routes
- `backend/src/database/seed-subscription-plans.sql` - Initial data

**Modified Files**:
- `backend/src/controllers/staking.controller.ts` - Premium bonus logic
- `backend/src/server.ts` - Registered subscription routes

**New API Endpoints**:
- `GET /api/v1/subscriptions/plans` - List plans
- `GET /api/v1/subscriptions/my-subscription` - User's subscription
- `POST /api/v1/subscriptions/upgrade` - Upgrade tier
- `POST /api/v1/subscriptions/cancel` - Cancel subscription
- `GET /api/v1/subscriptions/comparison` - Tier comparison

### Frontend

**New Files**:
- `frontend/src/pages/PremiumPage.tsx` - Premium subscription UI

**Modified Files**:
- `frontend/src/App.tsx` - Added `/premium` route
- `frontend/src/components/Sidebar.tsx` - Added Premium menu item (Crown icon)

---

## Subscription Tiers Overview

| Feature | Free | Premium | VIP |
|---------|------|---------|-----|
| **Price** | $0 | $29.99/mo | $99.99/mo |
| **Staking Bonus** | 0% | +25% | +50% |
| **Platform Fee** | 5% | 2% | 0% |
| **Max Stakes** | 10 | 50 | Unlimited |
| **Support** | Email | Priority | VIP + Manager |
| **API Access** | ❌ | ❌ | ✅ |

---

## Example Earnings

**Scenario**: Stake 1 BTC at 12% APY for 1 year

- **Free Tier**: 0.114 BTC (base reward - 5% fee)
- **Premium Tier**: 0.147 BTC (+28.9% more than Free!)
- **VIP Tier**: 0.18 BTC (+57.9% more than Free!)

---

## API Testing

### Get Subscription Plans
```bash
curl http://localhost:3000/api/v1/subscriptions/plans
```

### Check Your Subscription
```bash
curl http://localhost:3000/api/v1/subscriptions/my-subscription \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Upgrade to Premium (Yearly)
```bash
# First, get the premium plan ID
PLAN_ID=$(curl -s http://localhost:3000/api/v1/subscriptions/plans | jq -r '.data[] | select(.tier=="premium") | .id')

# Then upgrade
curl -X POST http://localhost:3000/api/v1/subscriptions/upgrade \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"planId\": \"$PLAN_ID\", \"billingCycle\": \"yearly\"}"
```

### Stake with Premium Benefits
```bash
# Create a stake (premium bonus auto-applied)
curl -X POST http://localhost:3000/api/v1/staking/stakes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "poolId": "POOL_UUID",
    "amount": 1.0
  }'

# Later, claim rewards with breakdown
curl -X POST http://localhost:3000/api/v1/staking/stakes/STAKE_UUID/claim \
  -H "Authorization: Bearer YOUR_TOKEN"
  
# Response includes:
# {
#   "rewardBreakdown": {
#     "baseReward": 0.12,
#     "premiumBonus": 0.03,
#     "platformFee": 0.003,
#     "netReward": 0.147,
#     "tier": "premium"
#   }
# }
```

---

## Verification Checklist

- [ ] Database updated with new tables
- [ ] Subscription plans seeded (3 tiers)
- [ ] Premium page accessible at `/premium`
- [ ] Premium menu item visible in sidebar
- [ ] Can view subscription plans
- [ ] Can upgrade subscription (when logged in)
- [ ] Staking rewards include premium bonus
- [ ] Platform fees are deducted correctly
- [ ] Reward breakdown shows all components
- [ ] No TypeScript compilation errors

---

## Troubleshooting

### "Subscription plans not found"
```bash
# Reseed the subscription plans
docker exec -i cryptex-postgres psql -U postgres -d cryptex < backend/src/database/seed-subscription-plans.sql
```

### "Column does not exist" errors
```bash
# Database schema not updated - recreate
docker-compose down -v
docker-compose up -d
# Wait for init, then seed data
```

### Premium page shows 404
```bash
# Ensure frontend is rebuilt
cd frontend
npm run build
# Or just restart dev server
```

### Staking rewards don't show premium bonus
```bash
# Check user's subscription tier
docker exec -it cryptex-postgres psql -U postgres -d cryptex -c \
  "SELECT username, subscription_tier, subscription_expires_at FROM users;"
  
# Manually set a user to premium for testing
docker exec -it cryptex-postgres psql -U postgres -d cryptex -c \
  "UPDATE users SET subscription_tier = 'premium', subscription_expires_at = NOW() + INTERVAL '1 year' WHERE username = 'testuser';"
```

---

## Next Steps

1. **Test all subscription tiers**: Upgrade to Premium, then VIP
2. **Verify earnings**: Create stakes and check bonus calculations
3. **Integration**: Add payment gateway (Stripe/PayPal) for production
4. **Marketing**: Promote premium benefits to existing users
5. **Analytics**: Monitor conversion rates and revenue

---

## Production Checklist

Before deploying to production:

- [ ] Integrate real payment gateway (Stripe/PayPal)
- [ ] Set up recurring billing automation
- [ ] Implement invoice generation
- [ ] Add tax calculation (if required)
- [ ] Create upgrade/downgrade flows
- [ ] Set up email notifications (upgrade, renewal, expiry)
- [ ] Implement refund policy
- [ ] Add cancellation survey
- [ ] Create admin dashboard for subscription metrics
- [ ] Test edge cases (expired subscriptions, failed payments)

---

## Documentation

- **[PREMIUM_SUBSCRIPTION.md](PREMIUM_SUBSCRIPTION.md)** - Complete documentation
- **[README.md](README.md)** - Updated main readme
- **[FEATURE_SUMMARY.md](FEATURE_SUMMARY.md)** - Platform overview

---

**Status**: ✅ **Premium Subscription System Ready!**

Users can now upgrade to Premium or VIP tiers to maximize their staking earnings! 👑💰

Questions? Check [PREMIUM_SUBSCRIPTION.md](PREMIUM_SUBSCRIPTION.md) for detailed docs.
