import { useState, useEffect } from 'react';
import { stakingApi } from '../services/api';

interface StakingPool {
  id: string;
  currency: string;
  name: string;
  description: string;
  apy: number;
  min_stake: number;
  max_stake: number;
  lock_period_days: number;
  total_staked: number;
  max_pool_size: number;
  is_active: boolean;
  activeStakers?: number;
  utilization?: number;
}

interface UserStake {
  id: string;
  pool_id: string;
  pool_name: string;
  currency: string;
  amount: number;
  apy: number;
  lock_period_days: number;
  reward_earned: number;
  currentReward: number;
  status: string;
  stake_date: string;
  unlock_date: string | null;
  isLocked: boolean;
  daysUntilUnlock: number;
}

interface StakingStats {
  activeStakes: {
    count: number;
    totalStaked: number;
    totalRewards: number;
  };
  rewardsByCurrency: Array<{ currency: string; total_amount: number }>;
}

export default function StakingPage() {
  const [activeTab, setActiveTab] = useState<'pools' | 'stakes'>('pools');
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [userStakes, setUserStakes] = useState<UserStake[]>([]);
  const [stats, setStats] = useState<StakingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'pools') {
        const response = await stakingApi.getPools({ active: true });
        setPools(response.data);
      } else {
        const [stakesRes, statsRes] = await Promise.all([
          stakingApi.getUserStakes({ status: 'active' }),
          stakingApi.getStats(),
        ]);
        setUserStakes(stakesRes.data);
        setStats(statsRes.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async () => {
    if (!selectedPool || !stakeAmount) return;

    try {
      setError('');
      await stakingApi.createStake({
        poolId: selectedPool.id,
        amount: parseFloat(stakeAmount),
      });
      setShowStakeModal(false);
      setStakeAmount('');
      setSelectedPool(null);
      alert('Staking successful!');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to stake');
    }
  };

  const handleUnstake = async (stakeId: string) => {
    if (!confirm('Are you sure you want to unstake?')) return;

    try {
      const response = await stakingApi.unstake(stakeId);
      alert(
        `Unstaked successfully! Returned: ${response.data.amount} ${response.data.currency} + ${response.data.reward} ${response.data.currency} rewards`
      );
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to unstake');
    }
  };

  const handleClaimRewards = async (stakeId: string) => {
    try {
      const response = await stakingApi.claimRewards(stakeId);
      alert(
        `Claimed ${response.data.amount} ${response.data.currency} successfully!`
      );
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to claim rewards');
    }
  };

  const openStakeModal = (pool: StakingPool) => {
    setSelectedPool(pool);
    setShowStakeModal(true);
    setStakeAmount('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Staking</h1>
          <p className="text-gray-600 mt-2">
            Earn rewards by staking your crypto assets
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('pools')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'pools'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Staking Pools
          </button>
          <button
            onClick={() => setActiveTab('stakes')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'stakes'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Stakes
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : activeTab === 'pools' ? (
          /* Staking Pools */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pools.map((pool) => (
              <div
                key={pool.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {pool.name}
                    </h3>
                    <p className="text-sm text-gray-600">{pool.currency}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {pool.apy}%
                    </div>
                    <div className="text-xs text-gray-600">APY</div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {pool.description}
                </p>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lock Period:</span>
                    <span className="font-medium">
                      {pool.lock_period_days === 0
                        ? 'Flexible'
                        : `${pool.lock_period_days} days`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min Stake:</span>
                    <span className="font-medium">
                      {pool.min_stake} {pool.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Staked:</span>
                    <span className="font-medium">
                      {pool.total_staked.toFixed(2)} {pool.currency}
                    </span>
                  </div>
                  {pool.activeStakers !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stakers:</span>
                      <span className="font-medium">{pool.activeStakers}</span>
                    </div>
                  )}
                  {pool.utilization !== undefined && pool.max_pool_size && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Utilization:</span>
                      <span className="font-medium">
                        {pool.utilization.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => openStakeModal(pool)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Stake Now
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* My Stakes */
          <div>
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-600 mb-2">
                    Active Stakes
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.activeStakes.count}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-600 mb-2">
                    Total Staked Value
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${stats.activeStakes.totalStaked.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-600 mb-2">
                    Total Rewards Earned
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ${stats.activeStakes.totalRewards.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Stakes List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pool
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        APY
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Rewards
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userStakes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          No active stakes. Visit the Staking Pools tab to get
                          started!
                        </td>
                      </tr>
                    ) : (
                      userStakes.map((stake) => (
                        <tr key={stake.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {stake.pool_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {stake.currency}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {stake.amount.toFixed(4)} {stake.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            {stake.apy}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {stake.currentReward.toFixed(6)} {stake.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {stake.isLocked ? (
                              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                Locked ({stake.daysUntilUnlock}d)
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                Unlocked
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                            {stake.lock_period_days === 0 &&
                              stake.currentReward > 0 && (
                                <button
                                  onClick={() => handleClaimRewards(stake.id)}
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Claim
                                </button>
                              )}
                            {!stake.isLocked && (
                              <button
                                onClick={() => handleUnstake(stake.id)}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Unstake
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Stake Modal */}
        {showStakeModal && selectedPool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">
                Stake {selectedPool.currency}
              </h2>

              <div className="mb-4">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Pool:</span>
                    <span className="font-medium">{selectedPool.name}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">APY:</span>
                    <span className="font-medium text-green-600">
                      {selectedPool.apy}%
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Lock Period:</span>
                    <span className="font-medium">
                      {selectedPool.lock_period_days === 0
                        ? 'Flexible'
                        : `${selectedPool.lock_period_days} days`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min Stake:</span>
                    <span className="font-medium">
                      {selectedPool.min_stake} {selectedPool.currency}
                    </span>
                  </div>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Stake
                </label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder={`Min: ${selectedPool.min_stake}`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={selectedPool.min_stake}
                  max={selectedPool.max_stake || undefined}
                  step="0.00000001"
                />

                {error && (
                  <div className="mt-2 text-sm text-red-600">{error}</div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowStakeModal(false);
                    setSelectedPool(null);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStake}
                  disabled={
                    !stakeAmount ||
                    parseFloat(stakeAmount) < selectedPool.min_stake
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  Confirm Stake
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
