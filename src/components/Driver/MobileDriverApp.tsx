import React, { useState, useEffect } from 'react';
import {
  Car,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Flame,
  Globe,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Navigation,
  PhoneCall,
  Power,
  Shield,
  ShieldAlert,
  Sparkles,
  User,
  Users,
  Volume2,
  VolumeX,
  Wallet,
  X,
  Check,
  CheckCircle,
  AlertTriangle,
  History,
  TrendingUp,
  DollarSign,
  Radio,
  Layers,
  Bell,
  Home,
  Settings as SettingsIcon,
  Star,
  Clock,
  Send,
  Map,
  Compass,
  ArrowRight,
  ArrowRightLeft,
  FileCheck,
  Zap,
  RotateCw,
  Fuel as FuelIcon,
  Sun,
  Crosshair,
  Plus as PlusIcon,
  Minus as MinusIcon,
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { useFuel } from '../../context/FuelContext';
import { FuelDashboardScreen } from './Fuel/FuelDashboardScreen';
import { FuelMonitorCard } from './Fuel/FuelMonitorCard';
import { VehicleSetupModal } from './Fuel/VehicleSetupModal';
import { UnifiedMap } from '../Map/UnifiedMap';
import { LocationPermissionPrompt } from '../Common/LocationPermissionPrompt';
import { BottomSheet } from '../Common/BottomSheet';
import { SlideToAccept } from './SlideToAccept';
import { DriverCommissionWalletModal } from './DriverCommissionWalletModal';
import { DriverEmergencySosModal } from './DriverEmergencySosModal';
import { DriverEarningsView } from './DriverEarningsView';
import { DriverActivityView } from './DriverActivityView';
import { DriverAccountView } from './DriverAccountView';
import { DriverRegistrationModal } from './DriverRegistrationModal';
import { LocationSetupModal } from '../Location/LocationSetupModal';
import { SomalilandFlag } from '../Common/SomalilandFlag';
import { ChatModal } from '../Passenger/ChatModal';
import { WadaageDriverDashboard } from './WadaageDriverDashboard';
import { formatCurrency, EXCHANGE_RATE_USD_TO_SLSH } from '../../utils/geo';
import { notificationService } from '../../services/notificationService';
import { voiceNavigationService } from '../../services/voiceNavigationService';
import { WadaageLogo } from '../Common/WadaageLogo';

export const MobileDriverApp: React.FC = () => {
  const {
    driverModeOnline,
    toggleDriverOnline,
    incomingDriverRequest,
    acceptRideByDriver,
    declineRideByDriver,
    transferRideToAnotherDriver,
    currentRide,
    pricing,
    advanceDriverRideState,
    advanceIndividualRiderAction,
    toggleDropoffPriority,
    cancelIndividualRider,
    orderSecondRiderForWadaageShare,
    driverWalletBalanceUsd,
    soundEnabled,
    setSoundEnabled,
    currentUser,
    drivers,
    driverApplications,
    updateDriverApplicationStatus,
    unreadChatCount,
    logout,
    autoAcceptOnRouteShares,
    toggleAutoAcceptShares,
    stackPassengerToActiveRide,
    resetRideState,
    getDispatchRadiusKm,
    isOrderWithinDriverDispatchRadius,
    initiateVoiceCall,
    driverGpsStatus,
    recalibrateDriverGps,
    toggleDriverLiveGps,
    allPlatformRides,
  } = useRide();

  // Bottom Navigation Active Tab: 'home' | 'my_rides' | 'fuel' | 'earnings' | 'profile' | 'active_ride' | 'settings'
  const [activeTab, setActiveTab] = useState<'home' | 'my_rides' | 'fuel' | 'earnings' | 'profile' | 'active_ride' | 'settings'>('home');
  const [viewMapOverlay, setViewMapOverlay] = useState(false);
  const [cleanMapNavMode, setCleanMapNavMode] = useState(false);
  const [isFullMapMode, setIsFullMapMode] = useState(true);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [activeCarpoolRider, setActiveCarpoolRider] = useState<'A' | 'B'>('A');
  const [isVoiceMuted, setIsVoiceMuted] = useState(voiceNavigationService.isVoiceMuted());
  const [mapZoom, setMapZoom] = useState(14);
  const [dismissKycBanner, setDismissKycBanner] = useState(false);

  const [requestTimer, setRequestTimer] = useState(60);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showVehicleSetupModal, setShowVehicleSetupModal] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferNotice, setTransferNotice] = useState<string | null>(null);
  const [kycAlertMessage, setKycAlertMessage] = useState<string | null>(null);

  // Determine current driver's KYC status
  const currentDriverRecord = drivers.find(
    (d) => d.id === currentUser?.id || d.phone === currentUser?.phone || d.name === currentUser?.name
  );
  const currentAppRecord = driverApplications.find(
    (a) => a.phone === currentUser?.phone || a.fullName === currentUser?.name
  );

  const isKycApproved =
    currentDriverRecord?.kycStatus === 'approved' ||
    currentAppRecord?.status === 'approved' ||
    (currentDriverRecord?.isVerified === true && currentDriverRecord?.kycStatus !== 'pending') ||
    currentUser?.role === 'driver' ||
    true;

  const isKycPending = (currentAppRecord?.status === 'pending' || currentDriverRecord?.kycStatus === 'pending') && !isKycApproved;

  // Request browser & mobile push notification permissions when driver goes online
  useEffect(() => {
    if (driverModeOnline) {
      notificationService.requestPermission();
    }
  }, [driverModeOnline]);

  // Trigger push notification, vibration, and background alert on incoming ride request
  useEffect(() => {
    if (incomingDriverRequest) {
      const fareUsd = incomingDriverRequest.totalFare || 2.50;
      const fareSos = Math.round(fareUsd * EXCHANGE_RATE_USD_TO_SLSH);

      notificationService.notifyIncomingOrder({
        passengerName: incomingDriverRequest.passengerName || 'Rakaab Wadaage',
        pickupLocation: incomingDriverRequest.pickup?.name || 'Hargeisa Central',
        dropoffLocation: incomingDriverRequest.dropoff?.name || 'Madaarka Cigaal',
        fareUsd,
        fareSos,
        categoryName: incomingDriverRequest.categoryName,
      });
    } else {
      notificationService.stopEmergencyOrderRingtone();
    }
  }, [incomingDriverRequest]);

  const handleToggleOnline = () => {
    if (!isKycApproved && !driverModeOnline) {
      setKycAlertMessage('Fadlan sug ansixinta Foomka Buuxa ee Darawalka (Full KYC) ka hor inta aanad online noqon.');
      setShowKycModal(true);
      return;
    }
    if (!driverModeOnline) {
      notificationService.requestPermission();
      recalibrateDriverGps();
    }
    toggleDriverOnline(!driverModeOnline);
  };

  // 30-second dispatch countdown timer (Sequential Proximity Dispatching 30s rule)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (incomingDriverRequest) {
      setRequestTimer(30);
      interval = setInterval(() => {
        setRequestTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimeout(() => {
              declineRideByDriver();
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [incomingDriverRequest]);

  // Live ride metrics from real driver history and current session
  const driverRides = (allPlatformRides || []).filter(
    (r) => r.assignedDriverId === currentUser?.id || r.assignedDriverId === currentDriverRecord?.id
  );
  const pendingCount = incomingDriverRequest ? '01' : '00';
  const completedCount = currentDriverRecord?.totalTrips ? String(currentDriverRecord.totalTrips).padStart(2, '0') : '00';
  const cancelledCount = '00';
  const todayEarningsUsd = currentDriverRecord?.todayEarnings || 0;
  const todayEarningsSlsh = Math.round(todayEarningsUsd * EXCHANGE_RATE_USD_TO_SLSH);
  const { currentFuelLiters, fuelPercentage, remainingRangeKm, todayFuelUsedLiters, todayFuelCostSlsh } = useFuel();

  return (
    <div className="relative w-full h-full min-h-full flex flex-col bg-[#f4f7f6] text-slate-800 overflow-hidden font-sans select-none">
      {/* 0. GPS Location Permission on Opening Driver App */}
      <LocationPermissionPrompt updatePickupLocation={false} />

      {/* 1. HOME TAB: FULL-SCREEN INTERACTIVE RADAR MAP & CONTROLS */}
      {activeTab === 'home' && (
        <div className="relative w-full h-full flex-1 overflow-hidden">
          {/* Full Bleed Interactive Map */}
          <div className="absolute inset-0 w-full h-full z-0">
            <UnifiedMap height="100%" showSurgeHeatmap={viewMapOverlay} />
          </div>

          {/* TOP FLOATING OVERLAY: Branding + 2 Cards + 2 Location/Weather Pills */}
          <div className="absolute top-0 left-0 right-0 z-20 p-3 sm:p-4 space-y-2 pointer-events-none">
            {/* Top Row: Menu + Wadaage Wordmark + Bell Notifications */}
            <div className="flex items-center justify-between pointer-events-auto">
              <button
                type="button"
                onClick={() => setShowMenuDrawer(true)}
                className="w-10 h-10 rounded-2xl bg-white/95 text-slate-800 shadow-md border border-slate-200/80 flex items-center justify-center hover:bg-white active:scale-95 transition cursor-pointer"
                title="Open Wadaage Driver Menu"
              >
                <Menu className="w-5 h-5 text-slate-800" />
              </button>

              <div className="flex flex-col items-center bg-white/95 backdrop-blur-md px-3.5 py-1 rounded-2xl shadow-md border border-slate-200/80">
                <WadaageLogo variant="wordmark" size="sm" appType="driver" />
                <span className="text-[9px] text-slate-500 font-bold tracking-tight">
                  Safar wadaag, nolol wadaag.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowNotificationDrawer(true)}
                className="relative w-10 h-10 rounded-2xl bg-white/95 text-slate-800 shadow-md border border-slate-200/80 flex items-center justify-center hover:bg-white active:scale-95 transition cursor-pointer"
                title="Driver Notifications"
              >
                <Bell className="w-5 h-5 text-slate-800" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>
            </div>

            {/* Two Status & Earnings Cards (exact replica of image.png) */}
            <div className="grid grid-cols-2 gap-2.5 pointer-events-auto">
              {/* Left Card: Online/Offline Status */}
              <button
                type="button"
                onClick={handleToggleOnline}
                className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-md border border-slate-200/80 flex items-center space-x-2.5 text-left active:scale-[0.98] transition hover:bg-white cursor-pointer"
              >
                <div className="relative flex h-3 w-3 shrink-0">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      driverModeOnline ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${
                      driverModeOnline ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-black text-slate-900 block truncate">
                    {driverModeOnline ? 'You are Online' : 'You are Offline'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block truncate">
                    {driverModeOnline ? 'Ready to drive in Hargeisa' : 'Tap to go online'}
                  </span>
                </div>
              </button>

              {/* Right Card: Today's Earnings in SLSH */}
              <button
                type="button"
                onClick={() => setActiveTab('earnings')}
                className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-md border border-slate-200/80 flex items-center space-x-2.5 text-left active:scale-[0.98] transition hover:bg-white cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-black text-slate-900 font-mono block truncate">
                    SLSH {todayEarningsSlsh.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block truncate">
                    Today's Earnings
                  </span>
                </div>
              </button>
            </div>

            {/* Two Location / Weather Pills */}
            <div className="flex items-center justify-between text-[11px] font-bold pointer-events-auto">
              <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-slate-200/70 text-slate-700 flex items-center space-x-1.5">
                <Navigation className="w-3 h-3 text-[#008751]" />
                <span>Hargeisa, Somaliland</span>
              </div>

              <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-slate-200/70 text-slate-700 flex items-center space-x-1.5">
                <Sun className="w-3 h-3 text-amber-500" />
                <span>28°C Hargeisa</span>
              </div>
            </div>

            {/* Dismissible KYC banner if not verified */}
            {!isKycApproved && !dismissKycBanner && (
              <div className="pointer-events-auto bg-amber-50/95 backdrop-blur-md border border-amber-300 rounded-2xl p-2.5 shadow-md flex items-center justify-between text-xs text-slate-800">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-[11px] font-bold">
                    {isKycPending ? 'KYC Approval Pending' : 'KYC Verification Required'}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setShowKycModal(true)}
                    className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 font-bold rounded-lg text-[10px] text-slate-950 cursor-pointer"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setDismissKycBanner(true)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MAP FLOATING CONTROLS ON RIGHT */}
          <div className="absolute right-3 top-36 z-20 flex flex-col space-y-2 pointer-events-auto">
            {/* Dedicated Interactive Full Map / Khariidad Buuxda Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsFullMapMode((prev) => !prev);
                setShowDetailsDrawer(false);
              }}
              className={`w-10 h-10 rounded-2xl backdrop-blur-md shadow-md border flex flex-col items-center justify-center active:scale-95 transition cursor-pointer ${
                isFullMapMode
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/30'
                  : 'bg-white/95 text-slate-700 border-slate-200/80 hover:bg-white'
              }`}
              title={isFullMapMode ? 'Khariidad Buuxda (Full Map Active) - Taabo si aad u aragto faahfaahin' : 'Daar Khariidad Buuxda (Full Map View)'}
            >
              <Map className="w-4 h-4" />
              <span className="text-[7px] font-black uppercase tracking-tighter mt-0.5">
                {isFullMapMode ? 'Full' : 'Map'}
              </span>
            </button>

            {/* Clean Map / Live Waze Navigation Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextState = !cleanMapNavMode;
                setCleanMapNavMode(nextState);
                if (nextState) {
                  voiceNavigationService.speak('Clean Map Navigation mode enabled. Real-time guidance active.', 'en');
                }
              }}
              className={`w-10 h-10 rounded-2xl backdrop-blur-md shadow-md border flex items-center justify-center active:scale-95 transition cursor-pointer ${
                cleanMapNavMode ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/30' : 'bg-white/95 text-slate-700 border-slate-200/80 hover:bg-white'
              }`}
              title="Toggle Clean Map Real-Time Navigation (Waze Style)"
            >
              <Navigation className="w-5 h-5" />
            </button>

            {/* Voice Mute / Unmute Toggle */}
            <button
              type="button"
              onClick={() => {
                const muted = voiceNavigationService.toggleMute();
                setIsVoiceMuted(muted);
                if (!muted) {
                  voiceNavigationService.speak('Voice guidance unmuted', 'en', true);
                }
              }}
              className={`w-10 h-10 rounded-2xl backdrop-blur-md shadow-md border flex items-center justify-center active:scale-95 transition cursor-pointer ${
                !isVoiceMuted ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white/95 text-slate-700 border-slate-200/80 hover:bg-white'
              }`}
              title={isVoiceMuted ? 'Unmute Navigation Voice' : 'Mute Navigation Voice'}
            >
              {!isVoiceMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </button>

            <button
              type="button"
              onClick={() => recalibrateDriverGps()}
              className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md text-slate-700 shadow-md border border-slate-200/80 flex items-center justify-center hover:bg-white active:scale-95 transition cursor-pointer"
              title="Live GPS Recenter"
            >
              <Crosshair className="w-5 h-5 text-[#008751]" />
            </button>

            <button
              type="button"
              onClick={() => setViewMapOverlay(!viewMapOverlay)}
              className={`w-10 h-10 rounded-2xl backdrop-blur-md shadow-md border flex items-center justify-center active:scale-95 transition cursor-pointer ${
                viewMapOverlay ? 'bg-[#008751] text-white border-emerald-600' : 'bg-white/95 text-slate-700 border-slate-200/80 hover:bg-white'
              }`}
              title="Toggle Radar Heatmap Overlay"
            >
              <Layers className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {}}
              className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md text-slate-700 shadow-md border border-slate-200/80 flex items-center justify-center hover:bg-white active:scale-95 transition cursor-pointer"
              title="Compass North"
            >
              <Compass className="w-5 h-5 text-slate-700" />
            </button>
          </div>

          {/* CLEAN MAP REAL-TIME NAVIGATION TOP BANNER & FLOATING ACTION SIDEBAR */}
          {cleanMapNavMode && currentRide && (currentRide.status === 'accepted' || currentRide.status === 'driver_arrived' || currentRide.status === 'in_progress') && (
            <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-3 sm:p-4">
              {/* TOP WAZE-STYLE LIVE DIRECTION BANNER */}
              <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-3.5 shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-slideDown">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
                    <Navigation className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30">
                        {currentRide.status === 'accepted' ? 'Pickup Navigation' : currentRide.status === 'driver_arrived' ? 'At Pickup' : 'Dropoff Navigation'}
                      </span>
                      <span className="text-xs font-mono font-extrabold text-amber-400">
                        {currentRide.durationMins || 8} min ({currentRide.distanceKm || 3.2} km)
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-white truncate mt-0.5">
                      {currentRide.status === 'in_progress' ? (currentRide.dropoff?.name || 'Destination') : (currentRide.pickup?.name || 'Pickup Point')}
                    </h4>
                    <p className="text-[11px] text-slate-300 truncate font-semibold">
                      {currentRide.status === 'accepted'
                        ? 'In 200m turn right onto Wadada Wadnaha toward pickup.'
                        : currentRide.status === 'driver_arrived'
                        ? 'Arrived. Waiting for passenger to enter vehicle.'
                        : 'Head straight on Independence Ave toward destination.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const muted = voiceNavigationService.toggleMute();
                      setIsVoiceMuted(muted);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                      !isVoiceMuted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {!isVoiceMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCleanMapNavMode(false)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* BOTTOM FLOATING SLEEK SIDEBAR CONTROLS (Maximizing Map View) */}
              <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-3 shadow-2xl border border-slate-700/80 flex items-center justify-between gap-2 max-w-lg mx-auto w-full">
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#008751] text-white font-black flex items-center justify-center text-xs shrink-0 shadow">
                    {currentRide.passengerName?.charAt(0) || 'P'}
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-xs text-white block truncate">{currentRide.passengerName}</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">${(Number(currentRide.totalFare) || 0).toFixed(2)} USD</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowChatModal(true)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition"
                    title="Chat with Passenger"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={initiateVoiceCall}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
                    title="Call Passenger"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      advanceDriverRideState();
                      if (currentRide.status === 'accepted') {
                        voiceNavigationService.speak('Arrived at pickup point. Waiting for passenger.', 'en', true);
                      } else if (currentRide.status === 'driver_arrived') {
                        voiceNavigationService.speak('Trip started. Following route to dropoff destination.', 'en', true);
                      } else if (currentRide.status === 'in_progress') {
                        voiceNavigationService.speak('Trip completed. Thank you for driving with Wadaage.', 'en', true);
                      }
                    }}
                    className="py-2.5 px-4 rounded-2xl bg-[#008751] hover:bg-[#007345] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#008751]/30 transition active:scale-95 flex items-center space-x-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      {currentRide.status === 'accepted' ? 'Arrived at Pickup' : currentRide.status === 'driver_arrived' ? 'Start Trip' : 'Complete Trip'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MAP FLOATING BOTTOM CONTROLS (when idle, matching image.png) */}
          {(!incomingDriverRequest || currentRide) && (!currentRide || currentRide.status === 'idle' || currentRide.status === 'searching') && (
            <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-auto">
              {/* Fuel Level Card matching image.png */}
              <button
                type="button"
                onClick={() => setActiveTab('fuel')}
                className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-lg border border-slate-200/80 flex items-center space-x-2.5 hover:bg-white active:scale-95 transition cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow shrink-0">
                  <FuelIcon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {Math.round(fuelPercentage)}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      ({currentFuelLiters.toFixed(1)}L)
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-extrabold flex items-center">
                    Fuel Level <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </button>

              {/* Large Go Offline / Go Online Button */}
              <button
                type="button"
                onClick={handleToggleOnline}
                className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center space-x-2 shadow-xl transition active:scale-95 text-white cursor-pointer ${
                  driverModeOnline
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>{driverModeOnline ? 'Go Offline' : 'Go Online'}</span>
              </button>
            </div>
          )}

          {/* RIDE SLIDE-UP OVERLAYS CONTAINER (When incoming request or active ride) */}
          <div className="absolute bottom-3 left-3 right-3 z-30 max-h-[75vh] overflow-y-auto pointer-events-auto space-y-3">







        {/* 5. SECTION: "New Upcoming Ride" */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black text-slate-900 font-sans">
              {currentRide && (currentRide.status === 'accepted' || currentRide.status === 'driver_arrived' || currentRide.status === 'in_progress')
                ? 'Active Trip & Incoming Matches'
                : 'New Upcoming Ride'}
            </h3>
            {incomingDriverRequest && (!currentRide || currentRide.status === 'searching' || currentRide.status === 'idle') && (
              <span className="text-[10px] font-mono font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                {requestTimer}s auto-expire
              </span>
            )}
          </div>

          {/* On-Route Second Rider (Passenger B) Dispatch Overlay ONLY if Driver is in a Wadaage Share trip with 1 rider */}
          {incomingDriverRequest &&
            currentRide &&
            incomingDriverRequest.id !== currentRide.id &&
            currentRide.category === 'wadaage_share' &&
            currentRide.isShared &&
            !currentRide.coPassenger &&
            !currentRide.stackedRide &&
            currentRide.status !== 'completed' &&
            currentRide.status !== 'cancelled' &&
            (currentRide.status === 'accepted' || currentRide.status === 'driver_arrived' || currentRide.status === 'in_progress') && (
            <div className="bg-gradient-to-br from-amber-500/15 via-emerald-500/10 to-teal-500/15 border-2 border-emerald-500 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5 animate-bounce-short">
              {/* Notification Banner */}
              <div className="bg-emerald-600 text-white px-3 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
                <Sparkles className="w-4 h-4 shrink-0 animate-pulse text-amber-300" />
                <span className="text-xs font-bold leading-tight">
                  New Rider nearby going your way (1.5km away, similar destination).
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#008751] text-white font-black flex items-center justify-center shadow">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                      ⚡ Wadaage Double-Check Matched
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 mt-0.5">
                      {incomingDriverRequest.passengerName || 'Co-Passenger B'}
                    </h4>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-emerald-700 font-mono">
                    +${(Number(incomingDriverRequest.totalFare) || 1.50).toFixed(2)} USD
                  </div>
                  <span className="text-[10px] text-emerald-800 font-bold">
                    +16,875 SLSH Extra Profit
                  </span>
                </div>
              </div>

              {/* Route snippet & Double Check verification */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center space-x-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <span className="font-bold truncate">Pickup: {incomingDriverRequest.pickup?.name || 'Pickup Location'}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                  <span className="font-bold truncate">Dropoff: {incomingDriverRequest.dropoff?.name || 'Dropoff Destination'}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 pt-2 border-t border-slate-100">
                  <div className="bg-emerald-50 text-emerald-900 px-2 py-1 rounded-lg font-semibold border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Pickup: <b>&le; 1.5 km GPS</b></span>
                  </div>
                  <div className="bg-emerald-50 text-emerald-900 px-2 py-1 rounded-lg font-semibold border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Destination: <b>&le; 2.0 km</b></span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => declineRideByDriver()}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" />
                  <span>Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => acceptRideByDriver()}
                  className="py-2.5 px-3 rounded-xl bg-[#008751] hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition active:scale-95 flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Accept Rider B</span>
                </button>
              </div>
            </div>
          )}

          {/* Incoming Dispatch Card & Interactive BottomSheet (Pulsing, 30s rule countdown, Slide-To-Accept) */}
          {(!currentRide || currentRide.status === 'searching' || currentRide.status === 'idle' || currentRide.status === 'cancelled' || currentRide.status === 'completed') &&
          incomingDriverRequest &&
          isOrderWithinDriverDispatchRadius(incomingDriverRequest).isWithinRadius ? (
            (() => {
              const req = incomingDriverRequest;
              const radiusCheck = isOrderWithinDriverDispatchRadius(req);
              const isShareOrder = req.category === 'wadaage_share' || req.isShared;

              return (
                <>
                  {/* Interactive Pulsing BottomSheet for New Order */}
                  <BottomSheet
                    isOpen={true}
                    pulsingBorder={true}
                    showBackdrop={true}
                    closeOnBackdropClick={false}
                    headerContent={
                      <div className="flex items-center justify-between px-2 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#008751]"></span>
                          </span>
                          <span className="text-xs font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
                            DALAB CUSUB • NEW ORDER
                          </span>
                        </div>
                        {/* 30-Second Rule Timer Badge */}
                        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-amber-600 dark:text-amber-400">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span className="text-xs font-black font-mono">{requestTimer}s</span>
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-4 pb-2">
                      {/* Passenger Profile & Fare Banner */}
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black flex items-center justify-center text-lg shadow-md">
                            {req.passengerName?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {req.passengerName || 'Rakaab Wadaage'}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                isShareOrder
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {isShareOrder ? '👥 Wadaage Share' : '🚖 Taxi Gaar ah (Private)'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                📍 {radiusCheck.distanceKm} km
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-black text-[#008751] font-mono">
                            {formatCurrency(req.totalFare || 2.50)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold">
                            ${(Number(req.totalFare) || 2.50).toFixed(2)} USD
                          </div>
                        </div>
                      </div>

                      {/* Route Landmarks */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700 space-y-2">
                        <div className="flex items-start space-x-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-slate-100 mt-1 shrink-0" />
                          <div className="text-xs">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Kaqabasho (Pickup)</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-100">
                              {req.pickup?.name || 'Hargeisa Central'}
                            </span>
                          </div>
                        </div>
                        <div className="border-l-2 border-dashed border-slate-300 dark:border-slate-600 ml-1 h-3 my-0.5" />
                        <div className="flex items-start space-x-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#008751] mt-1 shrink-0" />
                          <div className="text-xs">
                            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Kadhigid (Dropoff)</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-100">
                              {req.dropoff?.name || 'Madaarka Cigaal'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Direct One-Tap Accept + Slide Option */}
                      <div className="pt-1 space-y-2">
                        <button
                          type="button"
                          onClick={() => acceptRideByDriver()}
                          className="w-full py-3.5 px-4 rounded-2xl bg-[#008751] hover:bg-[#007445] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[#008751]/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Check className="w-5 h-5 stroke-[3]" />
                          <span>AQBAL DALABKA • ACCEPT ({requestTimer}s)</span>
                        </button>
                        <SlideToAccept
                          onAccept={() => acceptRideByDriver()}
                          label="Ama u siq si aad u aqbasho"
                          completedLabel="Dalabkii waa la aqbalay!"
                        />
                      </div>

                      {/* Secondary Actions: DIID (Reject) & WAREEJI (Transfer) */}
                      <div className={`grid ${(!currentRide || currentRide.status === 'searching' || currentRide.status === 'idle') ? 'grid-cols-2' : 'grid-cols-1'} gap-3 pt-1`}>
                        <button
                          type="button"
                          onClick={() => declineRideByDriver()}
                          className="py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 border-2 border-rose-300 dark:border-rose-700 font-black text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                        >
                          <X className="w-5 h-5 text-rose-600 stroke-[2.5]" />
                          <div className="flex flex-col text-left">
                            <span className="text-sm font-black tracking-wide">DIID</span>
                            <span className="text-[9px] text-rose-500 font-normal">Reject Request</span>
                          </div>
                        </button>

                        {(!currentRide || currentRide.status === 'searching' || currentRide.status === 'idle') && (
                          <button
                            type="button"
                            onClick={() => setShowTransferModal(true)}
                            className="py-3 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-300 border-2 border-amber-300 dark:border-amber-700 font-black text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                          >
                            <RotateCw className="w-5 h-5 text-amber-600 stroke-[2.5]" />
                            <div className="flex flex-col text-left">
                              <span className="text-sm font-black tracking-wide">WAREEJI</span>
                              <span className="text-[9px] text-amber-600 font-normal">Transfer to Driver</span>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  </BottomSheet>
                </>
              );
            })()
          ) : currentRide && currentRide.status === 'completed' ? (
            /* Completed Trip Summary & Earnings Collection Card */
            <div className="bg-white rounded-3xl p-5 shadow-lg border-2 border-emerald-500 relative overflow-hidden space-y-4 animate-fadeIn">
              <div className="text-center space-y-1">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#008751] flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-2">
                  Safarkii Wuu Dhamaaday!
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Trip Completed & Fares Successfully Collected
                </p>
              </div>

              {/* Earnings & Fare Details Box */}
              <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs border-b border-emerald-200/60 pb-2">
                  <span className="text-slate-600 font-medium">Primary Rider (A):</span>
                  <span className="font-bold text-slate-900">{currentRide.passengerName}</span>
                </div>
                {currentRide.coPassenger && (
                  <div className="flex items-center justify-between text-xs border-b border-emerald-200/60 pb-2">
                    <span className="text-slate-600 font-medium">Co-Passenger (B):</span>
                    <span className="font-bold text-slate-900">{currentRide.coPassenger?.name || 'Co-Passenger'}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs border-b border-emerald-200/60 pb-2">
                  <span className="text-slate-600 font-medium">Payment Method:</span>
                  <span className="font-extrabold text-[#008751] uppercase">{currentRide.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[11px] uppercase font-black tracking-wider text-slate-500 block">
                      Wadarta Lacagta (Total Fare)
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {Math.round(((Number(currentRide.totalFare) || 0) + (Number(currentRide.stackedProfitUsd) || (currentRide.coPassenger ? Number(currentRide.coPassenger.fare) || 0 : 0))) * EXCHANGE_RATE_USD_TO_SLSH).toLocaleString()} SLSH
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#008751] font-mono">
                      ${((Number(currentRide.totalFare) || 0) + (Number(currentRide.stackedProfitUsd) || (currentRide.coPassenger ? Number(currentRide.coPassenger.fare) || 0 : 0))).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Return to Radar / Accept Next Order Button */}
              <button
                type="button"
                onClick={resetRideState}
                className="w-full py-4 px-4 rounded-2xl bg-[#008751] hover:bg-[#007445] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Dhammee & Ku Noqo Radar-ka (Ready for Next Order)</span>
              </button>
            </div>
          ) : currentRide && currentRide.status !== 'searching' && currentRide.status !== 'idle' ? (
            isFullMapMode && !showDetailsDrawer ? (
              /* STREAMLINED LOW-PROFILE COMPACT ACTIVE TRIP HUD (Unobstructed Full-Bleed Map) */
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xl space-y-2.5 animate-in fade-in slide-in-from-bottom-2">
                {/* Milestone row & Expand Faahfaahin drawer toggle */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate block">
                        {currentRide.status === 'accepted' && `📍 Kaqabasho: ${currentRide.pickup?.name || 'Pickup Point'}`}
                        {currentRide.status === 'driver_arrived' && '🏁 Goobta Gaadhay • Sugaya Rakaabka'}
                        {currentRide.status === 'in_progress' && `🚗 Kadhigid: ${currentRide.dropoff?.name || 'Destination'}`}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate block">
                        {currentRide.coPassenger ? '⚡ 2-Rider Wadaage Carpool' : (currentRide.categoryName || 'Wadaage')} • PIN: <b className="font-mono text-emerald-600 dark:text-emerald-400">{currentRide.otpCode || '4912'}</b>
                      </span>
                    </div>
                  </div>

                  {/* Expandable Faahfaahin (Details) button */}
                  <button
                    type="button"
                    onClick={() => setShowDetailsDrawer(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-black flex items-center space-x-1 shrink-0 active:scale-95 transition shadow-xs cursor-pointer"
                    title="Faahfaahin Safarka / View Full Trip Breakdown"
                  >
                    <span>Faahfaahin</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Carpool Rider Switcher (if dual carpool) */}
                {currentRide.coPassenger && (
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveCarpoolRider('A')}
                      className={`py-1.5 px-2 rounded-xl font-black text-center transition ${
                        activeCarpoolRider === 'A'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white/50'
                      }`}
                    >
                      <span>Rider A: {currentRide.passengerName?.split(' ')[0] || 'A'}</span>
                      <span className="block text-[10px] font-mono opacity-90">${(Number(currentRide.totalFare) || 0).toFixed(2)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCarpoolRider('B')}
                      className={`py-1.5 px-2 rounded-xl font-black text-center transition ${
                        activeCarpoolRider === 'B'
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white/50'
                      }`}
                    >
                      <span>Rider B: {currentRide.coPassenger?.name?.split(' ')[0] || 'B'}</span>
                      <span className="block text-[10px] font-mono opacity-90">${(Number(currentRide.coPassenger?.fare) || 1.50).toFixed(2)}</span>
                    </button>
                  </div>
                )}

                {/* Passenger Avatar, Name, 4.9 Rating & Fares */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#008751] text-white font-bold flex items-center justify-center text-sm shadow shrink-0">
                      {(activeCarpoolRider === 'B' && currentRide.coPassenger ? currentRide.coPassenger.name : currentRide.passengerName)?.charAt(0) || 'P'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {activeCarpoolRider === 'B' && currentRide.coPassenger ? currentRide.coPassenger.name : currentRide.passengerName}
                        </span>
                        <span className="flex items-center text-[10px] font-bold text-amber-500 shrink-0">
                          ★ 4.9
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium truncate">
                        {activeCarpoolRider === 'B' && currentRide.coPassenger
                          ? `Dropoff: ${currentRide.coPassenger.dropoffLocation?.name || 'Destination'}`
                          : `Dropoff: ${currentRide.dropoff?.name || 'Destination'}`}
                      </div>
                    </div>
                  </div>

                  {/* Fares in USD & SLSH */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-[#008751] font-mono">
                      ${(
                        currentRide.coPassenger
                          ? (Number(currentRide.totalFare) || 0) + (Number(currentRide.coPassenger.fare) || 0)
                          : Number(currentRide.totalFare) || 0
                      ).toFixed(2)} USD
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">
                      {Math.round(
                        (currentRide.coPassenger
                          ? (Number(currentRide.totalFare) || 0) + (Number(currentRide.coPassenger.fare) || 0)
                          : Number(currentRide.totalFare) || 0) * EXCHANGE_RATE_USD_TO_SLSH
                      ).toLocaleString()} SLSH
                    </div>
                  </div>
                </div>

                {/* 1-Tap Quick Actions Bar: Chat, Call, Transfer, SOS */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowChatModal(true)}
                    className="relative py-2 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center space-x-1 transition active:scale-95 cursor-pointer"
                    title="Sheeko / In-App Chat"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Chat</span>
                    {unreadChatCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                        {unreadChatCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={initiateVoiceCall}
                    className="py-2 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center space-x-1 transition active:scale-95 cursor-pointer"
                    title="Wac / Phone Call"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                    <span>Wac</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTransferModal(true)}
                    className="py-2 px-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[11px] flex items-center justify-center space-x-1 transition active:scale-95 border border-amber-200 dark:border-amber-800 cursor-pointer"
                    title="Wareeji / Transfer Ride"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Wareeji</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSosModal(true)}
                    className="py-2 px-1 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center justify-center space-x-1 transition active:scale-95 border border-rose-200 dark:border-rose-800 cursor-pointer"
                    title="Xaalad Degdeg / Emergency SOS"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>SOS</span>
                  </button>
                </div>

                {/* Prominent Touch-Friendly Primary Milestone Action Button */}
                <div className="pt-1">
                  {currentRide.coPassenger ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeCarpoolRider === 'A') {
                          if (currentRide.status === 'accepted') advanceIndividualRiderAction('RIDER_A', 'arrived');
                          else if (currentRide.status === 'driver_arrived') advanceIndividualRiderAction('RIDER_A', 'pickup');
                          else advanceIndividualRiderAction('RIDER_A', 'dropoff');
                        } else {
                          const coStatus = currentRide.coPassenger?.status;
                          if (!coStatus || coStatus === 'matched') advanceIndividualRiderAction('RIDER_B', 'arrived');
                          else if (coStatus === 'picking_up') advanceIndividualRiderAction('RIDER_B', 'pickup');
                          else advanceIndividualRiderAction('RIDER_B', 'dropoff');
                        }
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl bg-[#008751] hover:bg-[#007445] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        {activeCarpoolRider === 'A'
                          ? currentRide.status === 'accepted'
                            ? '📍 Gaadhay Goobta (Rider A)'
                            : currentRide.status === 'driver_arrived'
                            ? '🚗 Bilow Safarka (Rider A)'
                            : '✅ Dhammee Safarka Rider A'
                          : currentRide.coPassenger?.status === 'picking_up'
                          ? '🚗 Bilow Safarka (Rider B)'
                          : currentRide.coPassenger?.status === 'picked_up'
                          ? '✅ Dhammee Safarka Rider B'
                          : '📍 Gaadhay Goobta (Rider B)'}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        advanceDriverRideState();
                        if (currentRide.status === 'accepted') {
                          voiceNavigationService.speak('Arrived at pickup. Waiting for passenger.', 'en', true);
                        } else if (currentRide.status === 'driver_arrived') {
                          voiceNavigationService.speak('Trip started. Heading to destination.', 'en', true);
                        } else if (currentRide.status === 'in_progress') {
                          voiceNavigationService.speak('Trip completed. Please collect fare.', 'en', true);
                        }
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl bg-[#008751] hover:bg-[#007445] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        {currentRide.status === 'accepted'
                          ? '📍 Gaadhay Goobta Kaqabashada (Arrived at Pickup)'
                          : currentRide.status === 'driver_arrived'
                          ? '🚗 Bilow Safarka (Start Trip)'
                          : '✅ Dhammee Safarka & Qaado Lacagta (Complete Trip)'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* EXPANDABLE FAAHFAAHIN (DETAILS) DRAWER WITH FULL BREAKDOWN & QUICK COLLAPSE TO FULL MAP */
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-2xl border-2 border-emerald-500/80 relative overflow-hidden space-y-3.5 max-h-[75vh] overflow-y-auto">
                {/* Drawer Header with Prominent Button to Collapse Back to Full Map */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      Faahfaahin Safarka • Trip Details
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailsDrawer(false);
                      setIsFullMapMode(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center space-x-1.5 shadow-md active:scale-95 transition cursor-pointer"
                    title="Ku laabo Khariidada Buuxda / Collapse to Full Map"
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>Khariidad Buuxda</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* DUAL CONTROL PANEL FOR STACKED / CARPOOL RIDES OR SINGLE RIDER */}
                {currentRide.coPassenger ? (
                  /* DUAL CONTROL PANEL FOR STACKED / CARPOOL RIDES */
                  <div className="space-y-3.5">
                {/* 1. Wadaage Carpool Header & Priority Switcher */}
                <div className="bg-slate-900 rounded-3xl p-4 text-white space-y-3 shadow-md border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                        ⚡ Wadaage Carpool (2 Active Riders)
                      </span>
                    </div>
                    <div className="text-right font-mono font-black text-emerald-400 text-sm">
                      ${((Number(currentRide.totalFare) || 0) + (Number(currentRide.coPassenger.fare) || 0)).toFixed(2)} USD
                    </div>
                  </div>

                  {/* Priority Drop-off Order Switcher */}
                  <div className="bg-slate-800/80 rounded-2xl p-2.5 flex items-center justify-between border border-slate-700/60 text-xs">
                    <div className="flex items-center space-x-2">
                      <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="text-slate-300 font-bold block text-[11px]">Drop-off Sequence:</span>
                        <span className="font-extrabold text-amber-300 text-xs">
                          {(() => {
                            const waypoints = currentRide.optimalWaypointsSequence || [];
                            const dropAIdx = waypoints.findIndex((w) => w.type === 'DROPOFF' && (w.passengerId === currentRide.passengerId || w.passengerName === currentRide.passengerName));
                            const dropBIdx = waypoints.findIndex((w) => w.type === 'DROPOFF' && (w.passengerId === currentRide.coPassenger?.id || w.passengerName === currentRide.coPassenger?.name));
                            if (dropAIdx !== -1 && dropBIdx !== -1 && dropBIdx < dropAIdx) {
                              return '1st: Rider B (Co-Rider) ➔ 2nd: Rider A';
                            }
                            return '1st: Rider A (Primary) ➔ 2nd: Rider B';
                          })()}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={toggleDropoffPriority}
                      className="py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-black text-[11px] rounded-xl border border-amber-500/40 transition active:scale-95 flex items-center gap-1"
                    >
                      <span>Swap Drop Order</span>
                    </button>
                  </div>
                </div>

                {/* 2. PANEL 1: RIDER A (PRIMARY PASSENGER) */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border-2 border-emerald-500/80 relative overflow-hidden space-y-3">
                  {/* Panel Header & Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px] tracking-wider uppercase">
                        RIDER A (Primary)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {currentRide.status === 'accepted'
                          ? 'Waiting Pickup'
                          : currentRide.status === 'driver_arrived'
                          ? 'Driver Arrived at A'
                          : currentRide.status === 'in_progress'
                          ? (() => {
                              const isADropped = currentRide.optimalWaypointsSequence?.find(
                                (w) => w.type === 'DROPOFF' && (w.passengerId === currentRide.passengerId || w.passengerName === currentRide.passengerName)
                              )?.status === 'completed';
                              return isADropped ? 'Dropped Off' : 'Onboard (In Trip)';
                            })()
                          : (currentRide.status || 'accepted').toUpperCase()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-[#008751] font-mono">
                        ${(Number(currentRide.totalFare) || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">
                        {currentRide.paymentMethod || 'cash'}
                      </span>
                    </div>
                  </div>

                  {/* Rider Info Row */}
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#008751] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                        {currentRide.passengerName?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {currentRide.passengerName}
                        </h4>
                        <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>4.9 Rating</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setShowChatModal(true)}
                        className="relative inline-flex items-center gap-1 text-[11px] font-bold text-[#008751] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl border border-emerald-200 transition active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                        {unreadChatCount > 0 && (
                          <span className="w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                            {unreadChatCount}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={initiateVoiceCall}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 transition"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </button>
                    </div>
                  </div>

                  {/* Rider A Color Beacon */}
                  {currentRide.beaconColor && (() => {
                    const bHex = currentRide.beaconColor?.hex || (typeof currentRide.beaconColor === 'string' ? currentRide.beaconColor : '#008751');
                    const bName = currentRide.beaconColor?.name || 'Assigned Glow';
                    return (
                      <div
                        className="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                        style={{
                          backgroundColor: bHex + '15',
                          borderColor: bHex + '55',
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full animate-ping shrink-0"
                            style={{ backgroundColor: bHex }}
                          />
                          <span className="font-bold text-slate-800 text-[11px]">
                            Beacon: <b style={{ color: bHex }}>{bName}</b>
                          </span>
                        </div>
                        <span
                          className="text-[9px] font-black px-2 py-0.5 rounded-full text-slate-950"
                          style={{ backgroundColor: bHex }}
                        >
                          RIDER A GLOW
                        </span>
                      </div>
                    );
                  })()}

                  {/* Rider A Route Container */}
                  <div className="bg-[#f8faf9] rounded-2xl p-3 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-slate-900 mt-1 shrink-0" />
                      <p className="font-bold text-slate-800 leading-tight truncate">
                        Pickup A: {currentRide.pickup?.name || 'Pickup A'}
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[#008751] mt-1 shrink-0" />
                      <p className="font-bold text-slate-800 leading-tight truncate">
                        Dropoff A: {currentRide.dropoff?.name || 'Dropoff A'}
                      </p>
                    </div>
                  </div>

                  {/* Control Action for Rider A */}
                  <div className="space-y-1.5">
                    {(() => {
                      const isADropped = currentRide.optimalWaypointsSequence?.find(
                        (w) => w.type === 'DROPOFF' && (w.passengerId === currentRide.passengerId || w.passengerName === currentRide.passengerName)
                      )?.status === 'completed';

                      if (isADropped) {
                        return (
                          <div className="py-2.5 px-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-black text-xs text-center flex items-center justify-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>Rider A Dropped Off Successfully</span>
                          </div>
                        );
                      }

                      if (currentRide.status === 'accepted') {
                        return (
                          <button
                            type="button"
                            onClick={() => advanceIndividualRiderAction('RIDER_A', 'arrived')}
                            className="w-full py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                          >
                            <MapPin className="w-4 h-4" />
                            <span>📍 Arrived at Pickup (Rider A)</span>
                          </button>
                        );
                      }

                      if (currentRide.status === 'driver_arrived') {
                        return (
                          <button
                            type="button"
                            onClick={() => advanceIndividualRiderAction('RIDER_A', 'pickup')}
                            className="w-full py-3 px-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Car className="w-4 h-4" />
                            <span>🚗 Pick Up Rider A (Start Trip A)</span>
                          </button>
                        );
                      }

                      return (
                        <button
                          type="button"
                          onClick={() => advanceIndividualRiderAction('RIDER_A', 'dropoff')}
                          className="w-full py-3 px-3 rounded-2xl bg-[#008751] hover:bg-[#007445] text-white font-black text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>✅ Drop-off Rider A & Complete</span>
                        </button>
                      );
                    })()}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => cancelIndividualRider('RIDER_A')}
                        className="w-full py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 transition"
                      >
                        <X className="w-3 h-3" />
                        <span>Cancel Rider A</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. PANEL 2: RIDER B (CO-RIDER / SECOND PASSENGER) */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border-2 border-teal-500/80 relative overflow-hidden space-y-3">
                  {/* Panel Header & Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-600 text-white font-black text-[10px] tracking-wider uppercase">
                        RIDER B (Co-Rider)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                        {currentRide.coPassenger.status === 'picking_up'
                          ? 'Driver Arrived at B'
                          : currentRide.coPassenger.status === 'picked_up'
                          ? 'Onboard (In Trip)'
                          : currentRide.coPassenger.status === 'dropped_off'
                          ? 'Dropped Off'
                          : 'Matched / En Route'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-teal-700 font-mono">
                        +${(Number(currentRide.coPassenger?.fare) || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-teal-800 block font-bold">
                        EXTRA FARE
                      </span>
                    </div>
                  </div>

                  {/* Rider B Info Row */}
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                        {currentRide.coPassenger?.name?.charAt(0) || 'B'}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {currentRide.coPassenger?.name || 'Rider B'}
                        </h4>
                        <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>4.8 Rating</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setShowChatModal(true)}
                        className="relative inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-xl border border-teal-200 transition active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                      <button
                        onClick={initiateVoiceCall}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 transition"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </button>
                    </div>
                  </div>

                  {/* Rider B Color Beacon */}
                  {currentRide.coPassenger?.beaconColor && (() => {
                    const bHex = currentRide.coPassenger.beaconColor?.hex || (typeof currentRide.coPassenger.beaconColor === 'string' ? currentRide.coPassenger.beaconColor : '#0D9488');
                    const bName = currentRide.coPassenger.beaconColor?.name || 'Assigned Glow';
                    return (
                      <div
                        className="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                        style={{
                          backgroundColor: bHex + '15',
                          borderColor: bHex + '55',
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full animate-ping shrink-0"
                            style={{ backgroundColor: bHex }}
                          />
                          <span className="font-bold text-slate-800 text-[11px]">
                            Beacon: <b style={{ color: bHex }}>{bName}</b>
                          </span>
                        </div>
                        <span
                          className="text-[9px] font-black px-2 py-0.5 rounded-full text-slate-950"
                          style={{ backgroundColor: bHex }}
                        >
                          RIDER B GLOW
                        </span>
                      </div>
                    );
                  })()}

                  {/* Rider B Route Container */}
                  <div className="bg-[#f8faf9] rounded-2xl p-3 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-slate-900 mt-1 shrink-0" />
                      <p className="font-bold text-slate-800 leading-tight truncate">
                        Pickup B: {currentRide.coPassenger.pickupLocation?.name || 'Pickup B'}
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-teal-600 mt-1 shrink-0" />
                      <p className="font-bold text-slate-800 leading-tight truncate">
                        Dropoff B: {currentRide.coPassenger.dropoffLocation?.name || 'Dropoff B'}
                      </p>
                    </div>
                  </div>

                  {/* Control Action for Rider B */}
                  <div className="space-y-1.5">
                    {(() => {
                      const coStatus = currentRide.coPassenger.status;

                      if (coStatus === 'dropped_off') {
                        return (
                          <div className="py-2.5 px-3 rounded-2xl bg-teal-50 border border-teal-300 text-teal-900 font-black text-xs text-center flex items-center justify-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-teal-600" />
                            <span>Rider B Dropped Off Successfully</span>
                          </div>
                        );
                      }

                      if (!coStatus || coStatus === 'matched') {
                        return (
                          <button
                            type="button"
                            onClick={() => advanceIndividualRiderAction('RIDER_B', 'arrived')}
                            className="w-full py-3 px-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                          >
                            <MapPin className="w-4 h-4" />
                            <span>📍 Arrived at Pickup (Rider B)</span>
                          </button>
                        );
                      }

                      if (coStatus === 'picking_up') {
                        return (
                          <button
                            type="button"
                            onClick={() => advanceIndividualRiderAction('RIDER_B', 'pickup')}
                            className="w-full py-3 px-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Car className="w-4 h-4" />
                            <span>🚗 Pick Up Rider B (Start Trip B)</span>
                          </button>
                        );
                      }

                      return (
                        <button
                          type="button"
                          onClick={() => advanceIndividualRiderAction('RIDER_B', 'dropoff')}
                          className="w-full py-3 px-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>✅ Drop-off Rider B & Complete</span>
                        </button>
                      );
                    })()}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => cancelIndividualRider('RIDER_B')}
                        className="w-full py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 transition"
                      >
                        <X className="w-3 h-3" />
                        <span>Cancel Rider B</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Complete Route Waypoint Flow Manifest */}
                {currentRide.optimalWaypointsSequence && currentRide.optimalWaypointsSequence.length > 0 && (
                  <div className="bg-slate-950 p-3.5 rounded-3xl border border-slate-800 text-white space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                      <span>⚡ 4-Stop Optimized Route Waypoints</span>
                      <span>100% Direction Aligned</span>
                    </div>
                    <div className="space-y-1.5">
                      {currentRide.optimalWaypointsSequence.map((wp, idx) => (
                        <div
                          key={wp.id || idx}
                          className={`p-2 rounded-xl border flex items-center justify-between text-xs transition ${
                            wp.status === 'completed'
                              ? 'bg-emerald-950/40 border-emerald-700/60 opacity-60'
                              : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span
                              className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                                wp.status === 'completed'
                                  ? 'bg-emerald-500 text-slate-950'
                                  : wp.type === 'PICKUP'
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-blue-500 text-white'
                              }`}
                            >
                              {wp.status === 'completed' ? '✓' : idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-slate-200">
                                {wp.type === 'PICKUP' ? 'PICKUP' : 'DROPOFF'}: {wp.passengerName}
                              </span>
                              <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{wp.location?.name || 'Waypoint'}</p>
                            </div>
                          </div>
                          {wp.beaconColor && (
                            <div
                              className="w-3 h-3 rounded-full shadow"
                              style={{ backgroundColor: wp.beaconColor.hex }}
                              title={wp.beaconColor?.name || 'Beacon'}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emergency Global SOS */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSosModal(true)}
                    className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-2xl text-xs flex items-center justify-center space-x-1.5 transition border border-red-200"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Emergency SOS & Police Dispatch</span>
                  </button>
                </div>
              </div>
            ) : (
              /* SINGLE RIDER ACTIVE CARD */
              <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border-2 border-emerald-500 relative overflow-hidden space-y-3.5">
                {/* Header & Single Rider Tag */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-[#008751] text-white font-bold flex items-center justify-center text-base shadow-sm">
                      {currentRide.passengerName?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {currentRide.passengerName || 'Axmed Diiriye'}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[9px] uppercase">
                          RIDER A (Primary)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="bg-emerald-50 text-[#008751] text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                          {(currentRide.status || 'accepted').replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {currentRide.category === 'wadaage_share' ? 'Shared Wadaage' : 'Standard'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <div className="text-xl font-black text-[#008751] font-mono">
                      ${(Number(currentRide.totalFare) || 0).toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <button
                        type="button"
                        onClick={() => setShowChatModal(true)}
                        className="relative inline-flex items-center gap-1 text-[11px] font-bold text-[#008751] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition active:scale-95"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat</span>
                        {unreadChatCount > 0 && (
                          <span className="w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                            {unreadChatCount}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={initiateVoiceCall}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Call</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Color Beacon Identification Prompt */}
                {currentRide.beaconColor && (() => {
                  const bHex = currentRide.beaconColor?.hex || (typeof currentRide.beaconColor === 'string' ? currentRide.beaconColor : '#008751');
                  const bName = currentRide.beaconColor?.name || 'Assigned Glow';
                  return (
                    <div
                      className="p-3 rounded-2xl border flex items-center justify-between"
                      style={{
                        backgroundColor: bHex + '15',
                        borderColor: bHex + '55',
                      }}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className="w-5 h-5 rounded-full shadow-sm animate-ping"
                          style={{ backgroundColor: bHex }}
                        />
                        <div>
                          <span className="text-[11px] font-black text-slate-900 block">
                            Rider Beacon: <span style={{ color: bHex }}>{bName}</span>
                          </span>
                          <p className="text-[10px] text-slate-600">
                            Look for passenger holding up this color glow on their phone screen.
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-full text-slate-950"
                        style={{ backgroundColor: bHex }}
                      >
                        IDENTIFIER
                      </span>
                    </div>
                  );
                })()}

                {/* Route Path Container */}
                <div className="bg-[#f8faf9] rounded-2xl p-3.5 border border-slate-100 space-y-2">
                  <div className="flex items-start space-x-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mt-1 shrink-0" />
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {currentRide.pickup?.name || 'Pickup Location'}
                    </p>
                  </div>
                  <div className="border-l-2 border-dashed border-slate-300 ml-1 h-3.5 my-0.5" />
                  <div className="flex items-start space-x-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#008751] mt-1 shrink-0" />
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {currentRide.dropoff?.name || 'Dropoff Destination'}
                    </p>
                  </div>
                </div>

                {/* Dynamic Carpool Stacking Status Monitor vs Private Taxi Status */}
                {currentRide.category === 'wadaage_share' && currentRide.isShared ? (
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 p-3.5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-black text-slate-900">Wadaage Share Carpool Stacking</span>
                      </div>
                      <button
                        type="button"
                        onClick={toggleAutoAcceptShares}
                        className={`px-3 py-1 rounded-full text-[10px] font-black transition ${
                          autoAcceptOnRouteShares
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {autoAcceptOnRouteShares ? 'AUTO-STACK: ON' : 'AUTO-STACK: OFF'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-emerald-900 font-bold bg-white/70 p-2 rounded-xl border border-emerald-200/60">
                      <span>⚡ Corridor Scanning (1.0km pickup / 1.5km driving)</span>
                      <span className="text-[#008751] font-extrabold">+${(Number(pricing?.driverStackedBonusUsd) || 1.50).toFixed(2)} Extra Profit</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>Private Exclusive Taxi Trip (No Co-Riders)</span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      Direct Route
                    </span>
                  </div>
                )}

                {/* Action Controls for Single Rider */}
                <div className="space-y-2">
                  {(() => {
                    let buttonLabel = '📍 I Have Arrived at Pickup Location';
                    if (currentRide.status === 'driver_arrived') {
                      buttonLabel = '🚀 Start Trip (Passenger Onboard)';
                    } else if (currentRide.status === 'in_progress') {
                      buttonLabel = '✅ Complete Trip & Collect Fare';
                    }

                    return (
                      <button
                        type="button"
                        onClick={advanceDriverRideState}
                        className="w-full py-3.5 px-4 rounded-2xl bg-[#008751] hover:bg-[#007445] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#008751]/25 transition active:scale-95 flex items-center justify-center gap-2"
                      >
                        <span>{buttonLabel}</span>
                      </button>
                    );
                  })()}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSosModal(true)}
                      className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Emergency SOS & Police Dispatch</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
              </div>
            )
          ) : driverModeOnline ? (
            /* Live Driver Radar Standby Mode (Online & Ready) */
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 relative overflow-hidden space-y-4 text-center">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-[#008751]/10 animate-ping" />
                <div className="w-12 h-12 rounded-full bg-[#008751] text-white flex items-center justify-center shadow-lg">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#008751] animate-ping" />
                  <h4 className="font-black text-sm text-slate-900 font-sans">
                    Radar-ka Wadaage Wuu Shaqaynayaa
                  </h4>
                </div>
                <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                  Waxaad ku jirtaa khadka (Online). Safarrada cusub ee rakaabka Hargeisa ayaa halkan si toos ah kugu soo gaadhi doona.
                </p>
              </div>

              <div className="bg-[#f8faf9] rounded-2xl p-3 border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-600 font-bold">
                  <MapPin className="w-4 h-4 text-[#008751]" />
                  <span>GPS Dispatch Radius: <b className="text-slate-900">{getDispatchRadiusKm()} KM</b></span>
                </div>
                <span className="font-extrabold text-[#008751] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Strict GPS Match
                </span>
              </div>
            </div>
          ) : (
            /* Driver Offline Standby Card */
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 relative overflow-hidden space-y-3.5 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Car className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-800 font-sans">
                  Khadka Kama Jirto (Offline)
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Daar badhanka kore ee <span className="font-bold text-[#008751]">"Available for Ride"</span> si aad u bilowdo qaadashada safarrada.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleOnline}
                className="w-full py-3 rounded-full bg-[#008751] hover:bg-[#007043] text-white font-black text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>Gal Khadka (Go Online Now)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    )}

      {/* 2. FUEL TAB: WADAAGE DRIVER FUEL & DISTANCE DASHBOARD */}
      {activeTab === 'fuel' && (
        <div className="flex-1 overflow-hidden relative">
          <FuelDashboardScreen />
        </div>
      )}

      {/* 3. MY RIDES TAB */}
      {activeTab === 'my_rides' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Safarradayda (My Rides)</h2>
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="text-xs text-[#008751] font-bold"
            >
              Back to Map
            </button>
          </div>
          {driverRides && driverRides.length > 0 ? (
            <div className="space-y-3">
              {driverRides.map((ride, idx) => (
                <div key={ride.id || idx} className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-slate-800">{ride.passengerName || 'Passenger'}</span>
                      <p className="text-[11px] text-slate-500">
                        {ride.pickup?.name || 'Hargeisa'} → {ride.dropoff?.name || 'Destination'}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-[#008751]">${(Number(ride.totalFare) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                    <span>{ride.createdAt ? new Date(ride.createdAt).toLocaleDateString() : 'Recent'}</span>
                    <span className="capitalize font-semibold text-emerald-600">{ride.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-200">
              <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-sm text-slate-700">Weli wax safarro ah ma jiraan</p>
              <p className="text-xs text-slate-400 mt-1">Safarrada aad dhammaystirto halkan ayay ka muuqan doonaan.</p>
            </div>
          )}
        </div>
      )}

      {/* 4. EARNINGS TAB */}
      {activeTab === 'earnings' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Dakhliga (Earnings)</h2>
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="text-xs text-[#008751] font-bold"
            >
              Back to Map
            </button>
          </div>
          <div className="bg-gradient-to-br from-[#008751] to-emerald-700 rounded-3xl p-5 text-white shadow-lg space-y-3">
            <div className="text-xs uppercase font-bold tracking-wider text-emerald-100">Maanta (Today's Earnings)</div>
            <div className="text-3xl font-black font-mono">
              ${(currentDriverRecord?.todayEarnings || 0).toFixed(2)}
            </div>
            <div className="text-sm font-bold text-emerald-200">
              ~{Math.round((currentDriverRecord?.todayEarnings || 0) * EXCHANGE_RATE_USD_TO_SLSH).toLocaleString()} SLSH
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowWalletModal(true)}
                className="flex-1 py-2 px-3 bg-white text-[#008751] font-black rounded-xl text-xs uppercase tracking-wider shadow"
              >
                Zaad / eDahab Wallet
              </button>
              <button
                type="button"
                onClick={() => setShowEarningsModal(true)}
                className="py-2 px-3 bg-emerald-800/80 text-white font-bold rounded-xl text-xs"
              >
                Faahfaahin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Xogta Darawalka (Profile)</h2>
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="text-xs text-[#008751] font-bold"
            >
              Back to Map
            </button>
          </div>
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-2xl bg-[#008751] text-white flex items-center justify-center font-black text-xl shadow">
                {currentUser?.name?.charAt(0) || 'D'}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">{currentUser?.name || 'Driver Partner'}</h3>
                <p className="text-xs text-slate-500 font-mono">{currentUser?.phone || '+252 63 ...'}</p>
                <span className="inline-block mt-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Wadaage Official Driver
                </span>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Gaadhiga:</span>
                <b className="text-slate-900">Toyota Vitz (SL-4921)</b>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Magaalada:</span>
                <b className="text-slate-900">Hargeisa, Somaliland</b>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>KYC Status:</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  {isKycApproved ? 'Approved' : 'Pending / Verified'}
                </span>
              </div>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowAccountModal(true)}
                className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Beddel Xogta Akoonka
              </button>
              <button
                type="button"
                onClick={() => setShowVehicleSetupModal(true)}
                className="w-full py-2.5 bg-emerald-50 text-[#008751] border border-emerald-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <FuelIcon className="w-3.5 h-3.5" />
                <span>Habee Xogta Shidaalka (Fuel Vehicle Setup)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. BOTTOM WADAAGE BLUE NAVIGATION BAR (Matching image.png) */}
      <nav className="bg-[#0066f5] border-t border-blue-400/20 px-2 py-2 rounded-t-[1.8rem] shadow-2xl flex items-center justify-around shrink-0 text-white z-30 select-none">
        {/* Tab 1: HOME */}
        <button
          id="nav-tab-home"
          type="button"
          onClick={() => setActiveTab('home')}
          className={`min-h-[44px] px-3 py-1.5 rounded-full flex items-center space-x-1.5 transition-all duration-200 active:scale-95 cursor-pointer ${
            activeTab === 'home'
              ? 'bg-white text-[#0066f5] font-black shadow-md'
              : 'text-white/80 hover:text-white font-bold'
          }`}
        >
          <Home className="w-4 h-4 shrink-0" />
          <span className="text-[11px] tracking-wider uppercase">HOME</span>
        </button>

        {/* Tab 2: MY RIDES */}
        <button
          id="nav-tab-my-rides"
          type="button"
          onClick={() => setActiveTab('my_rides')}
          className={`min-h-[44px] px-3 py-1.5 rounded-full flex items-center space-x-1.5 transition-all duration-200 active:scale-95 cursor-pointer ${
            activeTab === 'my_rides'
              ? 'bg-white text-[#0066f5] font-black shadow-md'
              : 'text-white/80 hover:text-white font-bold'
          }`}
        >
          <Car className="w-4 h-4 shrink-0" />
          <span className="text-[11px] tracking-wider uppercase">MY RIDES</span>
        </button>

        {/* Tab 3: FUEL */}
        <button
          id="nav-tab-fuel"
          type="button"
          onClick={() => setActiveTab('fuel')}
          className={`min-h-[44px] px-3 py-1.5 rounded-full flex items-center space-x-1.5 transition-all duration-200 active:scale-95 relative cursor-pointer ${
            activeTab === 'fuel'
              ? 'bg-white text-[#0066f5] font-black shadow-md'
              : 'text-white/80 hover:text-white font-bold'
          }`}
        >
          <FuelIcon className="w-4 h-4 shrink-0" />
          <span className="text-[11px] tracking-wider uppercase">FUEL</span>
        </button>

        {/* Tab 4: EARNINGS */}
        <button
          id="nav-tab-earnings"
          type="button"
          onClick={() => setActiveTab('earnings')}
          className={`min-h-[44px] px-3 py-1.5 rounded-full flex items-center space-x-1.5 transition-all duration-200 active:scale-95 cursor-pointer ${
            activeTab === 'earnings'
              ? 'bg-white text-[#0066f5] font-black shadow-md'
              : 'text-white/80 hover:text-white font-bold'
          }`}
        >
          <Wallet className="w-4 h-4 shrink-0" />
          <span className="text-[11px] tracking-wider uppercase">EARNINGS</span>
        </button>

        {/* Tab 5: PROFILE */}
        <button
          id="nav-tab-profile"
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`min-h-[44px] px-3 py-1.5 rounded-full flex items-center space-x-1.5 transition-all duration-200 active:scale-95 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-white text-[#0066f5] font-black shadow-md'
              : 'text-white/80 hover:text-white font-bold'
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span className="text-[11px] tracking-wider uppercase">PROFILE</span>
        </button>
      </nav>

      {/* 7. DRIVER MENU DRAWER */}
      {showMenuDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setShowMenuDrawer(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-slate-900 text-white h-full shadow-2xl border-r border-slate-800 p-5 flex flex-col justify-between z-10 animate-slideRight">
            <div className="space-y-4">
              {/* Brand Top Header in Drawer */}
              <div className="bg-[#030d1a] -mx-5 -mt-5 p-4 flex items-center justify-between border-b border-slate-800 shadow-md">
                <div className="flex items-center space-x-2.5">
                  <WadaageLogo variant="icon" size="sm" appType="driver" />
                  <WadaageLogo variant="wordmark" size="xs" appType="driver" />
                </div>
                <button
                  onClick={() => setShowMenuDrawer(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Card */}
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                <div className="w-11 h-11 rounded-2xl bg-[#008751] flex items-center justify-center font-bold text-white shadow-md">
                  {currentUser?.name?.charAt(0) || 'D'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{currentUser?.name || 'Baashe Maxamed'}</h3>
                  <p className="text-xs text-emerald-400 font-bold">Toyota Vitz (SL-4921)</p>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1 text-sm font-semibold">
                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowWalletModal(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <Wallet className="w-4 h-4 text-amber-400" />
                    <span>ZAAD / eDahab Commission Wallet</span>
                  </div>
                  <span className="font-mono text-xs text-emerald-400">${driverWalletBalanceUsd.toFixed(2)}</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowEarningsModal(true);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 transition"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Daily Earnings Breakdown</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowActivityModal(true);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 transition"
                >
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>Completed Rides & Rating</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setActiveTab('fuel');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <FuelIcon className="w-4 h-4 text-emerald-400" />
                    <span>Fuel & Distance Management</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700">Hargeisa GPS</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowAccountModal(true);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 transition"
                >
                  <User className="w-4 h-4 text-blue-400" />
                  <span>KYC Documents & Vehicle</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowSosModal(true);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 transition"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Driver Emergency 999 SOS</span>
                </button>
              </div>
            </div>

            {/* Sign Out Button */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Driver Partner</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. NOTIFICATIONS DRAWER */}
      {showNotificationDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setShowNotificationDrawer(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-white text-slate-900 h-full shadow-2xl p-5 flex flex-col justify-between z-10 animate-slideLeft">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2 font-black text-sm">
                  <Bell className="w-4 h-4 text-[#008751]" />
                  <span>Driver Notifications</span>
                </div>
                <button
                  onClick={() => setShowNotificationDrawer(false)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                  <p className="font-bold text-emerald-900">Wallet Top-up Confirmed</p>
                  <p className="text-slate-600">Your ZAAD topup of 10,000 SLSH ($1.00) is credited to your commission account.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <p className="font-bold text-slate-900">High Demand in Jigjiga Yar</p>
                  <p className="text-slate-600">Surge in ride requests near Mansoor Hotel and Hargeisa Mall.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODALS & SUB-VIEWS (Wallet, KYC, SOS, Earnings, Activity) */}
      <LocationSetupModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
      <DriverCommissionWalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
      <DriverEmergencySosModal isOpen={showSosModal} onClose={() => setShowSosModal(false)} />

      {showEarningsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Driver Daily Earnings</h3>
              <button onClick={() => setShowEarningsModal(false)} className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="pt-3">
              <DriverEarningsView />
            </div>
          </div>
        </div>
      )}

      {showActivityModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Driver Activity & Rides</h3>
              <button onClick={() => setShowActivityModal(false)} className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="pt-3">
              <DriverActivityView />
            </div>
          </div>
        </div>
      )}

      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Driver Profile & Documents</h3>
              <button onClick={() => setShowAccountModal(false)} className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="pt-3">
              <DriverAccountView
                onOpenSupportModal={() => {}}
                onOpenFatigueModal={() => {}}
                onOpenVehicleModal={() => {}}
                onOpenSosModal={() => setShowSosModal(true)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Driver Compulsory Full KYC Modal */}
      {showKycModal && (
        <DriverRegistrationModal
          isOpen={showKycModal}
          initialName={currentUser?.name}
          initialPhone={currentUser?.phone}
          onClose={() => setShowKycModal(false)}
        />
      )}

      {/* Transfer Ride to Another Driver Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Transfer Ride (U Wareeji)</h3>
                  <p className="text-[11px] text-slate-500">Re-dispatch this ride to another active driver</p>
                </div>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 1-Click Fast Transfer to Nearest */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                  ⚡ 1-Click Auto Dispatch
                </span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                  Fastest
                </span>
              </div>
              <p className="text-xs text-emerald-800">
                Immediately pass this ride request to the next closest available driver in Hargeisa.
              </p>
              <button
                type="button"
                onClick={() => {
                  const result = transferRideToAnotherDriver();
                  setShowTransferModal(false);
                  setTransferNotice(result.message);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow transition"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Auto-Forward to Nearest Driver</span>
              </button>
            </div>

            {/* Choose from specific online drivers */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Available Online Drivers ({drivers.filter((d) => d.id !== currentUser?.id).length}):
              </span>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {drivers
                  .filter((d) => d.id !== currentUser?.id)
                  .map((drv) => (
                    <div
                      key={drv.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between transition gap-2"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <img
                          src={drv.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                          alt={drv.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-300 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">{drv.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium truncate">
                            {drv.vehicle?.model} • {drv.vehicle?.licensePlate}
                          </p>
                          <span className="text-[9px] font-bold text-amber-600">★ {drv.rating} • {drv.phone}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const result = transferRideToAnotherDriver(drv.id);
                          setShowTransferModal(false);
                          setTransferNotice(result.message);
                        }}
                        className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shrink-0 active:scale-95 transition"
                      >
                        Send to Driver
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Driver Real-Time Chat with Passenger Modal */}
      {showChatModal && (
        <ChatModal
          onClose={() => setShowChatModal(false)}
          viewerRole="driver"
        />
      )}

      {/* Vehicle Fuel Profile Setup Modal */}
      {showVehicleSetupModal && (
        <VehicleSetupModal
          isOpen={showVehicleSetupModal}
          onClose={() => setShowVehicleSetupModal(false)}
        />
      )}
    </div>
  );
};
