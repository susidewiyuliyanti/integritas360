import React, { useState } from 'react';
import {
  Eye,
  Search,
  PlusCircle,
  Edit,
  Trash2,
  Wallet,
  Scale,
  ShieldCheck,
  Coins
} from 'lucide-react';
import { UserProfile } from '../../types';

interface AdminAuditorTableProps {
  auditorList: UserProfile[];
  onOpenEditSaldoAuditor: (auditor: UserProfile) => void;
  onOpenEditProfileModal: (auditor: UserProfile) => void;
  onDeleteAuditor: (auditor: UserProfile) => void;
}

export const AdminAuditorTable: React.FC<AdminAuditorTableProps> = ({
  auditorList,
  onOpenEditSaldoAuditor,
  onOpenEditProfileModal,
  onDeleteAuditor
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const totalSaldoAuditor = auditorList.reduce(
    (acc, curr) => acc + Number(curr.saldo || 0),
    0
  );

  const filteredList = auditorList.filter((a) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.namaPT?.toLowerCase().includes(term) ||
      a.email?.toLowerCase().includes(term) ||
      a.sektor?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4">
      {/* Header & Search */}
      <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-950/40">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-400" />
            Manajemen Auditor & Saldo Honorarium
          </h2>
          <p className="text-xs text-slate-400">
            Total Akumulasi Saldo Auditor:{' '}
            <span className="font-mono font-bold text-blue-400">
              Rp {totalSaldoAuditor.toLocaleString('id-ID')}
            </span>{' '}
            ({auditorList.length} Auditor Terdaftar)
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama auditor, email, keahlian..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {filteredList.length === 0 ? (
        <div className="py-16 text-center text-slate-500 space-y-3">
          <Eye className="w-12 h-12 mx-auto text-slate-700" />
          <p className="text-sm font-medium">Belum ada data auditor independen.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Nama Auditor & Spesialisasi</th>
                <th className="px-4 py-3.5">Email & Kontak</th>
                <th className="px-4 py-3.5">Rekening Bank</th>
                <th className="px-4 py-3.5">Saldo Honorarium</th>
                <th className="px-4 py-3.5">Lisensi & Verifikasi</th>
                <th className="px-5 py-3.5 text-right">Aksi Administrator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.map((auditor) => {
                const saldo = Number(auditor.saldo || 0);

                return (
                  <tr key={auditor.uid} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm">{auditor.namaPT}</div>
                      <div className="text-[11px] text-blue-400 mt-0.5">{auditor.sektor || 'Investigator Independen'}</div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-xs text-slate-300 font-mono">{auditor.email}</div>
                      {auditor.telepon && (
                        <div className="text-[11px] text-slate-500">{auditor.telepon}</div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {auditor.namaBank || auditor.rekeningBank?.bankName ? (
                        <div className="text-xs">
                          <span className="text-white font-bold">
                            {auditor.namaBank || auditor.rekeningBank?.bankName}
                          </span>{' '}
                          -{' '}
                          <span className="font-mono text-slate-300">
                            {auditor.nomorRekening || auditor.rekeningBank?.accountNumber}
                          </span>
                          <div className="text-[10px] text-slate-500">
                            a.n. {auditor.pemilikRekening || auditor.rekeningBank?.holderName}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Belum diisi</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-mono font-bold text-blue-400 text-sm bg-blue-950/40 border border-blue-800/40 px-2.5 py-1 rounded-lg inline-block">
                        Rp {saldo.toLocaleString('id-ID')}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                          auditor.statusVerifikasiDokumen === 'terverifikasi'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : auditor.statusVerifikasiDokumen === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : auditor.statusVerifikasiDokumen === 'ditolak'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {auditor.statusVerifikasiDokumen === 'terverifikasi'
                          ? 'Terverifikasi'
                          : auditor.statusVerifikasiDokumen === 'pending'
                          ? 'Review'
                          : auditor.statusVerifikasiDokumen === 'ditolak'
                          ? 'Ditolak'
                          : 'Belum Upload'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Tambah / Atur Saldo Auditor */}
                        <button
                          title="Tambah Honorarium atau Edit Saldo"
                          onClick={() => onOpenEditSaldoAuditor(auditor)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          Atur Saldo
                        </button>

                        {/* Edit Data Auditor */}
                        <button
                          title="Edit Data Auditor"
                          onClick={() => onOpenEditProfileModal(auditor)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Hapus Auditor */}
                        <button
                          title="Hapus Auditor"
                          onClick={() => onDeleteAuditor(auditor)}
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
