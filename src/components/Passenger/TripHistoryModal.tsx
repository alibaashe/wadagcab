import { Calendar, Car, Download, FileText, MapPin, Receipt, Star, Search, X } from 'lucide-react';
import React, { useState } from 'react';
import { useRide } from '../../context/RideContext';
import { formatCurrency } from '../../utils/geo';

interface PastTrip {
  id: string;
  date: string;
  categoryName: string;
  driverName: string;
  driverAvatar: string;
  vehiclePlate: string;
  pickup: string;
  dropoff: string;
  totalFare: number;
  baseFare: number;
  distanceKm: number;
  durationMins: number;
  discount: number;
  paymentMethod: 'wallet' | 'card' | 'cash';
  status: 'completed' | 'cancelled';
  rating?: number;
}

const LIVE_PAST_TRIPS: PastTrip[] = [
  {
    id: 'ride_901',
    date: '2026-08-20 • 18:30',
    categoryName: 'Wadaage Taxi / Gaadhi Gaar Ah',
    driverName: 'Maxamed Cumar',
    driverAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    vehiclePlate: 'SL-2044',
    pickup: 'Hargeisa Egal International Airport',
    dropoff: 'Jigjiga Yar (Central)',
    totalFare: 5.50,
    baseFare: 1.50,
    distanceKm: 8.2,
    durationMins: 16,
    discount: 0.50,
    paymentMethod: 'wallet',
    status: 'completed',
    rating: 5,
  },
  {
    id: 'ride_902',
    date: '2026-08-19 • 09:15',
    categoryName: 'Wadaage Share (Gaadhi Wadaag)',
    driverName: 'Mustafe Cabdi',
    driverAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    vehiclePlate: 'SL-8821',
    pickup: 'University of Hargeisa Campus',
    dropoff: '26 June Square & Downtown Market',
    totalFare: 1.80,
    baseFare: 0.80,
    distanceKm: 4.5,
    durationMins: 11,
    discount: 0.20,
    paymentMethod: 'card',
    status: 'completed',
    rating: 5,
  },
  {
    id: 'ride_903',
    date: '2026-08-18 • 14:00',
    categoryName: 'Standard City Taxi',
    driverName: 'Cali Xasan',
    driverAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    vehiclePlate: 'SL-1029',
    pickup: 'Hargeisa Group Hospital',
    dropoff: 'Bada Cas Residential Zone',
    totalFare: 3.20,
    baseFare: 1.20,
    distanceKm: 5.0,
    durationMins: 12,
    discount: 0,
    paymentMethod: 'cash',
    status: 'completed',
    rating: 5,
  },
];

interface TripHistoryModalProps {
  onClose: () => void;
}

export const TripHistoryModal: React.FC<TripHistoryModalProps> = ({ onClose }) => {
  const { currentRide, role } = useRide();
  const [selectedTrip, setSelectedTrip] = useState<PastTrip | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  const allTrips: PastTrip[] = [...LIVE_PAST_TRIPS];
  if (currentRide && currentRide.status === 'completed') {
    allTrips.unshift({
      id: currentRide.id,
      date: 'Just Now',
      categoryName: currentRide.categoryName || 'Wadaage Taxi',
      driverName: currentRide.driverName || 'Verified Driver',
      driverAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      vehiclePlate: currentRide.driverVehiclePlate || 'SL-101',
      pickup: currentRide.pickup.address,
      dropoff: currentRide.dropoff.address,
      totalFare: currentRide.fare,
      baseFare: 1.50,
      distanceKm: currentRide.distanceKm,
      durationMins: Math.round(currentRide.durationMins),
      discount: 0,
      paymentMethod: (currentRide.paymentMethod as any) || 'wallet',
      status: 'completed',
      rating: 5,
    });
  }

  const filteredTrips = allTrips.filter((t) => filter === 'all' || t.status === filter);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full text-white shadow-2xl relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Trip History & e-Invoices</h3>
              <p className="text-xs text-slate-400">Past rides, official payment receipts & tax summaries</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          {(['all', 'completed', 'cancelled'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                filter === cat
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Trips List */}
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {filteredTrips.map((trip) => (
            <div
              key={trip.id}
              className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-600 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm text-white">{trip.categoryName}</span>
                  <span className="text-[10px] bg-slate-700 text-slate-300 font-bold px-2 py-0.5 rounded-md">
                    {trip.date}
                  </span>
                </div>
                <div className="text-slate-400 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{trip.pickup} ➔ {trip.dropoff}</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-400 text-[11px] pt-1">
                  <span>Driver: <b>{trip.driverName}</b></span>
                  <span>Plate: <b className="text-emerald-400 font-mono">{trip.vehiclePlate}</b></span>
                  {trip.rating && <span className="text-amber-400 font-bold">★ {trip.rating}</span>}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-700">
                <div className="text-base font-black text-emerald-400">{formatCurrency(trip.totalFare)}</div>
                <button
                  onClick={() => setSelectedTrip(trip)}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 transition-colors mt-1"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View Invoice</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Itemized Invoice Drawer Overlay */}
        {selectedTrip && (
          <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-black text-sm text-white">Tax Invoice #{selectedTrip.id}</h4>
                </div>
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Base Fare ({selectedTrip.categoryName})</span>
                  <span>{formatCurrency(selectedTrip.baseFare)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Distance Fare ({selectedTrip.distanceKm} km)</span>
                  <span>{formatCurrency(selectedTrip.distanceKm * 1.25)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Time Fare ({selectedTrip.durationMins} mins)</span>
                  <span>{formatCurrency(selectedTrip.durationMins * 0.35)}</span>
                </div>
                {selectedTrip.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Promo Discount</span>
                    <span>-{formatCurrency(selectedTrip.discount)}</span>
                  </div>
                )}
                <div className="border-t border-slate-800 pt-2 flex justify-between font-extrabold text-sm text-white">
                  <span>Total Paid ({(selectedTrip.paymentMethod || 'cash').toUpperCase()})</span>
                  <span className="text-emerald-400">{formatCurrency(selectedTrip.totalFare)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  alert(`Downloading e-Invoice PDF for trip ${selectedTrip.id}...`);
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Printable Receipt (PDF)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
