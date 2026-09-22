// Source: Google Maps Platform Code Assist
import * as React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  APIProvider,
  Map,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Crosshair,
  Layers,
  Navigation,
  Car as CarIcon,
  MapPin,
  Sparkles,
  Compass,
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { CITY_LOCATIONS } from '../../data/mockData';
import { LeafletInteractiveMap } from './LeafletInteractiveMap';
import { MapLibreInteractiveMap } from './MapLibreInteractiveMap';

interface GoogleInteractiveMapProps {
  showSurgeHeatmap?: boolean;
  selectableMode?: 'pickup' | 'dropoff' | null;
  height?: string;
}

// Google Maps API Key resolved from build-time define or env
const RAW_GOOGLE_MAPS_KEY =
  (process.env as any).GOOGLE_MAPS_PLATFORM_KEY ||
  (process.env as any).GOOGLE_MAPS_API_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  '';

// Production Google Maps key
const GOOGLE_MAPS_KEY = RAW_GOOGLE_MAPS_KEY.trim();

// Custom Map ID if configured in Google Cloud Console
const CUSTOM_MAP_ID =
  (process.env as any).GOOGLE_MAPS_MAP_ID ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_MAP_ID ||
  undefined;

// Safe React Error Boundary to catch any Map SDK initialization errors
interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}

class MapErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public props: ErrorBoundaryProps;
  public state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Google Maps SDK initialization error intercepted:', error.message, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Resilient Custom HTML Marker for Google Maps (works with or without Map ID)
const HtmlMapMarker: React.FC<{
  position: { lat: number; lng: number };
  children: React.ReactNode;
  title?: string;
  zIndex?: number;
  onClick?: () => void;
}> = ({ position, children, title, zIndex = 10, onClick }) => {
  const map = useMap();
  const [container] = useState(() => {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    return el;
  });
  const overlayRef = useRef<google.maps.OverlayView | null>(null);

  useEffect(() => {
    if (!map || !(window as any).google?.maps?.OverlayView) return;

    class CustomMarkerOverlay extends ((window as any).google?.maps?.OverlayView || class {}) {
      div: HTMLDivElement;
      constructor(div: HTMLDivElement) {
        super();
        this.div = div;
      }
      onAdd() {
        const panes = this.getPanes();
        if (panes) {
          panes.overlayMouseTarget.appendChild(this.div);
        }
      }
      draw() {
        const projection = this.getProjection();
        if (!projection || !this.div) return;
        const point = projection.fromLatLngToDivPixel(
          new (window as any).google.maps.LatLng(position.lat, position.lng)
        );
        if (point) {
          this.div.style.left = `${point.x}px`;
          this.div.style.top = `${point.y}px`;
          this.div.style.transform = 'translate(-50%, -50%)';
          this.div.style.zIndex = `${zIndex}`;
          this.div.style.cursor = onClick ? 'pointer' : 'default';
        }
      }
      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
        }
      }
    }

    const overlay = new (CustomMarkerOverlay as any)(container);
    overlay.setMap(map);
    overlayRef.current = overlay as any;

    return () => {
      overlay.setMap(null);
    };
  }, [map, container, zIndex, onClick]);

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.draw();
    }
  }, [position.lat, position.lng]);

  return createPortal(
    <div title={title} onClick={onClick} className="pointer-events-auto select-none">
      {children}
    </div>,
    container
  );
};

