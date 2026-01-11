import { useState, useEffect } from 'react';
import { miningApi } from '../services/api';
import { Activity, Cpu, DollarSign, Zap, Server, TrendingUp } from 'lucide-react';

interface MiningPool {
  id: string;
  currency: string;
  name: string;
  description: string;
  algorithm: string;
  pool_type: string;
  pool_url: string;
  pool_port: number;
  fee_percentage: number;
  min_payout: number;
  pool_hashrate: number;
  active_miners: number;
  blocks_found: number;
  is_active: boolean;
}

interface UserMiner {
  id: string;
  pool_id: string;
  pool_name: string;
  currency: string;
  algorithm: string;
  pool_type: string;
  miner_name: string;
  is_active: boolean;
  total_hashrate: number;
  total_earnings: number;
  pending_balance: number;
  worker_count: number;
  online_workers: number;
  efficiency: string;
}

interface Worker {
  id: string;
  worker_name: string;
  hashrate: number;
  shares_accepted: number;
  shares_rejected: number;
  is_online: boolean;
  last_seen: string;
  miner_software: string;
}

interface DashboardStats {
  overview: {
    total_miners: number;
    total_hashrate: number;
    total_earnings: number;
    pending_balance: number;
    total_workers: number;
    online_workers: number;
  };
  earningsByCurrency: Array<{ currency: string; total: number; pending: number }>;
  recentPayouts: Array<any>;
}

