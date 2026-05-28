import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navigation2, AlertCircle, X, Route, Star, MessageSquare, ArrowLeft, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import PlaceCard from '../components/PlaceCard';
import PlaceChatPanel from '../components/PlaceChatPanel';
import SidebarOverlay from '../components/SidebarOverlay';
import { searchPlaces, getPlaceReviews, fetchNearbyPois } from '../services/placeService';
// import { getRecommendations } from '../services/recommendationService';
import { getRoute } from '../services/routingService';
import { fetchPlaceImage } from '../services/serpService';
import { useTravelData } from '../contexts/TravelDataContext';

const FALLBACK_CENTER = { lat: 21.0285, lng: 105.8542 };
const CURRENT_LOCATION_ZOOM = 18;
const STORAGE_KEY = 'home_search_state';
const APP_STATES = {
  IDLE: 'idle',
  ON_SEARCH: 'onSearch',
  FOCUS_CURRENT: 'focusOnCurrentPosition',
  ROUTING: 'routing',
};
const NAVBAR_HEIGHT = 64;

export default function HomePage() {
  const {
    ownedPlaces,
    checkIns,
    saveOwnedPlace,
    removeOwnedPlace,
    saveCheckIn,
    removeCheckIn,
    error: travelError,
  } = useTravelData();
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [places, setPlaces] = useState([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [mapFocusTarget, setMapFocusTarget] = useState(null);
  const [followUserLocation, setFollowUserLocation] = useState(false);
  const [disableAutoFit, setDisableAutoFit] = useState(false);
  const [route, setRoute] = useState([]);
  const [reviewsByPlace, setReviewsByPlace] = useState({});
  const [imagesByPlace, setImagesByPlace] = useState({});
  const [chatPlace, setChatPlace] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPlaceDetailPanel, setShowPlaceDetailPanel] = useState(false);
  const [appState, setAppState] = useState(APP_STATES.IDLE);
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const [isResizing, setIsResizing] = useState(false);
  const [budget, setBudget] = useState('');
  const [mapInvalidateTick, setMapInvalidateTick] = useState(0);
  const invalidateTimerRef = useRef(null);
  const [pois, setPois] = useState([]);
  const [isPoisLoading, setIsPoisLoading] = useState(false);
  const lastPoiKeyRef = useRef('');
  const userLocationWatchIdRef = useRef(null);
  const rehydratedRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [locationInput, setLocationInput] = useState('');
  const [placeType, setPlaceType] = useState('');
  const normalizeBudget = useCallback((value) => {
    if (!value) return '';
    const normalized = String(value).toLowerCase();
    if (['low', 'cheap', 'budget', 'rẻ', 'bình dân'].includes(normalized)) return 'low';
    if (['mid', 'medium', 'midrange', 'mid-range', 'vừa', 'trung bình'].includes(normalized)) return 'mid';
    if (['high', 'expensive', 'luxury', 'premium', 'sang trọng', 'cao cấp'].includes(normalized)) return 'high';
    return '';
  }, []);

  useEffect(() => {
    const syncMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    syncMobile();
    window.addEventListener('resize', syncMobile);
    return () => window.removeEventListener('resize', syncMobile);
  }, []);

  useEffect(() => {
    // Always start with a collapsed sidebar on Home.
    setIsSidebarOpen(false);
    setAppState(APP_STATES.IDLE);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarWidth(340);
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  const focusMapAt = useCallback((point, zoom = 15, options = {}) => {
    if (!point?.lat || !point?.lng) return;
    setDisableAutoFit(true);
    setMapFocusTarget({
      id: `${Date.now()}-${point.lat}-${point.lng}`,
      lat: Number(point.lat),
      lng: Number(point.lng),
      zoom,
      ...options,
    });
  }, []);

  const stopTrackingUserLocation = useCallback(() => {
    if (userLocationWatchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(userLocationWatchIdRef.current);
      userLocationWatchIdRef.current = null;
    }
  }, []);

  const transitionTo = useCallback(
    (nextState) => {
      setAppState(nextState);
      if (nextState === APP_STATES.IDLE) {
        setIsSidebarOpen(false);
        setFollowUserLocation(false);
        stopTrackingUserLocation();
      }
      if (nextState === APP_STATES.ON_SEARCH) {
        setIsSidebarOpen(true);
        setFollowUserLocation(false);
        stopTrackingUserLocation();
      }
      if (nextState === APP_STATES.FOCUS_CURRENT) {
        setIsSidebarOpen(false);
      }
      if (nextState === APP_STATES.ROUTING) {
        setIsSidebarOpen(false);
      }
    },
    [stopTrackingUserLocation]
  );

  const startTrackingUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị');
      return;
    }
    if (userLocationWatchIdRef.current !== null) return;

    userLocationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(nextLocation);
        focusMapAt(nextLocation, CURRENT_LOCATION_ZOOM, { source: 'current-location' });
      },
      (geoError) => {
        console.error('Theo dõi vị trí thất bại:', geoError);
        setError('Không thể theo dõi vị trí hiện tại liên tục.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 15000,
      }
    );
  }, [focusMapAt]);

  useEffect(() => {
    return () => {
      stopTrackingUserLocation();
    };
  }, [stopTrackingUserLocation]);

  const requestCurrentLocation = useCallback(() => {
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
        if (appState !== APP_STATES.ROUTING) {
          transitionTo(APP_STATES.FOCUS_CURRENT);
        }
        if (appState !== APP_STATES.ROUTING) {
          setFollowUserLocation(true);
          startTrackingUserLocation();
        } else {
          setFollowUserLocation(false);
          stopTrackingUserLocation();
        }
        setUserLocation(newLocation);
        focusMapAt(newLocation, CURRENT_LOCATION_ZOOM, { source: 'current-location' });
        setLocationStatus('success');
      },
      (error) => {
        setLocationStatus('error');
        setError('Không thể lấy vị trí. Vui lòng cho phép truy cập vị trí trong trình duyệt.');
        console.error('Geolocation error:', error);
      }
    );
  }, [appState, focusMapAt, startTrackingUserLocation, stopTrackingUserLocation, transitionTo]);

  useEffect(() => {
    requestCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ownedPlaceBySource = useMemo(() => {
    const map = {};
    ownedPlaces.forEach((ownedPlace) => {
      if (ownedPlace.sourcePlaceId) {
        map[ownedPlace.sourcePlaceId] = ownedPlace;
      }
    });
    return map;
  }, [ownedPlaces]);

  const ownedPlacesForMap = useMemo(
    () =>
      ownedPlaces.map((place) => ({
        ...place,
        lat: Number(place.lat),
        lng: Number(place.lng),
      })),
    [ownedPlaces]
  );
  const checkInsByPlaceId = useMemo(() => {
    const map = {};
    checkIns.forEach((ci) => {
      map[ci.placeId] = ci;
    });
    return map;
  }, [checkIns]);

  const visiblePlaces = useMemo(() => places.map((p) => ({
    ...p,
    type: p.type || p.categories?.[0] || 'default',
  })), [places]);

  const selectedPlace = useMemo(
    () => visiblePlaces.find((place) => place.id === selectedPlaceId) || null,
    [selectedPlaceId, visiblePlaces]
  );
  const selectedPlaceReviews = useMemo(
    () => (selectedPlace ? (reviewsByPlace[selectedPlace.id] || []) : []),
    [reviewsByPlace, selectedPlace]
  );

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
    const applySavedState = (saved) => {
      if (!saved || typeof saved !== 'object') return;
      if (typeof saved.searchQuery === 'string') setSearchQuery(saved.searchQuery);
      if (Array.isArray(saved.places)) setPlaces(saved.places);
      if (saved.userLocation) setUserLocation(saved.userLocation);
      if (typeof saved.locationInput === 'string') setLocationInput(saved.locationInput);
      if (typeof saved.placeType === 'string') setPlaceType(saved.placeType);
      if (typeof saved.budget === 'string') setBudget(saved.budget);
      if (saved.selectedPlaceId !== undefined) setSelectedPlaceId(saved.selectedPlaceId);
      if (typeof saved.isSidebarOpen === 'boolean') setIsSidebarOpen(saved.isSidebarOpen);
      if (typeof saved.showPlaceDetailPanel === 'boolean') setShowPlaceDetailPanel(saved.showPlaceDetailPanel);
      if (typeof saved.appState === 'string') setAppState(saved.appState);
      if (Array.isArray(saved.route)) setRoute(saved.route);
      if (saved.mapFocusTarget) setMapFocusTarget(saved.mapFocusTarget);
      rehydratedRef.current = true;
    };

    const routeState = location.state?.homeState;
    if (routeState) {
      applySavedState(routeState);
      return;
    }

    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      sessionStorage.removeItem(STORAGE_KEY);
      rehydratedRef.current = true;
      return;
    }
    try {
      const saved = JSON.parse(raw);
      applySavedState(saved);
    } catch (err) {
      console.warn('Unable to restore search state', err);
      sessionStorage.removeItem(STORAGE_KEY);
      rehydratedRef.current = true;
    }
  }, [location.state]);

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
  const getCurrentLocation = requestCurrentLocation;

  // Unified Search Logic
  // Sử dụng mock data thay cho API thật
  const performUnifiedSearch = useCallback(async (query, filters = {}) => {
    // Nếu không có gì, reset
    if (!query.trim() && !filters.type && !filters.locationInput && !filters.budget) {
      setPlaces([]);
      setError('');
      setIsSidebarOpen(false);
      transitionTo(APP_STATES.IDLE);
      return;
    }

    try {
      transitionTo(APP_STATES.ON_SEARCH);
      setDisableAutoFit(true);
      setIsSearching(true);
      setError('');
      setIsSidebarOpen(true);

      // Gọi mock searchPlaces thay vì getRecommendations
      const results = await searchPlaces(query.trim(), {
        type: filters.type,
        locationInput: filters.locationInput,
        budget: filters.budget,
      });
      setPlaces(results);
      setSelectedPlaceId(null);
      setRoute([]);
    } catch (err) {
      setError(err.message);
      console.error('Unified search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [transitionTo]);

  const handleSearchSubmit = useCallback((queryToSearch) => {
    setSearchQuery(queryToSearch);
    performUnifiedSearch(queryToSearch, {
      type: placeType,
      locationInput,
      budget,
    });
  }, [performUnifiedSearch, placeType, locationInput, budget, setSearchQuery]);

  const handleSearchInputChange = useCallback(
    (value) => {
      // We no longer open the sidebar immediately when typing starts.
      // The sidebar will open in performUnifiedSearch when Enter is pressed.
      if (!value?.trim() && appState === APP_STATES.ON_SEARCH) {
        transitionTo(APP_STATES.IDLE);
      }
    },
    [appState, transitionTo]
  );

  useEffect(() => {
    const handleAiSearch = (e) => {
      const filters = e.detail;
      const query = filters.query || '';
      const normalizedBudget = normalizeBudget(filters.budget);
      
      // Update Navbar states so the UI reflects the AI's parsed search
      setSearchQuery(query);
      // Support multiple types from AI (array) or single type (string)
      if (Array.isArray(filters.types) && filters.types.length > 0) {
        setPlaceType(filters.types.map(t => t.trim()).join(','));
      } else if (filters.type) {
        setPlaceType(filters.type.split(',').map(t => t.trim()).join(','));
      }
      if (filters.location) setLocationInput(filters.location);
      if (normalizedBudget) setBudget(normalizedBudget);

      // If AI already computed results (via backend workflow), use them directly
      // This eliminates the duplicate search call
      if (filters.results && filters.results.length > 0) {
        const transformed = filters.results.map(place => ({
          id: place.locationId,
          name: place.name,
          address: place.address,
          lat: place.location?.lat,
          lng: place.location?.lng,
          type: place.types?.[0] || place.type || 'default',
          rating: place.rating,
          priceLevel: place.priceLevel,
          price: place.price,
          amenities: place.amenities,
          userRatingsTotal: place.userRatingsTotal,
          imageUrl: place.imageUrl,
          source: place.source,
          sourcePlaceId: place.sourcePlaceId,
          score: place.score,
          reasons: place.reasons,
        }));
        setIsSidebarOpen(true);
        transitionTo(APP_STATES.ON_SEARCH);
        setDisableAutoFit(true);
        setError('');
        setPlaces(transformed);
        setSelectedPlaceId(null);
        setRoute([]);
        return;
      }

      // Fallback: perform search manually via GET /search
      performUnifiedSearch(query, {
        type: filters.type || (Array.isArray(filters.types) ? filters.types.join(',') : placeType),
        locationInput: filters.location || locationInput,
        budget: normalizedBudget || budget,
      });
    };

    window.addEventListener('app:ai-search', handleAiSearch);
    return () => window.removeEventListener('app:ai-search', handleAiSearch);
  }, [performUnifiedSearch, placeType, locationInput, budget, normalizeBudget, transitionTo]);

  useEffect(() => {
    if (!rehydratedRef.current) return;
    const payload = {
      searchQuery,
      places,
      userLocation,
      locationInput,
      placeType,
      budget,
      selectedPlaceId,
      isSidebarOpen,
      showPlaceDetailPanel,
      appState,
      route,
      mapFocusTarget,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    searchQuery,
    places,
    userLocation,
    locationInput,
    placeType,
    budget,
    selectedPlaceId,
    isSidebarOpen,
    showPlaceDetailPanel,
    appState,
    route,
    mapFocusTarget,
  ]);

  useEffect(() => {
    const anchor =
      userLocation ||
      visiblePlaces.find((p) => p.lat && p.lng) ||
      ownedPlacesForMap.find((p) => p.lat && p.lng) ||
      FALLBACK_CENTER;
    loadPois(anchor);
  }, [loadPois, userLocation, visiblePlaces, ownedPlacesForMap]);

  useEffect(() => {
    if (travelError) {
      setError(travelError);
    }
  }, [travelError]);

  // Handle marker click - open place detail in new tab
  const handleMarkerClick = (place) => {
    setSelectedPlaceId(place.id);
    navigate(`/places/${place.id}`, {
      state: {
        place,
        returnToMapState: {
          searchQuery,
          places,
          userLocation,
          locationInput,
          placeType,
          budget,
          selectedPlaceId: place.id,
          isSidebarOpen,
          showPlaceDetailPanel,
          appState,
          route,
          mapFocusTarget,
        },
      },
    });
  };

  const handleSelectPlace = (place) => {
    setSelectedPlaceId(place.id);
    setShowPlaceDetailPanel(false);
    focusMapAt({ lat: place.lat, lng: place.lng }, 15);
  };

  const handleShowPlaceDetails = (place) => {
    setSelectedPlaceId(place.id);
    navigate(`/places/${place.id}`, {
      state: {
        place,
        returnToMapState: {
          searchQuery,
          places,
          userLocation,
          locationInput,
          placeType,
          budget,
          selectedPlaceId: place.id,
          isSidebarOpen,
          showPlaceDetailPanel,
          appState,
          route,
          mapFocusTarget,
        },
      },
    });
  };

  const handleChat = (place) => {
    setChatPlace(place);
  };

  const handleToggleOwnedPlace = async (place) => {
    try {
      const existing = ownedPlaceBySource[place.id];
      if (existing) {
        await removeOwnedPlace(existing.id);
      } else {
        await saveOwnedPlace(place);
      }
    } catch (err) {
      setError(err?.message || 'Không thể cập nhật địa điểm đã lưu.');
    }
  };

  const handleToggleCheckIn = async (place) => {
    try {
      const existing = checkInsByPlaceId[place.id];
      if (existing) {
        await removeCheckIn(existing.id);
      } else {
        await saveCheckIn(place);
      }
    } catch (err) {
      setError(err?.message || 'Không thể thực hiện check-in.');
    }
  };

  const handleDirections = async (place) => {
    try {
      transitionTo(APP_STATES.ROUTING);
      setShowPlaceDetailPanel(false);
      setDisableAutoFit(true);
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
      focusMapAt(origin, 16);
      const routeCoords = await getRoute(origin, { lat: place.lat, lng: place.lng });
      setRoute(routeCoords);
      setSelectedPlaceId(place.id);
      setFollowUserLocation(false);
      stopTrackingUserLocation();
    } catch (err) {
      setError(err.message || 'Không thể lấy chỉ đường');
    }
  };

  const handleUserMapInteraction = useCallback(() => {
    setDisableAutoFit(true);
    if (appState === APP_STATES.FOCUS_CURRENT) {
      transitionTo(APP_STATES.IDLE);
    }
  }, [appState, transitionTo]);

  const handleStopRouting = useCallback(() => {
    setRoute([]);
    setSelectedPlaceId(null);
    transitionTo(APP_STATES.IDLE);
  }, [transitionTo]);

  const handleSidebarToggle = useCallback(
    (nextOpen) => {
      setIsSidebarOpen(nextOpen);
      if (!nextOpen) {
        if (appState === APP_STATES.ON_SEARCH) {
          transitionTo(APP_STATES.IDLE);
        }
        return;
      }

      if (searchQuery.trim() || visiblePlaces.length) {
        setAppState(APP_STATES.ON_SEARCH);
      }
    },
    [appState, searchQuery, transitionTo, visiblePlaces.length]
  );

  const hydrateImages = async (list) => {
    const limited = list.slice(0, 10);
    const promises = limited.map(async (p) => {
      if (!imagesByPlace[p.id]) {
        const img = await fetchPlaceImage(p.id).catch(() => null);
        if (img) setImagesByPlace((prev) => ({ ...prev, [p.id]: img }));
      }
    });
    await Promise.all(promises);
  };

  useEffect(() => {
    if (places.length) hydrateImages(places);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places]);

  useEffect(() => {
    if (!selectedPlace?.id) return;
    if (reviewsByPlace[selectedPlace.id]) return;

    let cancelled = false;

    const loadSelectedPlaceReviews = async () => {
      const reviews = await getPlaceReviews(selectedPlace.id).catch(() => []);
      if (!cancelled) {
        setReviewsByPlace((prev) => ({ ...prev, [selectedPlace.id]: reviews }));
      }
    };

    loadSelectedPlaceReviews();

    return () => {
      cancelled = true;
    };
  }, [reviewsByPlace, selectedPlace?.id]);

  return (
    <div className="relative h-screen w-full bg-base-50 overflow-hidden">
      <Navbar
        className="absolute top-0 left-0 right-0"
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearchSubmit}
        onSearchInputChange={handleSearchInputChange}
        locationInput={locationInput}
        setLocationInput={setLocationInput}
        placeType={placeType}
        setPlaceType={setPlaceType}
        budget={budget}
        setBudget={setBudget}
        onClearFilters={() => {
          setSearchQuery('');
          setPlaceType('');
          setLocationInput('');
          setBudget('');
        }}
      />

      <div className="absolute inset-0 bg-base-50 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(47,183,156,0.14)_0%,rgba(249,115,22,0.08)_42%,rgba(255,255,255,0)_100%)] pointer-events-none" />
        {/* Map layer */}
        <div className="absolute inset-0">
          <MapComponent
            userLocation={userLocation}
            followUserLocation={followUserLocation}
            currentLocationZoom={CURRENT_LOCATION_ZOOM}
            onUserMapInteraction={handleUserMapInteraction}
            places={visiblePlaces}
            ownedPlaces={ownedPlacesForMap}
            onDirectionsRequested={handleDirections}
            onOwnedMarkerClick={(ownedPlace) => {
              const linkedSourcePlace = ownedPlace?.sourcePlaceId;
              if (linkedSourcePlace) {
                setSelectedPlaceId(linkedSourcePlace);
              }
            }}
            selectedPlaceId={selectedPlaceId}
            route={route}
            mapStyle="standard"
            pois={pois}
            focusTarget={mapFocusTarget}
            disableAutoFit={disableAutoFit}
            invalidateKey={mapInvalidateTick}
          />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(34,28,23,0.16)_0%,rgba(34,28,23,0.04)_24%,transparent_48%,rgba(47,183,156,0.05)_78%,rgba(34,28,23,0.10)_100%)] pointer-events-none" />

        {/* Sidebar overlay */}
        <SidebarOverlay
          isOpen={isSidebarOpen}
          width={sidebarWidth}
          minWidth={300}
          maxWidth={560}
          topOffset={NAVBAR_HEIGHT + 10}
          isMobile={isMobile}
          onToggle={handleSidebarToggle}
          onWidthChange={setSidebarWidth}
          onResizeStateChange={setIsResizing}
        >
          {showPlaceDetailPanel && selectedPlace ? (
            <div className="space-y-3 animate-soft-in">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPlaceDetailPanel(false)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại danh sách
                </button>
                <span className="text-xs px-2 py-1 rounded-lg bg-primary-50 text-primary-800 border border-primary-200">
                  Chi tiết
                </span>
              </div>

              <div className="space-y-3">
                <div className="map-surface px-3 py-3">
                  <p className="text-base font-semibold text-slate-900 line-clamp-1">{selectedPlace.name}</p>
                  {selectedPlace.address ? (
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">{selectedPlace.address}</p>
                  ) : null}
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                    {selectedPlace.rating ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {selectedPlace.rating}
                      </span>
                    ) : (
                      <span>Chưa có điểm đánh giá</span>
                    )}
                    {selectedPlace.type ? (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{selectedPlace.type}</span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDirections(selectedPlace)}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-2 text-sm rounded-2xl border border-primary-200 bg-primary-50 text-primary-800 hover:bg-primary-100"
                  >
                    <Navigation2 className="w-4 h-4" />
                    Chỉ đường
                  </button>
                </div>

                <div className="map-surface px-3 py-3">
                  <p className="text-sm font-semibold text-slate-800 mb-2">Đánh giá gần đây</p>
                  {selectedPlaceReviews.length ? (
                    <div className="space-y-2">
                      {selectedPlaceReviews.slice(0, 3).map((review, idx) => (
                        <div key={`${selectedPlace.id}-review-${idx}`} className="rounded-xl bg-base-50 px-2.5 py-2 text-xs text-slate-700 border border-base-200">
                          {review.comment || review.text || 'Đánh giá không có nội dung.'}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Chưa có đánh giá cho địa điểm này.</p>
                  )}
                </div>

                <div className="map-surface px-3 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-primary-600" />
                    <p className="text-sm font-semibold text-slate-800">Chatbot địa điểm</p>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">UI đã sẵn sàng. Tính năng trả lời chatbot sẽ được bật ở bước tiếp theo.</p>
                  <div className="rounded-xl border border-base-200 bg-base-50 px-3 py-2 text-xs text-slate-500">
                    Xin chào, mình có thể tư vấn lịch trình, chi phí, và mẹo tham quan cho địa điểm này.
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      disabled
                      placeholder="Sắp hỗ trợ hỏi đáp về địa điểm..."
                      className="flex-1 h-9 rounded-xl border border-base-200 bg-base-50 px-3 text-xs text-slate-400"
                    />
                    <button
                      type="button"
                      disabled
                      className="h-9 px-3 rounded-xl border border-base-200 bg-base-50 text-xs text-slate-400"
                    >
                      Gửi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>

              <div className="mb-3 rounded-2xl border border-ink-900 bg-ink-900 px-3 py-2 text-xs font-bold text-white flex items-center justify-between shadow-soft">
                <p>Kết quả tìm kiếm & gợi ý</p>
              </div>

              {isSearching ? (
                <div className="mb-3 flex flex-col items-center justify-center map-surface py-8 text-ink-500">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary-200 bg-primary-50">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-700" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-700">Đang tìm kết quả...</p>
                </div>
              ) : null}

              {visiblePlaces.length ? (
                <div className="mb-3 px-1">
                  <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Kết quả tìm kiếm</p>
                  <p className="text-sm font-medium text-slate-700">{visiblePlaces.length} địa điểm</p>
                </div>
              ) : null}
              {!visiblePlaces.length && !isSearching && appState === APP_STATES.ON_SEARCH ? (
                <div className="text-sm text-gray-500">Không có kết quả phù hợp.</div>
              ) : null}
              <div className="space-y-3 pb-1">
                {visiblePlaces.map((place, index) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    itemIndex={index}
                    imageUrl={imagesByPlace[place.id]}
                    reviews={reviewsByPlace[place.id]}
                    userLocation={userLocation}
                    isSelected={selectedPlaceId === place.id}
                    onSelect={() => handleSelectPlace(place)}
                    onNavigate={() => handleMarkerClick(place)}
                    onShowDetails={() => handleShowPlaceDetails(place)}
                    onChat={() => handleChat(place)}
                    onDirections={() => handleDirections(place)}
                    onSave={() => handleToggleOwnedPlace(place)}
                    isSaved={Boolean(ownedPlaceBySource[place.id])}
                    onCheckIn={() => handleToggleCheckIn(place)}
                    isCheckedIn={Boolean(checkInsByPlaceId[place.id])}
                    showActions={false}
                  />
                ))}
              </div>
            </>
          )}
        </SidebarOverlay>

        {/* Quick Location Button + Style toggle */}
        <div
          className="absolute z-20 flex gap-2 transition-all duration-300 ease-in-out animate-soft-in"
          style={{
            bottom: isMobile ? 12 : 16,
            left: `${isMobile ? 16 : isSidebarOpen ? sidebarWidth + 30 : 16}px`,
          }}
        >
          <button
            onClick={getCurrentLocation}
            disabled={locationStatus === 'loading'}
            title={locationStatus === 'loading' ? 'Đang tìm vị trí...' : 'Lấy vị trí của tôi'}
            className="p-3 bg-ink-900 text-white rounded-2xl shadow-soft border border-ink-900 hover:bg-ink-700 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Navigation2 className={`w-5 h-5 ${locationStatus === 'loading' ? 'animate-spin' : ''}`} />
          </button>

          {(route?.length || appState === APP_STATES.ROUTING) ? (
            <button
              onClick={handleStopRouting}
              title="Ngừng chỉ đường"
              className="inline-flex items-center gap-2 px-3 py-3 bg-rose-50 rounded-2xl shadow-soft border border-rose-200 text-rose-700 hover:bg-rose-100 transition-all duration-200 ease-in-out"
            >
              <Route className="w-4 h-4" />
              <span className="text-sm font-medium">Ngừng chỉ đường</span>
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        <div
          className="absolute left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 w-[min(88vw,26rem)]"
          style={{ top: NAVBAR_HEIGHT + 10 }}
        >
          {error && (
            <div className="w-full bg-white border border-rose-200 text-rose-700 px-3 py-2 rounded-2xl flex items-start gap-2 shadow-soft animate-soft-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-700 hover:text-red-900 font-bold text-sm leading-none"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {chatPlace ? <PlaceChatPanel place={chatPlace} onClose={() => setChatPlace(null)} /> : null}
      </div>
    </div>
  );
}

