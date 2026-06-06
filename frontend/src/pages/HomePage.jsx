import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertCircle, Compass, MapPin, Route, Navigation, Layers } from 'lucide-react';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import AIWorkspacePanel from '../components/AIWorkspacePanel';
import { searchPlaces, fetchNearbyPois } from '../services/placeService';
import { getRoute } from '../services/routingService';
import { useTravelData } from '../contexts/TravelDataContext';
import { useConversation } from '../contexts/ConversationContext';

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
const DESKTOP_PANEL_GAP = 20;
const DESKTOP_WORKSPACE_WIDTH = 380;

export default function HomePage() {
  const {
    ownedPlaces,
  } = useTravelData();

  const {
    taggedPlaces,
    tagPlace,
    untagPlace,
  } = useConversation();

  // Basic Page States
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [places, setPlaces] = useState([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [error, setError] = useState('');
  const [mapFocusTarget, setMapFocusTarget] = useState(null);
  const [followUserLocation, setFollowUserLocation] = useState(false);
  const [disableAutoFit, setDisableAutoFit] = useState(false);
  const [route, setRoute] = useState([]);
  const [appState, setAppState] = useState(APP_STATES.IDLE);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Navbar Filters (kept for backend compatibility)
  const [locationInput, setLocationInput] = useState('');
  const [placeType, setPlaceType] = useState('');
  const [budget, setBudget] = useState('');

  // AI-Agent-First States
  const [comparedPlaces, setComparedPlaces] = useState([]);
  const [itinerary, setItinerary] = useState(null);
  const [areaInsight, setAreaInsight] = useState(null);
  const [budgetData, setBudgetData] = useState(null);
  const [foodRecommendations, setFoodRecommendations] = useState([]);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState('map'); // 'workspace' | 'map'
  const [isWorkspaceExpanded, setWorkspaceExpanded] = useState(false);

  const [pois, setPois] = useState([]);
  const lastPoiKeyRef = useRef('');
  const userLocationWatchIdRef = useRef(null);
  const rehydratedRef = useRef(false);

  const normalizeBudget = useCallback((value) => {
    if (!value) return '';
    const normalized = String(value).toLowerCase();
    if (['low', 'cheap', 'budget', 'rẻ', 'bình dân'].includes(normalized)) return 'low';
    if (['mid', 'medium', 'midrange', 'mid-range', 'vừa', 'trung bình'].includes(normalized)) return 'mid';
    if (['high', 'expensive', 'luxury', 'premium', 'sang trọng', 'cao cấp'].includes(normalized)) return 'high';
    return '';
  }, []);

  // Sync Mobile
  useEffect(() => {
    const syncMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    syncMobile();
    window.addEventListener('resize', syncMobile);
    return () => window.removeEventListener('resize', syncMobile);
  }, []);

  // Map focus helper
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

  // Geolocation handling
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
        setFollowUserLocation(false);
        stopTrackingUserLocation();
      }
      if (nextState === APP_STATES.ON_SEARCH) {
        setFollowUserLocation(false);
        stopTrackingUserLocation();
      }
      if (nextState === APP_STATES.FOCUS_CURRENT) {
        // Handled internally
      }
      if (nextState === APP_STATES.ROUTING) {
        // Handled internally
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

  // Restore states
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
      if (typeof saved.appState === 'string') setAppState(saved.appState);
      if (Array.isArray(saved.route)) setRoute(saved.route);
      if (saved.mapFocusTarget) setMapFocusTarget(saved.mapFocusTarget);
      if (Array.isArray(saved.comparedPlaces)) setComparedPlaces(saved.comparedPlaces);
      if (saved.itinerary !== undefined) setItinerary(saved.itinerary);
      if (saved.areaInsight !== undefined) setAreaInsight(saved.areaInsight);
      if (saved.budgetData !== undefined) setBudgetData(saved.budgetData);
      if (Array.isArray(saved.foodRecommendations)) setFoodRecommendations(saved.foodRecommendations);
      if (typeof saved.activeWorkspaceTab === 'string' || saved.activeWorkspaceTab === null) {
        setActiveWorkspaceTab(saved.activeWorkspaceTab ?? null);
      }
      if (typeof saved.activeMobileTab === 'string') setActiveMobileTab(saved.activeMobileTab);
      if (typeof saved.isWorkspaceExpanded === 'boolean') setWorkspaceExpanded(saved.isWorkspaceExpanded);
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

  // Load POIs
  const loadPois = useCallback(
    async (centerPoint) => {
      if (!centerPoint?.lat || !centerPoint?.lng) return;
      const key = `${centerPoint.lat.toFixed(3)}:${centerPoint.lng.toFixed(3)}`;
      if (key === lastPoiKeyRef.current && pois.length) return;
      try {
        const fetchedPois = await fetchNearbyPois(centerPoint.lat, centerPoint.lng, 1700);
        setPois(fetchedPois);
        lastPoiKeyRef.current = key;
      } catch (err) {
        console.error('POI fetch error:', err);
      }
    },
    [pois.length]
  );

  useEffect(() => {
    const anchor =
      userLocation ||
      places.find((p) => p.lat && p.lng) ||
      FALLBACK_CENTER;
    loadPois(anchor);
  }, [loadPois, userLocation, places]);

  // Unified Search Logic (Phase 5 real backend connection)
  const performUnifiedSearch = useCallback(async (query, filters = {}) => {
    if (!query.trim() && !filters.type && !filters.locationInput && !filters.budget) {
      setPlaces([]);
      setError('');
      transitionTo(APP_STATES.IDLE);
      return;
    }

    try {
      transitionTo(APP_STATES.ON_SEARCH);
      setDisableAutoFit(true);
      setError('');

      const results = await searchPlaces(query.trim(), {
        type: filters.type,
        locationInput: filters.locationInput,
        budget: filters.budget,
      });

      setPlaces(results);
      setSelectedPlaceId(null);
      setRoute([]);
      
      // Auto expand Search results accordion
      setActiveWorkspaceTab('search');
    } catch (err) {
      setError(err.message);
      console.error('Unified search error:', err);
    }
  }, [transitionTo]);

  const handleAiSearch = useCallback((filters) => {
    const query = filters.query || '';
    const normalizedBudget = normalizeBudget(filters.budget);
    
    setSearchQuery(query);
    if (Array.isArray(filters.types) && filters.types.length > 0) {
      setPlaceType(filters.types.map(t => t.trim()).join(','));
    } else if (filters.type) {
      setPlaceType(filters.type.split(',').map(t => t.trim()).join(','));
    }
    if (filters.location) setLocationInput(filters.location);
    if (normalizedBudget) setBudget(normalizedBudget);

    if (filters.results && filters.results.length > 0) {
      const transformed = filters.results.map(place => ({
        id: place.locationId || place.id,
        name: place.name,
        address: place.address,
        lat: place.location?.lat || place.lat,
        lng: place.location?.lng || place.lng,
        type: place.types?.[0] || place.type || 'default',
        rating: place.rating,
        priceLevel: place.priceLevel,
        price: place.price,
        amenities: place.amenities,
        userRatingsTotal: place.userRatingsTotal,
        imageUrl: place.imageUrl,
        source: place.source,
        sourcePlaceId: place.sourcePlaceId,
        score: place.score || 95,
        reasons: place.reasons || 'Không gian yên tĩnh, thiết kế vintage ấm cúng phù hợp để thư giãn.',
      }));
      setPlaces(transformed);
      setSelectedPlaceId(null);
      setRoute([]);
      setActiveWorkspaceTab('search');
      return;
    }

    performUnifiedSearch(query, {
      type: filters.type || (Array.isArray(filters.types) ? filters.types.join(',') : placeType),
      locationInput: filters.location || locationInput,
      budget: normalizedBudget || budget,
    });
  }, [performUnifiedSearch, placeType, locationInput, budget, normalizeBudget]);

  useEffect(() => {
    const handleSelectPlaceEvent = (event) => {
      const placeId = event?.detail?.id;
      if (!placeId) return;
      const selectedPlace =
        places.find((place) => String(place.id) === String(placeId)) ||
        taggedPlaces.find((place) => String(place.id) === String(placeId)) ||
        ownedPlaces.find((place) => String(place.id) === String(placeId));
      if (!selectedPlace) return;

      const lat = Number(selectedPlace.lat ?? selectedPlace.latitude ?? selectedPlace.location?.lat);
      const lng = Number(selectedPlace.lng ?? selectedPlace.longitude ?? selectedPlace.location?.lng);
      setSelectedPlaceId(selectedPlace.id);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        focusMapAt({ lat, lng }, 15);
      }
      setActiveWorkspaceTab(taggedPlaces.some((place) => String(place.id) === String(placeId)) ? 'pinned' : 'search');
      if (isMobile) setActiveMobileTab('workspace');
    };

    window.addEventListener('app:select-place', handleSelectPlaceEvent);
    return () => window.removeEventListener('app:select-place', handleSelectPlaceEvent);
  }, [focusMapAt, isMobile, ownedPlaces, places, taggedPlaces]);

  // Synchronize places to window.activeSearchResults for the global ChatWidget context
  useEffect(() => {
    window.activeSearchResults = places;
  }, [places]);

  // Listen for search actions dispatched by the ChatWidget
  useEffect(() => {
    const handleAiSearchEvent = (event) => {
      if (event?.detail) {
        handleAiSearch(event.detail);
      }
    };
    window.addEventListener('app:ai-search', handleAiSearchEvent);
    return () => window.removeEventListener('app:ai-search', handleAiSearchEvent);
  }, [handleAiSearch]);

  // Main input submission handler — all messages go through backend
  const handleSendMessage = async (text) => {
    const userText = String(text || '').trim();
    if (!userText) return;
    window.dispatchEvent(new CustomEvent('app:chat-send', { detail: { text: userText } }));
  };

  // Pin place action
  const handlePinPlace = (place) => {
    tagPlace(place);
  };

  // Compare place action
  const handleComparePlace = (place) => {
    const isAlreadyCompared = comparedPlaces.some(p => p.id === place.id);
    let nextCompared = [];
    if (isAlreadyCompared) {
      nextCompared = comparedPlaces.filter(p => p.id !== place.id);
    } else {
      nextCompared = [...comparedPlaces, place];
    }
    setComparedPlaces(nextCompared);
    setActiveWorkspaceTab('comparison');
    if (isMobile) setActiveMobileTab('workspace');
  };

  // Ask AI about specific place
  const handleAskAIAboutPlace = (place) => {
    window.dispatchEvent(new CustomEvent('app:chat-prefill', {
      detail: {
        text: `Cho tôi hỏi thêm thông tin về ${place.name} (vị trí, tiện ích, và nó có thực sự yên tĩnh không?)`,
      },
    }));
  };

  // Itinerary generation from place detail
  const onCreateItinerary = (place) => {
    handleSendMessage(`Lên lịch trình 3 ngày 2 đêm quanh chỗ ở ${place.name}`);
  };

  // Close workspace panels handler
  const handleClosePanel = (panelId) => {
    // If search panel closed, clear places
    if (panelId === 'search') setPlaces([]);
    if (panelId === 'comparison') setComparedPlaces([]);
    if (panelId === 'itinerary') setItinerary(null);
    if (panelId === 'insight') setAreaInsight(null);
    if (panelId === 'budget') setBudgetData(null);
    if (panelId === 'food') setFoodRecommendations([]);
  };

  // Interaction Sync (Phase 4): clicking marker expands workspace panel
  const handleMarkerClick = (place) => {
    setSelectedPlaceId(place.id);
    focusMapAt({ lat: place.lat, lng: place.lng }, 15);
    
    // Check if the place is in searchResults, or pinned list, etc.
    const isPinned = taggedPlaces.some(p => p.id === place.id);
    if (isPinned) {
      setActiveWorkspaceTab('pinned');
    } else {
      setActiveWorkspaceTab('search');
    }

    if (isMobile) {
      setActiveMobileTab('workspace');
    }
  };

  const handleSelectPlaceFromWorkspace = (place) => {
    setSelectedPlaceId(place.id);
    focusMapAt({ lat: place.lat, lng: place.lng }, 15);
  };

  // Routing directions requested
  const handleDirections = async (place) => {
    try {
      transitionTo(APP_STATES.ROUTING);
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

  const handleStopRouting = useCallback(() => {
    setRoute([]);
    setSelectedPlaceId(null);
    transitionTo(APP_STATES.IDLE);
  }, [transitionTo]);

  const handleUserMapInteraction = useCallback(() => {
    setDisableAutoFit(true);
    if (appState === APP_STATES.FOCUS_CURRENT) {
      transitionTo(APP_STATES.IDLE);
    }
  }, [appState, transitionTo]);

  // Sync state snapshot to session
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
      appState,
      route,
      mapFocusTarget,
      comparedPlaces,
      itinerary,
      areaInsight,
      budgetData,
      foodRecommendations,
      activeWorkspaceTab,
      activeMobileTab,
      isWorkspaceExpanded,
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
    appState,
    route,
    mapFocusTarget,
    comparedPlaces,
    itinerary,
    areaInsight,
    budgetData,
    foodRecommendations,
    activeWorkspaceTab,
    activeMobileTab,
    isWorkspaceExpanded,
  ]);

  // Navbar redirection to Chat Widget message submission
  const handleSearchSubmit = (queryToSearch) => {
    if (!queryToSearch.trim()) return;
    handleSendMessage(queryToSearch);
  };

  return (
    <div className="relative h-screen w-full bg-base-50 overflow-hidden flex flex-col font-sans">
      <Navbar
        className="absolute top-0 left-0 right-0 h-16 z-40"
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearchSubmit}
        onSearchInputChange={() => {}}
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

      <div className="relative flex-1 w-full overflow-hidden mt-16">
        {/* Background Map layer */}
        <div className="absolute inset-0 z-0">
          <MapComponent
            userLocation={userLocation}
            followUserLocation={followUserLocation}
            currentLocationZoom={CURRENT_LOCATION_ZOOM}
            onUserMapInteraction={handleUserMapInteraction}
            places={places}
            ownedPlaces={ownedPlaces.map(p => ({ ...p, lat: Number(p.lat), lng: Number(p.lng) }))}
            onDirectionsRequested={handleDirections}
            onMarkerClick={handleMarkerClick}
            selectedPlaceId={selectedPlaceId}
            route={route}
            mapStyle="standard"
            pois={pois}
            focusTarget={mapFocusTarget}
            disableAutoFit={disableAutoFit}
            invalidateKey={0}
          />
        </div>

        {/* Desktop Layout Overlay */}
        {!isMobile && (
          <div className="absolute inset-0 flex justify-between p-5 pointer-events-none z-10 font-sans">
            {/* Left AI Workspace Panel */}
            {isWorkspaceExpanded ? (
              <div className="w-[380px] h-full flex flex-col pointer-events-auto animate-panel-in-left">
                <AIWorkspacePanel
                  searchPlaces={places}
                  comparedPlaces={comparedPlaces}
                  pinnedPlaces={taggedPlaces}
                  itinerary={itinerary}
                  areaInsight={areaInsight}
                  budget={budgetData}
                  foodRecommendations={foodRecommendations}
                  
                  selectedPlaceId={selectedPlaceId}
                  pinnedPlaceIds={taggedPlaces.map(p => p.id)}
                  
                  onSelectPlace={handleSelectPlaceFromWorkspace}
                  onPinPlace={handlePinPlace}
                  onRemovePin={(id) => untagPlace(id)}
                  onComparePlace={handleComparePlace}
                  onRemoveFromComparison={(id) => setComparedPlaces(prev => prev.filter(p => p.id !== id))}
                  onAskAIAboutPlace={handleAskAIAboutPlace}
                  onHoverPlace={(id) => setSelectedPlaceId(id)}
                  onOptimizeRoute={() => handleSendMessage('Tối ưu hóa lịch trình đường đi')}
                  onAddFood={() => handleSendMessage('Gợi ý quán ăn ngon lân cận')}
                  onMakeCheaper={() => handleSendMessage('Lên dự toán chi phí tiết kiệm hơn')}
                  onMakeRelaxing={() => handleSendMessage('Đưa ra lịch trình du lịch nhẹ nhàng thư giãn')}
                  onSelectFood={(food) => {
                    const lat = Number(food.lat ?? food.latitude ?? userLocation?.lat ?? FALLBACK_CENTER.lat);
                    const lng = Number(food.lng ?? food.longitude ?? userLocation?.lng ?? FALLBACK_CENTER.lng);
                    focusMapAt({ lat, lng });
                  }}
                  onAddToItinerary={(f) => handleSendMessage(`Thêm quán ăn ${f.name} vào lịch trình`)}
                  onCreateItinerary={onCreateItinerary}
                  onDirections={handleDirections}
                  
                  activePanel={activeWorkspaceTab}
                  setActivePanel={setActiveWorkspaceTab}
                  onClosePanel={handleClosePanel}
                  onCollapse={() => setWorkspaceExpanded(false)}
                />
              </div>
            ) : (
              <div />
            )}
          </div>
        )}

        {!isMobile && !isWorkspaceExpanded && (
          <button
            onClick={() => setWorkspaceExpanded(true)}
            className="group absolute z-20 left-0 top-1/2 -translate-y-1/2 w-8 h-16 bg-ink-900 border border-l-0 border-ink-700 text-white rounded-r-full shadow-soft hover:bg-ink-700 hover:w-9 active:scale-95 transition-all duration-200 flex items-center justify-start pl-2 pointer-events-auto animate-control-fade-in"
            title="Mở AI Workspace"
          >
            <Layers className="w-[18px] h-[18px] text-primary-200 transition-colors group-hover:text-white duration-200"
              onClick={(e) => {
                // Make sure clicking the icon also triggers the button's action
                e.stopPropagation();
                setWorkspaceExpanded(true);
              }}
            />
          </button>
        )}

        {/* Mobile Layout Tab Contents */}
        {isMobile && (
          <div className="absolute inset-0 flex flex-col z-10 pointer-events-none p-3 pb-16">
            <div className="flex-1 w-full pointer-events-auto overflow-hidden">
              {activeMobileTab === 'workspace' && (
                <div className="w-full h-full">
                  <AIWorkspacePanel
                    searchPlaces={places}
                    comparedPlaces={comparedPlaces}
                    pinnedPlaces={taggedPlaces}
                    itinerary={itinerary}
                    areaInsight={areaInsight}
                    budget={budgetData}
                    foodRecommendations={foodRecommendations}
                    
                    selectedPlaceId={selectedPlaceId}
                    pinnedPlaceIds={taggedPlaces.map(p => p.id)}
                    
                    onSelectPlace={handleSelectPlaceFromWorkspace}
                    onPinPlace={handlePinPlace}
                    onRemovePin={(id) => untagPlace(id)}
                    onComparePlace={handleComparePlace}
                    onRemoveFromComparison={(id) => setComparedPlaces(prev => prev.filter(p => p.id !== id))}
                    onAskAIAboutPlace={handleAskAIAboutPlace}
                    onHoverPlace={(id) => setSelectedPlaceId(id)}
                    onOptimizeRoute={() => handleSendMessage('Tối ưu hóa lịch trình đường đi')}
                    onAddFood={() => handleSendMessage('Gợi ý quán ăn ngon lân cận')}
                    onMakeCheaper={() => handleSendMessage('Lên dự toán chi phí tiết kiệm hơn')}
                    onMakeRelaxing={() => handleSendMessage('Đưa ra lịch trình du lịch nhẹ nhàng thư giãn')}
                    onSelectFood={(food) => {
                      const lat = Number(food.lat ?? food.latitude ?? userLocation?.lat ?? FALLBACK_CENTER.lat);
                      const lng = Number(food.lng ?? food.longitude ?? userLocation?.lng ?? FALLBACK_CENTER.lng);
                      focusMapAt({ lat, lng });
                    }}
                    onAddToItinerary={(f) => handleSendMessage(`Thêm quán ăn ${f.name} vào lịch trình`)}
                    onCreateItinerary={onCreateItinerary}
                    onDirections={handleDirections}
                    
                    activePanel={activeWorkspaceTab}
                    setActivePanel={setActiveWorkspaceTab}
                    onClosePanel={handleClosePanel}
                  />
                </div>
              )}
              {activeMobileTab === 'map' && (
                <div className="w-full h-full pointer-events-none" /> /* Just show map in background */
              )}
            </div>
          </div>
        )}

        {/* Quick Location Button */}
        <div
          className="absolute z-20 flex gap-2 transition-all duration-300 ease-out pointer-events-auto"
          style={{
            bottom: isMobile ? '72px' : `${DESKTOP_PANEL_GAP}px`,
            left: isMobile
              ? `${DESKTOP_PANEL_GAP}px`
              : (isWorkspaceExpanded
                ? `${DESKTOP_PANEL_GAP + DESKTOP_WORKSPACE_WIDTH + DESKTOP_PANEL_GAP}px`
                : `${DESKTOP_PANEL_GAP}px`),
          }}
        >
          <button
            onClick={requestCurrentLocation}
            disabled={locationStatus === 'loading'}
            title={locationStatus === 'loading' ? 'Đang tìm vị trí...' : 'Lấy vị trí của tôi'}
            className="h-11 w-11 bg-ink-900 text-white rounded-2xl shadow-soft hover:bg-ink-700 transition disabled:opacity-50 flex items-center justify-center"
          >
            <Navigation className={`w-5 h-5 text-primary-300 ${locationStatus === 'loading' ? 'animate-spin' : ''}`} />
          </button>

          {(route?.length || appState === APP_STATES.ROUTING) && (
            <button
              onClick={handleStopRouting}
              title="Ngừng chỉ đường"
              className="inline-flex items-center px-4 h-11 bg-rose-50 rounded-2xl shadow-soft border border-rose-200 text-rose-700 hover:bg-rose-100 transition text-xs font-bold"
            >
              <Route className="w-4 h-4 mr-2" />
              Dừng chỉ đường
            </button>
          )}
        </div>

        {/* Error notification */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 w-[min(88vw,26rem)] pointer-events-auto"
          style={{ top: '16px' }}
        >
          {error && (
            <div className="w-full bg-white border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-2xl flex items-start gap-2 shadow-soft animate-soft-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold">{error}</p>
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
      </div>

      {/* Mobile Tab Navigation bar */}
      {isMobile && (
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-ink-900 text-white border-t border-ink-800 flex items-center justify-around z-30 shadow-card">
          <button
            onClick={() => setActiveMobileTab('workspace')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition text-xs ${
              activeMobileTab === 'workspace' ? 'text-primary-400 bg-white/5 font-black' : 'text-slate-400'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Workspace</span>
          </button>
          <button
            onClick={() => setActiveMobileTab('map')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition text-xs ${
              activeMobileTab === 'map' ? 'text-primary-400 bg-white/5 font-black' : 'text-slate-400'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Bản đồ</span>
          </button>
        </div>
      )}
    </div>
  );
}