// Sub-component to handle Route Computation & Polyline Rendering for Google Maps (Supports Multi-Passenger Rider A & Rider B Routes)
const GoogleRouteRenderer: React.FC<{
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  riderBOrigin?: { lat: number; lng: number } | null;
  riderBDestination?: { lat: number; lng: number } | null;
  driverPosition?: { lat: number; lng: number } | null;
  isDriverApproaching?: boolean;
  roadCoordinates?: Array<[number, number]>;
}> = ({ origin, destination, riderBOrigin, riderBDestination, driverPosition, isDriverApproaching, roadCoordinates }) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const tripPolylinesRef = useRef<google.maps.Polyline[]>([]);
  const approachPolylinesRef = useRef<google.maps.Polyline[]>([]);

  // Render Trip Route (Supports both Rider A & Rider B polylines in Wadaage Share)
  useEffect(() => {
    if (!map || !origin || !destination) {
      tripPolylinesRef.current.forEach((p) => {
        try {
          p.setMap(null);
        } catch (_) {}
      });
      tripPolylinesRef.current = [];
      return;
    }

    const drawTripPolylines = () => {
      tripPolylinesRef.current.forEach((p) => {
        try {
          p.setMap(null);
        } catch (_) {}
      });
      tripPolylinesRef.current = [];

      try {
        if ((window as any).google?.maps?.Polyline) {
          const newPolys: google.maps.Polyline[] = [];

          // Primary Route Polyline (Rider A) - Green
          let pathPointsA: Array<{ lat: number; lng: number }> = [];
          if (roadCoordinates && roadCoordinates.length > 1) {
            pathPointsA = roadCoordinates.map(([lng, lat]) => ({ lat, lng }));
          } else {
            pathPointsA = [
              { lat: origin.lat, lng: origin.lng },
              { lat: destination.lat, lng: destination.lng },
            ];
          }

          const polyA = new (window as any).google.maps.Polyline({
            path: pathPointsA,
            strokeColor: '#00E575',
            strokeOpacity: 0.95,
            strokeWeight: 6,
            map,
          });
          newPolys.push(polyA);

          // Co-Rider Route Polyline (Rider B) - Teal/Cyan if present
          if (riderBOrigin && riderBDestination) {
            const pathPointsB = [
              { lat: riderBOrigin.lat, lng: riderBOrigin.lng },
              { lat: riderBDestination.lat, lng: riderBDestination.lng },
            ];
            const polyB = new (window as any).google.maps.Polyline({
              path: pathPointsB,
              strokeColor: '#0D9488',
              strokeOpacity: 0.85,
              strokeWeight: 5,
              map,
            });
            newPolys.push(polyB);
          }

          tripPolylinesRef.current = newPolys;

          if ((window as any).google?.maps?.LatLngBounds) {
            const bounds = new (window as any).google.maps.LatLngBounds();
            pathPointsA.forEach((pt) => bounds.extend(pt));
            if (riderBOrigin) bounds.extend({ lat: riderBOrigin.lat, lng: riderBOrigin.lng });
            if (riderBDestination) bounds.extend({ lat: riderBDestination.lat, lng: riderBDestination.lng });
            if (driverPosition) bounds.extend({ lat: driverPosition.lat, lng: driverPosition.lng });
            map.fitBounds(bounds, { top: 60, bottom: 60, left: 50, right: 50 });
          }
        }
      } catch (_) {}
    };

    drawTripPolylines();

    return () => {
      tripPolylinesRef.current.forEach((p) => {
        try {
          p.setMap(null);
        } catch (_) {}
      });
      tripPolylinesRef.current = [];
    };
  }, [routesLib, map, origin?.lat, origin?.lng, destination?.lat, destination?.lng, riderBOrigin?.lat, riderBOrigin?.lng, riderBDestination?.lat, riderBDestination?.lng, driverPosition?.lat, driverPosition?.lng, roadCoordinates]);

  // Render Driver Approach Route (Driver to Pickup)
  useEffect(() => {
    if (!map || !driverPosition || !origin || !isDriverApproaching) {
      approachPolylinesRef.current.forEach((p) => {
        try {
          p.setMap(null);
        } catch (_) {}
      });
      approachPolylinesRef.current = [];
      return;
    }

    try {
      if ((window as any).google?.maps?.Polyline) {
        approachPolylinesRef.current.forEach((p) => {
          try {
            p.setMap(null);
          } catch (_) {}
        });
        approachPolylinesRef.current = [];

        const approachPoly = new (window as any).google.maps.Polyline({
          path: [
            { lat: driverPosition.lat, lng: driverPosition.lng },
            { lat: origin.lat, lng: origin.lng },
          ],
          strokeColor: '#38bdf8',
          strokeOpacity: 0.85,
          strokeWeight: 4,
          geodesic: true,
          map,
        });

        approachPolylinesRef.current = [approachPoly];
      }
    } catch (_) {}

    return () => {
      approachPolylinesRef.current.forEach((p) => {
        try {
          p.setMap(null);
        } catch (_) {}
      });
      approachPolylinesRef.current = [];
    };
  }, [map, driverPosition?.lat, driverPosition?.lng, origin?.lat, origin?.lng, isDriverApproaching]);

  return null;
};

