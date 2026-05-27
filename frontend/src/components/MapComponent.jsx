import { useCallback, useEffect, useMemo, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const DEFAULT_CENTER = { lat: 21.0285, lng: 105.8542 };
const DEFAULT_ZOOM = 13;
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const MAPBOX_STYLES = {
  standard: 'mapbox://styles/mapbox/streets-v12',
  clean: 'mapbox://styles/mapbox/light-v11',
  terrain: 'mapbox://styles/mapbox/outdoors-v12',
};

const OSM_RASTER_STYLES = {
  standard: {
    version: 8,
    sources: {
      carto: {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors © CARTO',
      },
    },
    layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
  },
  clean: {
    version: 8,
    sources: {
      carto: {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors © CARTO',
      },
    },
    layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
  },
  terrain: {
    version: 8,
    sources: {
      opentopo: {
        type: 'raster',
        tiles: ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors, SRTM | OpenTopoMap',
      },
    },
    layers: [{ id: 'opentopo', type: 'raster', source: 'opentopo' }],
  },
};

const POINT_SOURCE_ID = 'smacco-points';
const ROUTE_SOURCE_ID = 'smacco-route';
const USER_SOURCE_ID = 'smacco-user-location';

const getMapStyle = (mapStyle) => {
  const key = mapStyle in MAPBOX_STYLES ? mapStyle : 'standard';
  if (MAPBOX_TOKEN) return MAPBOX_STYLES[key];
  return OSM_RASTER_STYLES[key] || OSM_RASTER_STYLES.standard;
};

const isValidPoint = (item) => Number.isFinite(Number(item?.lat)) && Number.isFinite(Number(item?.lng));

const toPointFeature = (item, kind) => ({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [Number(item.lng), Number(item.lat)],
  },
  properties: {
    id: String(item.id || `${item.lat}-${item.lng}`),
    kind,
    name: item.name || item.placeName || 'Địa điểm',
    address: item.address || '',
    type: item.type || item.category || 'default',
    rating: item.rating || '',
    isSelected: false,
    payload: JSON.stringify(item),
  },
});

const buildPointCollection = ({ places, ownedPlaces, pois, selectedPlaceId }) => ({
  type: 'FeatureCollection',
  features: [
    ...pois.filter(isValidPoint).map((poi) => toPointFeature(poi, 'poi')),
    ...places.filter(isValidPoint).map((place) => ({
      ...toPointFeature(place, 'place'),
      properties: {
        ...toPointFeature(place, 'place').properties,
        isSelected: selectedPlaceId === place.id,
      },
    })),
    ...ownedPlaces.filter(isValidPoint).map((place) => toPointFeature(place, 'owned')),
  ],
});

const buildRouteCollection = (route) => ({
  type: 'FeatureCollection',
  features: route?.length
    ? [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: route.map(([lat, lng]) => [Number(lng), Number(lat)]),
          },
          properties: {},
        },
      ]
    : [],
});

const buildUserCollection = (userLocation) => ({
  type: 'FeatureCollection',
  features: isValidPoint(userLocation)
    ? [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [Number(userLocation.lng), Number(userLocation.lat)],
          },
          properties: { name: 'Vị trí của bạn' },
        },
      ]
    : [],
});

const popupHtml = (feature, showDirections = true) => {
  const { name, address, rating, kind } = feature.properties || {};
  const kindLabel = kind === 'owned' ? 'Địa điểm đã lưu' : kind === 'poi' ? 'Gợi ý gần đây' : '';
  return `
    <div style="min-width:180px;max-width:240px">
      <div style="font-weight:800;font-size:14px;color:#191512;margin-bottom:4px">${name || 'Địa điểm'}</div>
      ${address ? `<div style="font-size:12px;color:#6b665e;margin-bottom:6px">${address}</div>` : ''}
      ${rating ? `<div style="font-size:12px;color:#ea580c;margin-bottom:6px">★ ${rating}</div>` : ''}
      ${kindLabel ? `<div style="font-size:11px;color:#208f7c;margin-bottom:8px;font-weight:800">${kindLabel}</div>` : ''}
      ${
        showDirections
          ? '<button type="button" data-smacco-directions="true" style="border:0;border-radius:14px;background:#208f7c;color:#fff;padding:8px 11px;font-size:12px;font-weight:800;cursor:pointer">Chỉ đường</button>'
          : ''
      }
    </div>
  `;
};

