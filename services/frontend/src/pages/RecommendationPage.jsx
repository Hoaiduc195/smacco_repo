import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Compass, MapPin, Sparkles, LocateFixed } from 'lucide-react';
import Navbar from '../components/Navbar';
import RecommendationMap from '../components/RecommendationMap';
import { getRecommendations } from '../services/recommendationService';

const PLACE_TYPES = [
  { value: '', label: 'Tất cả loại lưu trú' },
  { value: 'hotel', label: 'Khách sạn' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'homestay', label: 'Homestay' },
  { value: 'resort', label: 'Resort' },
  { value: 'apartment', label: 'Căn hộ dịch vụ' },
];

const BUDGET_OPTIONS = [
  { value: '', label: 'Không chọn' },
  { value: 'budget', label: 'Tiết kiệm' },
  { value: 'midrange', label: 'Trung bình' },
  { value: 'premium', label: 'Cao cấp' },
];

export default function RecommendationPage() {
  const [location, setLocation] = useState('');
  const [placeType, setPlaceType] = useState('');
  const [budget, setBudget] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();

  const parseLocationString = (value) => {
    if (!value) return null;
    const parts = value.split(',').map((v) => parseFloat(v.trim()));
    if (parts.length === 2 && parts.every((v) => Number.isFinite(v))) {
      return { lat: parts[0], lng: parts[1] };
    }
    return null;
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ lấy vị trí hiện tại.');
      return;
    }
    setError('');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation(`${latitude.toFixed(6)},${longitude.toFixed(6)}`);
        setUserLocation({ lat: latitude, lng: longitude });
        setLocating(false);
      },
      () => {
        setError('Không lấy được vị trí hiện tại.');
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await getRecommendations({
        location: location.trim(),
        type: placeType || undefined,
        budget: budget || undefined,
      });
      const locObj = parseLocationString(location.trim());
      if (locObj) setUserLocation(locObj);
      setResults(data);
    } catch (err) {
      setError(err.message || 'Không thể lấy gợi ý.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <Navbar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Gợi ý chỗ ở</h2>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Thoát
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm text-gray-600 flex items-center gap-2">
                <Compass className="w-4 h-4" /> Khu vực (địa chỉ/tọa độ)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="VD: Hà Nội, 10.7626,106.6602"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className="inline-flex items-center justify-start gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60 w-fit"
                title="Lấy vị trí hiện tại"
              >
                <LocateFixed className="w-4 h-4" />
                {locating ? 'Đang lấy vị trí...' : 'Gần tôi'}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Loại lưu trú
              </label>
              <select
                value={placeType}
                onChange={(e) => setPlaceType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PLACE_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">Ngân sách</label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {BUDGET_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-[42px] md:h-[46px] px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang lấy gợi ý...' : 'Lấy gợi ý'}
            </button>
          </form>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          <RecommendationMap
            places={results.map((item) => ({
              ...item,
              lat: item.lat ?? item.latitude,
              lng: item.lng ?? item.longitude,
            }))}
            userLocation={userLocation}
          />

          {results.length === 0 && !loading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2">
              <Sparkles className="w-6 h-6" />
              <p>Nhập khu vực/loại để lấy gợi ý phù hợp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((item) => (
                <div
                  key={item.location_id}
                  className="border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-semibold">
                      {item.name?.charAt(0)?.toUpperCase() || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate" title={item.name}>{item.name}</h3>
                      {item.address && (
                        <div className="mt-1 text-sm text-gray-600 flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2" title={item.address}>{item.address}</span>
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-sm text-gray-700">
                        {item.rating !== undefined && (
                          <span className="px-2 py-1 bg-yellow-50 text-yellow-800 rounded-lg text-xs font-medium">
                            Rating: {item.rating?.toFixed(1) ?? '—'}
                          </span>
                        )}
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                          Score: {item.score?.toFixed(2) ?? '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
