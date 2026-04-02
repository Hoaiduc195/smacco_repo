import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation2, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import PlaceCard from '../components/PlaceCard';
import PlaceChatPanel from '../components/PlaceChatPanel';
import SidebarOverlay from '../components/SidebarOverlay';
import { searchPlaces, getNearbyPlaces, getPlaceReviews, fetchNearbyPois } from '../services/placeService';
import { getRoute } from '../services/routingService';
import { fetchPlaceImage } from '../services/serpService';

const FALLBACK_CENTER = { lat: 21.0285, lng: 105.8542 };
const STORAGE_KEY = 'home_search_state';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [places, setPlaces] = useState([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const mapStyle = 'standard';
  const [route, setRoute] = useState([]);
  const [reviewsByPlace, setReviewsByPlace] = useState({});
  const [imagesByPlace, setImagesByPlace] = useState({});
  const [chatPlace, setChatPlace] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const [isResizing, setIsResizing] = useState(false);
  const [mapInvalidateTick, setMapInvalidateTick] = useState(0);
  const invalidateTimerRef = useRef(null);
  const [pois, setPois] = useState([]);
  const [isPoisLoading, setIsPoisLoading] = useState(false);
  const lastPoiKeyRef = useRef('');
  const rehydratedRef = useRef(false);
  const navigate = useNavigate();

  const visiblePlaces = useMemo(() => places.map((p) => ({
    ...p,
    type: p.type || 'hotel',
  })), [places]);

  useEffect(() => {
    if (invalidateTimerRef.current) clearTimeout(invalidateTimerRef.current);
    invalidateTimerRef.current = setTimeout(() => {
      setMapInvalidateTick((tick) => tick + 1);
    }, isResizing ? 60 : 140);
    return () => {
      if (invalidateTimerRef.current) clearTimeout(invalidateTimerRef.current);
    };
  }, [sidebarWidth, isSidebarOpen, isResizing]);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (saved.searchQuery) setSearchQuery(saved.searchQuery);
      if (Array.isArray(saved.places)) setPlaces(saved.places);
      if (saved.userLocation) setUserLocation(saved.userLocation);
      rehydratedRef.current = true;
    } catch (err) {
      console.warn('Unable to restore search state', err);
    }
  }, []);

  const loadPois = useCallback(
    async (centerPoint) => {
      if (!centerPoint?.lat || !centerPoint?.lng) return;
      const key = `${centerPoint.lat.toFixed(3)}:${centerPoint.lng.toFixed(3)}`;
      if (key === lastPoiKeyRef.current && pois.length) return;
      try {
        setIsPoisLoading(true);
        const fetchedPois = await fetchNearbyPois(centerPoint.lat, centerPoint.lng, 1700);
        setPois(fetchedPois);
        lastPoiKeyRef.current = key;
      } catch (err) {
        console.error('POI fetch error:', err);
      } finally {
        setIsPoisLoading(false);
      }
    },
    [pois.length]
  );

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị');
      return;
    }

    setLocationStatus('loading');
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(newLocation);
        setLocationStatus('success');
        loadNearbyPlaces(newLocation);
      },
      (error) => {
        setLocationStatus('error');
        setError('Không thể lấy vị trí. Vui lòng cho phép truy cập vị trị trong trình duyệt.');
        console.error('Geolocation error:', error);
      }
    );
  };

  // Load nearby places
  const loadNearbyPlaces = async (location) => {
    try {
      setIsSearching(true);
      const nearbyPlaces = await getNearbyPlaces(location.lat, location.lng);
      setPlaces(nearbyPlaces);
      setError('');
      setSelectedPlaceId(null);
      setRoute([]);
    } catch (err) {
      setError(err.message);
      console.error('Error loading nearby places:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setPlaces([]);
      setError('');
      return;
    }

    try {
      setIsSearching(true);
      setError('');
      const searchResults = await searchPlaces(query, userLocation?.lat, userLocation?.lng);
      setPlaces(searchResults);
      setSelectedPlaceId(null);
      setRoute([]);
    } catch (err) {
      setError(err.message);
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search submission from navbar
  useEffect(() => {
    if (rehydratedRef.current) {
      rehydratedRef.current = false;
      return;
    }
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      setPlaces([]);
      setError('');
    }
  }, [searchQuery]);

  useEffect(() => {
    const payload = { searchQuery, places, userLocation };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [searchQuery, places, userLocation]);

  useEffect(() => {
    const anchor =
      userLocation ||
      visiblePlaces.find((p) => p.lat && p.lng) ||
      FALLBACK_CENTER;
    loadPois(anchor);
  }, [loadPois, userLocation, visiblePlaces]);

  // Handle marker click - navigate to place detail
  const handleMarkerClick = (place) => {
    setSelectedPlaceId(place.id);
    navigate(`/places/${place.id}`, { state: { place } });
  };

  const handleSelectPlace = (place) => {
    setSelectedPlaceId(place.id);
  };

  const handleChat = (place) => {
    setChatPlace(place);
  };

  const handleDirections = async (place) => {
    try {
      setError('');
      setRoute([]);
      const origin = await new Promise((resolve, reject) => {
        if (userLocation) return resolve(userLocation);
        if (!navigator.geolocation) return reject(new Error('Trình duyệt không hỗ trợ định vị'));
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => reject(err)
        );
      });
      setUserLocation(origin);
      const routeCoords = await getRoute(origin, { lat: place.lat, lng: place.lng });
      setRoute(routeCoords);
      setSelectedPlaceId(place.id);
    } catch (err) {
      setError(err.message || 'Không thể lấy chỉ đường');
    }
  };

  const hydrateReviewsAndImages = async (list) => {
    const limited = list.slice(0, 10);
    const promises = limited.map(async (p) => {
      if (!reviewsByPlace[p.id]) {
        const reviews = await getPlaceReviews(p.id).catch(() => []);
        setReviewsByPlace((prev) => ({ ...prev, [p.id]: reviews }));
      }
      if (!imagesByPlace[p.id]) {
        const img = await fetchPlaceImage(p.name, p.address).catch(() => null);
        if (img) setImagesByPlace((prev) => ({ ...prev, [p.id]: img }));
      }
    });
    await Promise.all(promises);
  };

  useEffect(() => {
    if (places.length) hydrateReviewsAndImages(places);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places]);

  return (
    <div className="flex flex-col h-screen w-full bg-white">
      {/* Navbar */}
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Main Content */}
      <div className="flex-1 relative bg-gray-100 overflow-hidden">
        {/* Map layer */}
        <MapComponent
          userLocation={userLocation}
          places={visiblePlaces}
          onMarkerClick={handleMarkerClick}
          selectedPlaceId={selectedPlaceId}
          route={route}
          mapStyle={mapStyle}
          pois={pois}
          invalidateKey={mapInvalidateTick}
        />

        {/* Sidebar overlay */}
        <SidebarOverlay
          isOpen={isSidebarOpen}
          width={sidebarWidth}
          minWidth={320}
          maxWidth={560}
          onToggle={setIsSidebarOpen}
          onWidthChange={setSidebarWidth}
          onResizeStateChange={setIsResizing}
          header={(
            <div>
              <div className="text-sm text-gray-500">Kết quả tìm kiếm</div>
              <div className="text-lg font-semibold text-gray-900">{visiblePlaces.length} địa điểm</div>
            </div>
          )}
        >
          {!visiblePlaces.length && !isSearching ? (
            <div className="text-sm text-gray-500">Nhập từ khóa ở thanh tìm kiếm để bắt đầu.</div>
          ) : null}
          <div className="space-y-3">
            {visiblePlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                imageUrl={imagesByPlace[place.id]}
                reviews={reviewsByPlace[place.id]}
                isSelected={selectedPlaceId === place.id}
                onSelect={() => handleSelectPlace(place)}
                onNavigate={() => handleMarkerClick(place)}
                onChat={() => handleChat(place)}
                onDirections={() => handleDirections(place)}
              />
            ))}
          </div>
        </SidebarOverlay>

        {/* Error Message */}
        {error && (
          <div className="absolute top-4 right-4 z-20 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 max-w-sm shadow-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-700 hover:text-red-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick Location Button + Style toggle */}
        <div
          className="absolute bottom-4 z-10 flex flex-col gap-2"
          style={{ left: `${isSidebarOpen ? sidebarWidth + 28 : 16}px` }}
        >
          <button
            onClick={getCurrentLocation}
            disabled={locationStatus === 'loading'}
            title={locationStatus === 'loading' ? 'Đang tìm vị trí...' : 'Lấy vị trí của tôi'}
            className="p-3 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Navigation2 className={`w-5 h-5 ${locationStatus === 'loading' ? 'animate-spin' : ''}`} />
          </button>
          {isPoisLoading && (
            <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm text-gray-700 shadow">
              Đang tải POI...
            </div>
          )}
        </div>

        {/* Loading Indicator */}
        {isSearching && (
          <div className="absolute bottom-4 left-4 z-20 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">Đang tải...</span>
          </div>
        )}

        {chatPlace ? <PlaceChatPanel place={chatPlace} onClose={() => setChatPlace(null)} /> : null}
      </div>
    </div>
  );
}
