import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Map as MapLibreMap, Marker, LngLatBounds, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Compass,
  Crosshair,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { Driver, LocationNode, RideRequest } from '../../types';
import { fetchRealHargeisaRoadRoute, HargeisaRoadRoute } from '../../utils/hargeisaRoadRouter';

interface MapLibreInteractiveMapProps {
  showSurgeHeatmap?: boolean;
  selectableMode?: 'pickup' | 'dropoff' | null;
  height?: string;
  onModeChange?: (mode: 'pickup' | 'dropoff') => void;
}

const rawCartoKey =
  (import.meta as any).env?.VITE_CARTO_API_KEY ||
  (process.env as any).CARTO_API_KEY ||
  (process.env as any).VITE_CARTO_API_KEY ||
  '';

// Clean key in case a full URL was provided
const CARTO_KEY = rawCartoKey.includes('key=')
  ? rawCartoKey.split('key=').pop()?.split('&')[0] || ''
  : rawCartoKey.replace(/^https?:\/\/[^\/]+\/?/, '');

const cartoKeyParam = CARTO_KEY ? `?api_key=${CARTO_KEY}&key=${CARTO_KEY}` : '';

// Mapbox & Vector Map Style Definitions
export type MapboxStyleKey = 'streets' | 'navigation_day' | 'navigation_night' | 'satellite' | 'outdoors' | 'custom_studio';

const MAPBOX_STYLES: Record<
  Exclude<MapboxStyleKey, 'custom_studio'>,
  { name: string; tag: string; description: string; style: any }