// Sub-component to handle Map Click for Setting Pickup / Dropoff
const MapClickHandler: React.FC<{
  selectableMode: 'pickup' | 'dropoff' | null;
  onSetLocation: (type: 'pickup' | 'dropoff', lat: number, lng: number) => void;
}> = ({ selectableMode, onSetLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      if (selectableMode === 'dropoff') {
        onSetLocation('dropoff', lat, lng);
      } else {
        onSetLocation('pickup', lat, lng);
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, selectableMode, onSetLocation]);

  return null;
};

// Sub-component to manage Traffic Layer
const TrafficLayerController: React.FC<{ showTraffic: boolean }> = ({ showTraffic }) => {
  const map = useMap();
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!trafficLayerRef.current) {
      trafficLayerRef.current = new google.maps.TrafficLayer();
    }

    if (showTraffic) {
      trafficLayerRef.current.setMap(map);
    } else {
      trafficLayerRef.current.setMap(null);
    }

    return () => {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    };
  }, [map, showTraffic]);

  return null;
};

// Main Google Interactive Map Renderer
const GoogleMapRenderer: React.FC<GoogleInteractiveMapProps> = ({
  showSurgeHeatmap = false,
  selectableMode = null,
  height = '100%',
}) => {
  const {
    pickupLocation,
    dropoffLocation,
    drivers,
    setPickupLocation,
    setDropoffLocation,
    currentRide,
    roadRoute,
    roadDistanceKm,
    roadDurationMins,
    roadRouteSummary,
    role,
  } = useRide();

  const activeRide = currentRide;
  const activeDriver = currentRide?.assignedDriverId ? drivers.find((d) => d.id === currentRide.assignedDriverId) : undefined;

  const map = useMap();
  const [mapTypeId, setMapTypeId] = useState<string>('roadmap');
  const [showTraffic, setShowTraffic] = useState<boolean>(true);
  const [isCenteringGPS, setIsCenteringGPS] = useState<boolean>(false);
  const [userGpsLocation, setUserGpsLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Live Driver Real-Time Telematics Tracking State
  const [liveDriverPos, setLiveDriverPos] = useState<{ lat: number; lng: number; heading: number } | null>(null);

  const assignedDriver = activeRide?.assignedDriverId
    ? drivers.find((d) => d.id === activeRide.assignedDriverId) || activeDriver
    : activeDriver;

  const isDriverEnRoute =
    activeRide?.status === 'accepted' ||
    activeRide?.status === 'driver_arrived' ||
    activeRide?.status === 'in_progress';

  // Smooth Driver Tracing Animation when Ride is Active
  useEffect(() => {
    if (!assignedDriver) {
      setLiveDriverPos(null);
      return;
    }

    const startLat = assignedDriver.currentLocation?.lat ?? 9.5600;
    const startLng = assignedDriver.currentLocation?.lng ?? 44.0650;

    let currentLat = startLat;
    let currentLng = startLng;
    let heading = 45;

    setLiveDriverPos({ lat: currentLat, lng: currentLng, heading });

    if (!isDriverEnRoute || !pickupLocation) return;

    const targetLat = currentRide?.status === 'in_progress' && dropoffLocation
      ? dropoffLocation.lat
      : pickupLocation.lat;
    const targetLng = currentRide?.status === 'in_progress' && dropoffLocation
      ? dropoffLocation.lng
      : pickupLocation.lng;

    const interval = setInterval(() => {
      const dLat = targetLat - currentLat;
      const dLng = targetLng - currentLng;
      const dist = Math.hypot(dLat, dLng);

      if (dist > 0.0002) {
        const step = 0.00012;
        currentLat += (dLat / dist) * step;
        currentLng += (dLng / dist) * step;
        heading = (Math.atan2(dLng, dLat) * 180) / Math.PI;
        setLiveDriverPos({ lat: currentLat, lng: currentLng, heading });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [assignedDriver?.id, isDriverEnRoute, pickupLocation?.lat, pickupLocation?.lng, dropoffLocation?.lat, dropoffLocation?.lng, currentRide?.status]);

  const handleSetLocation = useCallback((type: 'pickup' | 'dropoff', lat: number, lng: number) => {
    let minDistance = Infinity;
    let nearest = CITY_LOCATIONS[0];

    for (const loc of CITY_LOCATIONS) {
      const dist = Math.hypot(loc.lat - lat, loc.lng - lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = loc;
      }
    }

    const name =
      minDistance < 0.008
        ? nearest.name
        : `Hargeisa Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    const address =
      minDistance < 0.008
        ? nearest.address
        : `GPS: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;

    const newLoc = {
      id: `google_pin_${Date.now()}`,
      name,
      address,
      lat,
      lng,
    };

    if (type === 'dropoff') {
      setDropoffLocation(newLoc);
    } else {
      setPickupLocation(newLoc);
    }
  }, [setDropoffLocation, setPickupLocation]);

  const handleCenterGPS = () => {
    if ('geolocation' in navigator) {
      setIsCenteringGPS(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsCenteringGPS(false);
          const { latitude, longitude } = pos.coords;
          setUserGpsLocation({ lat: latitude, lng: longitude });
          handleSetLocation('pickup', latitude, longitude);
          if (map) {
            map.panTo({ lat: latitude, lng: longitude });
            map.setZoom(15);
          }
        },
        () => {
          setIsCenteringGPS(false);
          setUserGpsLocation({ lat: 9.5600, lng: 44.0650 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const handleRecenterBounds = () => {
    if (!map) return;
    if (pickupLocation && dropoffLocation) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: pickupLocation.lat, lng: pickupLocation.lng });
      bounds.extend({ lat: dropoffLocation.lat, lng: dropoffLocation.lng });
      if (liveDriverPos) {
        bounds.extend({ lat: liveDriverPos.lat, lng: liveDriverPos.lng });
      }
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 50, right: 50 });
    } else if (pickupLocation) {
      map.panTo({ lat: pickupLocation.lat, lng: pickupLocation.lng });
      map.setZoom(15);
    } else {
      map.panTo({ lat: 9.5600, lng: 44.0650 });
      map.setZoom(14);
    }
  };

  const defaultCenter = pickupLocation
    ? { lat: pickupLocation.lat, lng: pickupLocation.lng }
    : { lat: 9.5600, lng: 44.0650 };

  return (
    <div className="w-full relative overflow-hidden select-none font-sans" style={{ height }}>
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={14}
        mapId={CUSTOM_MAP_ID}
        mapTypeId={mapTypeId}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
        disableDefaultUI={true}
        gestureHandling="greedy"
      >
          <TrafficLayerController showTraffic={showTraffic} />

          {pickupLocation && dropoffLocation && (
            <GoogleRouteRenderer
              origin={{ lat: pickupLocation.lat, lng: pickupLocation.lng }}
              destination={{ lat: dropoffLocation.lat, lng: dropoffLocation.lng }}
              riderBOrigin={activeRide?.coPassenger?.pickupLocation ? { lat: activeRide.coPassenger.pickupLocation.lat, lng: activeRide.coPassenger.pickupLocation.lng } : null}
              riderBDestination={activeRide?.coPassenger?.dropoffLocation ? { lat: activeRide.coPassenger.dropoffLocation.lat, lng: activeRide.coPassenger.dropoffLocation.lng } : null}
              driverPosition={liveDriverPos ? { lat: liveDriverPos.lat, lng: liveDriverPos.lng } : null}
              isDriverApproaching={activeRide?.status === 'accepted' || activeRide?.status === 'driver_arrived'}
              roadCoordinates={roadRoute?.coordinates}
            />
          )}

          <MapClickHandler
            selectableMode={selectableMode}
            onSetLocation={handleSetLocation}
          />

          {/* User Precise GPS Pin */}
          {userGpsLocation && (
            <HtmlMapMarker
              position={{ lat: userGpsLocation.lat, lng: userGpsLocation.lng }}
              title="Your Precise GPS Location"
              zIndex={40}
            >
              <div className="relative flex flex-col items-center">
                <div className="absolute -inset-2 bg-blue-500/50 rounded-full animate-ping pointer-events-none" />
                <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-xl text-white">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
            </HtmlMapMarker>
          )}

          {/* Rider Pickup Beacon Marker */}
          {pickupLocation && (
            <HtmlMapMarker
              position={{ lat: pickupLocation.lat, lng: pickupLocation.lng }}
              title={`Pickup: ${pickupLocation?.name || 'Halka aad Joogto'}`}
              zIndex={50}
            >
              <div className="relative flex flex-col items-center select-none pointer-events-none">
                {/* Blue Speech Bubble Badge */}
                <div className="relative bg-[#0066F5] text-white text-[11px] font-extrabold px-3 py-1 rounded-xl shadow-xl whitespace-nowrap mb-1 flex items-center space-x-1 border border-blue-400/30 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[5px] after:border-transparent after:border-t-[#0066F5]">
                  <span>Halka aad Joogto</span>
                </div>
                {/* Blue Location Pulse Beacon */}
                <div className="relative mt-1 flex items-center justify-center">
                  <div className="absolute -inset-2 bg-blue-500/40 rounded-full animate-ping pointer-events-none" />
                  <div className="w-5 h-5 rounded-full bg-[#0066F5] border-[2.5px] border-white flex items-center justify-center shadow-lg text-white">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
              </div>
            </HtmlMapMarker>
          )}

          {/* Rider A Dropoff Marker */}
          {dropoffLocation && (
            <HtmlMapMarker
              position={{ lat: dropoffLocation.lat, lng: dropoffLocation.lng }}
              title={`Destination A: ${dropoffLocation?.name || 'Dropoff'}`}
              zIndex={50}
            >
              <div className="relative flex flex-col items-center">
                <div className="px-2 py-0.5 bg-slate-950/90 border border-indigo-400 text-indigo-300 text-[10px] font-black rounded-md shadow-md mb-1 whitespace-nowrap">
                  Dropoff A: {(dropoffLocation?.name || 'Dropoff').slice(0, 18)}
                </div>
                <div className="w-8 h-8 rounded-full bg-[#094757] border-2 border-[#00E575] flex items-center justify-center text-[#00E575] shadow-lg">
                  <span className="text-xs font-black">A</span>
                </div>
              </div>
            </HtmlMapMarker>
          )}

          {/* Rider B Pickup Marker (Co-Rider in Wadaage Share) */}
          {activeRide?.coPassenger?.pickupLocation && (
            <HtmlMapMarker
              position={{ lat: activeRide.coPassenger.pickupLocation.lat, lng: activeRide.coPassenger.pickupLocation.lng }}
              title={`Pickup B: ${activeRide.coPassenger.pickupLocation.name}`}
              zIndex={55}
            >
              <div className="relative flex flex-col items-center">
                <div className="px-2 py-0.5 bg-teal-950/95 border border-teal-400 text-teal-300 text-[10px] font-black rounded-md shadow-md mb-1 whitespace-nowrap">
                  Pickup B: {activeRide.coPassenger.name.split(' ')[0]}
                </div>
                <div className="w-8 h-8 rounded-full bg-teal-600 border-2 border-white flex items-center justify-center text-white shadow-lg">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
            </HtmlMapMarker>
          )}

          {/* Rider B Dropoff Marker */}
          {activeRide?.coPassenger?.dropoffLocation && (
            <HtmlMapMarker
              position={{ lat: activeRide.coPassenger.dropoffLocation.lat, lng: activeRide.coPassenger.dropoffLocation.lng }}
              title={`Dropoff B: ${activeRide.coPassenger.dropoffLocation.name}`}
              zIndex={55}
            >
              <div className="relative flex flex-col items-center">
                <div className="px-2 py-0.5 bg-teal-950/95 border border-teal-400 text-teal-300 text-[10px] font-black rounded-md shadow-md mb-1 whitespace-nowrap">
                  Dropoff B: {activeRide.coPassenger.dropoffLocation.name.slice(0, 18)}
                </div>
                <div className="w-8 h-8 rounded-full bg-teal-800 border-2 border-teal-300 flex items-center justify-center text-teal-200 shadow-lg font-black text-xs">
                  B
                </div>
              </div>
            </HtmlMapMarker>
          )}

          {/* Mid-Route Floating Indicator Card */}
          {pickupLocation && dropoffLocation && (
            <HtmlMapMarker
              position={{
                lat: (pickupLocation.lat + dropoffLocation.lat) / 2,
                lng: (pickupLocation.lng + dropoffLocation.lng) / 2,
              }}
              title="Route distance and duration"
              zIndex={45}
            >
              <div className="relative flex items-center space-x-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-xl border border-slate-200 text-slate-800 text-xs font-black whitespace-nowrap pointer-events-none select-none -translate-x-1/2 -translate-y-1/2">
                <CarIcon className="w-4 h-4 text-slate-800 shrink-0" />
                <span className="text-slate-900 font-black">~ {roadDistanceKm ? roadDistanceKm.toFixed(1) : '7.0'} km</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-700 font-bold">~ {roadDurationMins || '10'} daqiiqo</span>
              </div>
            </HtmlMapMarker>
          )}

          {/* Surge Heatmap Zones (Driver / Admin View) */}
          {showSurgeHeatmap && [
            { name: 'Central Market', lat: 9.5600, lng: 44.0650, surge: '1.6x', color: '#ef4444' },
            { name: 'Jigjiga Yar', lat: 9.5680, lng: 44.0780, surge: '1.4x', color: '#f59e0b' },
            { name: 'Egal Airport', lat: 9.5180, lng: 44.0880, surge: '1.5x', color: '#ef4444' },
            { name: '26 June Area', lat: 9.5750, lng: 44.0550, surge: '1.3x', color: '#10b981' },
          ].map((zone) => (
            <HtmlMapMarker key={zone.name} position={{ lat: zone.lat, lng: zone.lng }} title={`Surge ${zone.name}`} zIndex={20}>
              <div className="relative flex flex-col items-center pointer-events-none">
                <div
                  className="w-20 h-20 rounded-full animate-pulse opacity-30 border-2"
                  style={{ backgroundColor: zone.color, borderColor: zone.color }}
                />
                <div className="absolute top-6 px-1.5 py-0.5 rounded-md bg-slate-950/90 text-white text-[9px] font-black border border-slate-700 shadow flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>{zone.name}</span>
                  <span className="text-amber-300">{zone.surge}</span>
                </div>
              </div>
            </HtmlMapMarker>
          ))}

          {/* Active Assigned Driver Traced in Real-Time */}
          {liveDriverPos && assignedDriver && (
            <HtmlMapMarker
              position={{ lat: liveDriverPos.lat, lng: liveDriverPos.lng }}
              title={`Active Driver: ${assignedDriver.name || 'Driver'}`}
              zIndex={60}
            >
              <div className="flex flex-col items-center cursor-pointer group animate-fadeIn">
                {role === 'admin' && (
                  <div className="px-2 py-0.5 bg-emerald-950/95 border border-emerald-400 text-emerald-300 text-[10px] font-black rounded-lg shadow-lg mb-1 whitespace-nowrap flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>{(assignedDriver.name || 'Driver').split(' ')[0]} (Live)</span>
                  </div>
                )}
                <div
                  className="w-9 h-9 rounded-full bg-slate-950 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-2xl transition-transform duration-500"
                  style={{ transform: `rotate(${liveDriverPos.heading}deg)` }}
                >
                  <CarIcon className="w-5 h-5" />
                </div>
              </div>
            </HtmlMapMarker>
          )}

          {/* Idle Available Nearby Fleet Drivers */}
          {drivers
            .filter((d) => !assignedDriver || d.id !== assignedDriver.id)
            .map((driver) => {
              const dLat = driver.currentLocation?.lat ?? (driver as any).currentLat ?? 9.5600;
              const dLng = driver.currentLocation?.lng ?? (driver as any).currentLng ?? 44.0650;
              const carPlate = driver.vehicle?.licensePlate ?? (driver as any).carPlate ?? 'HGA-101';

              return (
                <HtmlMapMarker
                  key={driver.id}
                  position={{ lat: dLat, lng: dLng }}
                  title={`${driver.name || 'Driver'} (${carPlate})`}
                  zIndex={30}
                >
                  <div className="flex flex-col items-center cursor-pointer group">
                    {role === 'admin' && (
                      <div className="px-1.5 py-0.5 bg-slate-900/90 border border-slate-700 text-slate-200 text-[9px] font-bold rounded shadow mb-0.5 whitespace-nowrap">
                        {(driver.name || 'Driver').split(' ')[0]} ({carPlate})
                      </div>
                    )}
                    <div className="w-7 h-7 rounded-full bg-[#021820] border-2 border-[#00E575] flex items-center justify-center text-[#00E575] shadow-lg group-hover:scale-110 transition">
                      <CarIcon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </HtmlMapMarker>
              );
            })}
        </Map>

      {/* Floating Essential Google Map Controls */}
      <div className="absolute right-3 bottom-4 flex flex-col space-y-2 z-30">
        <button
          type="button"
          onClick={handleCenterGPS}
          disabled={isCenteringGPS}
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-emerald-400 flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer disabled:opacity-50"
          title="Locate My GPS Position"
        >
          <Crosshair className={`w-5 h-5 ${isCenteringGPS ? 'animate-spin text-amber-500' : ''}`} />
        </button>

        <button
          type="button"
          onClick={handleRecenterBounds}
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-slate-800 transition active:scale-95 font-black text-xs cursor-pointer"
          title="Fit Route / Fleet to View"
        >
          <Compass className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setMapTypeId((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))}
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-slate-800 transition active:scale-95 text-xs font-bold cursor-pointer"
          title="Toggle Satellite Imagery"
        >
          <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        </button>

        <button
          type="button"
          onClick={() => setShowTraffic((prev) => !prev)}
          className={`w-10 h-10 rounded-xl backdrop-blur-md border flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer ${
            showTraffic
              ? 'bg-[#00E575] text-slate-950 border-[#00E575]'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800'
          }`}
          title={showTraffic ? 'Live Traffic: ON' : 'Live Traffic: OFF'}
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const GoogleInteractiveMap: React.FC<GoogleInteractiveMapProps> = (props) => {
  return <MapLibreInteractiveMap {...props} />;
};
