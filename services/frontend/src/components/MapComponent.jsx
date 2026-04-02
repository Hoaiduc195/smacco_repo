import { MapContainer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useCallback, useEffect, useMemo, useRef } from 'react';

const DEFAULT_CENTER = { lat: 21.0285, lng: 105.8542 };

const TILE_LAYERS = {
  standard: {
    label: 'OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '© OpenStreetMap contributors',
  },
};

const createEmojiIcon = (emoji, background) =>
  L.divIcon({
    className: 'poi-icon',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:12px;background:${background};color:#111;font-size:16px;border:1px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.18)">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -26],
  });

const poiIconFor = {
  hotel: createEmojiIcon('🏨', '#e0e7ff'),
  resort: createEmojiIcon('🏖️', '#dcfce7'),
  homestay: createEmojiIcon('🏡', '#fde68a'),
  restaurant: createEmojiIcon('🍜', '#fee2e2'),
  cafe: createEmojiIcon('☕', '#e2e8f0'),
  default: createEmojiIcon('📍', '#e5e7eb'),
};

const placeIconForType = (type) => {
  const palette = {
    hotel: '#2563eb',
    resort: '#16a34a',
    homestay: '#d97706',
    guesthouse: '#7c3aed',
    default: '#ef4444',
  };
  const color = palette[type] || palette.default;
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 2px ${color}33"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const UserLocationMarker = ({ userLocation }) => {
  if (!userLocation) return null;
  return (
    <Marker
      position={[userLocation.lat, userLocation.lng]}
      icon={L.divIcon({
        className: 'user-marker',
        html: '<div style="background:#0ea5e9;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 2px #0ea5e933"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      })}
    >
      <Popup>Vị trí của bạn</Popup>
    </Marker>
  );
};

const FitBounds = ({ places, userLocation, route }) => {
  const map = useMap();
  useEffect(() => {
    const points = [];
    if (userLocation?.lat && userLocation?.lng) points.push([userLocation.lat, userLocation.lng]);
    places.forEach((p) => {
      if (p.lat && p.lng) points.push([p.lat, p.lng]);
    });
    if (route && route.length) {
      route.forEach((pt) => points.push([pt[0], pt[1]]));
    }
    if (!points.length) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, places, userLocation, route]);
  return null;
};

const TileLayerManager = ({ mapStyle, cacheRef, onLoading, onLoaded }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const activeKey = mapStyle in TILE_LAYERS ? mapStyle : 'standard';
    Object.entries(TILE_LAYERS).forEach(([key, cfg]) => {
      if (!cacheRef.current[key]) {
        const layer = L.tileLayer(cfg.url, {
          attribution: cfg.attr,
          maxZoom: 19,
          updateWhenIdle: true,
          updateWhenZooming: false,
          className: 'tile-fade',
        });
        if (onLoading) layer.on('loading', onLoading);
        if (onLoaded) layer.on('load', onLoaded);
        cacheRef.current[key] = layer;
        layer.addTo(map);
        layer.setOpacity(key === activeKey ? 1 : 0);
      } else if (!map.hasLayer(cacheRef.current[key])) {
        cacheRef.current[key].addTo(map);
      }
    });

    Object.entries(cacheRef.current).forEach(([key, layer]) => {
      if (key === activeKey) {
        layer.setOpacity(1);
        layer.bringToFront();
      } else {
        layer.setOpacity(0);
      }
    });
  }, [map, mapStyle, cacheRef, onLoading, onLoaded]);
  return null;
};

const MapControls = ({ onZoomIn, onZoomOut }) => (
  <div className="pointer-events-none absolute inset-0">
    <div className="absolute bottom-4 right-4 pointer-events-auto flex flex-col gap-2">
      <button
        onClick={onZoomIn}
        className="bg-white rounded-lg shadow-lg border border-gray-200 w-11 h-11 flex items-center justify-center text-gray-800 hover:bg-gray-50"
        aria-label="Phóng to"
      >
        +
      </button>
      <button
        onClick={onZoomOut}
        className="bg-white rounded-lg shadow-lg border border-gray-200 w-11 h-11 flex items-center justify-center text-gray-800 hover:bg-gray-50"
        aria-label="Thu nhỏ"
      >
        −
      </button>
    </div>
  </div>
);

export default function MapComponent({
  userLocation,
  onMarkerClick,
  places = [],
  selectedPlaceId,
  route = [],
  mapStyle = 'standard',
  pois = [],
  invalidateKey,
}) {
  const mapRef = useRef(null);
  const tileCacheRef = useRef({});

  const center = useMemo(() => {
    if (userLocation?.lat && userLocation?.lng) return [userLocation.lat, userLocation.lng];
    const firstPlace = places.find((p) => p.lat && p.lng);
    if (firstPlace) return [firstPlace.lat, firstPlace.lng];
    return [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];
  }, [places, userLocation]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.invalidateSize();
  }, [invalidateKey]);

  const placeMarkers = useMemo(
    () =>
      places.map((place) => (
        <Marker
          key={place.id || `${place.lat}-${place.lng}`}
          position={[place.lat, place.lng]}
          icon={placeIconForType(place.type)}
          eventHandlers={{
            click: () => onMarkerClick?.(place),
          }}
          opacity={selectedPlaceId && selectedPlaceId !== place.id ? 0.65 : 1}
        >
          <Popup>
            <div className="space-y-1">
              <div className="font-semibold text-sm">{place.name}</div>
              {place.address && <div className="text-xs text-gray-600">{place.address}</div>}
              {place.rating && <div className="text-xs">⭐ {place.rating}</div>}
            </div>
          </Popup>
        </Marker>
      )),
    [onMarkerClick, places, selectedPlaceId]
  );

  const poiMarkers = useMemo(
    () =>
      pois.map((poi) => (
        <Marker
          key={poi.id || `${poi.lat}-${poi.lng}`}
          position={[poi.lat, poi.lng]}
          icon={poiIconFor[poi.category] || poiIconFor.default}
        >
          <Popup>
            <div className="space-y-1">
              <div className="font-semibold text-sm">{poi.name || 'Địa điểm'}</div>
              {poi.address && <div className="text-xs text-gray-600">{poi.address}</div>}
              <div className="text-xs text-gray-500 uppercase">{poi.category}</div>
            </div>
          </Popup>
        </Marker>
      )),
    [pois]
  );

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={13}
        className="w-full h-full"
        zoomControl={false}
        scrollWheelZoom
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
      >
          <TileLayerManager mapStyle={mapStyle} cacheRef={tileCacheRef} />
        <UserLocationMarker userLocation={userLocation} />

        <MarkerClusterGroup chunkedLoading spiderfyOnMaxZoom disableClusteringAtZoom={18} maxClusterRadius={40}>
          {poiMarkers}
          {placeMarkers}
        </MarkerClusterGroup>

        {route && route.length ? (
          <Polyline positions={route} color="#2563eb" weight={5} opacity={0.7} />
        ) : null}

        <FitBounds places={places} userLocation={userLocation} route={route} />
      </MapContainer>

      <MapControls
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
      />
    </div>
  );
}