> = {
  streets: {
    name: 'OpenStreetMap Streets',
    tag: 'OSM Standard',
    description: 'Clean high-definition street network & POIs',
    style: {
      version: 8,
      sources: {
        'osm-streets': {
          type: 'raster',
          tiles: [
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [
        {
          id: 'streets-layer',
          type: 'raster',
          source: 'osm-streets',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
  navigation_day: {
    name: 'Mapbox Navigation',
    tag: 'Nav Day',
    description: 'High-contrast road rendering optimized for live driving',
    style: {
      version: 8,
      sources: {
        'osm-nav': {
          type: 'raster',
          tiles: [
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [
        {
          id: 'osm-nav-layer',
          type: 'raster',
          source: 'osm-nav',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
  navigation_night: {
    name: 'Mapbox Dark',
    tag: 'Nav Night',
    description: 'Low-glare dark navigation style for nighttime rides',
    style: {
      version: 8,
      sources: {
        'osm-dark': {
          type: 'raster',
          tiles: CARTO_KEY
            ? [
                `https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png${cartoKeyParam}`,
                `https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png${cartoKeyParam}`,
              ]
            : ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [
        {
          id: 'carto-dark-layer',
          type: 'raster',
          source: 'osm-dark',
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    },
  },
  satellite: {
    name: 'Mapbox Satellite HD',
    tag: 'Hybrid Satellite',
    description: 'High-resolution aerial satellite photography with road outlines',
    style: {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: '© Esri / DigitalGlobe / Earthstar',
        },
      },
      layers: [
        {
          id: 'esri-sat-layer',
          type: 'raster',
          source: 'esri-satellite',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
  outdoors: {
    name: 'Mapbox Outdoors',
    tag: 'Terrain & Hills',
    description: 'Topographical contours & terrain features around Hargeisa',
    style: {
      version: 8,
      sources: {
        'osm-outdoors': {
          type: 'raster',
          tiles: [
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [
        {
          id: 'carto-light-layer',
          type: 'raster',
          source: 'osm-outdoors',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
};

// Hargeisa Geofence Polygons for Surge & Heatmap
const HARGEISA_ZONES = [
  {
    name: 'Egal Int Airport Terminal',
    surge: 1.25,
    color: '#f59e0b',
    coordinates: [
      [44.085, 9.51],
      [44.105, 9.51],
      [44.105, 9.53],
      [44.085, 9.53],
      [44.085, 9.51],
    ],
  },
  {
    name: 'Suuq Weyn / Downtown Center',
    surge: 1.15,
    color: '#10b981',
    coordinates: [
      [44.055, 9.555],
      [44.075, 9.555],
      [44.075, 9.57],
      [44.075, 9.57],
      [44.055, 9.57],
      [44.055, 9.555],
    ],
  },
  {
    name: 'Jigjiga-Yar Commercial District',
    surge: 1.1,
    color: '#6366f1',
    coordinates: [
      [44.04, 9.57],
      [44.06, 9.57],
      [44.06, 9.585],
      [44.04, 9.585],
      [44.04, 9.57],
    ],
  },
];

// Helper: Calculate bearing angle in degrees between two GPS points
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const φ1 = lat1 * rad;
  const φ2 = lat2 * rad;
  const Δλ = (lon2 - lon1) * rad;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}

export const MapLibreInteractiveMap: React.FC<MapLibreInteractiveMapProps> = ({
  showSurgeHeatmap = false,
  selectableMode = null,
  height = '100%',
  onModeChange,
}) => {
  const {
    pickupLocation,
    dropoffLocation,
    drivers,
    currentRide,
    setPickupLocation,
    setDropoffLocation,
    role,
  } = useRide();

  // Stable references and memoized coordinates
  const EMPTY_STOPS: LocationNode[] = useMemo(() => [], []);
  const activePickup: LocationNode | null = useMemo(
    () => currentRide?.pickup || pickupLocation || null,
    [currentRide?.pickup, pickupLocation]
  );
  const activeDropoff: LocationNode | null = useMemo(
    () => currentRide?.dropoff || dropoffLocation || null,
    [currentRide?.dropoff, dropoffLocation]
  );
  const coPassengerPickup: LocationNode | null = useMemo(
    () => currentRide?.coPassenger?.pickupLocation || null,
    [currentRide?.coPassenger?.pickupLocation]
  );
  const coPassengerDropoff: LocationNode | null = useMemo(
    () => currentRide?.coPassenger?.dropoffLocation || null,
    [currentRide?.coPassenger?.dropoffLocation]
  );

  const activeStops: LocationNode[] = useMemo(() => {
    const stops: LocationNode[] = [];
    if (currentRide?.optimalWaypointsSequence && currentRide.optimalWaypointsSequence.length > 0) {
      currentRide.optimalWaypointsSequence.forEach((w) => {
        if (w.location?.lat && w.location?.lng) {
          stops.push({
            id: w.id,
            name: `${w.type === 'PICKUP' ? 'Pickup' : 'Dropoff'}: ${w.passengerName}`,
            address: w.location.address || 'Hargeisa',
            lat: w.location.lat,
            lng: w.location.lng,
          });
        }
      });
      return stops.length > 2 ? stops.slice(1, stops.length - 1) : stops;
    }
    if (coPassengerPickup) stops.push(coPassengerPickup);
    if (coPassengerDropoff) stops.push(coPassengerDropoff);
    if (currentRide?.multiStops && currentRide.multiStops.length > 0) {
      stops.push(...currentRide.multiStops);
    }
    return stops;
  }, [currentRide?.optimalWaypointsSequence, coPassengerPickup, coPassengerDropoff, currentRide?.multiStops]);

  const rideStatus = currentRide?.status;

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const driversRef = useRef<Driver[]>(drivers);
  driversRef.current = drivers;
  const currentRideRef = useRef<RideRequest | null>(currentRide);
  currentRideRef.current = currentRide;

  // References for live markers & animation
  const driverMarkersRef = useRef<Record<string, Marker>>({});
  const driverPrevCoordsRef = useRef<Record<string, { lat: number; lng: number; heading: number }>>({});
  const lastCameraCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const pickupMarkerRef = useRef<Marker | null>(null);
  const dropoffMarkerRef = useRef<Marker | null>(null);
  const coPickupMarkerRef = useRef<Marker | null>(null);
  const coDropoffMarkerRef = useRef<Marker | null>(null);
  const stopMarkersRef = useRef<Marker[]>([]);
  const gpsMarkerRef = useRef<Marker | null>(null);

  // State for Mapbox Styles & Mapbox Studio
  const [activeStyle, setActiveStyle] = useState<MapboxStyleKey>('streets');
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [customStudioUrl, setCustomStudioUrl] = useState('');
  const [mapboxAccessToken, setMapboxAccessToken] = useState('');
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [showOsmModal, setShowOsmModal] = useState(false);

  // Live Vehicle Telematics Tracking Engine (Firebase + Mapbox setData)
  const [isTrackingLiveVehicle, setIsTrackingLiveVehicle] = useState(true);
  const [followDriver, setFollowDriver] = useState(true);
  const [, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Live Navigation & Road Route State
  const [routeSummaryText, setRouteSummaryText] = useState<string | null>(null);
  const [routeDistanceKm, setRouteDistanceKm] = useState<string | null>(null);
  const [routeDurationMins, setRouteDurationMins] = useState<string | null>(null);
  const [driverApproachKm, setDriverApproachKm] = useState<string | null>(null);
  const [driverApproachMins, setDriverApproachMins] = useState<string | null>(null);
  const [approachCoords, setApproachCoords] = useState<[number, number][]>([]);

  const [selectedDriverDetails, setSelectedDriverDetails] = useState<Driver | null>(null);

  // Identify the currently assigned driver or the primary active driver
  const assignedDriver = useMemo(() => {
    if (currentRide && currentRide.assignedDriverId) {
      const matched = drivers.find((d) => d.id === currentRide.assignedDriverId);
      if (matched) return matched;
    }
    return null;
  }, [drivers, currentRide?.assignedDriverId]);

  const activeDriver = useMemo(() => {
    if (assignedDriver) return assignedDriver;
    return drivers.find((d) => d.status === 'busy' || d.status === 'available') || drivers[0] || null;
  }, [drivers, assignedDriver]);

  // Generate GeoJSON FeatureCollection for 'driver-location' source
  const generateDriverGeoJson = useCallback((driverList: Driver[]): GeoJSON.FeatureCollection => {
    const assignedId = currentRideRef.current?.assignedDriverId;
    const features: GeoJSON.Feature[] = driverList.map((driver) => {
      const lat = driver.currentLocation?.lat ?? (driver as any).lat ?? 9.56;
      const lng = driver.currentLocation?.lng ?? (driver as any).lng ?? 44.065;
      const isAssigned = assignedId === driver.id;
      const heading = (driver as any).heading || driverPrevCoordsRef.current[driver.id]?.heading || 0;

      return {
        type: 'Feature',
        id: driver.id,
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          status: driver.status || 'available',
          category: (driver as any).category || driver.vehicle?.category || 'wadaage_taxi',
          isAssigned: isAssigned ? 1 : 0,
          heading,
          rating: driver.rating || 4.9,
          plateNumber: driver.vehicle?.licensePlate || 'SL-2026',
        },
      };
    });

    return {
      type: 'FeatureCollection',
      features,
    };
  }, []);

  // Setup 'driver-location', 'route-source', and 'driver-approach-source' layers on Mapbox / MapLibre instance
  const setupDriverLocationLayers = useCallback((map: MapLibreMap) => {
    // 1. Add GeoJSON Source named 'driver-location' using setData
    if (!map.getSource('driver-location')) {
      map.addSource('driver-location', {
        type: 'geojson',
        data: generateDriverGeoJson(driversRef.current),
      });

      // Pulse Aura Layer for moving drivers
      map.addLayer({
        id: 'driver-location-pulse',
        type: 'circle',
        source: 'driver-location',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10,
            12,
            15,
            26,
            18,
            38,
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'isAssigned'], 1],
            '#10b981',
            '#0284c7',
          ],
          'circle-opacity': 0.25,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#10b981',
          'circle-stroke-opacity': 0.5,
        },
      });

      // Glow Ring Layer
      map.addLayer({
        id: 'driver-location-glow',
        type: 'circle',
        source: 'driver-location',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10,
            7,
            15,
            15,
            18,
            22,
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'isAssigned'], 1],
            '#059669',
            '#0f172a',
          ],
          'circle-opacity': 0.9,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Center Core Dot
      map.addLayer({
        id: 'driver-location-point',
        type: 'circle',
        source: 'driver-location',
        paint: {
          'circle-radius': 5,
          'circle-color': '#ffffff',
          'circle-opacity': 1,
        },
      });

      map.on('click', 'driver-location-glow', (e) => {
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties as any;
        const matched = drivers.find((d) => d.id === props.id);
        if (matched) {
          setSelectedDriverDetails(matched);
        }
      });

      map.on('mouseenter', 'driver-location-glow', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'driver-location-glow', () => {
        map.getCanvas().style.cursor = '';
      });
    }

    // 2. Driver Approach Route Source & Layers (Driver GPS -> Passenger Pickup Point)
    if (!map.getSource('driver-approach-source')) {
      map.addSource('driver-approach-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        },
      });

      map.addLayer({
        id: 'driver-approach-casing',
        type: 'line',
        source: 'driver-approach-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#0f172a',
          'line-width': 8,
          'line-opacity': 0.6,
        },
      });

      map.addLayer({
        id: 'driver-approach-line',
        type: 'line',
        source: 'driver-approach-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#f59e0b',
          'line-width': 5.5,
          'line-opacity': 0.95,
        },
      });
    }

    // 3. Primary Trip Route Source & Layers (Pickup -> Multi-Stops -> Destination)
    if (!map.getSource('route-source')) {
      map.addSource('route-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        },
      });

      map.addLayer({
        id: 'route-casing',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#090d16',
          'line-width': 9,
          'line-opacity': 0.5,
        },
      });

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#10b981',
          'line-width': 5.5,
          'line-opacity': 0.95,
        },
      });
    }

    // 4. Setup Hargeisa Surge Geofences
    HARGEISA_ZONES.forEach((zone, idx) => {
      const sourceId = `zone-source-${idx}`;
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { name: zone.name, surge: zone.surge },
            geometry: {
              type: 'Polygon',
              coordinates: [zone.coordinates],
            },
          },
        });

        map.addLayer({
          id: `zone-fill-${idx}`,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': zone.color,
            'fill-opacity': showSurgeHeatmap ? 0.2 : 0.05,
          },
        });

        map.addLayer({
          id: `zone-outline-${idx}`,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': zone.color,
            'line-width': 1.8,
            'line-dasharray': [2, 2],
            'line-opacity': 0.75,
          },
        });
      }
    });
  }, [generateDriverGeoJson, showSurgeHeatmap]);

  // Compute map style object
  const mapStyleDefinition = useMemo(() => {
    if (activeStyle === 'custom_studio' && customStudioUrl) {
      if (customStudioUrl.startsWith('mapbox://styles/')) {
        const stylePath = customStudioUrl.replace('mapbox://styles/', '');
        const tokenParam = mapboxAccessToken ? `?access_token=${mapboxAccessToken}` : '';
        return `https://api.mapbox.com/styles/v1/${stylePath}${tokenParam}`;
      }
      return customStudioUrl;
    }
    if (activeStyle in MAPBOX_STYLES) {
      return MAPBOX_STYLES[activeStyle as Exclude<MapboxStyleKey, 'custom_studio'>].style;
    }
    return MAPBOX_STYLES.streets.style;
  }, [activeStyle, customStudioUrl, mapboxAccessToken]);

  // Initialize Mapbox / MapLibre Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLng = activePickup?.lng || 44.065;
    const initialLat = activePickup?.lat || 9.56;

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: mapStyleDefinition as any,
      center: [initialLng, initialLat],
      zoom: 13.8,
      attributionControl: false,
    });

    map.on('load', () => {
      setupDriverLocationLayers(map);
    });

    map.on('click', (e) => {
      if (selectableMode === 'pickup') {
        setPickupLocation({
          id: `map_pick_${Date.now()}`,
          name: 'Selected on Map',
          address: `GPS: ${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)}, Hargeisa`,
          lat: e.lngLat.lat,
          lng: e.lngLat.lng,
          zone: 'Hargeisa',
        });
        if (onModeChange) onModeChange('dropoff');
      } else if (selectableMode === 'dropoff') {
        setDropoffLocation({
          id: `map_drop_${Date.now()}`,
          name: 'Selected Destination',
          address: `GPS: ${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)}, Hargeisa`,
          lat: e.lngLat.lat,
          lng: e.lngLat.lng,
          zone: 'Hargeisa',
        });
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update style when activeStyle or customStudioUrl changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    try {
      map.setStyle(mapStyleDefinition as any);
      map.once('style.load', () => {
        setupDriverLocationLayers(map);
      });
    } catch (_e) {}
  }, [mapStyleDefinition]);

  // Update Surge Heatmap opacity
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    if (!map.isStyleLoaded()) return;

    HARGEISA_ZONES.forEach((_, idx) => {
      if (map.getLayer(`zone-fill-${idx}`)) {
        map.setPaintProperty(`zone-fill-${idx}`, 'fill-opacity', showSurgeHeatmap ? 0.22 : 0.05);
      }
    });
  }, [showSurgeHeatmap]);

  // ----------------------------------------------------
  // REAL-TIME DRIVER TRACKING & 'driver-location' MAP UPDATES
  // Uses Firebase + Mapbox setData function for 60fps rendering
  // ----------------------------------------------------
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // 1. Update the dedicated Mapbox 'driver-location' GeoJSON Source via setData
    const driverLocationSource = map.getSource('driver-location') as GeoJSONSource | undefined;
    if (driverLocationSource && typeof driverLocationSource.setData === 'function') {
      const geoJsonData = generateDriverGeoJson(drivers);
      driverLocationSource.setData(geoJsonData);
    }

    // 2. Update / Interpolate Smooth HTML Markers for each Driver
    const currentDriverIds = new Set(drivers.map((d) => d.id));
    Object.keys(driverMarkersRef.current).forEach((id) => {
      if (!currentDriverIds.has(id)) {
        driverMarkersRef.current[id].remove();
        delete driverMarkersRef.current[id];
        delete driverPrevCoordsRef.current[id];
      }
    });

    drivers.forEach((driver) => {
      const isAssigned = currentRide?.assignedDriverId === driver.id;
      const isOnline = driver.status !== 'offline';

      // EXPLICIT GUARD: If driver status is NOT active on a trip, coordinates stay strictly fixed to database location
      let dLat = driver.currentLocation?.lat ?? (driver as any).lat ?? 9.56;
      let dLng = driver.currentLocation?.lng ?? (driver as any).lng ?? 44.065;

      const isTripActive = isAssigned && currentRide && ['accepted', 'driver_arrived', 'in_progress'].includes(currentRide.status);
      if (!isTripActive && driver.status !== 'busy') {
        dLat = Number(dLat.toFixed(6));
        dLng = Number(dLng.toFixed(6));
      }

      const prev = driverPrevCoordsRef.current[driver.id];
      let heading = (driver as any).heading || 0;
      if (prev && (prev.lat !== dLat || prev.lng !== dLng)) {
        heading = calculateBearing(prev.lat, prev.lng, dLat, dLng);
      }
      driverPrevCoordsRef.current[driver.id] = { lat: dLat, lng: dLng, heading };

      if (!driverMarkersRef.current[driver.id]) {
        const el = document.createElement('div');
        el.className = 'wadaage-driver-marker cursor-pointer select-none';
        el.id = `driver-marker-${driver.id}`;
        el.innerHTML = `
          <div class="relative flex flex-col items-center group">
            ${
              isAssigned
                ? '<div class="absolute -inset-2 bg-emerald-500/40 rounded-2xl animate-ping"></div>'
                : ''
            }

            <div id="car-body-${driver.id}" class="w-10 h-10 rounded-2xl ${
              isAssigned
                ? 'bg-emerald-500 ring-4 ring-emerald-300 shadow-xl shadow-emerald-500/60'
                : isOnline
                ? 'bg-slate-900 ring-2 ring-emerald-400 shadow-lg shadow-slate-950/80'
                : 'bg-slate-700 ring-1 ring-slate-600'
            } flex items-center justify-center text-white transition-transform duration-500 ease-out" style="transform: rotate(${heading}deg);">
              <svg class="w-5 h-5 ${isAssigned ? 'text-slate-950 font-black' : 'text-emerald-400'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>

            ${role === 'admin' ? `
            <div class="mt-1 bg-slate-900/95 text-[10px] font-black text-white px-2 py-0.5 rounded-md shadow-md border border-slate-700/80 whitespace-nowrap flex items-center gap-1">
              <span>${(driver?.name || 'Driver').split(' ')[0]}</span>
              ${isAssigned ? '<span class="text-amber-400">★</span>' : ''}
            </div>
            ` : ''}
          </div>
        `;

        el.onclick = () => {
          setSelectedDriverDetails(driver);
        };

        const marker = new Marker({ element: el, anchor: 'center' })
          .setLngLat([dLng, dLat])
          .addTo(map);

        driverMarkersRef.current[driver.id] = marker;
      } else {
        driverMarkersRef.current[driver.id].setLngLat([dLng, dLat]);
        const carBody = document.getElementById(`car-body-${driver.id}`);
        if (carBody) {
          carBody.style.transform = `rotate(${heading}deg)`;
        }
      }
    });

    // 3. Camera Smooth Following Mode with threshold check to prevent camera jump/jitter
    if (followDriver && activeDriver && currentRide && ['accepted', 'driver_arrived', 'in_progress'].includes(currentRide.status)) {
      const aLng = activeDriver.currentLocation?.lng ?? (activeDriver as any).lng;
      const aLat = activeDriver.currentLocation?.lat ?? (activeDriver as any).lat;

      if (aLng && aLat) {
        const lastCenter = lastCameraCenterRef.current;
        const distChange = lastCenter ? Math.hypot(aLat - lastCenter.lat, aLng - lastCenter.lng) : 999;

        // Threshold check: Only ease camera if active car has moved significantly (> 0.0003 deg ~ 30 meters)
        if (distChange > 0.0003) {
          lastCameraCenterRef.current = { lat: aLat, lng: aLng };
          map.easeTo({
            center: [aLng, aLat],
            zoom: 15.2,
            duration: 900,
          });
        }
      }
    }
  }, [drivers, currentRide?.status, currentRide?.assignedDriverId, generateDriverGeoJson, followDriver, activeDriver]);

  // ----------------------------------------------------
  // LIVE VEHICLE MOVEMENT VIA MAPBOX setData
  // When assigned driver is en-route, smoothly moves vehicle along OSRM path
  // ----------------------------------------------------
  useEffect(() => {
    if (!isTrackingLiveVehicle || approachCoords.length < 2 || !assignedDriver) return;
    if (!mapInstanceRef.current) return;

    const driverId = assignedDriver.id;
    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx >= approachCoords.length) {
        stepIdx = 0;
      }
      const [lng, lat] = approachCoords[stepIdx];

      const map = mapInstanceRef.current;
      if (map) {
        // Trigger Mapbox setData for 'driver-location'
        const driverLocationSource = map.getSource('driver-location') as GeoJSONSource | undefined;
        if (driverLocationSource && typeof driverLocationSource.setData === 'function') {
          driverLocationSource.setData(generateDriverGeoJson(driversRef.current));
        }

        // Update DOM Marker directly
        if (driverMarkersRef.current[driverId]) {
          driverMarkersRef.current[driverId].setLngLat([lng, lat]);
        }
      }

      stepIdx++;
    }, 2500);

    return () => clearInterval(interval);
  }, [isTrackingLiveVehicle, approachCoords, assignedDriver?.id, generateDriverGeoJson]);

  // ----------------------------------------------------
  // PICKUP, DROPOFF & MULTI-STOP WAYPOINT PINS
  // ----------------------------------------------------
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Pickup Pin
    if (activePickup) {
      if (!pickupMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'wadaage-pickup-pin select-none';
        el.innerHTML = `
          <div class="relative flex flex-col items-center">
            <div class="bg-emerald-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-2xl border-2 border-white flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span class="font-extrabold truncate max-w-[120px]">${activePickup.name || 'Pickup'}</span>
            </div>
            <div class="w-3.5 h-3.5 bg-emerald-600 rotate-45 -mt-1.5 shadow-md border-r-2 border-b-2 border-white"></div>
          </div>
        `;

        const marker = new Marker({ element: el, anchor: 'bottom' })
          .setLngLat([activePickup.lng, activePickup.lat])
          .addTo(map);

        pickupMarkerRef.current = marker;
      } else {
        pickupMarkerRef.current.setLngLat([activePickup.lng, activePickup.lat]);
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }

    // Destination Pin
    if (activeDropoff) {
      if (!dropoffMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'wadaage-dropoff-pin select-none';
        el.innerHTML = `
          <div class="relative flex flex-col items-center">
            <div class="bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-2xl border-2 border-white flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-white"></span>
              <span class="font-extrabold truncate max-w-[120px]">${activeDropoff.name || 'Destination'}</span>
            </div>
            <div class="w-3.5 h-3.5 bg-rose-600 rotate-45 -mt-1.5 shadow-md border-r-2 border-b-2 border-white"></div>
          </div>
        `;

        const marker = new Marker({ element: el, anchor: 'bottom' })
          .setLngLat([activeDropoff.lng, activeDropoff.lat])
          .addTo(map);

        dropoffMarkerRef.current = marker;
      } else {
        dropoffMarkerRef.current.setLngLat([activeDropoff.lng, activeDropoff.lat]);
      }
    } else if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.remove();
      dropoffMarkerRef.current = null;
    }

    // Order 2 / Co-Passenger Pickup Pin (Wadaage Share)
    if (coPassengerPickup) {
      if (!coPickupMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'wadaage-co-pickup-pin select-none';
        el.innerHTML = `
          <div class="relative flex flex-col items-center">
            <div class="bg-teal-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-2xl border-2 border-white flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span class="font-extrabold truncate max-w-[130px]">Order 2 Pick (${currentRide?.coPassenger?.name || 'Rider B'})</span>
            </div>
            <div class="w-3.5 h-3.5 bg-teal-600 rotate-45 -mt-1.5 shadow-md border-r-2 border-b-2 border-white"></div>
          </div>
        `;

        const marker = new Marker({ element: el, anchor: 'bottom' })
          .setLngLat([coPassengerPickup.lng, coPassengerPickup.lat])
          .addTo(map);

        coPickupMarkerRef.current = marker;
      } else {
        coPickupMarkerRef.current.setLngLat([coPassengerPickup.lng, coPassengerPickup.lat]);
      }
    } else if (coPickupMarkerRef.current) {
      coPickupMarkerRef.current.remove();
      coPickupMarkerRef.current = null;
    }

    // Order 2 / Co-Passenger Dropoff Pin (Wadaage Share)
    if (coPassengerDropoff) {
      if (!coDropoffMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'wadaage-co-dropoff-pin select-none';
        el.innerHTML = `
          <div class="relative flex flex-col items-center">
            <div class="bg-purple-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-2xl border-2 border-white flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-white"></span>
              <span class="font-extrabold truncate max-w-[130px]">Order 2 Drop (${currentRide?.coPassenger?.name || 'Rider B'})</span>
            </div>
            <div class="w-3.5 h-3.5 bg-purple-600 rotate-45 -mt-1.5 shadow-md border-r-2 border-b-2 border-white"></div>
          </div>
        `;

        const marker = new Marker({ element: el, anchor: 'bottom' })
          .setLngLat([coPassengerDropoff.lng, coPassengerDropoff.lat])
          .addTo(map);

        coDropoffMarkerRef.current = marker;
      } else {
        coDropoffMarkerRef.current.setLngLat([coPassengerDropoff.lng, coPassengerDropoff.lat]);
      }
    } else if (coDropoffMarkerRef.current) {
      coDropoffMarkerRef.current.remove();
      coDropoffMarkerRef.current = null;
    }

    // Multi-Stops Intermediate Pins
    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];

    if (activeStops && activeStops.length > 0) {
      activeStops.forEach((stop, idx) => {
        const el = document.createElement('div');
        el.className = 'wadaage-stop-pin select-none';
        el.innerHTML = `
          <div class="relative flex flex-col items-center">
            <div class="bg-indigo-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-xl border-2 border-white flex items-center gap-1">
              <span>Stop ${idx + 1}</span>
            </div>
            <div class="w-3 h-3 bg-indigo-600 rotate-45 -mt-1 shadow-md border-r-2 border-b-2 border-white"></div>
          </div>
        `;
        const marker = new Marker({ element: el, anchor: 'bottom' })
          .setLngLat([stop.lng, stop.lat])
          .addTo(map);
        stopMarkersRef.current.push(marker);
      });
    }
  }, [activePickup?.lat, activePickup?.lng, activeDropoff?.lat, activeDropoff?.lng, activeStops]);

  // ----------------------------------------------------------------------
  // REAL-TIME ROAD ROUTE COMPUTATION & VISUALIZATION FOR RIDER (AFTER ORDER)
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    let isMounted = true;

    async function updateRoadRoutes() {
      // 1. PRIMARY TRIP ROUTE (Pickup -> Multi-Stops -> Dropoff)
      if (activePickup && activeDropoff) {
        let startPoint = { lat: activePickup.lat, lng: activePickup.lng };
        if (rideStatus === 'in_progress' && assignedDriver?.currentLocation) {
          startPoint = {
            lat: assignedDriver.currentLocation.lat,
            lng: assignedDriver.currentLocation.lng,
          };
        }

        const endPoint = { lat: activeDropoff.lat, lng: activeDropoff.lng };

        try {
          const tripRoute: HargeisaRoadRoute = await fetchRealHargeisaRoadRoute(
            startPoint,
            endPoint,
            rideStatus === 'in_progress' ? [] : activeStops
          );

          if (!isMounted) return;

          setRouteDistanceKm(`${tripRoute.distanceKm.toFixed(1)} km`);
          setRouteDurationMins(`${tripRoute.durationMins} mins`);
          setRouteSummaryText(tripRoute.routeSummary || 'via Wadada Wadnaha');

          // Render polyline on 'route-source' using Mapbox setData
          const routeSource = map.getSource('route-source') as GeoJSONSource | undefined;
          if (routeSource && typeof routeSource.setData === 'function') {
            routeSource.setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: tripRoute.coordinates,
              },
            });
          }

          // Initial Camera Frame fit on order creation or free pan
          if (!followDriver && tripRoute.coordinates.length > 0) {
            const bounds = new LngLatBounds();
            tripRoute.coordinates.forEach((coord) => bounds.extend(coord));
            map.fitBounds(bounds, { padding: 60, duration: 800 });
          }
        } catch (_e) {
          // Handled by fallback in hargeisaRoadRouter
        }
      } else {
        const routeSource = map.getSource('route-source') as GeoJSONSource | undefined;
        if (routeSource && typeof routeSource.setData === 'function') {
          routeSource.setData({
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: [] },
          });
        }
        setRouteDistanceKm(null);
        setRouteDurationMins(null);
        setRouteSummaryText(null);
      }

      // 2. DRIVER APPROACH ROUTE (When Driver is Accepted / En Route to Pickup)
      if (
        (rideStatus === 'accepted' || rideStatus === 'driver_arrived') &&
        assignedDriver?.currentLocation &&
        activePickup
      ) {
        const dLat = assignedDriver.currentLocation.lat;
        const dLng = assignedDriver.currentLocation.lng;

        try {
          const approachRoute: HargeisaRoadRoute = await fetchRealHargeisaRoadRoute(
            { lat: dLat, lng: dLng },
            { lat: activePickup.lat, lng: activePickup.lng }
          );

          if (!isMounted) return;

          setDriverApproachKm(`${approachRoute.distanceKm.toFixed(1)} km`);
          setDriverApproachMins(`${approachRoute.durationMins} mins`);
          setApproachCoords(approachRoute.coordinates as [number, number][]);

          // Update 'driver-approach-source' using Mapbox setData
          const approachSource = map.getSource('driver-approach-source') as GeoJSONSource | undefined;
          if (approachSource && typeof approachSource.setData === 'function') {
            approachSource.setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: approachRoute.coordinates,
              },
            });
          }

          if (!followDriver && approachRoute.coordinates.length > 0) {
            const bounds = new LngLatBounds()
              .extend([dLng, dLat])
              .extend([activePickup.lng, activePickup.lat]);
            map.fitBounds(bounds, { padding: 70, duration: 800 });
          }
        } catch (_e) {}
      } else {
        const approachSource = map.getSource('driver-approach-source') as GeoJSONSource | undefined;
        if (approachSource && typeof approachSource.setData === 'function') {
          approachSource.setData({
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: [] },
          });
        }
        setDriverApproachKm(null);
        setDriverApproachMins(null);
        setApproachCoords([]);
      }
    }

    updateRoadRoutes();

    return () => {
      isMounted = false;
    };
  }, [
    activePickup?.lat,
    activePickup?.lng,
    activeDropoff?.lat,
    activeDropoff?.lng,
    activeStops,
    rideStatus,
    assignedDriver?.currentLocation?.lat,
    assignedDriver?.currentLocation?.lng,
    followDriver,
  ]);

  // Locate User GPS
  const handleLocateUser = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 15.2,
            duration: 1100,
          });

          if (!gpsMarkerRef.current) {
            const el = document.createElement('div');
            el.className = 'wadaage-gps-marker';
            el.innerHTML = `
              <div class="relative flex items-center justify-center">
                <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
                <div class="absolute w-8 h-8 bg-blue-400/40 rounded-full animate-ping"></div>
              </div>
            `;
            gpsMarkerRef.current = new Marker({ element: el })
              .setLngLat([longitude, latitude])
              .addTo(mapInstanceRef.current);
          } else {
            gpsMarkerRef.current.setLngLat([longitude, latitude]);
          }
        }
      },
      () => {
        setIsLocating(false);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo({ center: [44.065, 9.56], zoom: 14 });
        }
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  };

  // Re-center on Hargeisa City Center or Active Ride
  const handleCenterFleet = () => {
    if (!mapInstanceRef.current) return;
    setFollowDriver(false);
    if (activePickup && activeDropoff) {
      const bounds = new LngLatBounds()
        .extend([activePickup.lng, activePickup.lat])
        .extend([activeDropoff.lng, activeDropoff.lat]);
      mapInstanceRef.current.fitBounds(bounds, { padding: 60, duration: 800 });
    } else {
      mapInstanceRef.current.flyTo({
        center: [44.065, 9.56],
        zoom: 13.6,
        duration: 900,
      });
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 font-sans"
      style={{ height }}
    >
      {/* Mapbox / MapLibre Viewport Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Essential Map Controls */}
      <div className="absolute right-3 bottom-4 flex flex-col space-y-2 z-10">
        <button
          onClick={handleLocateUser}
          disabled={isLocating}
          title="Locate My GPS Position"
          className="w-10 h-10 bg-white/95 dark:bg-slate-900/95 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded-xl shadow-lg flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
        >
          <Crosshair className={`w-5 h-5 ${isLocating ? 'animate-spin text-emerald-500' : 'text-slate-700 dark:text-slate-300'}`} />
        </button>

        <button
          onClick={handleCenterFleet}
          title="Center on Route / City"
          className="w-10 h-10 bg-white/95 dark:bg-slate-900/95 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-lg flex items-center justify-center transition-all active:scale-95 font-black text-xs"
        >
          <Compass className="w-5 h-5" />
        </button>

        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          title="Zoom In"
          className="w-10 h-10 bg-white/95 dark:bg-slate-900/95 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded-xl shadow-lg flex items-center justify-center transition-all active:scale-95"
        >
          <ZoomIn className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>

        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          title="Zoom Out"
          className="w-10 h-10 bg-white/95 dark:bg-slate-900/95 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded-xl shadow-lg flex items-center justify-center transition-all active:scale-95"
        >
          <ZoomOut className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>
      </div>
    </div>
  );
};
