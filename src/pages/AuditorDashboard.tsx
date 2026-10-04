import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import {
  Eye,
  ShieldCheck,
  FileSearch,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Building2,
  Award,
  Filter,
  Image as ImageIcon,
  MessageCircle,
  Coins,
  Settings,
  X,
  Loader2,
  Wallet,
  ArrowUpRight,
  UserCircle
} from 'lucide-react';
import { WhistleblowingReport } from '../types';

export const AuditorDashboard: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { navigate } = useNavigation();

  const [reports, setReports] = useState<WhistleblowingReport[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<WhistleblowingReport | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [statusInput, setStatusInput] = useState<WhistleblowingReport['status']>('proses');
  const [savingNote, setSavingNote] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Setting Biaya Jasa Per Kasus State (Minimal 100.000)
  const currentBiayaJasa = Math.max(100000, profile?.biayaJasaPerKasus || 150000);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [feeInput, setFeeInput] = useState<string>(String(currentBiayaJasa));
  const [savingFee, setSavingFee] = useState(false);
  const [feeFeedback, setFeeFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync fee input when profile changes
  useEffect(() => {
    if (profile?.biayaJasaPerKasus) {
      setFeeInput(String(profile.biayaJasaPerKasus));
    }
  }, [profile?.biayaJasaPerKasus]);

  // Route protection
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Realtime subscription to whistleblowing reports
  useEffect(() => {
    if (!user) return;

    const reportsRef = collection(db, 'reports');
    const unsub = onSnapshot(
      reportsRef,
      (snapshot) => {
        const list: WhistleblowingReport[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const targetAuditors: string[] = d.targetAuditorIds || [];
          // Filter: only show if no specific auditors assigned (broadcast) OR current auditor is targeted OR auditor already reviewed it
          const isTargeted =
            targetAuditors.length === 0 ||
            targetAuditors.includes(user.uid) ||
            d.targetAuditorId === user.uid ||
            d.auditorId === user.uid;
          if (!isTargeted) return;

          list.push({
            id: docSnap.id,
            companyId: d.companyId,
            companyName: d.companyName || 'Perusahaan Terlapor',
            judul: d.judul || 'Dugaan Pelanggaran',
            kategori: d.kategori || 'Umum',
            tipePelanggaran: d.tipePelanggaran || (d.estimasiKerugian ? 'finansial' : 'etik'),
            estimasiKerugian: d.estimasiKerugian || 0,
            rewardMinAmount: d.rewardMinAmount || 0,
            rewardAmount: d.rewardAmount,
            rewardClaimStatus: d.rewardClaimStatus,
            targetAuditorId: d.targetAuditorId,
            targetAuditorName: d.targetAuditorName,
            deskripsi: d.deskripsi || '',
            tanggalKejadian: d.tanggalKejadian,
            lokasi: d.lokasi,
            status: d.status || 'baru',
            tokenAkses: d.tokenAkses || '',
            pelaporAnonim: d.pelaporAnonim !== false,
            namaPelapor: d.namaPelapor,
            kontakPelapor: d.kontakPelapor,
            whatsappPelapor: d.whatsappPelapor,
            buktiFiles: d.buktiFiles || [],
            isContoh: Boolean(d.isContoh),
            targetAuditorIds: d.targetAuditorIds,
            targetAuditorNames: d.targetAuditorNames,
            catatanAuditor: d.catatanAuditor,
            auditorId: d.auditorId,
            auditorName: d.auditorName,
            biayaAuditor: d.biayaAuditor,
            auditorVerified: d.auditorVerified,
            companyCaseStatus: d.companyCaseStatus,
            rewardReleased: d.rewardReleased,
            createdAt: d.createdAt,
          });
        });
        setReports(list);
      },
      (error) => {
        console.error('Error in auditor reports snapshot:', error);
      }
    );

    return () => unsub();
  }, [user]);

  const filteredReports = reports.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const handleOpenReview = (report: WhistleblowingReport) => {
    setSelectedReport(report);
    setNotesInput(report.catatanAuditor || '');
    setStatusInput(report.status);
    setSuccessMsg('');
  };

  const handleSaveAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport?.id || !user) return;

    try {
      setSavingNote(true);
      const reportDoc = doc(db, 'reports', selectedReport.id);

      const isMarkedValid = statusInput === 'valid';
      const feeToAttach = isMarkedValid ? currentBiayaJasa : selectedReport.biayaAuditor || currentBiayaJasa;

      const updatePayload: any = {
        status: statusInput,
        catatanAuditor: notesInput.trim(),
        auditorId: user.uid,
        auditorName: profile?.namaPT || 'Auditor Independen',
      };

      if (isMarkedValid) {
        updatePayload.auditorVerified = true;
        updatePayload.auditorVerifiedAt = serverTimestamp();
        updatePayload.biayaAuditor = feeToAttach;
        // Wajib muncul di dashboard perusahaan untuk diklik ambil kasus
        updatePayload.companyCaseStatus = 'menunggu_ambil';
        updatePayload.rewardReleased = false;
      }

      await updateDoc(reportDoc, updatePayload);

      setSuccessMsg(
        isMarkedValid
          ? 'Kasus dinyatakan VALID! Berkas telah diteruskan ke Dashboard Perusahaan (PT) untuk diambil & ditindaklanjuti.'
          : 'Hasil telaah audit berhasil diperbarui!'
      );
      setTimeout(() => {
        setSuccessMsg('');
        setSelectedReport(null);
      }, 1600);
    } catch (err: any) {
      console.error('Error saving audit note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleSaveAuditorFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cleanFee = Number(feeInput.replace(/\D/g, '')) || 0;

    if (cleanFee < 100000) {
      setFeeFeedback({
        type: 'error',
        message: 'Biaya jasa audit per kasus minimal adalah Rp 100.000.'
      });
      return;
    }

    try {
      setSavingFee(true);
      setFeeFeedback(null);
      await updateDoc(doc(db, 'users', user.uid), {
        biayaJasaPerKasus: cleanFee
      });
      setFeeFeedback({
        type: 'success',
        message: `Tarif jasa audit per kasus berhasil disetel menjadi Rp ${cleanFee.toLocaleString('id-ID')}.`
      });
      setTimeout(() => {
        setIsFeeModalOpen(false);
        setFeeFeedback(null);
      }, 1300);
    } catch (err: any) {
      setFeeFeedback({
        type: 'error',
        message: 'Gagal memperbarui tarif jasa: ' + (err.message || 'Terjadi kesalahan')
      });
    } finally {
      setSavingFee(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Auditor Header Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Eye className="w-3.5 h-3.5" />
                Auditor
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {profile?.namaPT || 'Auditor Independen'}
                  {profile?.gelarProfesi ? `, ${profile.gelarProfesi}` : ''}
                </h1>
                {profile?.statusVerifikasiDokumen === 'terverifikasi' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold shadow-sm shadow-emerald-500/10">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Terverifikasi
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Spesialisasi: <span className="text-emerald-400 font-semibold">{profile?.spesialisasiAudit || profile?.sektor || 'Audit Kepatuhan & Investigasi'}</span>
                {profile?.nomorLisensi && (
                  <> • Izin/Lisensi: <span className="text-slate-300 font-mono font-medium">{profile.nomorLisensi}</span></>
                )} • Akun: <span className="text-slate-300 font-mono">{user?.email}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Card Saldo Honorarium Auditor (Tanpa Lock) */}
              <div className="px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-blue-500/30 text-xs text-slate-300 flex items-center gap-3 shadow-lg">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Saldo Honorarium</div>
                  <div className="text-sm font-extrabold text-white font-mono">
                    Rp {Number(profile?.saldo || 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="ml-2 px-2.5 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                  title="Tarik saldo honorarium ke rekening bank"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                  <span>Withdraw</span>
                </button>
              </div>

              {/* Card Tarif Jasa Investigasi Auditor */}
              <div className="px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 text-xs text-slate-300 flex items-center gap-3 shadow-lg">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Tarif Jasa per Kasus</div>
                  <div className="text-sm font-extrabold text-emerald-400 font-mono">
                    Rp {currentBiayaJasa.toLocaleString('id-ID')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFeeInput(String(currentBiayaJasa));
                    setFeeFeedback(null);
                    setIsFeeModalOpen(true);
                  }}
                  className="ml-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                  title="Atur tarif jasa per kasus (minimal Rp 100.000)"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Ubah Tarif</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="px-4 py-2.5 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                title="Kelola profil praktisi dan dokumen lisensi profesi"
              >
                <UserCircle className="w-4 h-4 text-emerald-400" />
                <span>Profil & Lisensi</span>
              </button>

              <div className="px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-300 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Independensi Terjamin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="text-xs text-slate-400 uppercase font-semibold">Total Berkas Masuk</div>
            <div className="text-2xl font-black font-mono text-white mt-1">{reports.length}</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="text-xs text-blue-400 uppercase font-semibold">Laporan Baru</div>
            <div className="text-2xl font-black font-mono text-blue-400 mt-1">
              {reports.filter((r) => r.status === 'baru').length}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="text-xs text-amber-400 uppercase font-semibold">Dalam Investigasi</div>
            <div className="text-2xl font-black font-mono text-amber-400 mt-1">
              {reports.filter((r) => r.status === 'proses').length}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="text-xs text-emerald-400 uppercase font-semibold">Valid (Di PT)</div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {reports.filter((r) => r.status === 'valid').length}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="text-xs text-teal-400 uppercase font-semibold">Kasus Selesai</div>
            <div className="text-2xl font-black font-mono text-teal-400 mt-1">
              {reports.filter((r) => r.status === 'selesai').length}
            </div>
          </div>
        </div>

        {/* Investigation Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-950/40">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-emerald-400" />
                Daftar Berkas Whistleblowing untuk Ditelaah
              </h2>
              <p className="text-xs text-slate-400">
                Pemeriksaan bukti dugaan pelanggaran secara objektif tanpa intervensi pihak mana pun
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500 ml-2" />
              {[
                { id: 'all', label: 'Semua' },
                { id: 'baru', label: 'Baru' },
                { id: 'proses', label: 'Proses' },
                { id: 'valid', label: 'Valid (Ke PT)' },
                { id: 'selesai', label: 'Selesai' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filterStatus === tab.id
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-slate-700" />
              <p className="text-sm font-medium">Tidak ada laporan dengan status ini.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="p-5 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-sm">{report.judul}</span>
                      {report.isContoh ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                          Contoh / Simulasi
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                          Resmi PT
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {report.kategori}
                      </span>
                      {report.tipePelanggaran === 'finansial' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                          Finansial {report.estimasiKerugian ? `(Kerugian: Rp ${Number(report.estimasiKerugian).toLocaleString('id-ID')})` : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                          Etik
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-blue-400" />
                        {report.companyName}
                      </span>
                      {report.biayaAuditor && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-mono">
                          Fee Audit: Rp {Number(report.biayaAuditor).toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {report.deskripsi}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span>Lokasi: {report.lokasi || 'Tidak disebutkan'}</span>
                      <span>Tanggal: {report.tanggalKejadian || 'Terkini'}</span>
                      <span className="text-slate-500 italic">Identitas Terproteksi</span>
                      {report.buktiFiles && report.buktiFiles.length > 0 && (
                        <span className="text-amber-300 flex items-center gap-1 font-semibold">
                          <ImageIcon className="w-3 h-3 text-amber-400" />
                          {report.buktiFiles.length} Bukti Terlampir
                        </span>
                      )}
                      {report.whatsappPelapor && (
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <MessageCircle className="w-3 h-3 text-emerald-400" />
                          WA Notif Reward: {report.whatsappPelapor}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-bold uppercase px-3 py-1 rounded-lg border ${
                        report.status === 'baru'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : report.status === 'proses'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : report.status === 'valid'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : report.status === 'selesai'
                          ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {report.status === 'valid' ? 'VALID (DI PT)' : report.status}
                    </span>

                    <button
                      onClick={() => handleOpenReview(report)}
                      className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Audit & Tindak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AUDIT REVIEW MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileSearch className="w-5 h-5 text-emerald-400" />
                  Telaah & Catatan Audit Independen
                </h3>
                <p className="text-xs text-slate-400">
                  Status Pemeriksaan: <strong className="text-amber-400 uppercase">{selectedReport.status}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {/* Report Detail Preview */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Perusahaan Terlapor:</span>
                <span className="font-bold text-white">{selectedReport.companyName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Kategori Pelanggaran:</span>
                <span className="text-amber-400 font-semibold">{selectedReport.kategori}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-semibold">Judul Laporan:</span>
                <p className="text-white font-medium">{selectedReport.judul}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-semibold">Kronologi / Keterangan:</span>
                <p className="text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap">
                  {selectedReport.deskripsi}
                </p>
              </div>

              {/* Uploaded Evidence Gallery */}
              {selectedReport.buktiFiles && selectedReport.buktiFiles.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    Berkas Bukti / Foto Investigasi ({selectedReport.buktiFiles.length} Berkas):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    {selectedReport.buktiFiles.map((bUrl, idx) => (
                      <a
                        key={idx}
                        href={bUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative rounded-xl overflow-hidden border border-slate-700 hover:border-amber-400 bg-slate-900 block"
                      >
                        <img
                          src={bUrl}
                          alt={`Bukti ${idx + 1}`}
                          className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 p-1 text-[10px] text-center text-slate-300 font-medium">
                          Bukti #{idx + 1} (Klik Buka)
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* WhatsApp Reward Notification */}
              {selectedReport.whatsappPelapor ? (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white block">WhatsApp Notifikasi Reward:</span>
                      <span className="font-mono text-emerald-300 text-xs">{selectedReport.whatsappPelapor}</span>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${selectedReport.whatsappPelapor.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold text-[11px] inline-flex items-center gap-1"
                  >
                    Kirim Notif WA
                  </a>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic">
                  Pelapor tidak menyertakan nomor WhatsApp (Kerahasiaan 100% tanpa notifikasi langsung).
                </div>
              )}
            </div>

            {successMsg ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs text-emerald-400 font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {successMsg}
              </div>
            ) : (
              <form onSubmit={handleSaveAudit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Ubah Status Investigasi
                  </label>
                  <select
                    value={statusInput}
                    onChange={(e: any) => setStatusInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="baru">Baru Diterima (Belum Ditelaah)</option>
                    <option value="proses">Dalam Proses Investigasi Bukti</option>
                    <option value="valid">✅ Dinyatakan VALID & Terbukti (Kirim ke Dashboard PT)</option>
                    <option value="selesai">Investigasi Selesai (Arsip)</option>
                    <option value="ditolak">Ditolak / Bukti Tidak Cukup</option>
                  </select>
                </div>

                {statusInput === 'valid' && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 space-y-1.5 animate-fadeIn">
                    <div className="flex items-center gap-2 font-bold text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Alur Otomatis Verifikasi Valid:</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      1. Laporan ini akan segera muncul di <strong>Dashboard Perusahaan ({selectedReport.companyName})</strong>.<br />
                      2. Perusahaan wajib klik <strong>"Ambil Kasus"</strong> untuk melihat detail dan bukti, serta menindak oknum yang melanggar.<br />
                      3. Tarif jasa audit Anda sebesar <strong className="text-emerald-300">Rp {currentBiayaJasa.toLocaleString('id-ID')}</strong> akan otomatis dipotong dari saldo lock perusahaan bersama reward pelapor saat dirilis (maksimal 1x24 jam).
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Catatan Audit & Rekomendasi Auditor Independen
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Masukkan hasil telaah fakta, klarifikasi data, atau instruksi tindak lanjut perbaikan kepatuhan..."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={savingNote}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60 cursor-pointer"
                  >
                    {savingNote ? 'Menyimpan...' : 'Simpan Rekomendasi Audit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL SETTING TARIF BIAYA JASA AUDIT PER KASUS */}
      {isFeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Atur Biaya Jasa per Kasus</h3>
                  <p className="text-xs text-slate-400">Honorarium investigasi per laporan/kasus</p>
                </div>
              </div>
              <button
                onClick={() => setIsFeeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {feeFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  feeFeedback.type === 'success'
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/50 border-red-500/40 text-red-300'
                }`}
              >
                {feeFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{feeFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveAuditorFee} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nominal Biaya Jasa Investigasi (Minimal Rp 100.000)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-mono font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    required
                    value={Number(feeInput.replace(/\D/g, '') || 0).toLocaleString('id-ID')}
                    onChange={(e) => setFeeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 150000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Standar default adalah <strong>Rp 150.000</strong> per laporan/kasus. Saat kasus dinyatakan valid dan dirilis, saldo lock perusahaan akan otomatis dipotong sebesar biaya ini dan masuk ke saldo Anda.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFeeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingFee}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                >
                  {savingFee ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Tarif Jasa</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
