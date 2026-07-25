import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Search, User } from 'lucide-react';
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
    <nav className={`h-16 border-b border-white/10 bg-ink-950/95 flex items-center px-3 sm:px-5 gap-2 sm:gap-5 z-40 shadow-card backdrop-blur-xl ${className}`} aria-label="Điều hướng ứng dụng">
      {/* Logo */}
      <Link
        to="/"
        className="flex min-h-11 items-center gap-3 flex-shrink-0 rounded-lg">
        <img src="/favicon.svg" alt="Smacco Logo" className="w-8 h-8 object-contain transition-transform hover:scale-105" />
        <div className="hidden sm:block text-left">
          <p className="text-white font-extrabold text-lg tracking-normal leading-5 font-sans">Smacco</p>
          <p className="text-white/70 text-[10px] uppercase font-bold tracking-wide">Tìm lưu trú bằng AI</p>
        </div>
      </Link>

      {/* Search Bar */}
      <div className="relative mx-auto flex min-w-0 flex-1 md:max-w-xl">
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" aria-hidden="true" />
            <label htmlFor="workspace-search" className="sr-only">Tìm kiếm địa điểm hoặc lịch trình</label>
            <input
              id="workspace-search"
              type="text"
              placeholder="Tìm homestay, khách sạn hoặc lịch trình..."
              value={localSearchQuery}
              onChange={(e) => {
                const nextValue = e.target.value;
                setLocalSearchQuery(nextValue);
                onSearchInputChange?.(nextValue);
              }}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/95 px-3 pl-10 text-xs font-medium text-ink-900 shadow-soft outline-none transition duration-200 placeholder:text-ink-500 focus:border-primary-400 focus:ring-4 focus:ring-primary-500/20"
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
          type="button"
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex h-11 w-11 flex-shrink-0 cursor-pointer select-none items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-2 text-white shadow-soft transition duration-200 hover:bg-white/15 sm:w-48"
          aria-label="Mở menu tài khoản"
          aria-expanded={showUserMenu}
          aria-controls="account-menu"
        >
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Google Profile"
              className="h-7 w-7 shrink-0 rounded-lg border border-white/20 object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white text-[10px] font-black uppercase text-ink-900 shadow-sm">
              {userName.slice(0, 1)}
            </div>
          )}
          <span className="hidden flex-1 truncate text-left text-xs font-bold text-white sm:inline">{userName}</span>
          <ChevronDown className={`hidden h-3.5 w-3.5 text-white/60 transition sm:block ${showUserMenu ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {/* Dropdown Menu (Light theme popover below the dark navbar) */}
        {showUserMenu && (
          <div id="account-menu" role="group" aria-label="Tài khoản" className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-base-200 bg-white py-2 shadow-card">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            </div>

              <button
                type="button"
                onClick={() => {
                  navigate('/profile');
                  setShowUserMenu(false);
                }}
                className="flex min-h-11 w-full cursor-pointer items-center px-4 py-2 text-left text-sm text-ink-700 transition hover:bg-primary-50 hover:text-primary-700"
              >
                <User className="w-4 h-4 mr-2" />
                Trang cá nhân
              </button>

              <button
                type="button"
                onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex min-h-11 w-full cursor-pointer items-center px-4 py-2 text-left text-sm text-ink-700 transition hover:bg-base-100 disabled:cursor-not-allowed disabled:opacity-50"
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
