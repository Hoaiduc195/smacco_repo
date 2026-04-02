import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';

const DEFAULT_CENTER = { lat: 21.0285, lng: 105.8542 };

const iconForType = (type) => {
  const palette = {
    hotel: '#2563eb',
    hostel: '#0ea5e9',
    homestay: '#d97706',
    resort: '#16a34a',
    apartment: '#7c3aed',
    default: '#ef4444',
  };
  const color = palette[type] || palette.default;
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 2px ${color}33"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
};

const UserLocationMarker = ({ userLocation }) => {
  if (!userLocation) return null;
  return (
    <Marker
      position={[userLocation.lat, userLocation.lng]}
      icon={L.divIcon({
        className: 'user-marker',
        html: '<div style="background:#0ea5e9;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 2px #0ea5e933"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })}
    >
      <Popup>Vị trí của bạn</Popup>
    </Marker>
  );
};

const FitBounds = ({ places, userLocation }) => {
  const map = useMap();
  useEffect(() => {
    const points = [];
    if (userLocation?.lat && userLocation?.lng) points.push([userLocation.lat, userLocation.lng]);
    places.forEach((p) => {
      if (p.lat && p.lng) points.push([p.lat, p.lng]);
    });
    if (!points.length) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, places, userLocation]);
  return null;
};

export default function RecommendationMap({ places = [], userLocation, mapStyle = 'standard' }) {
  const center = useMemo(() => {
    if (userLocation?.lat && userLocation?.lng) return [userLocation.lat, userLocation.lng];
    const first = places.find((p) => p.lat && p.lng);
    if (first) return [first.lat, first.lng];
    return [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];
  }, [places, userLocation]);

  const tileLayers = {
    standard: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attr: '© OpenStreetMap contributors',
    },
    light: {
      url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      attr: '© OpenStreetMap, Tiles courtesy of Humanitarian OpenStreetMap Team',
    },
    terrain: {
      url: 'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
      attr: 'Map tiles by Stamen Design, CC BY 3.0 — Map data © OpenStreetMap',
    },
  };

  return (
    <MapContainer center={center} zoom={13} className="w-full h-64 md:h-80 lg:h-96 rounded-xl border border-gray-200" scrollWheelZoom>
      <LayersControl position="topright">
        {Object.entries(tileLayers).map(([key, cfg]) => (
          <LayersControl.BaseLayer key={key} name={key} checked={mapStyle === key}>
            <TileLayer url={cfg.url} attribution={cfg.attr} />
          </LayersControl.BaseLayer>
        ))}
      </LayersControl>

      <UserLocationMarker userLocation={userLocation} />

      {places.map((place) => (
        <Marker key={place.id || place.location_id || `${place.lat}-${place.lng}`} position={[place.lat, place.lng]} icon={iconForType(place.type)}>
          <Popup>
            <div className="space-y-1">
              <div className="font-semibold text-sm">{place.name}</div>
              {place.address && <div className="text-xs text-gray-600">{place.address}</div>}
              {place.rating && <div className="text-xs">⭐ {place.rating}</div>}
            </div>
          </Popup>
        </Marker>
      ))}

      <FitBounds places={places} userLocation={userLocation} />
    </MapContainer>
  );
}
