import React, { useState } from 'react';
import {
  Building2,
  Search,
  Lock,
  Unlock,
  PlusCircle,
  Download,
  Edit,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Coins,
  AlertCircle,
  Eye,
  Sliders,
  CheckCircle2,
  Clock,
  Phone,
  Filter
} from 'lucide-react';
import { UserProfile } from '../../types';

interface AdminPerusahaanTableProps {
  perusahaanList: UserProfile[];
  onAddPerusahaan: () => void;
  onOpenDetailModal: (pt: UserProfile) => void;
  onOpenLockModal: (pt: UserProfile, action: 'lock' | 'unlock') => void;
  onOpenEditSaldoModal: (pt: UserProfile) => void;
  onOpenEditProfileModal: (pt: UserProfile) => void;
  onOpenPosterModal: (pt: UserProfile) => void;
  onDeleteUser: (pt: UserProfile) => void;
}

export const AdminPerusahaanTable: React.FC<AdminPerusahaanTableProps> = ({
  perusahaanList,
  onAddPerusahaan,
  onOpenDetailModal,
  onOpenLockModal,
  onOpenEditSaldoModal,
  onOpenEditProfileModal,
  onOpenPosterModal,
  onDeleteUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLockStatus, setFilterLockStatus] = useState<'semua' | 'terkunci' | 'terbuka'>('semua');
  const [filterDocStatus, setFilterDocStatus] = useState<'semua' | 'terverifikasi' | 'pending' | 'belum_upload'>('semua');

  const filteredList = perusahaanList.filter((pt) => {
    const isLocked = Boolean(pt.isLocked || (Number(pt.danaTerkunci || 0) > 0 && !pt.danaTersedia));

    if (filterLockStatus === 'terkunci' && !isLocked) return false;
    if (filterLockStatus === 'terbuka' && isLocked) return false;

    if (filterDocStatus !== 'semua') {
      const docStatus = pt.statusVerifikasiDokumen || 'belum_upload';
      if (docStatus !== filterDocStatus) return false;
    }

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      pt.namaPT?.toLowerCase().includes(term) ||
      pt.email?.toLowerCase().includes(term) ||
      pt.sektor?.toLowerCase().includes(term) ||
      pt.picName?.toLowerCase().includes(term) ||
      pt.npwp?.toLowerCase().includes(term) ||
      pt.telepon?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4">
      {/* Header & Actions */}
      <div className="p-5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-950/40">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Kelola & Tambah Perusahaan
                <span className="text-xs font-mono font-normal text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {perusahaanList.length} PT Terdaftar
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pusat administrasi entitas: pendaftaran perusahaan baru, audit saldo lock/terbuka, dan legalitas.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Add Perusahaan */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onAddPerusahaan}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Tambah Perusahaan</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-5 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Status Lock */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterLockStatus('semua')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                filterLockStatus === 'semua'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Saldo
            </button>
            <button
              onClick={() => setFilterLockStatus('terbuka')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                filterLockStatus === 'terbuka'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <Unlock className="w-3 h-3" /> Terbuka
            </button>
            <button
              onClick={() => setFilterLockStatus('terkunci')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                filterLockStatus === 'terkunci'
                  ? 'bg-red-500 text-white font-bold'
                  : 'text-red-400 hover:text-red-300'
              }`}
            >
              <Lock className="w-3 h-3" /> Terkunci
            </button>
          </div>

          {/* Filter Status Dokumen */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterDocStatus('semua')}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                filterDocStatus === 'semua'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Legalitas
            </button>
            <button
              onClick={() => setFilterDocStatus('terverifikasi')}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                filterDocStatus === 'terverifikasi'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Terverifikasi
            </button>
            <button
              onClick={() => setFilterDocStatus('pending')}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                filterDocStatus === 'pending'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              Review
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari PT, email, PIC, sektor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {filteredList.length === 0 ? (
        <div className="py-16 text-center text-slate-500 space-y-3">
          <Building2 className="w-12 h-12 mx-auto text-slate-700" />
          <p className="text-sm font-medium">Tidak ada data perusahaan yang sesuai dengan kriteria filter.</p>
          <button
            onClick={onAddPerusahaan}
            className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-amber-500/30 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Daftarkan Perusahaan Sekarang
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Perusahaan & Kontak</th>
                <th className="px-4 py-3.5">Status Saldo</th>
                <th className="px-4 py-3.5">Saldo Bebas (Liquid)</th>
                <th className="px-4 py-3.5">Saldo Terkunci (Escrow)</th>
                <th className="px-4 py-3.5">Legalitas</th>
                <th className="px-5 py-3.5 text-right">Kelola & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.map((pt) => {
                const isLocked = Boolean(pt.isLocked || (Number(pt.danaTerkunci || 0) > 0 && !pt.danaTersedia));
                const danaTerbuka = Number(pt.danaTersedia || 0);
                const danaTerkunci = Number(pt.danaTerkunci || 0);

                // Monogram avatar
                const initials = (pt.namaPT || 'PT')
                  .replace(/PT|CV|\./gi, '')
                  .trim()
                  .slice(0, 2)
                  .toUpperCase() || 'PT';

                return (
                  <tr key={pt.uid} className="hover:bg-slate-800/40 transition-colors">
                    {/* Perusahaan info */}
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-bold text-amber-400 shrink-0 text-xs shadow-sm">
                          {initials}
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-bold text-white text-sm hover:text-amber-400 transition-colors flex flex-wrap items-center gap-1.5 cursor-pointer" onClick={() => onOpenDetailModal(pt)}>
                            <span>{pt.namaPT}</span>
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-amber-500/30 text-amber-400">
                              {pt.company_id || pt.uid}
                            </span>
                            {pt.company_code && (
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
                                {pt.company_code}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{pt.email}</div>
                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-amber-400 font-medium">{pt.sektor || 'Manufaktur'}</span>
                            {pt.picName && <span>• PIC: {pt.picName}</span>}
                            {pt.telepon && <span>• {pt.telepon}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status Lock/Terbuka */}
                    <td className="px-4 py-4">
                      {isLocked ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-500/15 border border-red-500/40 text-red-400 text-[11px] font-bold font-mono">
                            <Lock className="w-3 h-3 text-red-400" />
                            TERKUNCI
                          </span>
                          {pt.lockReason && (
                            <p className="text-[10px] text-red-300/80 italic max-w-xs truncate" title={pt.lockReason}>
                              {pt.lockReason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold font-mono">
                          <Unlock className="w-3 h-3 text-emerald-400" />
                          TERBUKA
                        </span>
                      )}
                    </td>

                    {/* Saldo Terbuka */}
                    <td className="px-4 py-4">
                      <span className="font-mono font-bold text-emerald-400 text-sm bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg inline-block">
                        Rp {danaTerbuka.toLocaleString('id-ID')}
                      </span>
                    </td>

                    {/* Saldo Terkunci */}
                    <td className="px-4 py-4">
                      <span className="font-mono font-bold text-red-400 text-sm bg-red-950/40 border border-red-800/40 px-2.5 py-1 rounded-lg inline-block">
                        Rp {danaTerkunci.toLocaleString('id-ID')}
                      </span>
                    </td>

                    {/* Status Dokumen */}
                    <td className="px-4 py-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${
                          pt.statusVerifikasiDokumen === 'terverifikasi'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : pt.statusVerifikasiDokumen === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : pt.statusVerifikasiDokumen === 'ditolak'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {pt.statusVerifikasiDokumen === 'terverifikasi' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Terverifikasi
                          </>
                        ) : pt.statusVerifikasiDokumen === 'pending' ? (
                          <>
                            <Clock className="w-3 h-3" /> Review
                          </>
                        ) : pt.statusVerifikasiDokumen === 'ditolak' ? (
                          'Ditolak'
                        ) : (
                          'Belum Upload'
                        )}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Tombol KELOLA LENGKAP */}
                        <button
                          title="Kelola & Detail Perusahaan"
                          onClick={() => onOpenDetailModal(pt)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/40 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5 text-blue-400" />
                          Kelola
                        </button>

                        {/* Lock / Unlock Toggle Button */}
                        {isLocked ? (
                          <button
                            title="Buka Kunci Saldo (Unlock)"
                            onClick={() => onOpenLockModal(pt, 'unlock')}
                            className="px-2 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            title="Kunci Saldo (Lock)"
                            onClick={() => onOpenLockModal(pt, 'lock')}
                            className="px-2 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Atur Saldo */}
                        <button
                          title="Tambah atau Edit Saldo"
                          onClick={() => onOpenEditSaldoModal(pt)}
                          className="px-2 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Coins className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Profil */}
                        <button
                          title="Edit Data Perusahaan"
                          onClick={() => onOpenEditProfileModal(pt)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Poster */}
                        <button
                          title="Download Poster QR Whistleblowing"
                          onClick={() => onOpenPosterModal(pt)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          title="Hapus Entitas Perusahaan"
                          onClick={() => onDeleteUser(pt)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

