import {
  AlertTriangle,
  Briefcase,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Info,
  Layers,
  Map,
  MapPin,
  Maximize2,
  MessageSquare,
  Minimize2,
  PhoneCall,
  Radar,
  Receipt,
  Share2,
  Shield,
  Sparkles,
  Star,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useRide } from '../../context/RideContext';
import { formatCurrency, EXCHANGE_RATE_USD_TO_SLSH } from '../../utils/geo';
import { CallDriverModal } from './CallDriverModal';
import { ChatModal } from './ChatModal';
import { ShareTripModal } from './ShareTripModal';
import { ColorBeaconModal } from '../Common/ColorBeaconModal';

interface ActiveRideCardProps {
  onOpenSafetyModal: () => void;
}

export const ActiveRideCard: React.FC<ActiveRideCardProps> = ({ onOpenSafetyModal }) => {
  const { currentRide, cancelRide, acceptBid, drivers, unreadChatCount, dispatchBatchPoolRideNow, initiateVoiceCall } = useRide();
  const [showChat, setShowChat] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFareBreakdown, setShowFareBreakdown] = useState(false);
  const [showBeaconModal, setShowBeaconModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Driver taking too long');
  const [isFullMapMode, setIsFullMapMode] = useState(false);

  // 3-Minute Pickup Countdown Timer State
  const [waitSeconds, setWaitSeconds] = useState(180); // 3 mins = 180s

  useEffect(() => {
    if (currentRide?.status === 'driver_arrived') {
      const interval = setInterval(() => {
        setWaitSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setWaitSeconds(180);
    }
  }, [currentRide?.status]);

  if (!currentRide) return null;

  const matchedDriver = currentRide.assignedDriverId ? drivers.find((d) => d.id === currentRide.assignedDriverId) : null;
  const driverVehicle = (matchedDriver as any)?.vehicle || {};
  // Dynamically map from driver_name field in database/active trip object, strictly avoiding placeholder text or rider name bleed
  let resolvedDriverName = (currentRide as any).driver_name || currentRide.driverName || matchedDriver?.name;
  if (!resolvedDriverName || resolvedDriverName.toLowerCase().includes('rider') || resolvedDriverName.includes('0000')) {
    resolvedDriverName = matchedDriver?.name || 'Maxamed Cumar Jaamac';
  }
  const driverName = currentRide.status === 'searching' ? 'Raadinta darawalka...' : resolvedDriverName;
  const driverPhone = (currentRide as any).driver_phone || currentRide.driverPhone || matchedDriver?.phone || '+252 63 4421908';
  const driverAvatar = (currentRide as any).driver_avatar || currentRide.driverAvatar || matchedDriver?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80';
  const driverRating = matchedDriver?.rating || 4.95;
  const vehicleModel = (currentRide as any).vehicle_model || currentRide.vehicleModel || driverVehicle.model || (matchedDriver as any)?.vehicle_model || 'Toyota Vitz';
  let vehiclePlate = (currentRide as any).license_plate || currentRide.licensePlate || driverVehicle.licensePlate || (matchedDriver as any)?.vehicle_plate;
  if (!vehiclePlate || vehiclePlate === 'SL-24810') {
    vehiclePlate = matchedDriver?.vehicle?.licensePlate || 'SL-2044';
  }
  const vehicleColor = driverVehicle.color || (matchedDriver as any)?.vehicle_color || 'White';

  const assignedDriver = {
    id: currentRide.assignedDriverId || matchedDriver?.id || 'live_driver',
    name: driverName,
    phone: driverPhone,
    avatar: driverAvatar,
    rating: driverRating,
    vehicle: {
      model: vehicleModel,
      licensePlate: vehiclePlate,
      color: vehicleColor,
    },
  };
  const waitMins = Math.floor(waitSeconds / 60);
  const waitRemainingSecs = waitSeconds % 60;

  const isShare = currentRide.category === 'wadaage_share' || currentRide.isShared;
  const ratePerKm = isShare ? 0.40 : 0.80;
  const ratePerKmSos = Math.round(ratePerKm * EXCHANGE_RATE_USD_TO_SLSH);
  const totalFare = Number(currentRide.totalFare) || 0;
  const totalSos = Math.round(totalFare * EXCHANGE_RATE_USD_TO_SLSH);
  const pickupName = currentRide.pickup?.name || 'Pickup Point';
  const dropoffName = currentRide.dropoff?.name || 'Destination';

  return (
    <>
      {/* 1. MINIMIZED / FULL MAP COMPACT RIDER HUD */}
      {isFullMapMode && currentRide.status !== 'searching' ? (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xl space-y-2.5 animate-in fade-in slide-in-from-bottom-2">
          {/* Top Row: Milestone Indicator & Expand Details Button */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900 dark:text-white truncate block">
                  {currentRide.status === 'accepted' && 'Darawalku wuu soo socdaa (~3 daqiiqo)'}
                  {currentRide.status === 'driver_arrived' && 'Darawalku wuxuu joogaa goobta!'}
                  {currentRide.status === 'in_progress' && `U socda: ${dropoffName}`}
                </span>
                <span className="text-[10px] text-slate-500 truncate block">
                  {currentRide.categoryName || 'Wadaage'} • {currentRide.distanceKm} km • PIN: <b className="font-mono text-emerald-600 dark:text-emerald-400">{currentRide.otpCode || '4912'}</b>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFullMapMode(false)}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-black flex items-center space-x-1 shrink-0 active:scale-95 transition shadow-xs cursor-pointer"
              title="Faahfaahin / Show Details"
            >
              <span>Faahfaahin</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bottom Row: Driver, Vehicle, Fare & 1-Tap Quick Actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5 min-w-0">
              <img
                src={assignedDriver.avatar}
                alt={assignedDriver.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {assignedDriver.name}
                  </span>
                  <span className="flex items-center text-[10px] font-bold text-amber-500">
                    ★ {assignedDriver.rating}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium truncate">
                  {assignedDriver.vehicle.model} • <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{assignedDriver.vehicle.licensePlate}</span>
                </div>
              </div>
            </div>

            {/* Price & Action Buttons */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <div className="text-right mr-1">
                <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  ${totalFare.toFixed(2)}
                </div>
                <div className="text-[9px] text-slate-400 font-medium">
                  {totalSos.toLocaleString()} SLSH
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowChat(true)}
                className="relative p-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition font-bold text-xs flex items-center justify-center active:scale-95 cursor-pointer shadow-sm"
                title="Open Chat"
              >
                <MessageSquare className="w-4 h-4" />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                    {unreadChatCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => initiateVoiceCall()}
                className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 hover:bg-slate-700 transition text-xs font-bold flex items-center justify-center active:scale-95 cursor-pointer shadow-sm"
                title="Call Driver"
              >
                <PhoneCall className="w-4 h-4" />
              </button>

              {currentRide.beaconColor && (
                <button
                  type="button"
                  onClick={() => setShowBeaconModal(true)}
                  className="p-2.5 rounded-xl text-slate-950 font-black text-xs shadow hover:brightness-110 active:scale-95 transition cursor-pointer"
                  style={{ backgroundColor: currentRide.beaconColor?.hex || '#06B6D4' }}
                  title="Open Beacon"
                >
                  <Zap className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 2. EXPANDED ACTIVE RIDE DETAILS SHEET */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Status Header with Dedicated Full Map Toggle Button */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              {currentRide.status === 'searching' && (
                <div className="relative flex items-center justify-center">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center animate-spin">
                    <Radar className="w-5 h-5" />
                  </div>
                </div>
              )}
              {currentRide.status === 'accepted' && (
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  <Car className="w-5 h-5" />
                </div>
              )}
              {currentRide.status === 'driver_arrived' && (
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5 animate-bounce" />
                </div>
              )}
              {currentRide.status === 'in_progress' && (
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                  <Car className="w-5 h-5" />
                </div>
              )}

              <div>
                <div className="font-extrabold text-slate-900 dark:text-white text-base">
                  {currentRide.status === 'searching' && 'Searching for Nearby Drivers...'}
                  {currentRide.status === 'accepted' && 'Driver Assigned & En Route'}
                  {currentRide.status === 'driver_arrived' && 'Driver Has Arrived at Pickup Point!'}
                  {currentRide.status === 'in_progress' && 'Ride in Progress'}
                </div>
                <p className="text-xs text-slate-500">
                  {currentRide.categoryName || 'Wadaage Ride'} • {pickupName} → {dropoffName}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {currentRide.status !== 'searching' && (
                <button
                  type="button"
                  onClick={() => setIsFullMapMode(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition active:scale-95 shadow-xs cursor-pointer"
                  title="Minimize to Full Map View / Arag Khariidada Buuxda"
                >
                  <Map className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Khariidad Buuxda</span>
                  <span className="sm:hidden">Map</span>
                </button>
              )}

              <div className="text-right">
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                  ${totalFare.toFixed(2)} USD
                </span>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  {currentRide.paymentMethod || 'cash'}
                </div>
              </div>
            </div>
          </div>

        {/* Prominent Price & Fare Breakdown Card for Rider */}
        <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 dark:from-slate-800/80 dark:to-emerald-950/20 border border-emerald-500/20 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                <Receipt className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Your Ride Total Fare</span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    ${totalFare.toFixed(2)} USD
                  </span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    ({totalSos.toLocaleString()} SLSH)
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowFareBreakdown(!showFareBreakdown)}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-950 transition flex items-center space-x-1"
            >
              <span>{showFareBreakdown ? 'Hide Breakdown' : 'Fare Breakdown'}</span>
              {showFareBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span>
              Tariff: <b>{isShare ? '$0.40 USD / 4,500 SLSH' : '$0.80 USD / 9,000 SLSH'} per km</b>
            </span>
            <span>
              Distance: <b>{currentRide.distanceKm} km</b> • Est. <b>{currentRide.durationMins} mins</b>
            </span>
          </div>

          {/* Expandable Itemized Breakdown */}
          {showFareBreakdown && (
            <div className="mt-2 pt-2 border-t border-dashed border-emerald-500/30 space-y-1.5 text-xs animate-in fade-in duration-150">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Base / Minimum Fare:</span>
                <span className="font-mono font-semibold">${(ratePerKm).toFixed(2)} USD ({ratePerKmSos.toLocaleString()} SLSH)</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Distance Rate ({currentRide.distanceKm || 0} km @ ${(Number(ratePerKm) || 0).toFixed(2)}/km):</span>
                <span className="font-mono font-semibold">${((Number(currentRide.distanceKm) || 0) * ratePerKm).toFixed(2)} USD ({Math.round((Number(currentRide.distanceKm) || 0) * ratePerKmSos).toLocaleString()} SLSH)</span>
              </div>
              {Number(currentRide.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Wadaage Share Discount:</span>
                  <span className="font-mono">-${(Number(currentRide.discountAmount) || 0).toFixed(2)} USD</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-black text-slate-900 dark:text-white">
                <span>Payment Mode:</span>
                <span className="uppercase text-emerald-600 dark:text-emerald-400">{currentRide.paymentMethod || 'cash'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Searching Animation State */}
        {currentRide.status === 'searching' && (
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-4 rounded-2xl text-center space-y-2.5">
              <div className="flex items-center justify-center space-x-2 text-blue-900 dark:text-blue-200 font-bold text-xs">
                <Radar className="w-4 h-4 text-blue-600 animate-spin" />
                <span>
                  {currentRide.scheduledTime
                    ? `📅 Dalab Hore loo Sii Qorsheeyay: Ballanta ${currentRide.scheduledTime} • Qiimaha Hore loo Cayimay waa Xaqiijisan yahay!`
                    : currentRide.isBookByBid
                    ? 'Helitaanka dalabyada darawallada ugu dhow...'
                    : 'Waxa lagugu xirayaa darawalka kuugu dhow (Qiyaastii 2-3 daqiiqo)...'}
                </span>
              </div>
              <div className="w-full bg-blue-100 dark:bg-blue-900/50 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse w-3/4"></div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Fadlan sug inta darawalku aqbalayo dalabkaaga
              </p>
            </div>

            {/* If Book by Bid active, display driver bids! */}
            {currentRide.isBookByBid && currentRide.bids && currentRide.bids.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-900 dark:text-white block uppercase tracking-wider">
                  Driver Offers Received ({currentRide.bids.length})
                </span>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {currentRide.bids.map((bid) => (
                    <div
                      key={bid.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={bid.driverAvatar}
                          alt={bid.driverName}
                          className="w-10 h-10 rounded-full object-cover border border-amber-400"
                        />
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                              {bid.driverName}
                            </span>
                            <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold px-1.5 rounded">
                              ★ {bid.driverRating}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{bid.vehicleModel}</p>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="font-black text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                          ${bid.priceUsd.toFixed(2)} USD
                        </div>
                        <button
                          onClick={() => acceptBid(bid.id)}
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-[11px] uppercase tracking-wider shadow"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => setShowCancelModal(true)}
                className="text-xs font-bold text-rose-600 hover:underline pt-1 inline-block"
              >
                Cancel Booking Request
              </button>
            </div>
          </div>
        )}

        {/* Assigned Driver Profile Card & Color Beacon Button */}
        {currentRide.status !== 'searching' && (
          <div className="space-y-3">
            {/* Color Beacon Identification Prompt (Last 50 Meters Connection) */}
            <div className="bg-slate-950 text-white p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-lg animate-pulse"
                  style={{
                    backgroundColor: currentRide.beaconColor?.hex || '#06B6D4',
                  }}
                >
                  <Sparkles className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-white">Color Beacon Active</span>
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase"
                      style={{
                        backgroundColor: (currentRide.beaconColor?.hex || '#06B6D4') + '33',
                        color: currentRide.beaconColor?.hex || '#06B6D4',
                        borderColor: currentRide.beaconColor?.hex || '#06B6D4',
                      }}
                    >
                      {currentRide.beaconColor?.name || 'Neon Cyan'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Flash your screen so Captain {assignedDriver.name} spots you in crowds.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBeaconModal(true)}
                className="px-3 py-2 rounded-xl text-slate-950 font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition flex items-center space-x-1.5 shrink-0"
                style={{
                  backgroundColor: currentRide.beaconColor?.hex || '#06B6D4',
                }}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Open Beacon</span>
              </button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={assignedDriver.avatar}
                  alt={assignedDriver.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {assignedDriver.name}
                    </h3>
                    <span className="flex items-center text-xs text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                      {assignedDriver.rating}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {assignedDriver.vehicle.model} ({assignedDriver.vehicle.color})
                  </p>
                  <div className="inline-block mt-1 bg-slate-900 text-emerald-400 font-mono font-black text-xs px-2 py-0.5 rounded tracking-wider border border-slate-700">
                    {assignedDriver.vehicle.licensePlate}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Chat & Call */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowChat(true)}
                  className="relative p-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-md font-bold text-xs flex items-center space-x-1.5 active:scale-95"
                  title="Open Chat"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Chat</span>
                  {unreadChatCount > 0 && (
                    <span className="w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                      {unreadChatCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    initiateVoiceCall();
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all text-xs font-bold flex items-center space-x-1"
                  title="Call Driver"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>

            {/* 3-Minute Pickup Waiting Timer Rule if Driver Arrived */}
            {currentRide.status === 'driver_arrived' && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-center justify-between text-xs text-amber-200">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black">
                    <Clock className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <div className="font-extrabold text-amber-300">Driver Arrived at Pickup Gate</div>
                    <p className="text-[11px] text-amber-200/90 mt-0.5">
                      Wadaage Share Policy: Driver will wait max <b>3 minutes</b> to keep co-passengers on schedule.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-amber-500/40 text-center font-mono font-black text-amber-400 text-sm shrink-0">
                  {waitMins}:{waitRemainingSecs < 10 ? `0${waitRemainingSecs}` : waitRemainingSecs}
                </div>
              </div>
            )}

            {/* Wadaage Share Co-Passenger Banner & Geo Sequence Manifest if active */}
            {currentRide.isShared && (
              <div className="space-y-2">
                {currentRide.coPassenger ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-emerald-500 text-slate-950">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                            Wadaage Share Co-Passenger Matched!
                          </span>
                          <span className="bg-emerald-500 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                            Saved 30%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          Co-rider <b>{currentRide.coPassenger?.name || 'Co-Passenger'}</b> joining route near{' '}
                          {currentRide.coPassenger?.pickupLocation?.name || 'En route stop'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                          Wadaage Share Active
                        </span>
                        <span className="bg-emerald-500 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                          30% Off
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Looking for real co-riders heading the same direction along your route. Direct trip continues smoothly.
                      </p>
                    </div>
                  </div>
                )}

                {/* Route Itinerary Stops for Shared Ride */}
                {currentRide.optimalWaypointsSequence && currentRide.optimalWaypointsSequence.length > 2 && (
                  <div className="bg-slate-900 text-white p-3 rounded-2xl border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">
                      <span>Jidka Safarka (Route Itinerary)</span>
                      <span className="text-blue-400 font-mono">Toos ah</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                      {currentRide.optimalWaypointsSequence.map((wp, idx) => (
                        <div
                          key={wp.id || idx}
                          className={`p-2 rounded-xl border ${
                            wp.status === 'completed'
                              ? 'bg-slate-800/60 border-slate-700 opacity-60'
                              : 'bg-slate-800 border-blue-500/40 ring-1 ring-blue-500/20'
                          }`}
                        >
                          <span className={`text-[9px] font-bold block ${wp.type === 'PICKUP' ? 'text-emerald-400' : 'text-blue-400'}`}>
                            ISTOOBKA {idx + 1} ({wp.type === 'PICKUP' ? 'Qaadasho' : 'Dejin'}) {wp.status === 'completed' ? '✓' : ''}
                          </span>
                          <span className="text-white font-semibold truncate block">
                            {wp.passengerName}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {wp.location?.name || 'Waypoint'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Turn-by-Turn Guidance, Hargeisa Road Corridor & ETA */}
            <div className="bg-slate-900 text-white p-3.5 rounded-xl flex flex-col space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                  <div>
                    <div className="font-bold">
                      {currentRide.status === 'accepted' && 'Driver heading to Pickup on Hargeisa roads (ETA ~3 mins)'}
                      {currentRide.status === 'driver_arrived' && 'Driver waiting at pickup gate'}
                      {currentRide.status === 'in_progress' && `En route to ${currentRide.dropoff?.name || 'Destination'}`}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Safety PIN: <span className="font-mono text-emerald-400 font-bold">{currentRide.otpCode || '4912'}</span> (Share with driver before starting)
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-emerald-400 font-mono">
                    {currentRide.distanceKm} km
                  </span>
                </div>
              </div>

              {currentRide.roadSummary && (
                <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <span>🛣️ Route:</span>
                    <span className="text-slate-200 font-semibold">{currentRide.roadSummary}</span>
                  </span>
                  <span className="text-emerald-400 text-[10px] font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    Real Road Nav
                  </span>
                </div>
              )}
            </div>

            {/* Utility Bar: Share Trip, SOS & Cancel */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setShowShareModal(true)}
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-500 flex items-center space-x-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Live Tracking</span>
              </button>

              <button
                onClick={onOpenSafetyModal}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center space-x-1.5 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Safety Toolkit</span>
              </button>

              {currentRide.status !== 'in_progress' && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900"
                >
                  Cancel Ride
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Cancel Trip Request</span>
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Please select reason for cancellation:
              </label>
              {[
                'Driver taking too long',
                'Driver asked for extra cash',
                'Wrong pickup / dropoff address',
                'Driver not moving',
                'Changed my mind / plans changed',
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setCancelReason(reason)}
                  className={`w-full text-left p-2.5 rounded-xl border font-semibold transition ${
                    cancelReason === reason
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
              >
                Keep Trip
              </button>
              <button
                onClick={() => {
                  cancelRide();
                  setShowCancelModal(false);
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs uppercase"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app Chat Modal */}
      {showChat && <ChatModal onClose={() => setShowChat(false)} />}
      {showCall && <CallDriverModal onClose={() => setShowCall(false)} />}
      {showShareModal && <ShareTripModal onClose={() => setShowShareModal(false)} />}
      {showBeaconModal && currentRide.beaconColor && (
        <ColorBeaconModal
          isOpen={showBeaconModal}
          beaconColor={currentRide.beaconColor}
          passengerName={currentRide.passengerName}
          onClose={() => setShowBeaconModal(false)}
        />
      )}
    </>
  );
};
