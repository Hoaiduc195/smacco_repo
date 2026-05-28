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
      <button
        onClick={() => navigate('/app')}
        className="flex items-center gap-3 flex-shrink-0">
        <img src="/favicon.svg" alt="Smacco Logo" className="w-8 h-8 object-contain transition-transform hover:scale-105" />
        <div className="hidden sm:block text-left">
          <p className="text-white font-extrabold text-lg tracking-normal leading-5 font-sans">Smacco</p>
          <p className="text-white/70 text-[10px] uppercase font-bold tracking-wide">Tìm lưu trú bằng AI</p>
        </div>
      </button>

      {/* Search Bar */}
      <div className="flex-1 max-w-md xl:max-w-lg hidden md:flex relative mx-auto" ref={searchContainerRef}>
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500" />
            <input
              type="text"
              placeholder="Tìm homestay yên tĩnh, khách sạn trung tâm..."
              value={localSearchQuery}
              onFocus={() => setShowFilters(true)}
              onChange={(e) => {
                const nextValue = e.target.value;
                setLocalSearchQuery(nextValue);
                onSearchInputChange?.(nextValue);
              }}
              className="w-full h-12 rounded-2xl border border-ink-700 bg-white px-4 pl-10 pr-10 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-900/20 shadow-soft"
            />
            <button
              type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl border transition-colors ${showFilters || placeType || budget || locationInput ? 'text-primary-400 bg-primary-950/70 border-primary-900' : 'text-ink-500 border-transparent hover:text-white hover:bg-ink-700'}`}
            title="Bộ lọc nâng cao"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </form>

        {/* Dropdown Bộ lọc nâng cao (Light theme popover below the dark navbar) */}
        {setLocationInput && (
          <div className={`absolute top-full mt-2 w-full map-surface z-50 p-4 origin-top transition-[transform,opacity] duration-200 ease-out will-change-transform ${showFilters ? 'scale-100 translate-y-0 opacity-100 pointer-events-auto' : 'scale-[0.98] -translate-y-2 opacity-0 pointer-events-none'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 border border-primary-100">
                  <SlidersHorizontal className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-ink-900">Bộ lọc lưu trú</h3>
                  <p className="text-[11px] font-semibold text-ink-500">Tinh chỉnh theo khu vực, loại nơi ở và chi phí</p>
                </div>
              </div>
              {(placeType || budget || locationInput || localSearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalSearchQuery('');
                    if (onClearFilters) onClearFilters();
                  }}
                  className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200"
                >
                  <X className="w-3 h-3" /> Xóa bộ lọc
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Vị trí */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1 text-slate-700">Vị trí / Khu vực</label>
                <div className="relative">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={e => setLocationInput(e.target.value)}
                    placeholder="Nhập tên thành phố, khu vực..."
                    className="input-field h-10 rounded-xl pr-12"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    VN
                  </span>
                </div>
              </div>
              
              {/* Thể loại lưu trú */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-2 text-slate-700">Loại địa điểm (có thể chọn nhiều)</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPlaceType('')}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 border ${!placeType ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-ink-500 border-base-200 hover:bg-base-50'}`}
                  >
                    Tất cả
                  </button>
                  {PLACE_TYPES.filter(opt => opt.value !== '').map((opt) => {
                    const isSelected = placeType.split(',').map(t => t.trim()).includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          const currentTypes = placeType ? placeType.split(',').map(t => t.trim()) : [];
                          let newTypes;
                          if (isSelected) {
                            newTypes = currentTypes.filter(t => t !== opt.value);
                          } else {
                            newTypes = [...currentTypes, opt.value];
                          }
                          setPlaceType(newTypes.join(','));
                        }}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 border ${isSelected ? 'bg-primary-600 text-white border-primary-600 shadow-sm transform scale-[1.02]' : 'bg-white text-ink-500 border-base-200 hover:border-primary-200 hover:bg-primary-50'}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chi phí */}
              <div className="col-span-2 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-semibold text-slate-700">Chi phí dự kiến</label>
                  <span className="text-[10px] font-black text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    {budgetLevel.label}
                  </span>
                </div>
                
                <div className="relative pt-2 pb-4 px-2">
                  <div className="relative h-6 flex items-center">
                    {/* Track Background */}
                    <div className="absolute left-0 right-0 h-2 bg-slate-100 rounded-full shadow-inner border border-slate-200 overflow-hidden pointer-events-none">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-300 ease-out"
                        style={{ width: `${(budgetLevel.slider / 3) * 100}%` }}
                      />
                    </div>

                    {/* Range Input (Invisible but functional) */}
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
                      className="w-full absolute inset-0 z-20 opacity-0 cursor-pointer"
                      aria-label="Chọn mức chi phí"
                    />

                    {/* Custom Thumb */}
                    <div 
                      className="absolute w-6 h-6 bg-white border-[3px] border-primary-500 rounded-full shadow-md transition-all duration-300 ease-out z-10 flex items-center justify-center pointer-events-none"
                      style={{ 
                        left: `calc(${(budgetLevel.slider / 3) * 100}% + ${12 - (budgetLevel.slider / 3) * 24}px)`,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="mt-2 flex justify-between text-[10px] font-semibold relative z-0">
                    {BUDGET_LEVELS.map((level, i) => (
                      <div 
                        key={level.value || 'any'} 
                        className="flex flex-col items-center cursor-pointer px-2"
                        onClick={() => setBudget(level.value)}
                      >
                        <span className={`mt-1 transition-all duration-200 ${budgetLevel.slider === i ? 'text-primary-700 font-bold scale-110' : 'text-ink-500/60 hover:text-ink-700'}`}>
                          {level.label}
                        </span>
                      </div>
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
                  requestAnimationFrame(() => onSearch?.(localSearchQuery));
                }}
                className="btn-primary px-4 py-2 rounded-xl"
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
            <div className="w-7 h-7 bg-slate-50 border border-base-200 rounded-full flex items-center justify-center shadow-sm shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
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
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors text-sm"
              >
                <User className="w-4 h-4" />
                Trang cá nhân
              </button>

              <button
                onClick={() => {
                  navigate('/app');
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors text-sm"
              >
                <MapPin className="w-4 h-4" />
                Quay lại bản đồ
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
