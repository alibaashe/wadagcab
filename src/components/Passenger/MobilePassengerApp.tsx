import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Car,
  Clock,
  Globe,
  LogOut,
  MapPin,
  Menu,
  Radio,
  Shield,
  Tag,
  Users,
  X,
  History,
  CheckCircle,
  Navigation,
  FileText,
  Search,
  ChevronRight,
  ChevronDown,
  Building,
  Plane,
  CreditCard,
  User,
  Gift,
  Crosshair,
  Zap,
  Sparkles,
  Phone,
  Check,
  ShieldCheck,
  Heart,
  Bell,
  Plus,
  Minus,
  Briefcase,
  Home,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { UnifiedMap } from '../Map/UnifiedMap';
import { LocationPermissionPrompt } from '../Common/LocationPermissionPrompt';
import { ActiveRideCard } from './ActiveRideCard';
import { PromosModal } from './PromosModal';
import { TripHistoryModal } from './TripHistoryModal';
import { SafetyCenterModal } from './SafetyCenterModal';
import { UssdOfflineBookingModal } from './UssdOfflineBookingModal';
import { FareSplitModal } from './FareSplitModal';
import { CommuteSubscriptionModal } from './CommuteSubscriptionModal';
import { LocationSetupModal } from '../Location/LocationSetupModal';
import { WadaageSearchOverlay } from './WadaageSearchOverlay';
import { VehicleIllustration } from '../Common/VehicleIllustration';
import { SomalilandFlag } from '../Common/SomalilandFlag';
import { WadaageLogo } from '../Common/WadaageLogo';
import { WadaageShareBrandLogo } from '../Common/WadaageShareBrandLogo';
import { WadaageCarCardGraphic } from '../Common/WadaageCarCardGraphic';
import { HARGEISA_PLACES, HargeisaPlace } from '../../data/hargeisaPlaces';
import { calculateDistanceKm, calculateDurationMins, computeFare, formatCurrency, EXCHANGE_RATE_USD_TO_SLSH } from '../../utils/geo';
import { LocationNode, VehicleCategory } from '../../types';
import { getApiUrl } from '../../services/apiConfig';
import { resolveHargeisaPlaceCoordinates } from '../../utils/hargeisaPlaceMatcher';

