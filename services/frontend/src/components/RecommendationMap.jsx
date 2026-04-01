import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_CENTER = { lat: 21.0285, lng: 105.8542 };

const loadGoogleMaps = (() => {
  let loader;
  return (apiKey) => {
    if (window.google && window.google.maps) return Promise.resolve();
    if (loader) return loader;
    loader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
    return loader;
  };
})();

export default function RecommendationMap({ places = [], userLocation }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [error, setError] = useState('');

  const center = useMemo(() => {
    if (userLocation?.lat && userLocation?.lng) return userLocation;
    const first = places.find((p) => p.lat && p.lng);
    if (first) return { lat: first.lat, lng: first.lng };
    return DEFAULT_CENTER;
  }, [places, userLocation]);

  useEffect(() => {
    if (!apiKey) {
      setError('Thiếu VITE_GOOGLE_MAPS_API_KEY');
      return undefined;
    }
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled) return;
        if (!mapInstanceRef.current && mapRef.current) {
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
        } else if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(center);
        }
      })
      .catch(() => {
        setError('Không tải được Google Maps.');
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey, center]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasBounds = false;

    if (userLocation?.lat && userLocation?.lng) {
      const marker = new window.google.maps.Marker({
        position: userLocation,
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: 'Vị trí của bạn',
      });
      markersRef.current.push(marker);
      bounds.extend(userLocation);
      hasBounds = true;
    }

    places.forEach((place) => {
      if (!place.lat || !place.lng) return;
      const marker = new window.google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map: mapInstanceRef.current,
        title: place.name,
      });
      const info = new window.google.maps.InfoWindow({
        content: `<div style="max-width:220px"><div style="font-weight:600">${place.name || ''}</div><div style="font-size:12px;color:#4b5563">${place.address || ''}</div></div>`,
      });
      marker.addListener('click', () => info.open({ anchor: marker, map: mapInstanceRef.current }));
      markersRef.current.push(marker);
      bounds.extend(marker.getPosition());
      hasBounds = true;
    });

    if (hasBounds) {
      mapInstanceRef.current.fitBounds(bounds, 80);
    } else {
      mapInstanceRef.current.setCenter(center);
      mapInstanceRef.current.setZoom(13);
    }
  }, [places, userLocation, center]);

  if (error) {
    return (
      <div className="w-full h-64 rounded-xl border border-gray-200 flex items-center justify-center text-sm text-red-600 bg-red-50">
        {error}
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-64 md:h-80 lg:h-96 rounded-xl border border-gray-200" />;
}
