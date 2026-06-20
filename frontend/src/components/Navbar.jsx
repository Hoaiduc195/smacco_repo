import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar({ 
  onSearch, 
  onSearchInputChange, 
  searchQuery = '', 
  setSearchQuery, 
  className = 'sticky top-0',
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
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
    <nav className={`h-16 border-b border-ink-900 bg-ink-900 flex items-center px-3 sm:px-6 gap-3 sm:gap-6 z-40 shadow-soft ${className}`}>
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-3 flex-shrink-0">
        <img src="/favicon.svg" alt="Smacco Logo" className="w-8 h-8 object-contain transition-transform hover:scale-105" />
        <div className="hidden sm:block text-left">
          <p className="text-white font-extrabold text-lg tracking-normal leading-5 font-sans">Smacco</p>
          <p className="text-white/70 text-[10px] uppercase font-bold tracking-wide">Tìm lưu trú bằng AI</p>
        </div>
      </Link>

      {/* Search Bar */}
      <div className="flex-1 max-w-md xl:max-w-lg hidden md:flex relative mx-auto">
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
            <input
              type="text"
              placeholder="Tìm homestay, khách sạn hoặc lịch trình..."
              value={localSearchQuery}
              onChange={(e) => {
                const nextValue = e.target.value;
                setLocalSearchQuery(nextValue);
                onSearchInputChange?.(nextValue);
              }}
              className="w-full h-11 rounded-2xl border border-ink-700 bg-white px-4 pl-10 pr-4 text-xs text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-900/20 shadow-soft"
            />
          </div>
        </form>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
      </div>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 px-2.5 h-10 w-10 sm:w-52 rounded-2xl border border-base-200 bg-white hover:bg-primary-50 text-slate-900 transition-colors shadow-soft select-none flex-shrink-0"
        >
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Google Profile"
              className="w-7 h-7 rounded-full object-cover border border-base-200 shadow-sm shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 bg-slate-50 border border-base-200 rounded-full flex items-center justify-center shadow-sm shrink-0 text-[10px] font-black text-ink-700 uppercase">
              {userName.slice(0, 1)}
            </div>
          )}
          <span className="text-xs font-bold hidden sm:inline text-slate-900 truncate flex-1 text-left">{userName}</span>
        </button>

        {/* Dropdown Menu (Light theme popover below the dark navbar) */}
        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-52 sm:w-full map-surface py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            </div>

              <button
                onClick={() => {
                  navigate('/profile');
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors text-sm"
              >
                <User className="w-4 h-4 mr-2" />
                Trang cá nhân
              </button>

              <button
                onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