export default function MapComponent({
  userLocation,
  followUserLocation = false,
  currentLocationZoom = 18,
  onUserMapInteraction,
  onMarkerClick,
  onDirectionsRequested,
  places = [],
  selectedPlaceId,
  ownedPlaces = [],
  onOwnedMarkerClick,
  route = [],
  mapStyle = 'standard',
  pois = [],
  focusTarget,
  disableAutoFit = false,
  invalidateKey,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const lastFocusIdRef = useRef(null);
  const hasFollowFocusedRef = useRef(false);
  const dataRef = useRef({ places: [], ownedPlaces: [], pois: [] });
  const pointDataRef = useRef({ type: 'FeatureCollection', features: [] });
  const routeDataRef = useRef({ type: 'FeatureCollection', features: [] });
  const userDataRef = useRef({ type: 'FeatureCollection', features: [] });
  const callbacksRef = useRef({ onMarkerClick, onOwnedMarkerClick, onDirectionsRequested, onUserMapInteraction });

  const center = useMemo(() => {
    if (isValidPoint(userLocation)) return [Number(userLocation.lng), Number(userLocation.lat)];
    const firstPlace = places.find(isValidPoint);
    if (firstPlace) return [Number(firstPlace.lng), Number(firstPlace.lat)];
    return [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat];
  }, [places, userLocation]);

  const pointData = useMemo(
    () => buildPointCollection({ places, ownedPlaces, pois, selectedPlaceId }),
    [ownedPlaces, places, pois, selectedPlaceId]
  );

  const routeData = useMemo(() => buildRouteCollection(route), [route]);
  const userData = useMemo(() => buildUserCollection(userLocation), [userLocation]);

  useEffect(() => {
    callbacksRef.current = { onMarkerClick, onOwnedMarkerClick, onDirectionsRequested, onUserMapInteraction };
  }, [onDirectionsRequested, onMarkerClick, onOwnedMarkerClick, onUserMapInteraction]);

  useEffect(() => {
    dataRef.current = { places, ownedPlaces, pois };
  }, [ownedPlaces, places, pois]);

  useEffect(() => {
    pointDataRef.current = pointData;
  }, [pointData]);

  useEffect(() => {
    routeDataRef.current = routeData;
  }, [routeData]);

  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  const addSourcesAndLayers = useCallback((map) => {
    if (!map.getSource(POINT_SOURCE_ID)) {
      map.addSource(POINT_SOURCE_ID, {
        type: 'geojson',
        data: pointDataRef.current,
        cluster: true,
        clusterMaxZoom: 15,
        clusterRadius: 42,
      });

      map.addLayer({
        id: 'smacco-clusters',
        type: 'circle',
        source: POINT_SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#0f172a',
          'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 30, 28],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
          'circle-opacity': 0.88,
        },
      });

      map.addLayer({
        id: 'smacco-cluster-count',
        type: 'symbol',
        source: POINT_SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      map.addLayer({
        id: 'smacco-points-shadow',
        type: 'circle',
        source: POINT_SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': ['case', ['==', ['get', 'isSelected'], true], 14, 11],
          'circle-color': '#020617',
          'circle-opacity': 0.18,
          'circle-translate': [0, 2],
        },
      });

      map.addLayer({
        id: 'smacco-points',
        type: 'circle',
        source: POINT_SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': ['case', ['==', ['get', 'isSelected'], true], 10, 8],
          'circle-color': [
            'match',
            ['get', 'kind'],
            'owned',
            '#1d4ed8',
            'poi',
            '#f59e0b',
            '#0891b2',
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': ['case', ['==', ['get', 'isSelected'], true], 4, 2],
          'circle-opacity': ['case', ['==', ['get', 'isSelected'], true], 1, 0.92],
        },
      });
    }

    if (!map.getSource(ROUTE_SOURCE_ID)) {
      map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: routeDataRef.current });
      map.addLayer({
        id: 'smacco-route-casing',
        type: 'line',
        source: ROUTE_SOURCE_ID,
        paint: {
          'line-color': '#ffffff',
          'line-width': 8,
          'line-opacity': 0.85,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      });
      map.addLayer({
        id: 'smacco-route',
        type: 'line',
        source: ROUTE_SOURCE_ID,
        paint: {
          'line-color': '#0369a1',
          'line-width': 5,
          'line-opacity': 0.92,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      });
    }

    if (!map.getSource(USER_SOURCE_ID)) {
      map.addSource(USER_SOURCE_ID, { type: 'geojson', data: userDataRef.current });
      map.addLayer({
        id: 'smacco-user-accuracy',
        type: 'circle',
        source: USER_SOURCE_ID,
        paint: {
          'circle-radius': 20,
          'circle-color': '#0284c7',
          'circle-opacity': 0.14,
        },
      });
      map.addLayer({
        id: 'smacco-user-location',
        type: 'circle',
        source: USER_SOURCE_ID,
        paint: {
          'circle-radius': 8,
          'circle-color': '#0284c7',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 3,
        },
      });
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    if (MAPBOX_TOKEN) {
      mapboxgl.accessToken = MAPBOX_TOKEN;
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: getMapStyle(mapStyle),
      center,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
      pitch: 0,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

    const handleLoad = () => {
      addSourcesAndLayers(map);
    };

    const handleMoveStart = (event) => {
      if (event?.originalEvent) callbacksRef.current.onUserMapInteraction?.('pan');
    };

    const handleZoomStart = (event) => {
      if (event?.originalEvent) callbacksRef.current.onUserMapInteraction?.('zoom');
    };

    const handlePointClick = (event) => {
      const feature = event.features?.[0];
      if (!feature) return;

      const payload = JSON.parse(feature.properties?.payload || '{}');
      if (feature.properties?.kind === 'owned') {
        callbacksRef.current.onOwnedMarkerClick?.(payload);
      } else if (feature.properties?.kind === 'place') {
        callbacksRef.current.onMarkerClick?.(payload);
      }

      popupRef.current?.remove();
      const popupNode = document.createElement('div');
      popupNode.innerHTML = popupHtml(feature);
      const directionButton = popupNode.querySelector('[data-smacco-directions="true"]');
      directionButton?.addEventListener('click', () => callbacksRef.current.onDirectionsRequested?.(payload));

      popupRef.current = new mapboxgl.Popup({ offset: 18, closeButton: false })
        .setLngLat(feature.geometry.coordinates)
        .setDOMContent(popupNode)
        .addTo(map);
    };

    const handleClusterClick = (event) => {
      const features = map.queryRenderedFeatures(event.point, { layers: ['smacco-clusters'] });
      const clusterId = features[0]?.properties?.cluster_id;
      if (clusterId === undefined) return;
      map.getSource(POINT_SOURCE_ID).getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        map.easeTo({ center: features[0].geometry.coordinates, zoom, duration: 450 });
      });
    };

    const setPointer = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const resetPointer = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('load', handleLoad);
    map.on('movestart', handleMoveStart);
    map.on('zoomstart', handleZoomStart);
    map.on('click', 'smacco-points', handlePointClick);
    map.on('click', 'smacco-clusters', handleClusterClick);
    map.on('mouseenter', 'smacco-points', setPointer);
    map.on('mouseleave', 'smacco-points', resetPointer);
    map.on('mouseenter', 'smacco-clusters', setPointer);
    map.on('mouseleave', 'smacco-clusters', resetPointer);

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [addSourcesAndLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const applyStyle = () => addSourcesAndLayers(map);
    if (map.isStyleLoaded()) {
      map.setStyle(getMapStyle(mapStyle));
      map.once('styledata', applyStyle);
    }
  }, [addSourcesAndLayers, mapStyle]);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource(POINT_SOURCE_ID);
    if (source?.setData) source.setData(pointData);
  }, [pointData]);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource(ROUTE_SOURCE_ID);
    if (source?.setData) source.setData(routeData);
  }, [routeData]);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource(USER_SOURCE_ID);
    if (source?.setData) source.setData(userData);
  }, [userData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.resize();
  }, [invalidateKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || disableAutoFit) return;

    const points = [];
    if (isValidPoint(userLocation)) points.push([Number(userLocation.lng), Number(userLocation.lat)]);
    places.filter(isValidPoint).forEach((point) => points.push([Number(point.lng), Number(point.lat)]));
    ownedPlaces.filter(isValidPoint).forEach((point) => points.push([Number(point.lng), Number(point.lat)]));
    route?.forEach(([lat, lng]) => points.push([Number(lng), Number(lat)]));

    if (!points.length) return;
    const bounds = points.reduce((box, point) => box.extend(point), new mapboxgl.LngLatBounds(points[0], points[0]));
    map.fitBounds(bounds, { padding: 90, maxZoom: 15, duration: 650 });
  }, [disableAutoFit, ownedPlaces, places, route, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isValidPoint(focusTarget)) return;
    if (focusTarget.id && focusTarget.id === lastFocusIdRef.current) return;
    lastFocusIdRef.current = focusTarget.id || `${focusTarget.lat}:${focusTarget.lng}`;
    map.flyTo({
      center: [Number(focusTarget.lng), Number(focusTarget.lat)],
      zoom: focusTarget.zoom || 15,
      duration: 650,
      essential: true,
    });
  }, [focusTarget]);

  useEffect(() => {
    const map = mapRef.current;
    if (!followUserLocation) {
      hasFollowFocusedRef.current = false;
      return;
    }
    if (!map || !isValidPoint(userLocation)) return;

    map.flyTo({
      center: [Number(userLocation.lng), Number(userLocation.lat)],
      zoom: hasFollowFocusedRef.current ? map.getZoom() : currentLocationZoom,
      duration: hasFollowFocusedRef.current ? 450 : 650,
      essential: true,
    });
    hasFollowFocusedRef.current = true;
  }, [currentLocationZoom, followUserLocation, userLocation]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {!MAPBOX_TOKEN ? (
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-xl border border-base-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-soft">
          Mapbox GL + OSM/CARTO tiles
        </div>
      ) : null}
    </div>
  );
}
