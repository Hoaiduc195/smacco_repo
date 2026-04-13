import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Sparkles, X, Plus } from 'lucide-react';
import Navbar from '../components/Navbar';
import PlaceCard from '../components/PlaceCard';
import { useTravelData } from '../contexts/TravelDataContext';
import { getRecommendations } from '../services/recommendationService';
import { getRouteDetails } from '../services/routingService';

const PLACE_TYPES = [
  { value: '', label: 'Tất cả loại lưu trú' },
  { value: 'hotel', label: 'Khách sạn' },
  { value: 'hostel', label: 'Nhà nghỉ tập thể' },
  { value: 'homestay', label: 'Nhà ở bản địa' },
  { value: 'resort', label: 'Resort' },
  { value: 'apartment', label: 'Căn hộ dịch vụ' },
];

const BUDGET_OPTIONS = [
  { value: '', label: 'Không chọn' },
  { value: 'budget', label: 'Tiết kiệm' },
  { value: 'midrange', label: 'Trung bình' },
  { value: 'premium', label: 'Cao cấp' },
];

const RADIUS_OPTIONS = [
  { value: '', label: 'Mặc định' },
  { value: 2, label: '2 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
  { value: 30, label: '30 km' },
];

const PLACE_TYPE_LABELS = {
  hotel: 'Khách sạn',
  hostel: 'Nhà nghỉ tập thể',
  homestay: 'Nhà ở bản địa',
  resort: 'Resort',
  apartment: 'Căn hộ dịch vụ',
  cafe: 'Cafe',
  restaurant: 'Nhà hàng',
};

const filterTruthyEntries = (entries) => Object.fromEntries(entries.filter(([, value]) => value !== null && value !== undefined));

const formatPlaceType = (value) => {
  if (!value) return 'Địa điểm';
  return PLACE_TYPE_LABELS[value] || value.replace(/_/g, ' ');
};

export default function RecommendationPage() {
  const [placeType, setPlaceType] = useState('');
  const [budget, setBudget] = useState('');
  const [radius, setRadius] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [travelTimes, setTravelTimes] = useState({});
  const [tripPickerPlace, setTripPickerPlace] = useState(null);
  const [tripSelectionId, setTripSelectionId] = useState('');
  const [tripName, setTripName] = useState('');
  const [tripActionError, setTripActionError] = useState('');
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const navigate = useNavigate();
  const { trips, activeTripId, setActiveTripId, createTrip, assignAccommodation } = useTravelData();

  const requestCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ lấy vị trí hiện tại.');
      setLocating(false);
      return;
    }

    setError('');
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocating(false);
      },
      () => {
        setError('Không lấy được vị trí hiện tại. Vui lòng cho phép quyền vị trí để nhận gợi ý quanh bạn.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    requestCurrentLocation();
  }, [requestCurrentLocation]);

  useEffect(() => {
    if (!userLocation) {
      setResults([]);
      return;
    }

    let cancelled = false;

    const loadRecommendations = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getRecommendations({
          location: `${userLocation.lat},${userLocation.lng}`,
          type: placeType || undefined,
          budget: budget || undefined,
          radius: radius || undefined,
        });
        if (!cancelled) {
          setResults(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Không thể lấy gợi ý.');
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [userLocation, placeType, budget, radius]);

  useEffect(() => {
    if (!userLocation || !results.length) {
      setTravelTimes({});
      return;
    }

    let cancelled = false;

    const loadTravelTimes = async () => {
      const entries = await Promise.all(
        results.map(async (item) => {
          const lat = Number(item.lat ?? item.latitude);
          const lng = Number(item.lng ?? item.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return [item.location_id, null];
          }

          try {
            const details = await getRouteDetails(userLocation, { lat, lng });
            const minutes = details.durationSeconds ? Math.max(1, Math.round(details.durationSeconds / 60)) : null;
            return [item.location_id, minutes];
          } catch {
            return [item.location_id, null];
          }
        })
      );

      if (!cancelled) {
        setTravelTimes(filterTruthyEntries(entries));
      }
    };

    loadTravelTimes();

    return () => {
      cancelled = true;
    };
  }, [results, userLocation]);

  const displayResults = useMemo(
    () =>
      results.map((item) => ({
        ...item,
        travelTimeMinutes: travelTimes[item.location_id] ?? null,
        lat: item.lat ?? item.latitude,
        lng: item.lng ?? item.longitude,
      })),
    [results, travelTimes]
  );

  useEffect(() => {
    if (!tripPickerPlace) return;
    setTripSelectionId(activeTripId || trips[0]?.id || '');
    setTripName(`Chuyến đi tới ${tripPickerPlace.name || 'địa điểm này'}`);
  }, [activeTripId, trips, tripPickerPlace]);

  const openTripPicker = (place) => {
    setTripActionError('');
    setTripPickerPlace(place);
  };

  const closeTripPicker = () => {
    setTripPickerPlace(null);
    setTripSelectionId('');
    setTripName('');
    setTripActionError('');
  };

  const buildAccommodationPayload = (place) => ({
    location_id: place.location_id,
    name: place.name,
    address: place.address,
    rating: place.rating,
    type: place.type,
    lat: place.lat,
    lng: place.lng,
    score: place.score,
    travelTimeMinutes: place.travelTimeMinutes,
    source: 'recommendation',
  });

  const handleAttachToTrip = async () => {
    if (!tripPickerPlace) return;
    const accommodation = buildAccommodationPayload(tripPickerPlace);

    try {
      setTripActionError('');
      if (!tripSelectionId) {
        setTripActionError('Vui lòng chọn hoặc tạo một chuyến đi trước.');
        return;
      }

      await assignAccommodation(tripSelectionId, accommodation);
      setActiveTripId(tripSelectionId);
      closeTripPicker();
    } catch (err) {
      setTripActionError(err.message || 'Không thể thêm địa điểm vào chuyến đi.');
    }
  };

  const handleCreateTrip = async () => {
    if (!tripPickerPlace) return;
    try {
      setIsCreatingTrip(true);
      setTripActionError('');
      const created = await createTrip({
        name: tripName.trim() || `Chuyến đi tới ${tripPickerPlace.name || 'địa điểm này'}`,
        destination: tripPickerPlace.address || tripPickerPlace.name || '',
      });
      if (created?.id) {
        await assignAccommodation(created.id, buildAccommodationPayload(tripPickerPlace));
        setActiveTripId(created.id);
        setTripSelectionId(created.id);
        closeTripPicker();
      }
    } catch (err) {
      setTripActionError(err.message || 'Không thể tạo chuyến đi.');
    } finally {
      setIsCreatingTrip(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <Navbar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Gợi ý chỗ ở quanh bạn</h2>
              <p className="text-sm text-gray-500">Tự động dùng vị trí hiện tại của bạn để lấy kết quả mặc định.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Thoát
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Loại lưu trú
              </label>
              <select
                value={placeType}
                onChange={(e) => setPlaceType(e.target.value)}
                className="h-12 w-full border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                className="h-12 w-full border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {BUDGET_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">Bán kính tìm kiếm</label>
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="h-12 w-full border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {RADIUS_OPTIONS.map((item) => (
                  <option key={item.label} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={requestCurrentLocation}
              disabled={locating}
              className="h-12 px-4 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center"
            >
              Gợi ý
            </button>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 flex items-center justify-center gap-3 text-slate-600 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
              <span>Đang lấy gợi ý quanh vị trí của bạn...</span>
            </div>
          ) : null}

          {!loading && displayResults.length === 0 ? (
            <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-gray-500 gap-2 rounded-2xl border border-dashed border-gray-200 bg-gray-50/70">
              <Sparkles className="w-6 h-6" />
              <p>Chưa có kết quả phù hợp từ vị trí hiện tại.</p>
            </div>
          ) : null}

          {displayResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayResults.map((item) => (
                <PlaceCard
                  key={item.location_id}
                  place={item}
                  imageUrl={null}
                  travelTimeMinutes={item.travelTimeMinutes}
                  showActions
                  onAssignToTrip={() => openTripPicker(item)}
                  tripActionLabel="Thêm vào chuyến đi"
                  onChat={null}
                  onDirections={null}
                  onNavigate={null}
                  onSelect={() => {}}
                  onSave={null}
                  isSaved={false}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {tripPickerPlace ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden transform transition-all duration-200 ease-out animate-soft-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-gradient-to-r from-white to-sky-50">
              <div>
                <p className="text-lg font-semibold text-slate-900">Thêm vào chuyến đi</p>
                <p className="text-sm text-slate-500">Chọn chuyến đi đã có hoặc tạo chuyến đi mới.</p>
              </div>
              <button type="button" onClick={closeTripPicker} className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-sky-100 flex items-center justify-center font-semibold text-sky-700">
                    {tripPickerPlace.name?.charAt(0)?.toUpperCase() || 'P'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-slate-900 truncate">{tripPickerPlace.name}</h3>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-3">{tripPickerPlace.address || 'Không có địa chỉ'}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                      <span className="rounded-lg border border-cyan-100 bg-cyan-50 px-2 py-1 text-cyan-700">{formatPlaceType(tripPickerPlace.type)}</span>
                      {tripPickerPlace.travelTimeMinutes ? (
                        <span className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-emerald-700">
                          {tripPickerPlace.travelTimeMinutes} phút từ vị trí của bạn
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Tên chuyến đi mới</label>
                  <input
                    type="text"
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    placeholder="Ví dụ: Kỳ nghỉ Hà Nội"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                  <button
                    type="button"
                    onClick={handleCreateTrip}
                    disabled={isCreatingTrip}
                    className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    {isCreatingTrip ? 'Đang tạo...' : 'Tạo chuyến đi'}
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="mb-3 text-sm font-semibold text-slate-800">Chuyến đi đã tạo</p>
                  <div className="max-h-60 space-y-2 overflow-auto pr-1">
                    {trips.length ? trips.map((trip) => (
                      <button
                        key={trip.id}
                        type="button"
                        onClick={() => setTripSelectionId(trip.id)}
                        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                          tripSelectionId === trip.id
                            ? 'border-sky-300 bg-sky-50'
                            : 'border-slate-200 hover:border-sky-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{trip.name || 'Chuyến đi'}</p>
                            <p className="truncate text-xs text-slate-500">{trip.destination || 'Chưa có điểm đến'}</p>
                          </div>
                          {activeTripId === trip.id ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">Đang chọn</span> : null}
                        </div>
                      </button>
                    )) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                        Chưa có chuyến đi nào. Hãy tạo chuyến đi mới ở trên.
                      </div>
                    )}
                  </div>
                </div>

                {tripActionError ? <p className="text-sm text-rose-600">{tripActionError}</p> : null}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeTripPicker}
                    className="h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleAttachToTrip}
                    disabled={!tripSelectionId}
                    className="h-11 flex-1 rounded-xl bg-sky-600 px-4 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                  >
                    Thêm vào chuyến đi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

