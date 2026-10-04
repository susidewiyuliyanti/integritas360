import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Building2,
  Coins,
  Edit,
  Trash2,
  ExternalLink,
  Award
} from 'lucide-react';
import { WhistleblowingReport } from '../../types';

interface AdminReportsManagerProps {
  reports: WhistleblowingReport[];
  onOpenEditReportModal: (report: WhistleblowingReport) => void;
  onDeleteReport: (report: WhistleblowingReport) => void;
}

export const AdminReportsManager: React.FC<AdminReportsManagerProps> = ({
  reports,
  onOpenEditReportModal,
  onDeleteReport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredReports = reports.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterType !== 'all' && r.tipePelanggaran !== filterType) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.judul?.toLowerCase().includes(term) ||
      r.tokenAkses?.toLowerCase().includes(term) ||
      r.companyName?.toLowerCase().includes(term) ||
      r.kategori?.toLowerCase().includes(term) ||
      r.targetAuditorName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Berkas Laporan</div>
          <div className="text-2xl font-black font-mono text-white mt-1">{reports.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="text-xs text-blue-400 font-semibold uppercase flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Laporan Baru
          </div>
          <div className="text-2xl font-black font-mono text-blue-400 mt-1">
            {reports.filter((r) => r.status === 'baru').length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="text-xs text-amber-400 font-semibold uppercase flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> Dalam Investigasi
          </div>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">
            {reports.filter((r) => r.status === 'proses').length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="text-xs text-emerald-400 font-semibold uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Kasus Selesai
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {reports.filter((r) => r.status === 'selesai').length}
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-950/40">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              Kelola Semua Data Laporan Whistleblowing
            </h2>
            <p className="text-xs text-slate-400">
              Admin berwenang meninjau, mengubah status, mengoreksi reward, dan menghapus laporan palsu/spam
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['all', 'baru', 'proses', 'selesai', 'ditolak'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer ${
                    filterStatus === st
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'all' ? 'Semua' : st}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari token, judul, PT, auditor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <FileText className="w-12 h-12 mx-auto text-slate-700" />
            <p className="text-sm font-medium">Tidak ada laporan yang sesuai dengan filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Tiket & Judul</th>
                  <th className="px-4 py-3.5">Target Perusahaan</th>
                  <th className="px-4 py-3.5">Tipe & Kategori</th>
                  <th className="px-4 py-3.5">Alokasi Reward</th>
                  <th className="px-4 py-3.5">Auditor</th>
                  <th className="px-4 py-3.5">Status Laporan</th>
                  <th className="px-5 py-3.5 text-right">Aksi Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredReports.map((report) => {
                  const rewardVal = report.rewardAmount || report.rewardMinAmount || 0;

                  return (
                    <tr key={report.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 max-w-xs">
                        <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-bold inline-block mb-1">
                          #{report.tokenAkses}
                        </span>
                        <div className="font-bold text-white text-sm line-clamp-1">{report.judul}</div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{report.deskripsi}</p>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-semibold text-white">{report.companyName}</div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md inline-block ${
                            report.tipePelanggaran === 'finansial'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          }`}
                        >
                          {report.tipePelanggaran === 'finansial' ? 'Finansial / Korupsi' : 'Etik / Disiplin'}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1 font-medium">{report.kategori}</div>
                        {report.estimasiKerugian && report.estimasiKerugian > 0 ? (
                          <div className="text-[10px] text-red-300 font-mono">
                            Rugi: Rp {report.estimasiKerugian.toLocaleString('id-ID')}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-4">
                        {rewardVal > 0 ? (
                          <span className="font-mono font-bold text-amber-400 text-xs bg-amber-950/40 border border-amber-800/40 px-2 py-1 rounded-lg inline-block">
                            Rp {rewardVal.toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Belum diatur</span>
                        )}
                        {report.rewardClaimStatus === 'selesai' && (
                          <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                            ✓ Sudah Dicairkan
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-xs text-slate-300">
                          {report.targetAuditorName || report.auditorName || (
                            <span className="text-slate-500 italic">Belum dipilih</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                            report.status === 'selesai'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : report.status === 'proses'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : report.status === 'ditolak'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {report.status === 'selesai'
                            ? 'Selesai'
                            : report.status === 'proses'
                            ? 'Investigasi'
                            : report.status === 'ditolak'
                            ? 'Ditolak'
                            : 'Laporan Baru'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit / Kelola Laporan */}
                          <button
                            title="Edit / Ubah Status & Reward Laporan"
                            onClick={() => onOpenEditReportModal(report)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Kelola
                          </button>

                          {/* Hapus Laporan */}
                          <button
                            title="Hapus Laporan Palsu / Spam"
                            onClick={() => onDeleteReport(report)}
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
    </div>
  );
};
