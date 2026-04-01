import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issues in Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIconRetina,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function MapComponent({ userLocation, onMarkerClick, places = [] }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Create map only once
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([21.0285, 105.8542], 13);

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      // Don't destroy map on unmount - keep it persistent
    };
  }, []);

  // Add user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;

    // Remove old user marker
    if (markersRef.current.user) {
      mapInstanceRef.current.removeLayer(markersRef.current.user);
    }

    // Add new user marker
    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: L.icon({
        iconUrl: markerIcon,
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        shadowSize: [41, 41],
        shadowAnchor: [12, 41],
      }),
    })
      .bindPopup('📍 Vị trí của bạn')
      .addTo(mapInstanceRef.current);

    markersRef.current.user = userMarker;

    // Center map on user location
    mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 15);
  }, [userLocation]);

  // Add place markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear old place markers
    Object.keys(markersRef.current).forEach((key) => {
      if (key !== 'user') {
        mapInstanceRef.current.removeLayer(markersRef.current[key]);
        delete markersRef.current[key];
      }
    });

    // Add new place markers
    places.forEach((place) => {
      if (place.lat && place.lng) {
        const marker = L.marker([place.lat, place.lng])
          .bindPopup(`<div class="font-semibold">${place.name}</div><small>${place.address || ''}</small>`)
          .addTo(mapInstanceRef.current);

        if (onMarkerClick) {
          marker.on('click', () => {
            onMarkerClick(place);
          });
        }

        markersRef.current[`place-${place.id}`] = marker;
      }
    });
  }, [places, onMarkerClick]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ 
        minHeight: '100%',
        height: '100%'
      }}
    />
  );
}
