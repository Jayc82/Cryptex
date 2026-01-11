import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Wallet, 
  BarChart3, 
  Brain,
  Coins,
  Cpu,
  Crown,
  User 
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/trade', label: 'Trade', icon: TrendingUp },
  { path: '/portfolio', label: 'Portfolio', icon: Wallet },
  { path: '/markets', label: 'Markets', icon: BarChart3 },
  { path: '/staking', label: 'Staking', icon: Coins },
  { path: '/mining', label: 'Mining', icon: Cpu },
  { path: '/premium', label: 'Premium', icon: Crown },
  { path: '/ai-insights', label: 'AI Insights', icon: Brain },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-slate-800 border-r border-slate-700">
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
