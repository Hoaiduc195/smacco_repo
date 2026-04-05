import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, User, LogOut, Sparkles, Route } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar({ onSearch, onSearchInputChange, searchQuery = '', setSearchQuery, className = 'sticky top-0' }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setShowUserMenu(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (setSearchQuery) {
      setSearchQuery(localSearchQuery);
    }
    if (onSearch) {
      onSearch(localSearchQuery);
    }
  };

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const userEmail = currentUser?.email || '';
  const userName = currentUser?.displayName || userEmail.split('@')[0] || 'Người dùng';

  return (
    <nav className={`h-20 bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-cyan-900/95 border-b border-white/10 flex items-center px-3 sm:px-6 gap-3 sm:gap-6 z-40 shadow-lg backdrop-blur ${className}`}>
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-3 flex-shrink-0">
        <div className="w-11 h-11 bg-white/15 border border-white/25 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-white font-bold leading-5">AI Studio Maps</p>
          <p className="text-cyan-100/80 text-xs">Lập kế hoạch thông minh cho chuyến đi</p>
        </div>
      </button>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm nhà hàng, quán cà phê..."
            value={localSearchQuery}
            onChange={(e) => {
              const nextValue = e.target.value;
              setLocalSearchQuery(nextValue);
              onSearchInputChange?.(nextValue);
            }}
            className="w-full pl-10 pr-4 py-3 border border-white/10 bg-white/95 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300 text-slate-900"
          />
        </div>
      </form>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/trips')}
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/25 text-white bg-white/10 hover:bg-white/20 transition-colors"
        >
          <Route className="w-4 h-4" />
          Chuyến đi
        </button>
        <button
          type="button"
          onClick={() => navigate('/recommendations')}
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-200/30 text-white bg-cyan-400/15 hover:bg-cyan-300/20 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Gợi ý
        </button>
      </div>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
        >
          <div className="w-9 h-9 bg-white/20 border border-white/25 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium hidden sm:inline text-white">{userName}</span>
        </button>

        {/* Dropdown Menu */}
        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-4 h-4" />
              {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
