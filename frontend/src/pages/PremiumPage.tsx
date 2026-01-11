import { useState, useEffect } from 'react';
import { Crown, Check, Zap, Shield, TrendingUp, Star, DollarSign } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  tier: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  staking_bonus_percentage: number;
  platform_fee_percentage: number;
  trading_fee_discount: number;
  mining_fee_discount: number;
  withdrawal_limit_daily: number | null;
  max_stakes: number | null;
  priority_support: boolean;
  api_access: boolean;
  features: {
    features: string[];
  };
}

interface UserSubscription {
  currentTier: string;
  expiresAt: string | null;
  isExpired: boolean;
  plan: SubscriptionPlan;
  history: any[];
}

export default function PremiumPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Load plans
      const plansRes = await fetch('http://localhost:3000/api/v1/subscriptions/plans');
      const plansData = await plansRes.json();
      setPlans(plansData.data);

      // Load user's current subscription
      if (token) {
        const subRes = await fetch('http://localhost:3000/api/v1/subscriptions/my-subscription', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const subData = await subRes.json();
        setUserSubscription(subData.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setUpgrading(true);
      setError('');
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Please login to upgrade');
        return;
      }

      const res = await fetch('http://localhost:3000/api/v1/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId, billingCycle })
      });

      const data = await res.json();

      if (data.success) {
        alert(`Successfully upgraded! ${data.message}`);
        loadData(); // Reload data
      } else {
        setError(data.message || 'Upgrade failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpgrading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 border-gray-300';
      case 'premium': return 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-300';
      case 'vip': return 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <Shield className="w-8 h-8 text-gray-600" />;
      case 'premium': return <Zap className="w-8 h-8 text-purple-600" />;
      case 'vip': return <Crown className="w-8 h-8 text-yellow-600" />;
      default: return <Shield className="w-8 h-8 text-gray-600" />;
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    return billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
  };

  const getMonthlyEquivalent = (plan: SubscriptionPlan) => {
    if (billingCycle === 'monthly') return plan.price_monthly;
    return (plan.price_yearly / 12).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading subscription plans...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Maximize Your Earnings with Premium
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Boost staking rewards up to 50%, reduce fees, and unlock exclusive features
        </p>

        {/* Current Subscription Badge */}
        {userSubscription && (
          <div className="inline-block bg-white rounded-lg shadow-sm border px-6 py-3 mb-6">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-700">
                Current Plan: <strong className="capitalize">{userSubscription.currentTier}</strong>
              </span>
              {userSubscription.expiresAt && !userSubscription.isExpired && (
                <span className="text-sm text-gray-500">
                  (Expires: {new Date(userSubscription.expiresAt).toLocaleDateString()})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={billingCycle === 'monthly' ? 'text-gray-900 font-semibold' : 'text-gray-500'}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="relative w-14 h-8 bg-purple-600 rounded-full transition-colors"
          >
            <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
              billingCycle === 'yearly' ? 'translate-x-6' : ''
            }`} />
          </button>
          <span className={billingCycle === 'yearly' ? 'text-gray-900 font-semibold' : 'text-gray-500'}>
            Yearly <span className="text-green-600 text-sm">(Save 17%)</span>
          </span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {plans.map((plan) => {
          const isCurrentPlan = userSubscription?.currentTier === plan.tier;
          const price = getPrice(plan);
          const monthlyEquiv = getMonthlyEquivalent(plan);

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-8 ${getTierColor(plan.tier)} ${
                plan.tier === 'premium' ? 'transform scale-105 shadow-xl' : 'shadow-lg'
              }`}
            >
              {/* Recommended Badge */}
              {plan.tier === 'premium' && (
                <div className="absolute top-0 right-8 transform -translate-y-1/2">
                  <div className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    ⭐ Most Popular
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className="mb-6">{getTierIcon(plan.tier)}</div>

              {/* Plan Name */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-6 min-h-[48px]">{plan.description}</p>

              {/* Pricing */}
              <div className="mb-6">
                {price === 0 ? (
                  <div className="text-4xl font-bold text-gray-900">Free</div>
                ) : (
                  <>
                    <div className="text-4xl font-bold text-gray-900">
                      ${price}
                      <span className="text-lg text-gray-600 font-normal">
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <div className="text-sm text-gray-600 mt-1">
                        ${monthlyEquiv}/month billed annually
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Key Metrics */}
              <div className="bg-white rounded-lg p-4 mb-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Staking Bonus</span>
                  <span className="font-bold text-green-600">
                    {plan.staking_bonus_percentage > 0 ? `+${plan.staking_bonus_percentage}%` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Platform Fee</span>
                  <span className="font-bold text-gray-900">{plan.platform_fee_percentage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Trading Fee Discount</span>
                  <span className="font-bold text-purple-600">
                    {plan.trading_fee_discount > 0 ? `-${plan.trading_fee_discount}%` : '—'}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-8">
                {plan.features.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              {isCurrentPlan ? (
                <button
                  disabled
                  className="w-full py-3 bg-gray-300 text-gray-600 rounded-lg font-semibold cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : plan.tier === 'free' ? (
                <button
                  disabled
                  className="w-full py-3 bg-gray-200 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                >
                  Default Plan
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={upgrading}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    plan.tier === 'premium'
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {upgrading ? 'Processing...' : 'Upgrade Now'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Earnings Comparison */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Potential Earnings Comparison
        </h2>
        <p className="text-gray-600 text-center mb-8">
          Example: Staking 1 BTC in a 12% APY pool for 1 year
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Free Tier Example */}
          <div className="border-2 border-gray-200 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4 text-gray-700">Free Tier</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Reward (12% APY)</span>
                <span className="font-semibold">0.12 BTC</span>
              </div>
              <div className="flex justify-between">
                <span>Premium Bonus</span>
                <span className="text-gray-400">—</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Platform Fee (5%)</span>
                <span className="font-semibold">-0.006 BTC</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>You Receive</span>
                <span className="text-green-600">0.114 BTC</span>
              </div>
            </div>
          </div>

          {/* Premium Tier Example */}
          <div className="border-2 border-purple-400 rounded-lg p-6 bg-purple-50">
            <h3 className="font-bold text-lg mb-4 text-purple-700">Premium Tier ⭐</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Reward (12% APY)</span>
                <span className="font-semibold">0.12 BTC</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Premium Bonus (+25%)</span>
                <span className="font-semibold">+0.03 BTC</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Platform Fee (2%)</span>
                <span className="font-semibold">-0.003 BTC</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>You Receive</span>
                <span className="text-green-600">0.147 BTC</span>
              </div>
              <div className="text-center text-purple-600 font-semibold mt-2">
                +28.9% vs Free!
              </div>
            </div>
          </div>

          {/* VIP Tier Example */}
          <div className="border-2 border-yellow-400 rounded-lg p-6 bg-yellow-50">
            <h3 className="font-bold text-lg mb-4 text-yellow-700">VIP Tier 👑</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Reward (12% APY)</span>
                <span className="font-semibold">0.12 BTC</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>VIP Bonus (+50%)</span>
                <span className="font-semibold">+0.06 BTC</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Platform Fee (0%)</span>
                <span className="font-semibold">FREE! 🎉</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>You Receive</span>
                <span className="text-green-600">0.18 BTC</span>
              </div>
              <div className="text-center text-yellow-600 font-semibold mt-2">
                +57.9% vs Free!
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          * Actual earnings may vary based on market conditions and pool performance
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4 max-w-3xl mx-auto">
          <details className="bg-white rounded-lg p-4">
            <summary className="font-semibold cursor-pointer">
              How does the premium bonus work?
            </summary>
            <p className="mt-2 text-gray-600">
              Premium and VIP subscribers receive a bonus percentage on top of their base staking rewards.
              Premium gets +25% and VIP gets +50%. This bonus is calculated on your rewards before platform fees.
            </p>
          </details>

          <details className="bg-white rounded-lg p-4">
            <summary className="font-semibold cursor-pointer">
              What happens to my stakes if I cancel?
            </summary>
            <p className="mt-2 text-gray-600">
              Your subscription continues until the end of your billing period. Your existing stakes will
              receive premium benefits until expiry. After that, new rewards will use free tier rates.
            </p>
          </details>

          <details className="bg-white rounded-lg p-4">
            <summary className="font-semibold cursor-pointer">
              Can I upgrade from Premium to VIP?
            </summary>
            <p className="mt-2 text-gray-600">
              Yes! You can upgrade at any time. The new tier takes effect immediately, and you'll be charged
              a prorated amount for the remainder of your billing period.
            </p>
          </details>

          <details className="bg-white rounded-lg p-4">
            <summary className="font-semibold cursor-pointer">
              Are there any hidden fees?
            </summary>
            <p className="mt-2 text-gray-600">
              No hidden fees! The platform fee shown is the only fee deducted from your staking rewards.
              Premium and VIP tiers have significantly reduced platform fees (2% and 0% respectively).
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
