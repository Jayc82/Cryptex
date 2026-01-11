import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { data: portfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const res = await api.get('/portfolio');
      return res.data;
    },
  });

  const { data: performance } = useQuery({
    queryKey: ['performance'],
    queryFn: async () => {
      const res = await api.get('/portfolio/performance');
      return res.data;
    },
  });

  const stats = [
    {
      label: 'Total Balance',
      value: `$${portfolio?.totalValue || '0.00'}`,
      icon: DollarSign,
      color: 'blue',
    },
    {
      label: '24h Profit/Loss',
      value: `$${performance?.profitLoss || '0.00'}`,
      icon: performance?.profitLoss >= 0 ? TrendingUp : TrendingDown,
      color: performance?.profitLoss >= 0 ? 'green' : 'red',
    },
    {
      label: 'Total Trades',
      value: performance?.total_trades || '0',
      icon: Activity,
      color: 'purple',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">{stat.label}</p>
                <p className={`text-2xl font-bold text-${stat.color}-500 mt-1`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 bg-${stat.color}-500/10 rounded-lg`}>
                <stat.icon size={24} className={`text-${stat.color}-500`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Portfolio Holdings */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Portfolio Holdings</h2>
        <div className="space-y-2">
          {portfolio?.holdings?.map((holding: any) => (
            <div
              key={holding.currency}
              className="flex items-center justify-between p-3 bg-slate-700 rounded"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <span className="font-bold">{holding.currency}</span>
                </div>
                <div>
                  <p className="font-medium">{holding.currency}</p>
                  <p className="text-sm text-slate-400">
                    {holding.balance} {holding.currency}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">${holding.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>
          <p className="text-slate-400 text-sm">
            Get personalized trading insights powered by AI
          </p>
          <button className="btn-primary mt-4">View Insights</button>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Market Overview</h3>
          <p className="text-slate-400 text-sm">
            Explore trending cryptocurrencies and market movements
          </p>
          <button className="btn-primary mt-4">View Markets</button>
        </div>
      </div>
    </div>
  );
}
