import React from 'react';
import {
  Wallet,
  Lock,
  Unlock,
  Eye,
  Building2,
  TrendingUp,
  ShieldAlert,
  Coins,
  Scale,
  FileCheck
} from 'lucide-react';
import { UserProfile } from '../../types';

interface AdminBalanceOverviewProps {
  perusahaanList: UserProfile[];
  auditorList: UserProfile[];
  totalReportsCount: number;
}

export const AdminBalanceOverview: React.FC<AdminBalanceOverviewProps> = ({
  perusahaanList,
  auditorList,
  totalReportsCount
}) => {
  // 1. Saldo Perusahaan Terbuka (danaTersedia + saldo bebas)
  const totalDanaPerusahaanTerbuka = perusahaanList.reduce((acc, curr) => {
    return acc + Number(curr.danaTersedia || 0);
  }, 0);

  // 2. Saldo Perusahaan Terkunci (danaTerkunci)
  const totalDanaPerusahaanTerkunci = perusahaanList.reduce((acc, curr) => {
    return acc + Number(curr.danaTerkunci || 0);
  }, 0);

  // 3. Saldo Seluruh Auditor
  const totalSaldoAuditor = auditorList.reduce((acc, curr) => {
    return acc + Number(curr.saldo || 0);
  }, 0);

  // 4. Total Saldo Seluruh Platform / Ekosistem
  const grandTotalSaldo =
    totalDanaPerusahaanTerbuka + totalDanaPerusahaanTerkunci + totalSaldoAuditor;

  // Counts of Lock vs Terbuka
  const countLockedPerusahaan = perusahaanList.filter(
    (pt) => pt.isLocked || (Number(pt.danaTerkunci || 0) > 0 && !pt.danaTersedia)
  ).length;
  const countUnlockedPerusahaan = perusahaanList.length - countLockedPerusahaan;

  return (
    <div className="space-y-6">
      {/* MASTER HIGHLIGHT CARDS: SEMUA SALDO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: GRAND TOTAL SALDO SISTEM */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Coins className="w-24 h-24 text-amber-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">
              Total Saldo Seluruh Sistem
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              Rp {grandTotalSaldo.toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="text-amber-400 font-semibold">Semua Akun</span>
              (Perusahaan & Auditor)
            </p>
          </div>
        </div>

        {/* CARD 2: SALDO PERUSAHAAN TERBUKA */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Unlock className="w-24 h-24 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase flex items-center gap-1">
              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              Saldo PT (Terbuka / Likuid)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight">
              Rp {totalDanaPerusahaanTerbuka.toLocaleString('id-ID')}
            </h3>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Dana Tersedia / Bebas</span>
              <span className="font-semibold text-emerald-300">
                {countUnlockedPerusahaan} PT Terbuka
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: SALDO PERUSAHAAN TERKUNCI (LOCK) */}
        <div className="bg-slate-900/90 border border-red-500/30 rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lock className="w-24 h-24 text-red-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-red-400 uppercase flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-red-400" />
              Saldo PT (Terkunci / Lock)
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black font-mono text-red-400 tracking-tight">
              Rp {totalDanaPerusahaanTerkunci.toLocaleString('id-ID')}
            </h3>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Jaminan Kepatuhan</span>
              <span className={`font-semibold ${countLockedPerusahaan > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                {countLockedPerusahaan} PT Terkunci
              </span>
            </div>
          </div>
        </div>

        {/* CARD 4: SALDO AUDITOR INDEPENDEN */}
        <div className="bg-slate-900/90 border border-blue-500/30 rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Eye className="w-24 h-24 text-blue-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-blue-400 uppercase flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              Total Saldo Auditor
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black font-mono text-blue-400 tracking-tight">
              Rp {totalSaldoAuditor.toLocaleString('id-ID')}
            </h3>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Honorarium Investigasi</span>
              <span className="font-semibold text-blue-300">
                {auditorList.length} Auditor Aktif
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK STATUS BAR */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">Total Perusahaan:</span>
            <span className="font-bold text-white font-mono">{perusahaanList.length} PT</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400">Status Saldo Terbuka:</span>
            <span className="font-bold text-emerald-400 font-mono">{countUnlockedPerusahaan} PT</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-slate-400">Status Saldo Terkunci:</span>
            <span className="font-bold text-red-400 font-mono">{countLockedPerusahaan} PT</span>
          </div>

          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-400" />
            <span className="text-slate-400">Auditor Independen:</span>
            <span className="font-bold text-blue-400 font-mono">{auditorList.length} Tim</span>
          </div>

          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Total Laporan:</span>
            <span className="font-bold text-amber-400 font-mono">{totalReportsCount} Kasus</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Realtime Sync Firestore Active</span>
        </div>
      </div>
    </div>
  );
};
