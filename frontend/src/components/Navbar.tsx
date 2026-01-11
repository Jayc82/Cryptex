import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Bell, User, LogOut, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-blue-500">
          Cryptex
        </Link>

        <div className="flex items-center gap-4">
          {/* Transparency Badge */}
          <Link 
            to="/transparency"
            className="flex items-center gap-2 px-3 py-2 bg-green-900/30 hover:bg-green-900/50 text-green-300 rounded-lg transition border border-green-700/50"
          >
            <Shield size={16} />
            <span className="text-sm font-semibold">Transparency</span>
          </Link>
          
          <button className="p-2 hover:bg-slate-700 rounded-lg transition">
            <Bell size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <User size={20} />
            <span className="text-sm">{user?.username}</span>
          </div>

          <button
            onClick={() => logout()}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}
