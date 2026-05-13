import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, User, LogOut, SlidersHorizontal, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PLACE_TYPES = [
  { value: '', label: 'Tất cả loại lưu trú' },
  { value: 'hotel', label: 'Khách sạn' },
  { value: 'hostel', label: 'Nhà nghỉ' },
  { value: 'homestay', label: 'Homestay' },
  { value: 'apartment', label: 'Căn hộ' },
  { value: 'resort', label: 'Resort' },
  { value: 'villa', label: 'Villa' },
  { value: 'guesthouse', label: 'Nhà khách' },
  { value: 'motel', label: 'Motel' },
  { value: 'camping', label: 'Camping' },
];

const BUDGET_LEVELS = [
  { value: '', label: 'Không giới hạn', slider: 0 },
  { value: 'low', label: 'Tiết kiệm', slider: 1 },
  { value: 'mid', label: 'Tầm trung', slider: 2 },
  { value: 'high', label: 'Cao cấp', slider: 3 },
];

export default function Navbar({ 
  onSearch, 
  onSearchInputChange, 
  searchQuery = '', 
  setSearchQuery, 
  className = 'sticky top-0',
  locationInput, setLocationInput,
  placeType, setPlaceType,
  budget, setBudget,
  onClearFilters
}) {
  const budgetLevel = BUDGET_LEVELS.find((level) => level.value === budget) || BUDGET_LEVELS[0];
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      <div className="flex-1 max-w-2xl hidden md:flex relative md:ml-12 lg:ml-32" ref={searchContainerRef}>
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm nhà hàng, quán cà phê..."
              value={localSearchQuery}
              onFocus={() => setShowFilters(true)}
              onChange={(e) => {
                const nextValue = e.target.value;
                setLocalSearchQuery(nextValue);
                onSearchInputChange?.(nextValue);
              }}
              className="w-full pl-10 pr-10 py-3 border border-white/10 bg-white/95 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300 text-slate-900"
            />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${showFilters || placeType || budget || locationInput ? 'text-cyan-600 bg-cyan-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              title="Bộ lọc nâng cao"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Dropdown Bộ lọc nâng cao */}
        {showFilters && setLocationInput && (
          <div className="absolute top-full mt-2 w-full rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.6)] z-50 p-4 backdrop-blur animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
                  <SlidersHorizontal className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Bộ lọc tìm kiếm</h3>
                  <p className="text-[11px] text-slate-500">Tinh chỉnh nhanh theo khu vực, loại và chi phí</p>
                </div>
              </div>
              {(placeType || budget || locationInput || localSearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalSearchQuery('');
                    if (onClearFilters) onClearFilters();
                  }}
                  className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200"
                >
                  <X className="w-3 h-3" /> Xóa bộ lọc
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Vị trí */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700">Vị trí / Khu vực</label>
                <div className="relative">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={e => setLocationInput(e.target.value)}
                    placeholder="Nhập tên thành phố, khu vực..."
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-300 outline-none bg-white"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    VN
                  </span>
                </div>
              </div>
              
              {/* Thể loại lưu trú */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700">Loại địa điểm</label>
                <select
                  value={placeType}
                  onChange={e => setPlaceType(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-300 outline-none bg-white"
                >
                  {PLACE_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              {/* Chi phí */}
              <div className="col-span-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold mb-1 text-slate-700">Chi phí dự kiến</label>
                  <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2.5 py-0.5 rounded-full">
                    {budgetLevel.label}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-cyan-50/40 px-3 py-3">
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    value={budgetLevel.slider}
                    onChange={(e) => {
                      const nextLevel = BUDGET_LEVELS.find((level) => level.slider === Number(e.target.value)) || BUDGET_LEVELS[0];
                      setBudget(nextLevel.value);
                    }}
                    className="w-full accent-cyan-600"
                    aria-label="Chọn mức chi phí"
                  />
                  <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                    {BUDGET_LEVELS.map((level) => (
                      <span key={level.value || 'any'}>{level.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <p className="text-[11px] text-slate-500">Nhấn Enter để tìm nhanh hoặc áp dụng ngay.</p>
              <button
                type="button"
                onClick={() => {
                  setShowFilters(false);
                  if (onSearch) onSearch(localSearchQuery);
                }}
                className="px-4 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
              >
                Áp dụng bộ lọc
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
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
              onClick={() => {
                navigate('/profile');
                setShowUserMenu(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors text-sm"
            >
              <User className="w-4 h-4" />
              Trang cá nhân
            </button>

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
