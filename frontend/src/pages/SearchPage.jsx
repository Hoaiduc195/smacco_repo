import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertCircle, MapPin, X, Plus } from 'lucide-react';
import { searchPlaces } from '../services/placeService';
import { useDebounce } from '../hooks/useDebounce';
import { getRouteDetails } from '../services/routingService';
import { useTravelData } from '../contexts/TravelDataContext';
import MapComponent from '../components/MapComponent';
import Navbar from '../components/Navbar';
import PlaceCard from '../components/PlaceCard';

const filterTruthyEntries = (entries) => Object.fromEntries(entries.filter(([, value]) => value !== null && value !== undefined));
const getPlaceKey = (item) => item.id || item.location_id || item.locationId;
const getPlaceLat = (item) => Number(item.lat ?? item.latitude ?? item.location?.lat);
const getPlaceLng = (item) => Number(item.lng ?? item.longitude ?? item.location?.lng);

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [travelTimes, setTravelTimes] = useState({});
  const [tripPickerPlace, setTripPickerPlace] = useState(null);
  const [tripSelectionId, setTripSelectionId] = useState('');
  const [tripName, setTripName] = useState('');
  const [tripActionError, setTripActionError] = useState('');
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const debouncedQuery = useDebounce(query, 500);
  const navigate = useNavigate();
  const { trips, activeTripId, setActiveTripId, createTrip, assignAccommodation } = useTravelData();

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Default to Hanoi if location not available
          setUserLocation({ lat: 21.0285, lng: 105.8542 });
        }
      );
    }
  }, []);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setPlaces([]);
      setError('');
      return;
    }

    if (!userLocation) return;

    const performSearch = async () => {
      setIsLoading(true);
      setError('');
      try {
        const results = await searchPlaces(debouncedQuery, userLocation.lat, userLocation.lng);
        setPlaces(results);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, userLocation]);

  // Calculate travel times for search results
  useEffect(() => {
    if (!userLocation || !places.length) {
      setTravelTimes({});
      return;
    }

    let cancelled = false;

    const loadTravelTimes = async () => {
      const entries = await Promise.all(
        places.map(async (item) => {
          const key = getPlaceKey(item);
          const lat = getPlaceLat(item);
          const lng = getPlaceLng(item);
          if (!key) {
            return [null, null];
          }
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return [key, null];
          }

          try {
            const details = await getRouteDetails(userLocation, { lat, lng });
            const minutes = details.durationSeconds ? Math.max(1, Math.round(details.durationSeconds / 60)) : null;
            return [key, minutes];
          } catch {
            return [key, null];
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
  }, [places, userLocation]);

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
    setIsCreatingTrip(false);
  };

  const buildAccommodationPayload = (place) => {
    const lat = getPlaceLat(place);
    const lng = getPlaceLng(place);
    const placeKey = getPlaceKey(place);
    return {
      location_id: place.location_id || place.locationId || placeKey,
      name: place.name,
      address: place.address,
      rating: place.rating,
      type: place.type || 'accommodation',
      lat,
      lng,
      travelTimeMinutes: travelTimes[placeKey] ?? null,
      source: 'search',
    };
  };

  const handleAttachToTrip = async () => {
    if (!tripPickerPlace || !tripSelectionId) {
      setTripActionError('Vui lòng chọn chuyến đi');
      return;
    }
    try {
      const payload = buildAccommodationPayload(tripPickerPlace);
      await assignAccommodation(tripSelectionId, payload);
      setActiveTripId(tripSelectionId);
      closeTripPicker();
    } catch (err) {
      setTripActionError(err.message || 'Không thể thêm địa điểm vào chuyến đi');
    }
  };

  const handleCreateTrip = async () => {
    if (!tripName.trim()) {
      setTripActionError('Vui lòng nhập tên chuyến đi');
      return;
    }
    try {
      setIsCreatingTrip(true);
      const newTrip = await createTrip({ name: tripName });
      const payload = buildAccommodationPayload(tripPickerPlace);
      await assignAccommodation(newTrip.id, payload);
      setActiveTripId(newTrip.id);
      closeTripPicker();
    } catch (err) {
      setTripActionError(err.message || 'Không thể tạo chuyến đi');
    } finally {
      setIsCreatingTrip(false);
    }
  };

  const displayResults = useMemo(
    () =>
      places.map((item) => {
        const key = getPlaceKey(item);
        return {
        ...item,
        travelTimeMinutes: key ? (travelTimes[key] ?? null) : null,
        lat: item.lat ?? item.latitude ?? item.location?.lat,
        lng: item.lng ?? item.longitude ?? item.location?.lng,
      };
      }),
    [places, travelTimes]
  );

  return (
    <div className="flex flex-col h-screen w-full bg-white">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Search Results */}
        <div className="w-96 flex-shrink-0 border-r border-gray-200 flex flex-col bg-white">
          {/* Search Form */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm chỗ ở..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              {isLoading && (
                <div className="flex items-center px-2">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {displayResults.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {query ? 'Không tìm thấy kết quả' : 'Nhập từ khóa để tìm kiếm'}
              </div>
            ) : (
              displayResults.map((place, index) => (
                <div key={place.id}>
                  <PlaceCard
                    place={place}
                    itemIndex={index}
                    imageUrl={place.imageUrl}
                    travelTimeMinutes={place.travelTimeMinutes}
                    isSelected={selectedPlace?.id === place.id}
                    onSelect={() => setSelectedPlace(place)}
                    onAssignToTrip={() => openTripPicker(place)}
                    tripActionLabel="Thêm vào chuyến đi"
                    showActions={true}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 relative bg-gray-100">
          {userLocation && (
            <MapComponent
              userLocation={userLocation}
              places={places}
              onMarkerClick={(place) => setSelectedPlace(place)}
            />
          )}
        </div>
      </div>

      {/* Trip Picker Modal */}
      {tripPickerPlace ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl transform transition-all animate-soft-in">
            <div className="grid gap-4 p-5 md:grid-cols-[1.1fr_0.9fr]">
              {/* Left: Place preview */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="space-y-3">
                  <div>
                    <img
                      src={tripPickerPlace.imageUrl || 'https://via.placeholder.com/400x250?text=No+Image'}
                      alt={tripPickerPlace.name}
                      className="w-full h-40 rounded-lg object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{tripPickerPlace.name}</h2>
                    <p className="text-sm text-gray-600 mt-1">{tripPickerPlace.address}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span>Loại: {tripPickerPlace.type || 'Chỗ ở'}</span>
                    {tripPickerPlace.rating && <span>⭐ {tripPickerPlace.rating}</span>}
                  </div>
                  {tripPickerPlace.travelTimeMinutes && (
                    <div className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700 font-medium">
                      ⏱️ Thời gian di chuyển: {tripPickerPlace.travelTimeMinutes} phút
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Trip creation + selection */}
              <div className="space-y-3 flex flex-col">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tạo chuyến đi mới:</label>
                  <input
                    type="text"
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    placeholder="Tên chuyến đi..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    onClick={handleCreateTrip}
                    disabled={isCreatingTrip || !tripName.trim()}
                    className="mt-2 w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" /> Tạo chuyến đi
                  </button>
                </div>

                {trips.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Hoặc chọn chuyến đi hiện có:</label>
                    <div className="space-y-2 flex-1 overflow-y-auto max-h-32">
                      {trips.map((trip) => (
                        <button
                          key={trip.id}
                          onClick={() => setTripSelectionId(trip.id)}
                          className={`w-full px-3 py-2 text-sm rounded-lg border text-left transition ${
                            tripSelectionId === trip.id
                              ? 'border-cyan-500 bg-sky-50 text-cyan-900 font-medium'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{trip.name}</span>
                            {activeTripId === trip.id && <span className="text-xs bg-cyan-500 text-white px-2 py-1 rounded">Đang chọn</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {tripActionError && (
                  <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                    {tripActionError}
                  </div>
                )}

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={closeTripPicker}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleAttachToTrip}
                    disabled={!tripSelectionId}
                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Xác nhận
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
