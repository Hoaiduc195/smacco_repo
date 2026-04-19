import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, AlertCircle } from 'lucide-react';
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
  const debouncedQuery = useDebounce(query, 500);
  const { 
    checkIns, 
    saveCheckIn, 
    removeCheckIn, 
    ownedPlaces,
    saveOwnedPlace,
    removeOwnedPlace,
    error: travelError 
  } = useTravelData();

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
    if (travelError) {
      setError(travelError);
    }
  }, [travelError]);

  const checkInsByPlaceId = useMemo(() => {
    const map = {};
    checkIns.forEach((ci) => {
      map[ci.placeId] = ci;
    });
    return map;
  }, [checkIns]);

  const ownedPlacesByPlaceId = useMemo(() => {
    const map = {};
    ownedPlaces.forEach((op) => {
      if (op.sourcePlaceId) map[op.sourcePlaceId] = op;
    });
    return map;
  }, [ownedPlaces]);

  const handleToggleCheckIn = useCallback(async (place) => {
    try {
      const existing = checkInsByPlaceId[place.id];
      if (existing) {
        await removeCheckIn(existing.id);
      } else {
        await saveCheckIn(place);
      }
    } catch (err) {
      console.error('Check-in toggle error:', err);
    }
  }, [checkInsByPlaceId, removeCheckIn, saveCheckIn]);

  const handleToggleSave = useCallback(async (place) => {
    try {
      const existing = ownedPlacesByPlaceId[place.id];
      if (existing) {
        await removeOwnedPlace(existing.id);
      } else {
        await saveOwnedPlace(place);
      }
    } catch (err) {
      console.error('Save toggle error:', err);
    }
  }, [ownedPlacesByPlaceId, removeOwnedPlace, saveOwnedPlace]);

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
                  placeholder="Tìm địa điểm..."
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
                    onNavigate={() => window.open(`/places/${place.id}`, '_blank')}
                    onSave={() => handleToggleSave(place)}
                    isSaved={Boolean(ownedPlacesByPlaceId[place.id])}
                    onCheckIn={() => handleToggleCheckIn(place)}
                    isCheckedIn={Boolean(checkInsByPlaceId[place.id])}
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
    </div>
  );
}
