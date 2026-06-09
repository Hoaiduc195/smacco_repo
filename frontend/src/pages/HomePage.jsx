import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertCircle, BarChart3, Compass, Lightbulb, MapPin, Route, Navigation, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import LeftContextPanel from '../components/LeftContextPanel';
import WorkspaceRail from '../components/WorkspaceRail';
import SearchResultsPanel from '../components/SearchResultsPanel';
import ComparePlacesPanel from '../components/ComparePlacesPanel';
import PlaceInsightPanel from '../components/PlaceInsightPanel';
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
const PANEL_IDS = {
  RESULTS: 'results',
  COMPARE: 'compare',
  INSIGHT: 'insight',
};
const PANEL_OPTIONS = [
  { id: PANEL_IDS.RESULTS, label: 'Danh sách tìm kiếm', shortLabel: 'Kết quả', icon: Search },
  { id: PANEL_IDS.COMPARE, label: 'So sánh địa điểm', shortLabel: 'So sánh', icon: BarChart3 },
  { id: PANEL_IDS.INSIGHT, label: 'Insight địa điểm', shortLabel: 'Insight', icon: Lightbulb },
];

const normalizePanelId = (panelId) => {
  if (panelId === null) return null;
  if (panelId === 'search' || panelId === 'pinned') return PANEL_IDS.RESULTS;
  if (panelId === 'comparison') return PANEL_IDS.COMPARE;
  if (panelId === 'results' || panelId === 'compare' || panelId === 'insight') return panelId;
  return null;
};

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
  const [areaInsight, setAreaInsight] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState('map'); // 'workspace' | 'map'

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
      if (saved.areaInsight !== undefined) setAreaInsight(saved.areaInsight);
      if (saved.activePanel === null) {
        setActivePanel(null);
      } else if (typeof saved.activePanel === 'string' || typeof saved.activeWorkspaceTab === 'string') {
        setActivePanel(normalizePanelId(saved.activePanel || saved.activeWorkspaceTab));
      }
      if (typeof saved.activeMobileTab === 'string') setActiveMobileTab(saved.activeMobileTab);
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

  const showSearchResults = useCallback((results = []) => {
    const transformed = results.map(place => ({
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
      coverImageUrl: place.coverImageUrl,
      photoUrl: place.photoUrl,
    }));

    setPlaces(transformed);
    setSelectedPlaceId(null);
    setRoute([]);
    setActivePanel(PANEL_IDS.RESULTS);
    if (isMobile) setActiveMobileTab('workspace');
  }, [isMobile]);

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

      showSearchResults(results);
    } catch (err) {
      setError(err.message);
      console.error('Unified search error:', err);
    }
  }, [showSearchResults, transitionTo]);

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

    if (Array.isArray(filters.results)) {
      showSearchResults(filters.results);
      return;
    }

    performUnifiedSearch(query, {
      type: filters.type || (Array.isArray(filters.types) ? filters.types.join(',') : placeType),
      locationInput: filters.location || locationInput,
      budget: normalizedBudget || budget,
    });
  }, [performUnifiedSearch, placeType, locationInput, budget, normalizeBudget, showSearchResults]);

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
      setActivePanel(PANEL_IDS.RESULTS);
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
    tagPlace(place);
    setActivePanel(PANEL_IDS.COMPARE);
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

  // Interaction Sync (Phase 4): clicking marker expands workspace panel
  const handleMarkerClick = (place) => {
    setSelectedPlaceId(place.id);
    focusMapAt({ lat: place.lat, lng: place.lng }, 15);
    setActivePanel(PANEL_IDS.RESULTS);

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
      areaInsight,
      activePanel,
      activeMobileTab,
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
    areaInsight,
    activePanel,
    activeMobileTab,
  ]);

  // Navbar redirection to Chat Widget message submission
  const handleSearchSubmit = (queryToSearch) => {
    if (!queryToSearch.trim()) return;
    handleSendMessage(queryToSearch);
  };

  const selectedContextPlace =
    places.find((place) => String(place.id) === String(selectedPlaceId)) ||
    taggedPlaces.find((place) => String(place.id) === String(selectedPlaceId)) ||
    ownedPlaces.find((place) => String(place.id) === String(selectedPlaceId));

  const closeSidebar = useCallback(() => {
    setActivePanel(null);
    if (isMobile) setActiveMobileTab('map');
  }, [isMobile]);

  const togglePanel = useCallback((panelId) => {
    if (activePanel === panelId) {
      closeSidebar();
      return;
    }
    setActivePanel(panelId);
    if (isMobile) setActiveMobileTab('workspace');
  }, [activePanel, closeSidebar, isMobile]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && activePanel) {
        closeSidebar();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activePanel, closeSidebar]);

  const activePanelMeta = PANEL_OPTIONS.find((panel) => panel.id === activePanel);

  const renderActiveContextPanel = () => {
    if (!activePanel) return null;

    return (
      <LeftContextPanel activePanel={activePanel} onCollapse={closeSidebar}>
        {activePanel === PANEL_IDS.RESULTS && (
            <SearchResultsPanel
              places={places}
              selectedPlaceId={selectedPlaceId}
              pinnedPlaceIds={taggedPlaces.map((place) => place.id)}
              onSelectPlace={handleSelectPlaceFromWorkspace}
              onPinPlace={handlePinPlace}
              onComparePlace={handleComparePlace}
              onDirections={handleDirections}
              onHoverPlace={(id) => setSelectedPlaceId(id)}
            />
        )}
        {activePanel === PANEL_IDS.COMPARE && (
          <ComparePlacesPanel
            taggedPlaces={taggedPlaces}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={handleSelectPlaceFromWorkspace}
            onRemoveTaggedPlace={(id) => untagPlace(id)}
            onDirections={handleDirections}
            onAskAIAboutPlace={handleAskAIAboutPlace}
            onRequestAiCompare={() => handleSendMessage('So sánh các địa điểm tôi đã tag giúp tôi')}
          />
        )}
        {activePanel === PANEL_IDS.INSIGHT && (
          <PlaceInsightPanel
            selectedPlace={selectedContextPlace}
            insight={areaInsight}
            onAskAIAboutPlace={handleAskAIAboutPlace}
            onDirections={handleDirections}
          />
        )}
      </LeftContextPanel>
    );
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
          <div className={`left-workspace-layout pointer-events-none z-40 ${activePanel ? 'is-open' : ''}`}>
            <div className="pointer-events-auto">
              <WorkspaceRail
                activePanel={activePanel}
                items={PANEL_OPTIONS}
                onTogglePanel={togglePanel}
                onClose={closeSidebar}
              />
            </div>
            {activePanel ? (
              <div className="pointer-events-auto h-full min-h-0 overflow-hidden animate-panel-in-left">
                {renderActiveContextPanel()}
              </div>
            ) : null}
          </div>
        )}

        {/* Mobile Layout Tab Contents */}
        {isMobile && (
          <div className="absolute inset-0 flex flex-col z-10 pointer-events-none p-3 pb-16">
            <div className="flex-1 w-full pointer-events-auto overflow-hidden">
              {activeMobileTab === 'workspace' && (
                <div className="flex h-full w-full flex-col gap-2">
                  <div className="rounded-3xl border border-base-200 bg-white/95 p-2 shadow-soft backdrop-blur-xl">
                    <div className="mb-2 flex items-center justify-between px-2">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wide text-primary-700">Bảng AI</p>
                        <p className="text-sm font-black text-ink-900">
                          {activePanelMeta?.label || 'Chọn bảng làm việc'}
                        </p>
                      </div>
                      {activePanel ? (
                        <button
                          type="button"
                          onClick={closeSidebar}
                          className="rounded-xl border border-base-200 px-3 py-1.5 text-xs font-bold text-ink-600"
                        >
                          Đóng
                        </button>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {PANEL_OPTIONS.map(({ id, shortLabel, icon: Icon }) => {
                        const isActive = activePanel === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => togglePanel(id)}
                            className={`flex items-center justify-center gap-1.5 rounded-2xl px-2 py-2 text-xs font-black transition ${
                              isActive
                                ? 'bg-ink-900 text-white shadow-soft'
                                : 'bg-base-50 text-ink-600 hover:bg-primary-50 hover:text-primary-700'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {shortLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="min-h-0 flex-1">
                    {renderActiveContextPanel()}
                  </div>
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
              : (activePanel
                ? 'calc(var(--workspace-left-inset) + var(--workspace-rail-width) + var(--workspace-gap) + var(--workspace-panel-width) + 20px)'
                : 'calc(var(--workspace-left-inset) + var(--workspace-rail-width) + 20px)'),
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
            <span>Bảng AI</span>
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
