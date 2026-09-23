import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Crosshair,
  Layers,
  Navigation,
} from 'lucide-react';
import { useRide } from '../../context/RideContext';

interface LeafletInteractiveMapProps {
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

// Clean key in case a full URL or query string was provided in env
const CARTO_KEY = rawCartoKey.includes('key=')
  ? rawCartoKey.split('key=').pop()?.split('&')[0] || ''
  : rawCartoKey.replace(/^https?:\/\/[^\/]+\/?/, '');

const cartoKeyParam = CARTO_KEY ? `?api_key=${CARTO_KEY}&key=${CARTO_KEY}` : '';

// Tile Layer URLs
const TILE_LAYERS = {
  dark: {
    url: CARTO_KEY
      ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${cartoKeyParam}`
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri',
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
};

export const LeafletInteractiveMap: React.FC<LeafletInteractiveMapProps> = ({
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
    roadRoute,
    roadDistanceKm,
    roadDurationMins,
    roadRouteSummary,
    role,
  } = useRide();

  const coPassengerPickup = currentRide?.coPassenger?.pickupLocation;
  const coPassengerDropoff = currentRide?.coPassenger?.dropoffLocation;

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [showTraffic, setShowTraffic] = useState<boolean>(true);
  const [isCenteringGPS, setIsCenteringGPS] = useState<boolean>(false);
  const [userGpsLocation, setUserGpsLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] = pickupLocation
        ? [pickupLocation.lat, pickupLocation.lng]
        : [9.5600, 44.0650]; // Hargeisa Central

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      const initialTile = TILE_LAYERS[mapStyle];
      tileLayerRef.current = L.tileLayer(initialTile.url, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer on Style Change
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const targetTile = TILE_LAYERS[mapStyle];
    tileLayerRef.current.setUrl(targetTile.url);
  }, [mapStyle]);

  // Update Route Polyline and Map Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (pickupLocation && dropoffLocation) {
      let latlngs: [number, number][] = [];
      if (roadRoute && roadRoute.coordinates && roadRoute.coordinates.length > 1) {
        latlngs = roadRoute.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
      } else {
        const midLat = (pickupLocation.lat + dropoffLocation.lat) / 2 + (pickupLocation.lng > dropoffLocation.lng ? 0.0012 : -0.0012);
        const midLng = (pickupLocation.lng + dropoffLocation.lng) / 2 + (pickupLocation.lat > dropoffLocation.lat ? 0.0008 : -0.0008);
        latlngs = [
          [pickupLocation.lat, pickupLocation.lng],
          [midLat, midLng],
          [dropoffLocation.lat, dropoffLocation.lng],
        ];
      }

      const polyline = L.polyline(latlngs, {
        color: '#00E575',
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routeLayerRef.current = polyline;

      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    }
  }, [pickupLocation, dropoffLocation, roadRoute]);

  // Update Markers (Pickup, Dropoff, Drivers, Surge, GPS)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. User Live GPS Marker
    if (userGpsLocation) {
      const gpsIcon = L.divIcon({
        className: 'custom-gps-marker',
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
            <div class="absolute w-8 h-8 bg-blue-500/40 rounded-full animate-ping"></div>
            <div class="w-5 h-5 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg">
              <div class="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </div>
        `,
        iconSize: [24, 24],
      });
      L.marker([userGpsLocation.lat, userGpsLocation.lng], { icon: gpsIcon, zIndexOffset: 400 }).addTo(group);
    }

    // 2. Pickup Marker (Point A)
    if (pickupLocation) {
      const pickupIcon = L.divIcon({
        className: 'custom-pickup-marker',
        html: `
          <div class="flex flex-col items-center -translate-x-1/2 -translate-y-full select-none pointer-events-none">
            <div class="relative bg-[#0066F5] text-white text-[11px] font-extrabold px-3 py-1 rounded-xl shadow-xl whitespace-nowrap mb-1 flex items-center space-x-1 border border-blue-400/30 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[5px] after:border-transparent after:border-t-[#0066F5]">
              <span>Halka aad Joogto</span>
            </div>
            <div class="relative mt-1 flex items-center justify-center">
              <div class="w-5 h-5 rounded-full bg-[#0066F5] border-[2.5px] border-white flex items-center justify-center shadow-lg text-white">
                <div class="w-2 h-2 rounded-full bg-white"></div>
              </div>
            </div>
          </div>
        `,
        iconSize: [120, 56],
      });

      L.marker([pickupLocation.lat, pickupLocation.lng], {
        icon: pickupIcon,
        zIndexOffset: 500,
      }).addTo(group);
    }

    // 3b. Order 2 / Co-Passenger Pickup Marker (Wadaage Share)
    if (coPassengerPickup) {
      const coPickIcon = L.divIcon({
        className: 'custom-copickup-marker',
        html: `
          <div class="flex flex-col items-center -translate-x-1/2 -translate-y-full select-none pointer-events-none">
            <div class="relative bg-teal-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-xl shadow-xl whitespace-nowrap mb-1 border border-teal-400/30">
              <span>Order 2 Pick (${currentRide?.coPassenger?.name?.split(' ')[0] || 'Rider B'})</span>
            </div>
            <div class="w-5 h-5 rounded-full bg-teal-600 border-2 border-white shadow-lg"></div>
          </div>
        `,
        iconSize: [120, 56],
      });
      L.marker([coPassengerPickup.lat, coPassengerPickup.lng], {
        icon: coPickIcon,
        zIndexOffset: 480,
      }).addTo(group);
    }

    // 3c. Order 2 / Co-Passenger Dropoff Marker (Wadaage Share)
    if (coPassengerDropoff) {
      const coDropIcon = L.divIcon({
        className: 'custom-codropoff-marker',
        html: `
          <div class="flex flex-col items-center -translate-x-1/2 -translate-y-full select-none pointer-events-none">
            <div class="relative bg-purple-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-xl shadow-xl whitespace-nowrap mb-1 border border-purple-400/30">
              <span>Order 2 Drop (${currentRide?.coPassenger?.name?.split(' ')[0] || 'Rider B'})</span>
            </div>
            <div class="w-5 h-5 rounded-full bg-purple-600 border-2 border-white shadow-lg"></div>
          </div>
        `,
        iconSize: [120, 56],
      });
      L.marker([coPassengerDropoff.lat, coPassengerDropoff.lng], {
        icon: coDropIcon,
        zIndexOffset: 480,
      }).addTo(group);
    }

    // 3. Dropoff Marker (Point B)
    if (dropoffLocation) {
      const dropoffIcon = L.divIcon({
        className: 'custom-dropoff-marker',
        html: `
          <div class="flex flex-col items-center -translate-x-1/2 -translate-y-full select-none pointer-events-none">
            <div class="relative bg-[#EF4444] text-white text-[11px] font-extrabold px-3 py-1 rounded-xl shadow-xl whitespace-nowrap mb-1 flex items-center space-x-1 border border-red-400/30 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[5px] after:border-transparent after:border-t-[#EF4444]">
              <span>Halka aad Tageyso</span>
            </div>
            <div class="w-8 h-8 rounded-full bg-[#EF4444] border-2 border-white flex items-center justify-center text-white shadow-xl mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="#EF4444"/></svg>
            </div>
          </div>
        `,
        iconSize: [120, 56],
      });

      L.marker([dropoffLocation.lat, dropoffLocation.lng], {
        icon: dropoffIcon,
        zIndexOffset: 500,
      }).addTo(group);
    }

    // Mid-Route Distance and Duration Indicator
    if (pickupLocation && dropoffLocation) {
      const midLat = (pickupLocation.lat + dropoffLocation.lat) / 2;
      const midLng = (pickupLocation.lng + dropoffLocation.lng) / 2;
      const midRouteIcon = L.divIcon({
        className: 'custom-mid-route-marker',
        html: `
          <div class="flex items-center space-x-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-xl border border-slate-200 text-slate-800 text-xs font-black whitespace-nowrap pointer-events-none select-none -translate-x-1/2 -translate-y-1/2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
            <span class="text-slate-900 font-black">~ ${roadDistanceKm ? roadDistanceKm.toFixed(1) : '7.0'} km</span>
            <span class="text-slate-400">•</span>
            <span class="text-slate-700 font-bold">~ ${roadDurationMins || '10'} daqiiqo</span>
          </div>
        `,
        iconSize: [160, 36],
      });

      L.marker([midLat, midLng], {
        icon: midRouteIcon,
        zIndexOffset: 450,
      }).addTo(group);
    }

    // 4. Live Drivers on Road (High-Resolution Professional White Vehicle Marker Layer with Heading Rotation)
    drivers.forEach((driver) => {
      const dLat = driver.currentLocation?.lat ?? (driver as any).currentLat ?? 9.5600;
      const dLng = driver.currentLocation?.lng ?? (driver as any).currentLng ?? 44.0650;
      const carPlate = driver.vehicle?.licensePlate ?? (driver as any).carPlate ?? 'SL-2044';
      const heading = (driver as any).headingDegrees || (driver as any).heading || 0;

      const driverIcon = L.divIcon({
        className: 'custom-white-car-marker',
        html: `
          <div class="relative flex flex-col items-center justify-center pointer-events-auto cursor-pointer group">
            ${role === 'admin' ? `
            <div class="absolute -top-6 px-2 py-0.5 bg-slate-950/90 border border-emerald-500/40 text-emerald-300 text-[9px] font-black rounded-lg shadow-xl whitespace-nowrap z-20">
              ${(driver?.name || 'Captain').split(' ')[0]} • ${carPlate}
            </div>
            ` : ''}
            <div class="relative w-8 h-8 flex items-center justify-center transition-transform duration-300 ease-out" style="transform: rotate(${heading}deg);">
              <div class="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse"></div>
              <div class="w-8 h-8 rounded-full bg-slate-950 border-2 border-emerald-400 shadow-[0_0_12px_rgba(0,229,117,0.5)] flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF" stroke="#00E575" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                  <circle cx="7" cy="17" r="2" fill="#00E575"/>
                  <path d="M9 17h6"/>
                  <circle cx="17" cy="17" r="2" fill="#00E575"/>
                </svg>
              </div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([dLat, dLng], { icon: driverIcon, zIndexOffset: 300 }).addTo(group);
    });

    // 5. Surge Hotspots
    if (showSurgeHeatmap) {
      const hotspots = [
        { name: 'Central Market', lat: 9.5600, lng: 44.0650, surge: '1.6x', color: '#ef4444' },
        { name: 'Jigjiga Yar', lat: 9.5680, lng: 44.0780, surge: '1.4x', color: '#f59e0b' },
        { name: 'Egal Airport', lat: 9.5180, lng: 44.0880, surge: '1.5x', color: '#ef4444' },
        { name: '26 June Area', lat: 9.5750, lng: 44.0550, surge: '1.3x', color: '#10b981' },
      ];

      hotspots.forEach((zone) => {
        L.circle([zone.lat, zone.lng], {
          radius: 350,
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: 0.2,
          weight: 1.5,
        }).addTo(group);

        const surgeTag = L.divIcon({
          className: 'surge-tag',
          html: `
            <div class="px-1.5 py-0.5 rounded-md bg-slate-950/90 text-white text-[9px] font-black border border-slate-700 shadow flex items-center gap-1 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
              <span>${zone.name}</span>
              <span class="text-amber-300 font-bold">${zone.surge}</span>
            </div>
          `,
          iconSize: [80, 20],
        });
        L.marker([zone.lat, zone.lng], { icon: surgeTag, zIndexOffset: 250 }).addTo(group);
      });
    }
  }, [pickupLocation, dropoffLocation, drivers, showSurgeHeatmap, userGpsLocation]);

  // Centering on Device GPS
  const handleCenterGPS = () => {
    if ('geolocation' in navigator) {
      setIsCenteringGPS(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsCenteringGPS(false);
          const { latitude, longitude } = pos.coords;
          setUserGpsLocation({ lat: latitude, lng: longitude });
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([latitude, longitude], 15, { duration: 1.2 });
          }
        },
        () => {
          setIsCenteringGPS(false);
          setUserGpsLocation({ lat: 9.5600, lng: 44.0650 });
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([9.5600, 44.0650], 14, { duration: 1.2 });
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  return (
    <div className="w-full relative overflow-hidden select-none" style={{ height }}>
      {/* Leaflet Map Div Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls */}
      <div className="absolute top-4 right-3 z-[1000] flex flex-col space-y-2">
        <button
          type="button"
          onClick={handleCenterGPS}
          disabled={isCenteringGPS}
          className="w-10 h-10 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-[#00E575] flex items-center justify-center shadow-lg hover:bg-slate-800 transition active:scale-95 cursor-pointer"
          title="Precise GPS Location"
        >
          <Crosshair className={`w-5 h-5 ${isCenteringGPS ? 'animate-spin text-amber-400' : ''}`} />
        </button>

        <button
          type="button"
          onClick={() => setMapStyle((prev) => (prev === 'streets' ? 'satellite' : 'streets'))}
          className="w-10 h-10 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-slate-200 flex items-center justify-center shadow-lg hover:bg-slate-800 transition active:scale-95 text-xs font-bold cursor-pointer"
          title="Toggle Satellite Imagery"
        >
          <Layers className="w-4 h-4 text-emerald-400" />
        </button>

        <button
          type="button"
          onClick={() => setShowTraffic((prev) => !prev)}
          className={`w-10 h-10 rounded-2xl backdrop-blur-md border flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer ${
            showTraffic
              ? 'bg-[#00E575] text-slate-950 border-[#00E575]'
              : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800'
          }`}
          title={showTraffic ? 'Live Traffic: ON' : 'Live Traffic: OFF'}
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
