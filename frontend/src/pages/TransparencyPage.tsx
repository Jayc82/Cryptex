import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Validator {
  id: string;
  name: string;
  chain: string;
  address: string;
  commission_rate: number;
  uptime_percentage: number;
  slashing_events: number;
  decentralization_score: number;
  is_exchange_validator: boolean;
  active_stakes?: number;
  total_staked_by_users?: number;
}

interface FeeConfig {
  asset_type: string;
  fee_type: string;
  fee_percentage: number;
  fee_cap_max: number;
  is_immutable: boolean;
  description: string;
  rationale: string;
}

interface ReserveSnapshot {
  currency: string;
  total_user_balances: number;
  total_exchange_holdings: number;
  reserve_ratio: number;
  total_staked_amount: number;
  audited: boolean;
  snapshot_date: string;
}

interface TransparencyMetrics {
  total_active_users: number;
  total_staking_users: number;
  total_staking_fees_collected: number;
  total_rewards_distributed: number;
  insurance_fund_balance: number;
}

/**
 * ============================================================================
 * TRANSPARENCY DASHBOARD
 * ============================================================================
 * PUBLIC PAGE - No authentication required
 * The ultimate trust signal: complete transparency into operations
 * ============================================================================
 */
export default function TransparencyPage() {
  const [activeTab, setActiveTab] = useState<'validators' | 'fees' | 'reserves' | 'metrics'>('validators');
  const [validators, setValidators] = useState<Validator[]>([]);
  const [feeConfigs, setFeeConfigs] = useState<FeeConfig[]>([]);
  const [reserves, setReserves] = useState<ReserveSnapshot[]>([]);
  const [metrics, setMetrics] = useState<TransparencyMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'validators':
          const validatorRes = await fetch('/api/v1/transparency/validators');
          const validatorData = await validatorRes.json();
          setValidators(validatorData.validators || []);
          break;

        case 'fees':
          const feesRes = await fetch('/api/v1/transparency/fees');
          const feesData = await feesRes.json();
          setFeeConfigs(feesData.fee_configurations || []);
          break;

        case 'reserves':
          const reservesRes = await fetch('/api/v1/transparency/reserves/current');
          const reservesData = await reservesRes.json();
          setReserves(reservesData.reserves || []);
          break;

        case 'metrics':
          const metricsRes = await fetch('/api/v1/transparency/metrics');
          const metricsData = await metricsRes.json();
          setMetrics(metricsData.latest_metrics);
          break;
      }
    } catch (error) {
      console.error('Failed to load transparency data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                🏛️ Transparency Dashboard
              </h1>
              <p className="text-gray-300 text-lg">
                Real-time proof of our trust-first model. Every number is verifiable on-chain.
              </p>
            </div>
            <Link
              to="/"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Back to App
            </Link>
          </div>
        </div>
      </div>

      {/* Trust Statement Banner */}
      <div className="bg-green-900/30 border-y border-green-700/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 text-green-100">
            <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium">
              <strong>Zero Hidden Fees.</strong> We publish our fee caps and never exceed them. 
              No payment for order flow. No wash trading. No fake volume. Proof below. ↓
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg mb-8">
          {[
            { id: 'validators', label: '🛡️ Validators', desc: 'Choose who stakes for you' },
            { id: 'fees', label: '💰 Fee Caps', desc: 'Immutable maximums' },
            { id: 'reserves', label: '🔒 Reserves', desc: 'Proof of solvency' },
            { id: 'metrics', label: '📊 Metrics', desc: 'Real-time stats' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-6 py-4 rounded-lg transition text-left ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <div className="font-semibold">{tab.label}</div>
              <div className="text-xs mt-1 opacity-75">{tab.desc}</div>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading transparency data...</p>
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
            {activeTab === 'validators' && <ValidatorsTab validators={validators} />}
            {activeTab === 'fees' && <FeesTab feeConfigs={feeConfigs} />}
            {activeTab === 'reserves' && <ReservesTab reserves={reserves} />}
            {activeTab === 'metrics' && <MetricsTab metrics={metrics} />}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-400 text-sm">
        <p>
          All data updates in real-time. Blockchain addresses are publicly verifiable.
          <br />
          Questions? Email <a href="mailto:transparency@cryptex.io" className="text-blue-400 hover:underline">transparency@cryptex.io</a>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// VALIDATORS TAB
// ============================================================================

function ValidatorsTab({ validators }: { validators: Validator[] }) {
  const [selectedChain, setSelectedChain] = useState<string>('all');
  
  const chains = ['all', ...Array.from(new Set(validators.map((v) => v.chain)))];
  const filteredValidators = selectedChain === 'all' 
    ? validators 
    : validators.filter((v) => v.chain === selectedChain);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Validator Registry</h2>
          <p className="text-gray-400 mt-1">
            All validators with on-chain addresses, commissions, and performance history
          </p>
        </div>
        <select
          value={selectedChain}
          onChange={(e) => setSelectedChain(e.target.value)}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
        >
          {chains.map((chain) => (
            <option key={chain} value={chain}>
              {chain === 'all' ? 'All Chains' : chain.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="pb-3 text-gray-300 font-semibold">Validator</th>
              <th className="pb-3 text-gray-300 font-semibold">Chain</th>
              <th className="pb-3 text-gray-300 font-semibold">Address</th>
              <th className="pb-3 text-gray-300 font-semibold text-right">Commission</th>
              <th className="pb-3 text-gray-300 font-semibold text-right">Uptime</th>
              <th className="pb-3 text-gray-300 font-semibold text-right">Slashing</th>
              <th className="pb-3 text-gray-300 font-semibold text-right">Decentralization</th>
            </tr>
          </thead>
          <tbody>
            {filteredValidators.map((validator) => (
              <tr key={validator.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{validator.name}</span>
                    {validator.is_exchange_validator && (
                      <span className="px-2 py-1 bg-blue-900/50 text-blue-300 text-xs rounded">
                        Exchange
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 text-gray-300">{validator.chain.toUpperCase()}</td>
                <td className="py-4">
                  <code className="text-xs text-blue-400 bg-gray-900/50 px-2 py-1 rounded">
                    {validator.address.substring(0, 12)}...
                  </code>
                </td>
                <td className="py-4 text-right text-gray-300">
                  {(validator.commission_rate * 100).toFixed(2)}%
                </td>
                <td className="py-4 text-right">
                  <span className={validator.uptime_percentage >= 99 ? 'text-green-400' : 'text-yellow-400'}>
                    {validator.uptime_percentage.toFixed(2)}%
                  </span>
                </td>
                <td className="py-4 text-right">
                  <span className={validator.slashing_events === 0 ? 'text-green-400' : 'text-red-400'}>
                    {validator.slashing_events}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${validator.decentralization_score}%` }}
                      />
                    </div>
                    <span className="text-gray-300 text-sm w-8">
                      {validator.decentralization_score}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
        <p className="text-blue-200 text-sm">
          💡 <strong>User Choice:</strong> You can select your preferred validators when staking. 
          All addresses are verifiable on their respective blockchains.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// FEES TAB
// ============================================================================

function FeesTab({ feeConfigs }: { feeConfigs: FeeConfig[] }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Fee Configuration</h2>
      <p className="text-gray-400 mb-6">
        These are our maximum possible fees. Immutable fees cannot be changed without user vote.
      </p>

      {/* Comparison Banner */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
          <div className="text-red-300 text-sm font-semibold mb-1">Typical CEX</div>
          <div className="text-2xl font-bold text-red-400">15-25%</div>
          <div className="text-red-200 text-sm mt-1">Staking fee (opaque)</div>
        </div>
        <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
          <div className="text-green-300 text-sm font-semibold mb-1">Cryptex Maximum</div>
          <div className="text-2xl font-bold text-green-400">3-5%</div>
          <div className="text-green-200 text-sm mt-1">Staking fee (capped)</div>
        </div>
      </div>

      {/* Fee Table */}
      <div className="space-y-4">
        {feeConfigs.map((config, idx) => (
          <div key={idx} className="bg-gray-700/30 rounded-lg p-5 border border-gray-600">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">
                    {config.asset_type.replace(/_/g, ' ')} - {config.fee_type}
                  </h3>
                  {config.is_immutable && (
                    <span className="px-3 py-1 bg-purple-900/50 text-purple-300 text-xs font-semibold rounded-full">
                      🔒 IMMUTABLE
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mt-1">{config.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-400">
                  {(config.fee_percentage * 100).toFixed(3)}%
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  Cap: {(config.fee_cap_max * 100).toFixed(3)}%
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 rounded p-3 text-sm text-gray-300">
              <strong>Rationale:</strong> {config.rationale}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
        <p className="text-yellow-200 text-sm">
          ⚖️ <strong>Governance:</strong> Immutable fees can only be changed through user governance vote 
          requiring 2/3 majority. This protects you from arbitrary fee increases.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// RESERVES TAB
// ============================================================================

function ReservesTab({ reserves }: { reserves: ReserveSnapshot[] }) {
  const allAdequate = reserves.every((r) => r.reserve_ratio >= 1.0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Proof of Reserves</h2>
          <p className="text-gray-400 mt-1">
            Real-time verification that we hold 100%+ of user funds
          </p>
        </div>
        {allAdequate && (
          <div className="px-4 py-2 bg-green-900/50 text-green-300 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Fully Reserved</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {reserves.map((reserve, idx) => {
          const ratio = reserve.reserve_ratio;
          const isHealthy = ratio >= 1.0;

          return (
            <div key={idx} className="bg-gray-700/30 rounded-lg p-6 border border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{reserve.currency}</h3>
                {reserve.audited && (
                  <span className="px-3 py-1 bg-green-900/50 text-green-300 text-xs font-semibold rounded-full">
                    ✓ AUDITED
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6 mb-4">
                <div>
                  <div className="text-gray-400 text-sm mb-1">User Balances</div>
                  <div className="text-2xl font-bold text-white">
                    {reserve.total_user_balances.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Exchange Holdings</div>
                  <div className="text-2xl font-bold text-green-400">
                    {reserve.total_exchange_holdings.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Reserve Ratio Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Reserve Ratio</span>
                  <span className={isHealthy ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                    {(ratio * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Last updated: {new Date(reserve.snapshot_date).toLocaleString()}
                </div>
              </div>

              {reserve.total_staked_amount > 0 && (
                <div className="bg-gray-800/50 rounded p-3 text-sm">
                  <div className="text-gray-400">Currently Staked</div>
                  <div className="text-white font-semibold">
                    {reserve.total_staked_amount.toLocaleString()} {reserve.currency}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
        <p className="text-blue-200 text-sm">
          🔍 <strong>Verification:</strong> All blockchain addresses are publicly listed. 
          You can verify holdings yourself on block explorers. Updated hourly.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// METRICS TAB
// ============================================================================

function MetricsTab({ metrics }: { metrics: TransparencyMetrics | null }) {
  if (!metrics) {
    return <div className="text-gray-400">No metrics available</div>;
  }

  const netMargin = metrics.total_rewards_distributed > 0
    ? (metrics.total_staking_fees_collected / metrics.total_rewards_distributed) * 100
    : 0;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Live Platform Metrics</h2>
      <p className="text-gray-400 mb-8">
        Real-time statistics. No fake volume, no wash trading, no hidden fees.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          label="Active Users"
          value={metrics.total_active_users.toLocaleString()}
          icon="👥"
          color="blue"
        />
        <MetricCard
          label="Staking Users"
          value={metrics.total_staking_users.toLocaleString()}
          icon="🪙"
          color="purple"
        />
        <MetricCard
          label="Rewards Distributed"
          value={`$${metrics.total_rewards_distributed.toLocaleString()}`}
          icon="💎"
          color="green"
        />
        <MetricCard
          label="Insurance Fund"
          value={`$${metrics.insurance_fund_balance.toLocaleString()}`}
          icon="🛡️"
          color="yellow"
        />
      </div>

      {/* Fee Breakdown */}
      <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600">
        <h3 className="text-lg font-bold text-white mb-4">Fee Transparency</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Total Rewards Distributed to Users</span>
            <span className="text-2xl font-bold text-green-400">
              ${metrics.total_rewards_distributed.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Total Fees Collected by Platform</span>
            <span className="text-2xl font-bold text-blue-400">
              ${metrics.total_staking_fees_collected.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-600">
            <span className="text-gray-400 text-sm">Platform Take Rate</span>
            <span className="text-lg font-bold text-gray-300">
              {netMargin.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
        <p className="text-green-200 text-sm">
          ✨ <strong>Compare:</strong> Traditional CEXs take 15-25% of staking rewards and don't tell you. 
          We publish everything and cap our fees at 3-5%.
        </p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-900/20 border-blue-700/50 text-blue-400',
    purple: 'bg-purple-900/20 border-purple-700/50 text-purple-400',
    green: 'bg-green-900/20 border-green-700/50 text-green-400',
    yellow: 'bg-yellow-900/20 border-yellow-700/50 text-yellow-400',
  }[color];

  return (
    <div className={`${colorClasses} border rounded-lg p-5`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
