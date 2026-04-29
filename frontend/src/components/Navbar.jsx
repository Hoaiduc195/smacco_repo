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

const RATING_OPTIONS = [
  { value: '', label: 'Tất cả đánh giá' },
  { value: '5', label: '5★ trở lên' },
  { value: '4', label: '4★ trở lên' },
  { value: '3', label: '3★ trở lên' },
  { value: '2', label: '2★ trở lên' },
  { value: '1', label: '1★ trở lên' },
];

export default function Navbar({ 
  onSearch, 
  onSearchInputChange, 
  searchQuery = '', 
  setSearchQuery, 
  className = 'sticky top-0',
  locationInput, setLocationInput,
  placeType, setPlaceType,
  rating, setRating,
  customNote, setCustomNote,
  onClearFilters
}) {
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
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${showFilters || placeType || rating || locationInput || customNote ? 'text-cyan-600 bg-cyan-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              title="Bộ lọc nâng cao"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Dropdown Bộ lọc nâng cao */}
        {showFilters && setLocationInput && (
          <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
                Bộ lọc tìm kiếm
              </h3>
              {(placeType || rating || locationInput || customNote || localSearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalSearchQuery('');
                    if (onClearFilters) onClearFilters();
                  }}
                  className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 px-2 py-1 rounded"
                >
                  <X className="w-3 h-3" /> Xóa bộ lọc
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Vị trí */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700">Vị trí / Khu vực</label>
                <input
                  type="text"
                  value={locationInput}
                  onChange={e => setLocationInput(e.target.value)}
                  placeholder="Nhập tên thành phố, khu vực..."
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-300 outline-none"
                />
              </div>
              
              {/* Thể loại lưu trú */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700">Loại địa điểm</label>
                <select
                  value={placeType}
                  onChange={e => setPlaceType(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-300 outline-none bg-white"
                >
                  {PLACE_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              {/* Rating tổng thể */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700">Đánh giá tối thiểu</label>
                <select
                  value={rating}
                  onChange={e => setRating(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-300 outline-none bg-white"
                >
                  {RATING_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              {/* Ghi chú custom */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700">Yêu cầu đặc biệt</label>
                <input
                  type="text"
                  value={customNote}
                  onChange={e => setCustomNote(e.target.value)}
                  placeholder="Ví dụ: gần biển, có bãi đỗ xe..."
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-300 outline-none"
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowFilters(false);
                  if (onSearch) onSearch(localSearchQuery);
                }}
                className="px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition-colors"
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
