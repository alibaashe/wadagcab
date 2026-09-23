import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  DollarSign,
  Wallet,
  Phone,
  FileText,
  Search,
  Check,
  Edit3,
  Copy,
  PlusCircle,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  User,
  Car,
  Layers
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { DriverWalletTransaction } from '../../types';
import { EXCHANGE_RATE_USD_TO_SLSH } from '../../utils/geo';
import { WadaageLogo } from '../Common/WadaageLogo';

export const WadaageAdminWalletControl: React.FC = () => {
  const {
    driverWalletTransactions,
    verifyAndApproveDriverTopUp,
    rejectDriverPendingTransaction,
    adminDirectCreditDriverWallet,
    adminCreditUserWallet,
    drivers,
    driverWallets,
    getDriverWalletBalance,
    getUserWalletBalance,
  } = useRide();

  const [activeTab, setActiveTab] = useState<'pending' | 'credit' | 'ledger'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');

  // Editable real amounts per pending transaction ID
  const [editedAmounts, setEditedAmounts] = useState<{ [txId: string]: number }>({});
  const [adminNotes, setAdminNotes] = useState<{ [txId: string]: string }>({});

  // Direct Admin Credit Form State
  const [targetType, setTargetType] = useState<'driver' | 'passenger'>('driver');
  const [targetDriverId, setTargetDriverId] = useState<string>(drivers[0]?.id || 'drv_01');
  const [targetUserId, setTargetUserId] = useState<string>('usr_admin_baashe');
  const [directAmountSos, setDirectAmountSos] = useState<number>(10000);
  const [directAmountUsd, setDirectAmountUsd] = useState<number>(1.00);
  const [directNote, setDirectNote] = useState<string>('Direct Admin Wallet Credit');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const pendingTxs = driverWalletTransactions.filter((tx) => tx.status === 'pending_verification');
  const completedTxs = driverWalletTransactions.filter((tx) => tx.status === 'completed');
  const rejectedTxs = driverWalletTransactions.filter((tx) => tx.status === 'rejected');

  const filteredTxs = driverWalletTransactions.filter((tx) => {
    const matchesSearch =
      (tx.driverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.driverPhone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.referenceId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.id || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'pending') return matchesSearch && tx.status === 'pending_verification';
    if (filterStatus === 'completed') return matchesSearch && tx.status === 'completed';
    if (filterStatus === 'rejected') return matchesSearch && tx.status === 'rejected';
    return matchesSearch;
  });

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const [processingTxIds, setProcessingTxIds] = useState<Record<string, boolean>>({});

  const handleVerify = (tx: DriverWalletTransaction) => {
    const curStatus = String(tx.status || '').toLowerCase();
    if (processingTxIds[tx.id] || curStatus === 'completed' || curStatus === 'verified') return;
    setProcessingTxIds((p) => ({ ...p, [tx.id]: true }));
    try {
      const realAmountSos = editedAmounts[tx.id] !== undefined ? editedAmounts[tx.id] : tx.amountSos;
      const note = adminNotes[tx.id] || `Verified by Admin. Amount credited: ${realAmountSos.toLocaleString()} SLSH`;
      verifyAndApproveDriverTopUp(tx.id, realAmountSos, note);
    } catch (e) {
      console.error('Error verifying top-up:', e);
    } finally {
      setTimeout(() => {
        setProcessingTxIds((p) => ({ ...p, [tx.id]: false }));
      }, 1000);
    }
  };

  const handleReject = (tx: DriverWalletTransaction) => {
    const curStatus = String(tx.status || '').toLowerCase();
    if (processingTxIds[tx.id] || curStatus === 'rejected') return;
    setProcessingTxIds((p) => ({ ...p, [tx.id]: true }));
    try {
      const note = adminNotes[tx.id] || 'Rejected by Admin. Invalid payment receipt or reference.';
      rejectDriverPendingTransaction(tx.id, note);
    } catch (e) {
      console.error('Error rejecting top-up:', e);
    } finally {
      setTimeout(() => {
        setProcessingTxIds((p) => ({ ...p, [tx.id]: false }));
      }, 1000);
    }
  };

  const handleDirectCreditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetType === 'driver') {
      if (directAmountSos <= 0) return;
      adminDirectCreditDriverWallet(targetDriverId, directAmountSos, directNote);
    } else {
      if (directAmountUsd <= 0) return;
      adminCreditUserWallet(targetUserId, directAmountUsd, directNote);
    }
    setDirectAmountSos(10000);
    setDirectAmountUsd(1.00);
    setDirectNote('Direct Admin Wallet Credit');
    setActiveTab('ledger');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-5 text-slate-900 dark:text-white font-sans">

      {/* 1. BRANDED HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center font-bold shadow-sm">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <WadaageLogo variant="wordmark" size="xs" appType="admin" />
              <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                Admin Control
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify ZAAD / eDahab / EVC receipts, direct credit driver & passenger wallets, manage commission balances
            </p>
          </div>
        </div>

        {/* Header Action Tabs */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Receipts ({pendingTxs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('credit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'credit'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Direct Credit</span>
          </button>
        </div>
      </div>

      {/* 2. KPI METRICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/50">
          <span className="text-slate-500 dark:text-amber-300 block text-[10px] font-bold uppercase">Pending Receipts</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingTxs.length}</span>
        </div>

        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
          <span className="text-slate-500 dark:text-emerald-300 block text-[10px] font-bold uppercase">Verified Approvals</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedTxs.length}</span>
        </div>

        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-800/50">
          <span className="text-slate-500 dark:text-rose-300 block text-[10px] font-bold uppercase">Rejected Invalid</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{rejectedTxs.length}</span>
        </div>

        <div className="p-3 bg-[#002418] rounded-2xl border border-[#00E575]/30">
          <span className="text-emerald-400 block text-[10px] font-extrabold uppercase tracking-wider">Total Live System Float</span>
          <span className="text-2xl font-black text-white font-mono">
            {Math.round(
              drivers.reduce((sum, drv) => {
                const balUsd = getDriverWalletBalance(drv.id) || (drv.phone ? getDriverWalletBalance(drv.phone) : 0);
                return sum + balUsd;
              }, 0) * 10000
            ).toLocaleString()} SLSH
          </span>
        </div>
      </div>

      {/* 3. TAB 1: PENDING RECEIPTS VERIFICATION QUEUE */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Pending Gateway Payment Receipts ({pendingTxs.length})</span>
            </h4>
            <span className="text-[11px] text-slate-500">
              Check ZAAD / eDahab / EVC portal, adjust amount, verify and activate wallet
            </span>
          </div>

          {pendingTxs.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-extrabold text-slate-700 dark:text-slate-300">All Driver Receipts Verified!</p>
              <p className="text-[11px] text-slate-400 mt-0.5">No pending top-up verification requests at this moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {pendingTxs.map((tx) => {
                const currentEditedSos = editedAmounts[tx.id] !== undefined ? editedAmounts[tx.id] : tx.amountSos;
                const isAmountChanged = currentEditedSos !== (tx.originalRequestedAmountSos || tx.amountSos);

                return (
                  <div
                    key={tx.id}
                    className="p-4 bg-amber-50/60 dark:bg-slate-800/90 border-2 border-amber-300 dark:border-amber-500/50 rounded-2xl space-y-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-amber-200 dark:border-slate-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm">
                          {tx.driverName ? tx.driverName.charAt(0) : 'D'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {tx.driverName || 'Captain / Driver'}
                            </span>
                            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full uppercase">
                              PENDING
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center space-x-2 font-mono">
                            <span>Phone: {tx.driverPhone || 'N/A'}</span>
                            <span>•</span>
                            <span>Gateway: {tx.paymentProvider?.toUpperCase() || 'ZAAD'}</span>
                            <span>•</span>
                            <span>{tx.date}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Ref Code:</span>
                        <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                          {tx.referenceId || tx.id}
                        </span>
                        <button
                          onClick={() => handleCopyRef(tx.referenceId || tx.id)}
                          className="p-1 text-slate-400 hover:text-emerald-500 cursor-pointer"
                        >
                          {copiedRef === (tx.referenceId || tx.id) ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {tx.smsReceiptText && (
                      <div className="p-2.5 bg-slate-950 text-emerald-300 font-mono text-xs rounded-xl border border-slate-800 flex items-start space-x-2">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block font-sans">Driver Payment Gateway SMS / Note:</span>
                          <span>{tx.smsReceiptText}</span>
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-500/40 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Requested Top-Up:</span>
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                          {(tx.originalRequestedAmountSos || tx.amountSos).toLocaleString()} SLSH
                        </span>
                        <span className="text-xs text-slate-500 font-mono block">
                          (${((tx.originalRequestedAmountSos || tx.amountSos) / 10000).toFixed(2)} USD)
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold text-amber-700 dark:text-amber-400 mb-1 flex items-center space-x-1">
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Admin Verified Amount (SLSH):</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={currentEditedSos}
                            onChange={(e) =>
                              setEditedAmounts({
                                ...editedAmounts,
                                [tx.id]: Number(e.target.value),
                              })
                            }
                            step={500}
                            min={500}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-amber-400 rounded-xl py-1.5 pl-3 pr-20 font-mono font-black text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                          />
                          <span className="absolute right-3 top-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                            ${(currentEditedSos / 10000).toFixed(2)} USD
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Admin Verification Note:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Verified on ZAAD portal"
                          value={adminNotes[tx.id] || ''}
                          onChange={(e) => setAdminNotes({ ...adminNotes, [tx.id]: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => handleReject(tx)}
                        disabled={processingTxIds[tx.id] || tx.status === 'rejected' || tx.status === 'completed'}
                        className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl text-xs uppercase shadow flex items-center space-x-1 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{processingTxIds[tx.id] ? 'PROCESSING...' : 'REJECT'}</span>
                      </button>

                      <button
                        onClick={() => handleVerify(tx)}
                        disabled={processingTxIds[tx.id] || (tx.status as string) === 'completed' || (tx.status as string) === 'verified'}
                        className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase shadow-lg flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{processingTxIds[tx.id] ? 'VERIFYING & CREDITING...' : `VERIFY & CREDIT (${currentEditedSos.toLocaleString()} SLSH)`}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: DIRECT ADMIN CREDIT FORM */}
      {activeTab === 'credit' && (
        <form onSubmit={handleDirectCreditSubmit} className="p-5 bg-slate-950 border border-emerald-500/40 rounded-2xl text-white space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-extrabold text-emerald-400 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5" />
              <span>Direct Admin Wallet Credit (Manual Top-Up / Adjustment)</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Target Account Type:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('driver')}
                  className={`py-2 px-3 rounded-xl font-black transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    targetType === 'driver'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'bg-slate-900 border border-slate-700 text-slate-400'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span>Driver Wallet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('passenger')}
                  className={`py-2 px-3 rounded-xl font-black transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    targetType === 'passenger'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'bg-slate-900 border border-slate-700 text-slate-400'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Passenger Wallet</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Select Account:</label>
              {targetType === 'driver' ? (
                <select
                  value={targetDriverId}
                  onChange={(e) => setTargetDriverId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white font-bold outline-none focus:border-emerald-500 text-xs"
                >
                  {drivers.map((drv) => {
                    const b = getDriverWalletBalance(drv.id) || (drv.phone ? getDriverWalletBalance(drv.phone) : 0);
                    return (
                      <option key={drv.id} value={drv.id}>
                        {drv.name} ({drv.phone}) — Balance: ${b.toFixed(2)} ({(b * 10000).toLocaleString()} SLSH)
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter Passenger ID or Phone Number"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white font-bold outline-none focus:border-emerald-500 text-xs"
                />
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Credit Amount ({targetType === 'driver' ? 'SLSH' : 'USD'}):
              </label>
              {targetType === 'driver' ? (
                <div className="relative">
                  <input
                    type="number"
                    value={directAmountSos}
                    onChange={(e) => setDirectAmountSos(Number(e.target.value))}
                    step={500}
                    min={1000}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-3 pr-20 text-white font-mono font-bold outline-none focus:border-emerald-500 text-xs"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-emerald-400 font-bold font-mono">
                    ${(directAmountSos / 10000).toFixed(2)} USD
                  </span>
                </div>
              ) : (
                <input
                  type="number"
                  value={directAmountUsd}
                  onChange={(e) => setDirectAmountUsd(Number(e.target.value))}
                  step={0.50}
                  min={0.10}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white font-mono font-bold outline-none focus:border-emerald-500 text-xs"
                />
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Admin Verification Note / Reason:</label>
              <input
                type="text"
                value={directNote}
                onChange={(e) => setDirectNote(e.target.value)}
                placeholder="e.g. Cash top-up at office or manual adjustment"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white font-semibold outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase shadow-lg transition cursor-pointer"
            >
              Verify & Credit {targetType === 'driver' ? `${directAmountSos.toLocaleString()} SLSH ($${(directAmountSos / 10000).toFixed(2)})` : `$${directAmountUsd.toFixed(2)} USD`}
            </button>
          </div>
        </form>
      )}

      {/* 5. TAB 3 & LEDGER: FULL TRANSACTION AUDIT TABLE */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Driver Name, Phone, or Transaction Ref Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {(['all', 'pending', 'completed', 'rejected'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  filterStatus === st
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-extrabold uppercase text-[10px]">
                <th className="py-2.5 px-3">Date & Ref ID</th>
                <th className="py-2.5 px-3">Driver Name & Phone</th>
                <th className="py-2.5 px-3">Payment Provider</th>
                <th className="py-2.5 px-3 text-right">Amount (SLSH & USD)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3">Admin Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400 text-xs">
                    No wallet transaction records found.
                  </td>
                </tr>
              ) : (
                filteredTxs.map((tx) => {
                  const isPending = tx.status === 'pending_verification';
                  const isCompleted = tx.status === 'completed';
                  const isRejected = tx.status === 'rejected';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                          {tx.referenceId || tx.id}
                        </span>
                        <span className="text-[10px] text-slate-400">{tx.date}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {tx.driverName || 'Captain / Driver'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{tx.driverPhone || 'N/A'}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="uppercase font-bold text-xs text-amber-600 dark:text-amber-400">
                          {tx.paymentProvider || 'ZAAD'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-mono font-black block text-sm ${
                            tx.amountSos >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                          }`}
                        >
                          {tx.amountSos >= 0 ? '+' : ''}
                          {tx.amountSos.toLocaleString()} SLSH
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          (${Math.abs(tx.amountUsd).toFixed(2)} USD)
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isCompleted
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isCompleted ? 'VERIFIED' : isPending ? 'PENDING' : 'REJECTED'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {tx.adminNote || tx.title}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