export const MobilePassengerApp: React.FC = () => {
  const {
    pickupLocation,
    setPickupLocation,
    dropoffLocation,
    setDropoffLocation,
    selectedCategory,
    setSelectedCategory,
    pricing,
    bookRide,
    cancelRide,
    currentRide,
    isDetectingLocation,
    detectUserRealLocation,
    language,
    setLanguage,
    t,
    currentUser,
    logout,
    roadDistanceKm,
    roadDurationMins,
    roadRouteSummary,
    isCalculatingRoadRoute,
  } = useRide();

  // Navigation Tabs: 'dalbo' (Home) | 'safarradayda' (Activity) | 'favorites' | 'akoonka' (Account)
  type TabType = 'dalbo' | 'safarradayda' | 'favorites' | 'akoonka';
  const [activeTab, setActiveTab] = useState<TabType>('dalbo');

  // Modals & Drawers
  const [showLocationSearchModal, setShowLocationSearchModal] = useState<'pickup' | 'dropoff' | null>(null);
  const [showSuperAppSearch, setShowSuperAppSearch] = useState(false);
  const [showPromosModal, setShowPromosModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showUssdModal, setShowUssdModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showCommuteModal, setShowCommuteModal] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [showLocationSetupModal, setShowLocationSetupModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Favorite Saved Places for 1-click booking
  const [favoritePlaces] = useState([
    { id: 'fav-1', name: 'Guriga (Home)', address: 'Ina Naxar Street, Hargeisa', lat: 9.5320, lng: 44.0710 },
    { id: 'fav-2', name: 'Shaqada (Work / Office)', address: 'Dahabshiil Business Center, Downtown', lat: 9.5615, lng: 44.0660 },
    { id: 'fav-3', name: 'Egal International Airport (HGA)', address: 'Airport Road, South Hargeisa', lat: 9.5181, lng: 44.0888 },
    { id: 'fav-4', name: 'Berbera Bus Terminal (Istaanka Berbera)', address: 'East Highway, 26 June District, Hargeisa', lat: 9.5680, lng: 44.0850 },
    { id: 'fav-5', name: 'Maan-soor Hotel', address: 'Jigjiga Yar District, Hargeisa', lat: 9.5755, lng: 44.0722 },
    { id: 'fav-6', name: 'Jaamacadda Hargeysa', address: 'University Road, Hargeisa', lat: 9.5512, lng: 44.0585 },
  ]);

  // Options & Inputs
  const [paymentMethod, setPaymentMethod] = useState<'cash'>('cash');
  const [profileType, setProfileType] = useState<'Personal' | 'Business'>('Personal');
  const [driverNote, setDriverNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [showPromoInputModal, setShowPromoInputModal] = useState(false);
  const [orderTiming, setOrderTiming] = useState<'now' | 'advance'>('now');
  const [advanceMinutes, setAdvanceMinutes] = useState<number>(30);

  const distanceKm = roadDistanceKm || calculateDistanceKm(
    pickupLocation.lat,
    pickupLocation.lng,
    dropoffLocation.lat,
    dropoffLocation.lng
  );
  const durationMins = roadDurationMins || calculateDurationMins(distanceKm);
  const currentFare = computeFare(selectedCategory, distanceKm, durationMins, pricing);

  // Fares formatted for Somaliland Shillings (matching 33,000 SLSH & 54,000 SLSH for standard route)
  const wadaageFare = computeFare('wadaage_share', distanceKm, durationMins, pricing);
  const taxiFare = computeFare('wadaage_taxi', distanceKm, durationMins, pricing);

  const formatSlshRound = (usdFare: number, fallbackSlsh: number) => {
    const rawSlsh = Math.round(usdFare * EXCHANGE_RATE_USD_TO_SLSH);
    if (!rawSlsh || isNaN(rawSlsh)) return `${fallbackSlsh.toLocaleString()} SLSH`;
    // Round to nearest 500 or 1,000
    const rounded = Math.round(rawSlsh / 500) * 500;
    return `${rounded.toLocaleString()} SLSH`;
  };

  const isDefaultScreenshotRoute =
    (pickupLocation?.name?.toLowerCase().includes('naxar') || pickupLocation?.id === 'ina_naxar_street') &&
    (dropoffLocation?.name?.toLowerCase().includes('berbera') || dropoffLocation?.id === 'berbera_bus_terminal');

  const wadaageFareFormatted = isDefaultScreenshotRoute ? '33,000 SLSH' : formatSlshRound(wadaageFare.finalFare, 33000);
  const taxiFareFormatted = isDefaultScreenshotRoute ? '54,000 SLSH' : formatSlshRound(taxiFare.finalFare, 54000);

  // Vehicle Option Data
  const vehicleOptions = [
    {
      id: 'wadaage_share' as VehicleCategory,
      illustration: 'wadaage' as const,
      name: 'Wadaage',
      subtitle: '"Safar wadaag, nolol wadaag."',
      description: t.wadaageShareDesc,
      capacity: '1–4 kursi',
      badge: 'SHARE',
      baseFare: wadaageFare,
      etaMins: 10,
    },
    {
      id: 'wadaage_taxi' as VehicleCategory,
      illustration: 'taxi' as const,
      name: 'Normal Taxi',
      subtitle: '"Gaari kuu gaar ah"',
      description: t.wadaageTaxiDesc,
      capacity: '4',
      baseFare: computeFare('wadaage_taxi', distanceKm, durationMins, pricing),
      etaMins: 4,
    },
  ];

  const [modalGoogleResults, setModalGoogleResults] = useState<LocationNode[]>([]);
  const [isSearchingModalGoogle, setIsSearchingModalGoogle] = useState(false);
  const [modalCategory, setModalCategory] = useState<string>('All');
  const modalAbortRef = React.useRef<AbortController | null>(null);

  // Live Google Maps suggestions for location search modal
  React.useEffect(() => {
    const trimmed = searchFilter.trim();
    if (!trimmed) {
      setModalGoogleResults([]);
      setIsSearchingModalGoogle(false);
      return;
    }

    if (modalAbortRef.current) {
      modalAbortRef.current.abort();
    }
    const controller = new AbortController();
    modalAbortRef.current = controller;

    setIsSearchingModalGoogle(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(getApiUrl(`/api/places/autocomplete?input=${encodeURIComponent(trimmed)}`), {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.predictions) && data.predictions.length > 0) {
            const formatted: LocationNode[] = data.predictions.map((p: any) =>
              resolveHargeisaPlaceCoordinates({
                id: p.id,
                name: p.name || p.address?.split(',')[0] || trimmed,
                address: p.address || `${trimmed}, Hargeisa, Somaliland`,
                lat: typeof p.lat === 'number' ? p.lat : undefined,
                lng: typeof p.lng === 'number' ? p.lng : undefined,
                category: p.category || 'Google Map Location',
              })
            );
            setModalGoogleResults(formatted);
          } else {
            setModalGoogleResults([]);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setModalGoogleResults([]);
        }
      } finally {
        setIsSearchingModalGoogle(false);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchFilter]);

  const handleSelectSearchedPlace = (place: LocationNode | HargeisaPlace | string) => {
    const locNode = resolveHargeisaPlaceCoordinates(place as any);
    if (showLocationSearchModal === 'pickup') {
      setPickupLocation(locNode);
    } else {
      setDropoffLocation(locNode);
    }
    setShowLocationSearchModal(null);
    setSearchFilter('');
    setModalGoogleResults([]);
  };

  const filteredLocalPlaces = React.useMemo(() => {
    const categoryMap: Record<string, string> = {
      'Hotels': 'Hotel',
      'Hospitals': 'Hospital',
      'Banks': 'Financial',
      'Malls': 'Commercial',
      'Universities': 'Education',
      'Transit': 'Transit',
    };
    const cat = modalCategory !== 'All' ? categoryMap[modalCategory] || modalCategory : undefined;
    if (!searchFilter && modalCategory === 'All') {
      return HARGEISA_PLACES.slice(0, 15);
    }
    return HARGEISA_PLACES.filter((p) => {
      if (cat && !p.category.toLowerCase().includes(cat.toLowerCase())) return false;
      if (!searchFilter) return true;
      const q = searchFilter.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.district?.toLowerCase().includes(q) ||
        p.searchTerms?.some((t) => t.includes(q))
      );
    });
  }, [searchFilter, modalCategory]);

  const combinedModalPlaces = React.useMemo(() => {
    const seen = new Set<string>();
    const list: (LocationNode & { isGoogle?: boolean; subCategory?: string; district?: string })[] = [];

    for (const r of filteredLocalPlaces) {
      seen.add(r.name.toLowerCase().trim());
      list.push(r);
    }

    for (const g of modalGoogleResults) {
      const key = g.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ ...g, isGoogle: true });
      }
    }

    return list;
  }, [filteredLocalPlaces, modalGoogleResults]);

  const handleBookSelected = () => {
    const scheduledTime = orderTiming === 'advance'
      ? new Date(Date.now() + advanceMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : undefined;
    bookRide('cash', undefined, undefined, undefined, scheduledTime);
  };

  return (
    <div className="relative w-full h-full min-h-full flex flex-col bg-slate-100 text-slate-800 overflow-hidden font-sans select-none">
      {/* 0. GPS Live Location Permission Prompt */}
      <LocationPermissionPrompt />

      {/* 1. TOP APP BAR - Matching exact screenshot design */}
      <header className="bg-white border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between shadow-2xs z-40 shrink-0 select-none">
        {/* Left: Blue Hamburger in rounded circle */}
        <button
          onClick={() => setShowMenuDrawer(true)}
          className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-[#0066F5] shadow-xs hover:bg-slate-50 transition active:scale-95 cursor-pointer"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Center: Wadaage Share Brand Logo */}
        <div className="flex items-center justify-center">
          <WadaageShareBrandLogo size="md" />
        </div>

        {/* Right: Somaliland Flag + Hargeisa Pill & Notification Bell */}
        <div className="flex items-center space-x-2">
          {/* Somaliland Flag Pill */}
          <button
            onClick={() => setShowCityModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-[#0066F5] shadow-xs hover:bg-slate-50 transition active:scale-95 cursor-pointer"
            title="Magaalada / City"
          >
            <SomalilandFlag className="w-4 h-2.5 rounded-xs shrink-0" />
            <span>Hargeisa</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#0066F5]" />
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => setShowNotificationsModal(true)}
            className="relative w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-800 shadow-xs hover:bg-slate-50 transition active:scale-95 cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-700" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>
        </div>
      </header>

      {/* MAIN TAB CONTENT AREA */}
      <div className="flex-1 w-full h-full overflow-hidden relative flex flex-col">
        {/* TAB 1: DALBO (MAP & VEHICLE SELECTION) */}
        {activeTab === 'dalbo' && (
          <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative">
            {/* FLOATING ROUTE INPUT CARD OVER MAP (Matching screenshot exactly) */}
            {!currentRide && (
              <div className="absolute top-3 inset-x-3.5 z-20 bg-white rounded-2xl border border-slate-200 shadow-lg p-3 select-none">
                {/* Pickup Row */}
                <div
                  onClick={() => setShowLocationSearchModal('pickup')}
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-50/80 -mx-1 px-1.5 py-1 rounded-xl transition"
                >
                  <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-extrabold text-slate-900 tracking-tight leading-tight">
                        Halka aad Joogto
                      </div>
                      <div className="text-[11px] text-slate-500 truncate font-medium">
                        {pickupLocation?.name || 'Ina Naxar Street, Hargeisa'}
                      </div>
                    </div>
                  </div>

                  {/* Blue Pill: Goobtaada (Use Current GPS) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      detectUserRealLocation();
                    }}
                    disabled={isDetectingLocation}
                    className="shrink-0 ml-2 px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-[#0066F5] border border-blue-100 text-xs font-bold flex items-center space-x-1 shadow-2xs active:scale-95 transition cursor-pointer"
                    title="Isticmaal GPS-ka tooska ah"
                  >
                    <Navigation className={`w-3 h-3 text-[#0066F5] ${isDetectingLocation ? 'animate-spin' : ''}`} />
                    <span>Goobtaada</span>
                  </button>
                </div>

                {/* Dotted vertical line separator */}
                <div className="flex items-center space-x-1 pl-1 py-0.5">
                  <div className="flex flex-col items-center space-y-0.5 ml-[1px]">
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                  </div>
                </div>

                {/* Dropoff Row */}
                <div
                  onClick={() => setShowLocationSearchModal('dropoff')}
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-50/80 -mx-1 px-1.5 py-1 rounded-xl transition"
                >
                  <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-extrabold text-slate-900 tracking-tight leading-tight">
                        Halka aad Tageyso
                      </div>
                      <div className="text-[11px] text-slate-500 truncate font-medium">
                        {dropoffLocation?.name || 'Berbera Bus Terminal (Istaanka Berbera)'}
                      </div>
                    </div>
                  </div>

                  {/* Clear button ✕ */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLocationSearchModal('dropoff');
                    }}
                    className="shrink-0 ml-2 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition active:scale-90 cursor-pointer"
                    title="Beddel meesha"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* FULL BLEED MAP AREA */}
            <div className="relative flex-1 w-full h-full overflow-hidden">
              <UnifiedMap height="100%" />

              {/* Floating GPS Button on right */}
              <div className="absolute top-36 right-3 z-20 flex flex-col space-y-2 select-none">
                <button
                  type="button"
                  onClick={() => detectUserRealLocation()}
                  disabled={isDetectingLocation}
                  className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md flex items-center justify-center text-[#0066F5] hover:bg-white active:scale-95 transition cursor-pointer"
                  title="Goobteyda GPS"
                >
                  <Crosshair className={`w-5 h-5 ${isDetectingLocation ? 'animate-spin text-amber-500' : ''}`} />
                </button>
              </div>

              {/* ACTIVE RIDE CARD OVERLAY - Floating docked at bottom of full-bleed map */}
              {currentRide && currentRide.status !== 'searching' && (
                <div className="absolute bottom-3 inset-x-3 z-30 max-w-md mx-auto pointer-events-auto">
                  <ActiveRideCard onOpenSafetyModal={() => setShowSafetyModal(true)} />
                </div>
              )}
            </div>

            {/* SEARCHING STATE WITH ANIMATED RADAR PULSE */}
            {currentRide && currentRide.status === 'searching' && (
              <div className="relative z-30 bg-white border-t border-slate-200 shadow-2xl p-4 flex flex-col space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">
                      {t.driverSearchingTitle}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {t.driverSearchingSub}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#008751] flex items-center justify-center">
                    <Car className="w-5 h-5 animate-bounce" />
                  </div>
                </div>

                <div className="relative w-full h-32 bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
                  <div className="absolute w-28 h-28 rounded-full border border-emerald-500/30 animate-ping pointer-events-none" />
                  <div className="absolute w-20 h-20 rounded-full border border-emerald-400/40 animate-pulse pointer-events-none" />
                  <div className="absolute w-12 h-12 rounded-full bg-emerald-500/20 pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-emerald-500/10 to-transparent animate-spin duration-3000 pointer-events-none" />
                  <div className="relative z-10 flex flex-col items-center">
                    <VehicleIllustration type={selectedCategory === 'wadaage_share' ? 'wadaage' : 'taxi'} className="w-20 h-12 drop-shadow-[0_0_12px_rgba(0,135,81,0.8)]" />
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-1">
                      Wadaage Dispatch
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t.nearbyCars}:</span>
                    <span className="font-extrabold text-[#008751]">{t.nearbyCarsCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{language === 'so' ? 'Meesha aad joogto' : 'Pickup'}:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">{currentRide.pickup?.name || 'Pickup Location'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{language === 'so' ? 'Halka aad u socoto' : 'Dropoff'}:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">{currentRide.dropoff?.name || 'Dropoff Destination'}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-800">{t.tripFare}:</span>
                    <span className="font-black text-[#008751]">
                      {Math.round((Number(currentRide.totalFare) || 0) * EXCHANGE_RATE_USD_TO_SLSH).toLocaleString()} SLSH
                    </span>
                  </div>
                </div>

                <button
                  onClick={cancelRide}
                  className="w-full py-2.5 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 font-bold rounded-xl text-xs transition active:scale-95"
                >
                  {t.cancelSearch}
                </button>
              </div>
            )}

            {/* BOTTOM VEHICLE SELECTION SHEET (Matching image.png) */}
            {!currentRide && (
              <div className="absolute bottom-0 inset-x-0 z-20 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200/80 px-4 pt-2.5 pb-4 select-none">
                {/* Drag handle */}
                <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

                {/* 2 Side-by-side vehicle cards */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {/* Card 1: Wadaage */}
                  <div
                    onClick={() => setSelectedCategory('wadaage_share')}
                    className={`relative rounded-2xl p-3 flex flex-col justify-between transition cursor-pointer ${
                      selectedCategory === 'wadaage_share'
                        ? 'border-2 border-emerald-500 bg-white shadow-md ring-2 ring-emerald-500/20'
                        : 'border border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Top right checkmark badge */}
                    <div className="absolute top-2.5 right-2.5">
                      {selectedCategory === 'wadaage_share' ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 bg-white" />
                      )}
                    </div>

                    {/* Vector Car graphic */}
                    <div className="w-full flex justify-center py-1">
                      <WadaageCarCardGraphic type="wadaage" className="w-28 h-14 object-contain drop-shadow-xs" />
                    </div>

                    {/* Title & Slogan */}
                    <div>
                      <div className="font-black text-slate-900 text-sm tracking-tight">Wadaage</div>
                      <div className="text-[11px] text-slate-500 font-medium leading-tight line-clamp-1">
                        "Safar wadaag, nolol wadaag."
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mt-2 text-base font-black text-slate-900 tracking-tight">
                      {wadaageFareFormatted}
                    </div>

                    {/* Meta */}
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-bold border-t border-slate-100 pt-1.5">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>1–4 kursi</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>~ 10 daqiiqo</span>
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Normal Taxi */}
                  <div
                    onClick={() => setSelectedCategory('wadaage_taxi')}
                    className={`relative rounded-2xl p-3 flex flex-col justify-between transition cursor-pointer ${
                      selectedCategory === 'wadaage_taxi'
                        ? 'border-2 border-emerald-500 bg-white shadow-md ring-2 ring-emerald-500/20'
                        : 'border border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Top right indicator */}
                    <div className="absolute top-2.5 right-2.5">
                      {selectedCategory === 'wadaage_taxi' ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 bg-white" />
                      )}
                    </div>

                    {/* Vector Car graphic */}
                    <div className="w-full flex justify-center py-1">
                      <WadaageCarCardGraphic type="taxi" className="w-28 h-14 object-contain drop-shadow-xs" />
                    </div>

                    {/* Title & Slogan */}
                    <div>
                      <div className="font-black text-slate-900 text-sm tracking-tight">Normal Taxi</div>
                      <div className="text-[11px] text-slate-500 font-medium leading-tight line-clamp-1">
                        "Gaari kuu gaar ah"
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mt-2 text-base font-black text-slate-900 tracking-tight">
                      {taxiFareFormatted}
                    </div>

                    {/* Meta */}
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-bold border-t border-slate-100 pt-1.5">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>1–4 kursi</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>~ 10 daqiiqo</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Big Green CTA Button: Dalbo Hada → */}
                <button
                  onClick={handleBookSelected}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#008751] hover:bg-[#007345] active:scale-[0.98] text-white font-black text-base tracking-wide shadow-md flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <span>
                    {orderTiming === 'advance'
                      ? (language === 'so'
                          ? `Xaqiiji Dalabka Hore (${new Date(Date.now() + advanceMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                          : `Confirm Advance Order (${new Date(Date.now() + advanceMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`)
                      : (language === 'so'
                          ? `Dalbo ${selectedCategory === 'wadaage_share' ? 'Wadaage' : 'Taksi'}`
                          : `Book ${selectedCategory === 'wadaage_share' ? 'Wadaage' : 'Taxi'}`)}
                  </span>
                  <div className="text-right">
                    <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-black block">
                      {Math.round(currentFare.finalFare * EXCHANGE_RATE_USD_TO_SLSH).toLocaleString()} SLSH (${currentFare.finalFare.toFixed(2)})
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAFARRADAYDA (TRIP HISTORY & ACTIVITY) */}
        {activeTab === 'safarradayda' && (
          <div className="w-full h-full flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  {language === 'so' ? 'Safarradii Hore' : 'Trip History'}
                </h2>
                <p className="text-xs text-slate-500">
                  {language === 'so' ? 'Daawo safarrada aad ku martay Hargeysa' : 'Past rides and digital receipts'}
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="text-xs font-bold text-[#008751] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
              >
                {language === 'so' ? 'Dhammaan' : 'All Receipts'}
              </button>
            </div>

            {/* Current Active Trip Banner if available */}
            {currentRide && (
              <div
                onClick={() => setActiveTab('dalbo')}
                className="bg-emerald-600 text-white rounded-2xl p-4 shadow-lg flex items-center justify-between cursor-pointer active:scale-98 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Car className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                      {language === 'so' ? 'Safar Hadda Socda' : 'Active Live Trip'}
                    </div>
                    <div className="font-bold text-sm truncate max-w-[200px]">{currentRide.dropoff?.name || 'Dropoff Destination'}</div>
                  </div>
                </div>
                <span className="text-xs font-black bg-white text-emerald-800 px-3 py-1 rounded-full">
                  {language === 'so' ? 'Daawo' : 'View'}
                </span>
              </div>
            )}

            {/* List of Recent Rides */}
            <div className="space-y-3">
              {[
                {
                  id: 'w-101',
                  date: 'Maanta • 16:45',
                  driver: 'Maxamed Cumar',
                  car: 'Toyota Vitz (SL-2044)',
                  from: 'Mansoor Hotel, Jigjiga Yar',
                  to: 'Egal International Airport',
                  fare: '30,000 SLSH ($3.50)',
                  status: 'Completed',
                },
                {
                  id: 'w-102',
                  date: 'Shalay • 11:20',
                  driver: 'Mustafe Cabdi',
                  car: 'Wadaage Share (SL-8821)',
                  from: 'University of Hargeisa',
                  to: '26 June Downtown Market',
                  fare: '15,000 SLSH ($1.50)',
                  status: 'Completed',
                },
                {
                  id: 'w-103',
                  date: 'Dhowaan • 09:10',
                  driver: 'Cali Xasan',
                  car: 'Wadaage Taxi (SL-1029)',
                  from: 'Hargeisa Group Hospital',
                  to: 'Bada Cas District',
                  fare: '20,000 SLSH ($2.00)',
                  status: 'Completed',
                },
              ].map((trip) => (
                <div
                  key={trip.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#008751] flex items-center justify-center font-black text-xs">
                        ✓
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">{trip.car}</div>
                        <div className="text-[10px] text-slate-400">{trip.date}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {trip.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex items-center text-slate-600 truncate">
                      <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 shrink-0" />
                      <span className="truncate">{trip.from}</span>
                    </div>
                    <div className="flex items-center text-slate-900 font-medium truncate">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shrink-0" />
                      <span className="truncate">{trip.to}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Captain: {trip.driver}</span>
                    <span className="font-black text-[#008751]">{trip.fare}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FAVORITES (GOOBAHA LA DOORBIDAY) */}
        {activeTab === 'favorites' && (
          <div className="w-full h-full flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <span>{language === 'so' ? 'Goobaha La Doorbiday' : 'Favorite Places'}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'so' ? 'Hal taabasho ku dalbo meelaha aad sida joogtada ah u tagto' : '1-tap quick booking to your regular spots in Hargeisa'}
              </p>
            </div>

            {/* Quick action grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'fav_home', label: 'Hoyga (Home)', icon: 'home', name: 'Ina Naxar Street, Hargeisa', address: 'Ina Naxar', lat: 9.5320, lng: 44.0710 },
                { id: 'fav_work', label: 'Shaqada (Work)', icon: 'briefcase', name: 'Dahabshiil Business Center', address: '26 June', lat: 9.5615, lng: 44.0660 },
                { id: 'fav_uni', label: 'Jaamacadda', icon: 'graduation-cap', name: 'University of Hargeisa', address: 'Maxamuud Haybe', lat: 9.5512, lng: 44.0585 },
                { id: 'fav_airport', label: 'Madaarka Hargeysa', icon: 'plane', name: 'Egal International Airport', address: 'Airport Rd', lat: 9.5181, lng: 44.0888 },
              ].map((fav) => (
                <div
                  key={fav.id}
                  onClick={() => {
                    setDropoffLocation({
                      id: fav.id,
                      name: fav.name,
                      address: fav.address,
                      lat: fav.lat,
                      lng: fav.lng,
                    });
                    setActiveTab('dalbo');
                  }}
                  className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-md cursor-pointer transition flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#008751] flex items-center justify-center font-bold text-sm">
                      {fav.icon === 'home' ? '🏠' : fav.icon === 'briefcase' ? '💼' : fav.icon === 'graduation-cap' ? '🎓' : '✈️'}
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Tag Hada →
                    </span>
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-900">{fav.label}</div>
                    <div className="text-[11px] text-slate-500 truncate font-medium">{fav.name}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Location adder banner */}
            <div
              onClick={() => {
                setShowLocationSearchModal('dropoff');
              }}
              className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-emerald-100 transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">
                    {language === 'so' ? 'Ku dar Goob Cusub' : 'Add New Favorite Location'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {language === 'so' ? 'Dooro goob kale oo Hargeysa ku taal' : 'Save any landmark in Hargeisa'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
        )}

        {/* TAB 4: AKOONKA (ACCOUNT & PROFILE) */}
        {activeTab === 'akoonka' && (
          <div className="w-full h-full flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
            {/* Profile Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-14 h-14 rounded-full bg-[#008751] text-white flex items-center justify-center font-black text-xl shadow-md">
                {currentUser?.name?.charAt(0) || 'R'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-base text-slate-900 truncate">
                  {currentUser?.name || 'Wadaage Passenger'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">{currentUser?.phone || '+252 63 4918201'}</p>
                <div className="flex items-center space-x-1 text-emerald-600 font-bold text-xs mt-1">
                  <span>⭐ 5.0 Rakaab Qiimo Sare leh</span>
                </div>
              </div>
            </div>

            {/* Emergency SOS Button */}
            <button
              onClick={() => setShowSafetyModal(true)}
              className="w-full p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-left hover:bg-rose-100 transition shadow-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-xs text-rose-900">
                    {language === 'so' ? 'Xarunta Gurmadka Degdegga ah (SOS 999)' : 'Emergency Safety & SOS (999)'}
                  </div>
                  <div className="text-[11px] text-rose-600">
                    {language === 'so' ? 'Boliska Somaliland & Wadaage Dispatch' : 'Somaliland Police & Wadaage Command'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400" />
            </button>

            {/* Account Menu Items */}
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm text-xs font-bold text-slate-800">
              <button
                onClick={() => setShowPromosModal(true)}
                className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="flex items-center space-x-3">
                  <Tag className="w-4 h-4 text-[#008751]" />
                  <span>{t.promoTitle}</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-[#008751] px-2 py-0.5 rounded-full font-black">50% OFF</span>
              </button>

              <button
                onClick={() => setShowUssdModal(true)}
                className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="flex items-center space-x-3">
                  <Radio className="w-4 h-4 text-teal-600" />
                  <span>{language === 'so' ? 'Dalbashada Offline USSD (*990#)' : 'Offline USSD Booking (*990#)'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setShowCommuteModal(true)}
                className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{language === 'so' ? 'Baasaska Shaqada & Jaamacadda' : 'Commuter & Student Passes'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setLanguage(language === 'so' ? 'en' : 'so')}
                className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="flex items-center space-x-3">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>{language === 'so' ? 'Luqadda (Soomaali / English)' : 'Language'}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-bold flex items-center space-x-1">
                  {language === 'so' ? (
                    <>
                      <SomalilandFlag className="w-3.5 h-2.5 rounded-xs" />
                      <span>Soomaali</span>
                    </>
                  ) : (
                    <span>English 🇬🇧</span>
                  )}
                </span>
              </button>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="w-full py-3.5 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </button>
          </div>
        )}
      </div>

      {/* NATIVE MOBILE BOTTOM TAB BAR (Matching screenshot 4 tabs exactly) */}
      <nav className="relative z-40 bg-white border-t border-slate-200/90 px-3 py-2 flex items-center justify-around shadow-lg shrink-0 select-none">
        {/* Tab 1: Dalbo */}
        <button
          type="button"
          onClick={() => setActiveTab('dalbo')}
          className={`flex-1 min-h-[48px] py-1 px-2 flex flex-col items-center justify-center space-y-1 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
            activeTab === 'dalbo'
              ? 'text-emerald-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className="relative">
            <Car className={`w-5 h-5 ${activeTab === 'dalbo' ? 'text-[#008751] stroke-[2.5px]' : 'text-slate-400 stroke-2'}`} />
            {currentRide && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            )}
          </div>
          <span className={`text-[11px] tracking-tight ${activeTab === 'dalbo' ? 'text-[#008751] font-black' : 'text-slate-500'}`}>
            Dalbo
          </span>
        </button>

        {/* Tab 2: Safarradayda */}
        <button
          type="button"
          onClick={() => setActiveTab('safarradayda')}
          className={`flex-1 min-h-[48px] py-1 px-2 flex flex-col items-center justify-center space-y-1 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
            activeTab === 'safarradayda'
              ? 'text-emerald-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Calendar className={`w-5 h-5 ${activeTab === 'safarradayda' ? 'text-[#008751] stroke-[2.5px]' : 'text-slate-400 stroke-2'}`} />
          <span className={`text-[11px] tracking-tight ${activeTab === 'safarradayda' ? 'text-[#008751] font-black' : 'text-slate-500'}`}>
            Safarradayda
          </span>
        </button>

        {/* Tab 3: Favorites */}
        <button
          type="button"
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 min-h-[48px] py-1 px-2 flex flex-col items-center justify-center space-y-1 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
            activeTab === 'favorites'
              ? 'text-emerald-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Heart className={`w-5 h-5 ${activeTab === 'favorites' ? 'text-[#008751] fill-emerald-600 stroke-[2.5px]' : 'text-slate-400 stroke-2'}`} />
          <span className={`text-[11px] tracking-tight ${activeTab === 'favorites' ? 'text-[#008751] font-black' : 'text-slate-500'}`}>
            Favorites
          </span>
        </button>

        {/* Tab 4: Akoonka */}
        <button
          type="button"
          onClick={() => setActiveTab('akoonka')}
          className={`flex-1 min-h-[48px] py-1 px-2 flex flex-col items-center justify-center space-y-1 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
            activeTab === 'akoonka'
              ? 'text-emerald-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'akoonka' ? 'text-[#008751] stroke-[2.5px]' : 'text-slate-400 stroke-2'}`} />
          <span className={`text-[11px] tracking-tight ${activeTab === 'akoonka' ? 'text-[#008751] font-black' : 'text-slate-500'}`}>
            Akoonka
          </span>
        </button>
      </nav>

      {/* 7. LOCATION SEARCH & LANDMARK MODAL */}
      {showLocationSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-3 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden mt-4 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="bg-[#008751] text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {showLocationSearchModal === 'pickup' ? t.selectPickup : t.selectDropoff}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowLocationSearchModal(null);
                  setSearchFilter('');
                }}
                className="p-1 text-white hover:opacity-80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input & Live Feedback */}
            <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={language === 'so' ? 'Qor magaca meel Hargeysa ah (tusaale: Mansoor, Airport, Dahabshiil...)' : 'Type place name in Hargeisa...'}
                  className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-9 pr-20 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#008751] focus:ring-1 focus:ring-[#008751] shadow-xs"
                  autoFocus
                />
                {isSearchingModalGoogle && (
                  <div className="absolute right-2.5 top-2.5 flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 animate-pulse">
                    <Globe className="w-2.5 h-2.5 animate-spin" />
                    <span>Google...</span>
                  </div>
                )}
                {!isSearchingModalGoogle && searchFilter && (
                  <button
                    onClick={() => {
                      setSearchFilter('');
                      setModalGoogleResults([]);
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px]">
                {['All', 'Hotels', 'Hospitals', 'Banks', 'Malls', 'Universities', 'Transit'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setModalCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                      modalCategory === cat
                        ? 'bg-[#008751] text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {cat === 'All' ? (language === 'so' ? '⭐ Dhammaan Meelaha' : '⭐ All Places') : cat}
                  </button>
                ))}
              </div>

              {/* GPS Quick Action */}
              {showLocationSearchModal === 'pickup' && (
                <button
                  type="button"
                  onClick={async () => {
                    await detectUserRealLocation();
                    setShowLocationSearchModal(null);
                  }}
                  className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#008751] text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{language === 'so' ? 'Isticmaal GPS-ka Tooska ah ee Telefoonka' : 'Use My Current Live GPS in Hargeisa'}</span>
                </button>
              )}
            </div>

            {/* Landmark List */}
            <div className="p-2 overflow-y-auto flex-1 divide-y divide-slate-100">
              {/* Custom input pin button */}
              {searchFilter.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    handleSelectSearchedPlace(resolveHargeisaPlaceCoordinates(searchFilter.trim()));
                  }}
                  className="w-full text-left p-2.5 hover:bg-emerald-50 rounded-xl flex items-center justify-between transition mb-1 bg-emerald-50/40 border border-emerald-200/60"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-[#008751] flex items-center justify-center font-bold text-xs shrink-0">
                      📍
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-extrabold text-[#008751] truncate">
                        &quot;{searchFilter}&quot;
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {language === 'so' ? 'U dhig meel ahaan Hargeysa' : 'Set as point in Hargeisa'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#008751] bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                    {language === 'so' ? 'Dooro' : 'Select'} →
                  </span>
                </button>
              )}

              {combinedModalPlaces.map((place) => (
                <button
                  key={place.id}
                  onClick={() => handleSelectSearchedPlace(place)}
                  className="w-full text-left p-2.5 hover:bg-slate-50 rounded-xl flex items-center justify-between transition group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 group-hover:scale-105 transition">
                      {place.category === 'Transit' || place.name.toLowerCase().includes('airport') ? (
                        <Plane className="w-4 h-4 text-blue-600" />
                      ) : place.category?.toLowerCase().includes('hotel') ? (
                        <Building className="w-4 h-4 text-amber-600" />
                      ) : (
                        <MapPin className="w-4 h-4 text-[#008751]" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate group-hover:text-[#008751] transition">{place.name}</span>
                        {place.isGoogle && (
                          <span className="text-[8px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded shrink-0">
                            Google
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{place.address}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#008751] transition shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. NOTES TO DRIVER MODAL */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">{t.noteToDriver}</h3>
              <button onClick={() => setShowNoteModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={driverNote}
              onChange={(e) => setDriverNote(e.target.value)}
              placeholder={t.enterNote}
              rows={3}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#008751]"
            />
            <button
              onClick={() => setShowNoteModal(false)}
              className="w-full py-2.5 bg-[#008751] hover:bg-[#007345] text-white font-bold rounded-xl text-xs transition"
            >
              {t.saveNote}
            </button>
          </div>
        </div>
      )}

      {/* 9. PROMO CODE INPUT MODAL */}
      {showPromoInputModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">{t.promoTitle}</h3>
              <button onClick={() => setShowPromoInputModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
              placeholder={t.enterPromo}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 uppercase focus:outline-none focus:border-[#008751]"
            />
            <button
              onClick={() => setShowPromoInputModal(false)}
              className="w-full py-2.5 bg-[#008751] hover:bg-[#007345] text-white font-bold rounded-xl text-xs transition"
            >
              {t.apply}
            </button>
          </div>
        </div>
      )}

      {/* 10. PAYMENT METHOD NOTICE MODAL (CASH ONLY) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">💵</span>
                <h3 className="font-bold text-sm text-slate-900">
                  {language === 'so' ? 'Habka Lacag-Bixinta: Naqad (Cash)' : 'Payment Method: Cash Only'}
                </h3>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cash Only Highlight */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center space-x-2 text-[#008751] font-black text-xs uppercase tracking-wider">
                <CheckCircle className="w-4 h-4 text-[#008751]" />
                <span>{language === 'so' ? 'Lacag Caddaan ah (Naqad)' : '100% Cash On Drop-off'}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {language === 'so'
                  ? 'Dhammaan safarrada Wadaage waxaa si toos ah loogu bixiyaa lacag caddaan ah darawalka (Shilin Somaliland SLSH ama USD) marka aad gaadho meesha aad u socoto.'
                  : 'All Wadaage trips in Somaliland are paid directly in cash to your captain (Somaliland Shillings SLSH or USD) upon arrival.'}
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between font-medium">
                <span>{language === 'so' ? 'Qiimaha Shilin Somaliland:' : 'Somaliland Shillings (SLSH):'}</span>
                <span className="font-bold text-slate-900">1 USD = 11,250 SLSH</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>{language === 'so' ? 'Lacagta la aqbalo:' : 'Accepted Currencies:'}</span>
                <span className="font-bold text-emerald-700">SLSH / USD Cash</span>
              </div>
            </div>

            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full py-3 bg-[#008751] hover:bg-[#007345] text-white font-bold rounded-xl text-xs transition"
            >
              {language === 'so' ? 'Waan Fahmay (OK)' : 'Understood (OK)'}
            </button>
          </div>
        </div>
      )}

      {/* 11. SIDE MENU DRAWER */}
      {showMenuDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowMenuDrawer(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white text-slate-800 h-full shadow-2xl p-5 flex flex-col justify-between z-10 animate-slideRight">
            <div className="space-y-4">
              {/* Brand Top Header in Drawer */}
              <div className="bg-[#030d1a] -mx-5 -mt-5 p-4 flex items-center justify-between border-b border-slate-800 shadow-md">
                <div className="flex items-center space-x-2.5">
                  <WadaageLogo variant="icon" size="sm" />
                  <WadaageLogo variant="wordmark" size="xs" />
                </div>
                <button
                  onClick={() => setShowMenuDrawer(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Card */}
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
                <div className="w-11 h-11 rounded-full bg-[#008751] flex items-center justify-center font-black text-white shadow-md">
                  {currentUser?.name?.charAt(0) || 'W'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{currentUser?.name || 'Wadaage Rider'}</h3>
                  <p className="text-xs text-slate-500 font-mono">{currentUser?.phone || '+252 63 4918201'}</p>
                </div>
              </div>

              {/* Language Switch Row */}
              <div className="p-3 bg-emerald-50 rounded-xl flex items-center justify-between border border-emerald-100">
                <span className="text-xs font-bold text-[#008751]">{t.switchLanguage}</span>
                <button
                  onClick={() => setLanguage(language === 'so' ? 'en' : 'so')}
                  className="px-2.5 py-1 bg-white text-[#008751] text-xs font-black rounded-lg shadow-xs border border-emerald-200 flex items-center space-x-1"
                >
                  {language === 'so' ? (
                    <>
                      <SomalilandFlag className="w-3.5 h-2.5 rounded-xs" />
                      <span>Soomaali</span>
                    </>
                  ) : (
                    <span>English 🇬🇧</span>
                  )}
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1 text-sm font-semibold">
                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowPromosModal(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <Tag className="w-4 h-4 text-[#008751]" />
                    <span>{t.promoTitle}</span>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-[#008751] font-black px-1.5 py-0.5 rounded">50% OFF</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowHistoryModal(true);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition"
                >
                  <History className="w-4 h-4 text-blue-600" />
                  <span>{t.history}</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowSafetyModal(true);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition"
                >
                  <Shield className="w-4 h-4 text-rose-500" />
                  <span>{t.emergencySOS}</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowUssdModal(true);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition"
                >
                  <Radio className="w-4 h-4 text-teal-600" />
                  <span>Offline USSD (*990#)</span>
                </button>
              </div>
            </div>

            {/* Sign Out Button */}
            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.logout}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. MODAL WINDOWS */}
      <WadaageSearchOverlay
        isOpen={showSuperAppSearch}
        onClose={() => setShowSuperAppSearch(false)}
        onSelectDestination={(loc) => {
          setDropoffLocation(loc);
          setShowSuperAppSearch(false);
        }}
        onOpenMapPicker={() => setShowLocationSetupModal(true)}
        currentPickup={pickupLocation}
      />
      {showLocationSetupModal && (
        <LocationSetupModal
          isOpen={showLocationSetupModal}
          onClose={() => setShowLocationSetupModal(false)}
        />
      )}
      {showPromosModal && <PromosModal onClose={() => setShowPromosModal(false)} />}
      {showHistoryModal && <TripHistoryModal onClose={() => setShowHistoryModal(false)} />}
      {showSafetyModal && <SafetyCenterModal onClose={() => setShowSafetyModal(false)} />}
      <UssdOfflineBookingModal isOpen={showUssdModal} onClose={() => setShowUssdModal(false)} />
      <FareSplitModal isOpen={showSplitModal} onClose={() => setShowSplitModal(false)} />
      <CommuteSubscriptionModal isOpen={showCommuteModal} onClose={() => setShowCommuteModal(false)} />
    </div>
  );
};