export default function MiningPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pools' | 'miners'>('dashboard');
  const [pools, setPools] = useState<MiningPool[]>([]);
  const [miners, setMiners] = useState<UserMiner[]>([]);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [selectedMiner, setSelectedMiner] = useState<UserMiner | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<MiningPool | null>(null);
  const [error, setError] = useState('');

  // Form states
  const [minerName, setMinerName] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [workerPassword, setWorkerPassword] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'dashboard') {
        const response = await miningApi.getDashboard();
        setDashboard(response.data);
      } else if (activeTab === 'pools') {
        const response = await miningApi.getPools({ active: true });
        setPools(response.data);
      } else {
        const response = await miningApi.getMiners();
        setMiners(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkers = async (minerId: string) => {
    try {
      const response = await miningApi.getWorkers(minerId);
      setWorkers(response.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to load workers');
    }
  };

  const handleCreateMiner = async () => {
    if (!selectedPool || !selectedWalletId) return;

    try {
      setError('');
      await miningApi.createMiner({
        poolId: selectedPool.id,
        walletId: selectedWalletId,
        minerName: minerName || undefined,
      });
      setShowPoolModal(false);
      setMinerName('');
      setSelectedWalletId('');
      setSelectedPool(null);
      alert('Miner configuration created successfully!');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create miner');
    }
  };

  const handleAddWorker = async () => {
    if (!selectedMiner || !workerName) return;

    try {
      await miningApi.addWorker(selectedMiner.id, {
        workerName,
        workerPassword: workerPassword || undefined,
      });
      setShowWorkerModal(false);
      setWorkerName('');
      setWorkerPassword('');
      alert('Worker added successfully!');
      loadWorkers(selectedMiner.id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add worker');
    }
  };

  const handleRequestPayout = async (minerId: string) => {
    if (!confirm('Request payout for this miner?')) return;

    try {
      const response = await miningApi.requestPayout(minerId);
      alert(
        `Payout successful! Amount: ${response.data.netAmount} (Fee: ${response.data.fee})`
      );
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to request payout');
    }
  };

  const formatHashrate = (hashrate: number) => {
    if (hashrate >= 1e12) return `${(hashrate / 1e12).toFixed(2)} TH/s`;
    if (hashrate >= 1e9) return `${(hashrate / 1e9).toFixed(2)} GH/s`;
    if (hashrate >= 1e6) return `${(hashrate / 1e6).toFixed(2)} MH/s`;
    if (hashrate >= 1e3) return `${(hashrate / 1e3).toFixed(2)} KH/s`;
    return `${hashrate.toFixed(2)} H/s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Cpu className="text-blue-600" />
            Mining Portal
          </h1>
          <p className="text-gray-600 mt-2">
            Mine cryptocurrency and earn rewards with pool or solo mining
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Activity size={18} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('pools')}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              activeTab === 'pools'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Server size={18} />
            Mining Pools
          </button>
          <button
            onClick={() => setActiveTab('miners')}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              activeTab === 'miners'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Cpu size={18} />
            My Miners
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : activeTab === 'dashboard' && dashboard ? (
          /* Dashboard */
          <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">Total Hashrate</div>
                  <Zap className="text-yellow-500" size={20} />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatHashrate(dashboard.overview.total_hashrate)}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">Active Miners</div>
                  <Cpu className="text-blue-500" size={20} />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {dashboard.overview.total_miners}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {dashboard.overview.online_workers}/{dashboard.overview.total_workers} workers
                  online
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">Total Earnings</div>
                  <DollarSign className="text-green-500" size={20} />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${dashboard.overview.total_earnings.toFixed(4)}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">Pending Balance</div>
                  <TrendingUp className="text-purple-500" size={20} />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${dashboard.overview.pending_balance.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Earnings by Currency */}
            {dashboard.earningsByCurrency.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">Earnings by Currency</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dashboard.earningsByCurrency.map((earning) => (
                    <div key={earning.currency} className="border rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">{earning.currency}</div>
                      <div className="text-xl font-bold">
                        {earning.total.toFixed(8)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Pending: {earning.pending.toFixed(8)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Payouts */}
            {dashboard.recentPayouts.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Payouts</h3>
                <div className="space-y-3">
                  {dashboard.recentPayouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex justify-between items-center border-b pb-3"
                    >
                      <div>
                        <div className="font-medium">{payout.pool_name}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(payout.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          +{parseFloat(payout.amount).toFixed(8)} {payout.currency}
                        </div>
                        <div className="text-xs text-gray-500">{payout.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'pools' ? (
          /* Mining Pools */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pools.map((pool) => (
              <div
                key={pool.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{pool.name}</h3>
                    <p className="text-sm text-gray-600">{pool.currency}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      pool.pool_type === 'pool'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {pool.pool_type.toUpperCase()}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4">{pool.description}</p>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Algorithm:</span>
                    <span className="font-medium">{pool.algorithm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pool Fee:</span>
                    <span className="font-medium">{pool.fee_percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min Payout:</span>
                    <span className="font-medium">
                      {pool.min_payout} {pool.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pool Hashrate:</span>
                    <span className="font-medium">
                      {pool.pool_hashrate ? formatHashrate(pool.pool_hashrate) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Miners:</span>
                    <span className="font-medium">{pool.active_miners}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Blocks Found:</span>
                    <span className="font-medium">{pool.blocks_found}</span>
                  </div>
                </div>

                {pool.pool_url && (
                  <div className="mb-4 p-3 bg-gray-50 rounded text-xs">
                    <div className="font-medium text-gray-700 mb-1">Connection:</div>
                    <div className="text-gray-600 break-all">
                      {pool.pool_url}:{pool.pool_port}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedPool(pool);
                    setShowPoolModal(true);
                    setError('');
                  }}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Start Mining
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* My Miners */
          <div>
            {miners.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Cpu size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Miners Configured
                </h3>
                <p className="text-gray-600 mb-4">
                  Start mining by selecting a pool from the Mining Pools tab
                </p>
                <button
                  onClick={() => setActiveTab('pools')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Browse Pools
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {miners.map((miner) => (
                  <div key={miner.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {miner.miner_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {miner.pool_name} • {miner.currency}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            miner.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {miner.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {miner.pool_type}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Hashrate</div>
                        <div className="text-lg font-bold">
                          {formatHashrate(miner.total_hashrate)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Workers</div>
                        <div className="text-lg font-bold">
                          {miner.online_workers}/{miner.worker_count}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Efficiency</div>
                        <div className="text-lg font-bold text-green-600">
                          {miner.efficiency}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Pending</div>
                        <div className="text-lg font-bold">
                          {miner.pending_balance.toFixed(6)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedMiner(miner);
                          loadWorkers(miner.id);
                        }}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition"
                      >
                        View Workers ({miner.worker_count})
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMiner(miner);
                          setShowWorkerModal(true);
                        }}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                      >
                        Add Worker
                      </button>
                      <button
                        onClick={() => handleRequestPayout(miner.id)}
                        disabled={miner.pending_balance === 0}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Request Payout
                      </button>
                    </div>

                    {/* Workers List */}
                    {selectedMiner?.id === miner.id && workers.length > 0 && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="font-semibold mb-3">Workers</h4>
                        <div className="space-y-2">
                          {workers.map((worker) => (
                            <div
                              key={worker.id}
                              className="flex justify-between items-center p-3 bg-gray-50 rounded"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    worker.is_online ? 'bg-green-500' : 'bg-gray-400'
                                  }`}
                                ></div>
                                <div>
                                  <div className="font-medium">{worker.worker_name}</div>
                                  <div className="text-xs text-gray-600">
                                    {worker.miner_software || 'Unknown Software'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  {formatHashrate(worker.hashrate)}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {worker.shares_accepted} accepted /{' '}
                                  {worker.shares_rejected} rejected
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Miner Modal */}
        {showPoolModal && selectedPool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Configure Miner</h2>

              <div className="mb-4">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="font-medium mb-2">{selectedPool.name}</div>
                  <div className="text-sm text-gray-600">
                    {selectedPool.currency} • {selectedPool.algorithm}
                  </div>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Miner Name (Optional)
                </label>
                <input
                  type="text"
                  value={minerName}
                  onChange={(e) => setMinerName(e.target.value)}
                  placeholder="My Miner"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                />

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wallet ID *
                </label>
                <input
                  type="text"
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  placeholder="Enter wallet ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use your {selectedPool.currency} wallet ID for receiving payouts
                </p>

                {error && (
                  <div className="mt-2 text-sm text-red-600">{error}</div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowPoolModal(false);
                    setSelectedPool(null);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMiner}
                  disabled={!selectedWalletId}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  Create Miner
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Worker Modal */}
        {showWorkerModal && selectedMiner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Add Worker</h2>

              <div className="mb-4">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="font-medium">{selectedMiner.miner_name}</div>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Worker Name *
                </label>
                <input
                  type="text"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  placeholder="worker01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                />

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Worker Password (Optional)
                </label>
                <input
                  type="password"
                  value={workerPassword}
                  onChange={(e) => setWorkerPassword(e.target.value)}
                  placeholder="Optional password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowWorkerModal(false);
                    setWorkerName('');
                    setWorkerPassword('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWorker}
                  disabled={!workerName}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  Add Worker
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
