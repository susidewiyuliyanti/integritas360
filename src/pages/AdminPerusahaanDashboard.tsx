import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc
} from '../lib/publicApi';
import { db } from '../lib/publicApi';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Award,
  XCircle,
  QrCode,
  Download,
  ExternalLink,
  MessageCircle,
  FileCheck,
  Scale,
  UserCheck,
  Coins,
  Send,
  HelpCircle,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  MapPin,
  Lock,
  Unlock,
  Check,
  X,
  UserCircle,
  Users
} from 'lucide-react';
import { UserProfile, WhistleblowingReport } from '../types';
import { PosterModal } from '../components/PosterModal';
import { PosterOptions } from '../utils/posterGenerator';
import { CompanyUsersView } from '../components/company/CompanyUsersView';

export const AdminPerusahaanDashboard: React.FC = () => {
  const { user, profile, loading: authLoading, role } = useAuth();
  const { navigate } = useNavigation();

  // Active Menu Tab: 'dashboard' | 'investigasi' | 'sop' | 'users' | 'profile'
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'investigasi' | 'sop' | 'users' | 'profile'>('dashboard');

  // Company suspension state
  const [isCompanySuspended, setIsCompanySuspended] = useState(false);

  // Reports state
  const [reports, setReports] = useState<WhistleblowingReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'baru' | 'investigasi' | 'terbukti' | 'palsu_hoax'>('all');
  const [kategoriFilter, setKategoriFilter] = useState<string>('all');

  // Selected Report for Detail & Investigation Modal
  const [selectedReport, setSelectedReport] = useState<WhistleblowingReport | null>(null);
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [hoaxReasonInput, setHoaxReasonInput] = useState('');
  const [showHoaxConfirm, setShowHoaxConfirm] = useState(false);
  const [showTerbuktiConfirm, setShowTerbuktiConfirm] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  // Poster Modal
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ type, message });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (role !== 'admin_perusahaan' && role !== 'owner' && role !== 'perusahaan') {
        navigate('/');
      }
    }
  }, [user, authLoading, role, navigate]);

  // Target Company ID for this Admin Perusahaan (Strict tenant isolation)
  const targetCompanyId = profile?.company_id || profile?.perusahaanId || (profile as any)?.companyId || user?.uid || '';
  const companyName = profile?.perusahaanName || profile?.namaPT || 'Perusahaan Kepatuhan';

  // Check if company is suspended
  useEffect(() => {
    if (!targetCompanyId) return;
    const unsubComp = onSnapshot(doc(db, 'companies', targetCompanyId), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.status === 'SUSPENDED') {
          setIsCompanySuspended(true);
        } else {
          setIsCompanySuspended(false);
        }
      }
    });
    return () => unsubComp();
  }, [targetCompanyId]);

  // Realtime subscription to whistleblowing reports of this company
  useEffect(() => {
    if (!user) return;

    setLoadingReports(true);

    // Query reports where companyId matches
    // If targetCompanyId is present, query by that, otherwise fallback to user.uid
    const qReports = targetCompanyId
      ? query(collection(db, 'reports'), where('companyId', '==', targetCompanyId))
      : query(collection(db, 'reports'), where('companyId', '==', user.uid));

    const unsubscribe = onSnapshot(
      qReports,
      (snapshot) => {
        const list: WhistleblowingReport[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            companyId: d.companyId,
            companyName: d.companyName || companyName,
            judul: d.judul || 'Laporan Dugaan Pelanggaran',
            kategori: d.kategori || 'Umum',
            tipePelanggaran: d.tipePelanggaran || (d.estimasiKerugian ? 'finansial' : 'etik'),
            estimasiKerugian: Number(d.estimasiKerugian || 0),
            rewardMinAmount: Number(d.rewardMinAmount || 0),
            rewardAmount: d.rewardAmount !== undefined ? Number(d.rewardAmount) : undefined,
            rewardStatusPerusahaan: d.rewardStatusPerusahaan || 'belum_ditentukan',
            rewardClaimed: Boolean(d.rewardClaimed),
            rewardClaimStatus: d.rewardClaimStatus,
            rewardClaimBank: d.rewardClaimBank,
            whatsappPelapor: d.whatsappPelapor,
            targetAuditorName: d.targetAuditorName,
            deskripsi: d.deskripsi || '',
            tanggalKejadian: d.tanggalKejadian,
            lokasi: d.lokasi,
            status: d.status || 'baru',
            tokenAkses: d.tokenAkses || '',
            pelaporAnonim: d.pelaporAnonim !== false,
            buktiFiles: d.buktiFiles || [],
            isContoh: Boolean(d.isContoh),
            catatanAuditor: d.catatanAuditor,
            investigasiStatus: d.investigasiStatus || 'belum_dimulai',
            investigasiStartedAt: d.investigasiStartedAt,
            investigasiCompletedAt: d.investigasiCompletedAt,
            investigasiNotes: d.investigasiNotes,
            investigatorName: d.investigatorName,
            investigatorRole: d.investigatorRole,
            hasilInvestigasi: d.hasilInvestigasi,
            hoaxReason: d.hoaxReason,
            terbuktiNotes: d.terbuktiNotes,
            rewardReleased: Boolean(d.rewardReleased),
            rewardReleasedAt: d.rewardReleasedAt,
            rewardReleaseType: d.rewardReleaseType,
            createdAt: d.createdAt
          });
        });

        // Sort latest first
        list.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });

        setReports(list);
        setLoadingReports(false);
      },
      (error) => {
        console.error('Error fetching admin perusahaan reports:', error);
        setLoadingReports(false);
      }
    );

    return () => unsubscribe();
  }, [user, targetCompanyId, companyName]);

  // Sync selectedReport if updated in realtime
  useEffect(() => {
    if (selectedReport) {
      const updated = reports.find((r) => r.id === selectedReport.id);
      if (updated) {
        setSelectedReport(updated);
      }
    }
  }, [reports]);

  // KPI Calculations
  const totalReports = reports.length;
  const baruCount = reports.filter((r) => r.status === 'baru').length;
  const investigasiCount = reports.filter(
    (r) => r.status === 'investigasi' || r.investigasiStatus === 'investigasi_berjalan'
  ).length;
  const terbuktiCount = reports.filter((r) => r.status === 'terbukti' || r.status === 'valid').length;
  const hoaxCount = reports.filter(
    (r) => r.status === 'palsu_hoax' || (r.status === 'ditolak' && r.hasilInvestigasi === 'palsu_hoax')
  ).length;

  const totalKerugian = reports
    .filter((r) => r.status === 'terbukti' || r.status === 'valid')
    .reduce((acc, curr) => acc + (curr.estimasiKerugian || 0), 0);

  const totalRewardReleased = reports
    .filter((r) => r.rewardReleased)
    .reduce((acc, curr) => acc + (curr.rewardAmount || curr.rewardMinAmount || 0), 0);

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    // Search
    const searchMatch =
      r.tokenAkses.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.deskripsi.toLowerCase().includes(searchTerm.toLowerCase());

    // Status
    let statusMatch = true;
    if (statusFilter === 'baru') statusMatch = r.status === 'baru';
    else if (statusFilter === 'investigasi')
      statusMatch = r.status === 'investigasi' || r.investigasiStatus === 'investigasi_berjalan';
    else if (statusFilter === 'terbukti') statusMatch = r.status === 'terbukti' || r.status === 'valid';
    else if (statusFilter === 'palsu_hoax')
      statusMatch = r.status === 'palsu_hoax' || r.status === 'ditolak';

    // Kategori
    const katMatch = kategoriFilter === 'all' || r.kategori === kategoriFilter;

    return searchMatch && statusMatch && katMatch;
  });

  // Unique categories for filter
  const uniqueCategories = Array.from(new Set(reports.map((r) => r.kategori))).filter(Boolean);

  // ==========================================
  // ACTION: MULAI INVESTIGASI MENYELURUH
  // ==========================================
  const handleStartInvestigation = async (report: WhistleblowingReport) => {
    if (!report.id) return;
    try {
      setProcessingAction(true);
      const reportRef = doc(db, 'reports', report.id);
      await updateDoc(reportRef, {
        status: 'investigasi',
        investigasiStatus: 'investigasi_berjalan',
        investigasiStartedAt: serverTimestamp(),
        investigatorName: profile?.picName || user?.email || 'Admin Kepatuhan',
        investigatorRole: 'admin_perusahaan',
        investigasiNotes: investigationNotes.trim()
          ? `${report.investigasiNotes ? report.investigasiNotes + '\n' : ''}[${new Date().toLocaleString('id-ID')}] Investigasi dimulai: ${investigationNotes.trim()}`
          : report.investigasiNotes || `[${new Date().toLocaleString('id-ID')}] Investigasi menyeluruh dimulai oleh ${profile?.picName || 'Admin Kepatuhan'}`
      });
      showToast('Status diperbarui: Investigasi menyeluruh sedang berjalan.');
      setInvestigationNotes('');
    } catch (err: any) {
      console.error('Error starting investigation:', err);
      showToast('Gagal memulai investigasi: ' + err.message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  // ==========================================
  // ACTION: TETAPKAN KASUS TERBUKTI & RILIS REWARD
  // ==========================================
  const handleSetTerbuktiDanRilisReward = async () => {
    if (!selectedReport || !selectedReport.id) return;
    try {
      setProcessingAction(true);

      const calculatedReward =
        selectedReport.rewardAmount ||
        selectedReport.rewardMinAmount ||
        (selectedReport.tipePelanggaran === 'finansial' && selectedReport.estimasiKerugian
          ? Math.round(selectedReport.estimasiKerugian * 0.02)
          : 100000);

      const reportRef = doc(db, 'reports', selectedReport.id);
      await updateDoc(reportRef, {
        status: 'terbukti',
        hasilInvestigasi: 'terbukti',
        investigasiStatus: 'investigasi_selesai',
        investigasiCompletedAt: serverTimestamp(),
        terbuktiNotes: investigationNotes.trim() || 'Kasus terbukti sah dan valid berdasarkan investigasi mendalam.',
        investigasiNotes: `${selectedReport.investigasiNotes ? selectedReport.investigasiNotes + '\n' : ''}[${new Date().toLocaleString('id-ID')}] KEPUTUSAN: TERBUKTI. Reward Rp ${calculatedReward.toLocaleString('id-ID')} dirilis untuk pelapor. Catatan: ${investigationNotes.trim() || '-'}`,
        rewardReleased: true,
        rewardReleasedAt: serverTimestamp(),
        rewardReleaseType: 'admin_perusahaan',
        rewardAmount: calculatedReward,
        rewardClaimStatus: 'siap_diklaim'
      });

      // Log transaction record for transparency
      await addDoc(collection(db, 'transactions'), {
        userId: selectedReport.companyId,
        companyName: selectedReport.companyName,
        type: 'claim_reward',
        amount: calculatedReward,
        status: 'selesai',
        keterangan: `Reward pelapor whistleblowing kasus #${selectedReport.tokenAkses} dirilis oleh Admin Perusahaan`,
        claimReportToken: selectedReport.tokenAkses,
        claimReportId: selectedReport.id,
        processedBy: profile?.picName || user?.email,
        createdAt: serverTimestamp()
      }).catch((txErr) => console.warn('Reward transaction logging warning:', txErr));

      showToast(`Kasus dinyatakan TERBUKTI! Reward sebesar Rp ${calculatedReward.toLocaleString('id-ID')} telah dirilis.`);
      setShowTerbuktiConfirm(false);
      setInvestigationNotes('');
    } catch (err: any) {
      console.error('Error confirming proven report:', err);
      showToast('Gagal merilis reward: ' + err.message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  // ==========================================
  // ACTION: TETAPKAN LAPORAN PALSU / HOAX
  // ==========================================
  const handleSetPalsuHoax = async () => {
    if (!selectedReport || !selectedReport.id) return;
    if (!hoaxReasonInput.trim()) {
      showToast('Harap berikan alasan investigasi penetapan laporan palsu/hoax.', 'error');
      return;
    }

    try {
      setProcessingAction(true);
      const reportRef = doc(db, 'reports', selectedReport.id);
      await updateDoc(reportRef, {
        status: 'palsu_hoax',
        hasilInvestigasi: 'palsu_hoax',
        investigasiStatus: 'investigasi_selesai',
        investigasiCompletedAt: serverTimestamp(),
        hoaxReason: hoaxReasonInput.trim(),
        investigasiNotes: `${selectedReport.investigasiNotes ? selectedReport.investigasiNotes + '\n' : ''}[${new Date().toLocaleString('id-ID')}] KEPUTUSAN: DITOLAK / LAPORAN PALSU (HOAX). Alasan: ${hoaxReasonInput.trim()}`,
        rewardReleased: false,
        rewardClaimStatus: 'ditolak'
      });

      showToast('Laporan telah ditandai sebagai LAPORAN PALSU / HOAX. Kasus ditutup tanpa reward.');
      setShowHoaxConfirm(false);
      setHoaxReasonInput('');
      setInvestigationNotes('');
    } catch (err: any) {
      console.error('Error marking hoax report:', err);
      showToast('Gagal memproses laporan hoax: ' + err.message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  if (isCompanySuspended) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-xl shadow-red-500/10">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
          Akses Perusahaan Ditangguhkan (SUSPENDED)
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          Akun perusahaan "{companyName}" ({targetCompanyId}) sedang ditangguhkan oleh Super Admin Integritas360.
          Akses ke dashboard dan modul investigasi dinonaktifkan sementara hingga Super Admin mengaktifkan kembali.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
        >
          Kembali ke Portal Masuk
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-semibold ${
              toastMsg.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-red-950/90 border-red-500/50 text-red-200'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{toastMsg.message}</span>
          </div>
        </div>
      )}

      {/* EXECUTIVE IDENTITY MASTHEAD */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Identity info */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white flex items-center justify-center font-extrabold text-xl shadow-xl shadow-cyan-600/20 border border-cyan-400/30 shrink-0">
                <ShieldCheck className="w-8 h-8 text-cyan-200" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    Portal Admin Perusahaan
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-cyan-400" />
                    {profile?.picName || 'Petugas Investigasi'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                    ISO 37002 Compliant
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-200 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    {companyName}
                  </span>
                  <span>•</span>
                  <span>{profile?.jabatan || 'Admin Kepatuhan Internal'}</span>
                  <span>•</span>
                  <span className="text-cyan-400 font-mono">{profile?.email}</span>
                </div>
              </div>
            </div>

            {/* Right: Quick actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setIsPosterModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <QrCode className="w-4 h-4" />
                <span>Unduh Poster QR PT</span>
              </button>

              <button
                onClick={() => setActiveMenu('profile')}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-cyan-600/20"
              >
                <UserCircle className="w-4 h-4" />
                <span>Profil & Penugasan</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar / Menu */}
          <div className="flex items-center gap-2 pt-6 overflow-x-auto border-t border-slate-800/80 mt-6 scrollbar-none">
            <button
              onClick={() => setActiveMenu('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeMenu === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Dashboard Laporan</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-900/60 font-mono text-[10px]">
                {totalReports}
              </span>
            </button>

            <button
              onClick={() => setActiveMenu('investigasi')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeMenu === 'investigasi'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Investigasi Kasus</span>
              {investigasiCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-mono text-[10px]">
                  {investigasiCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveMenu('sop')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeMenu === 'sop'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>SOP Investigasi & Alur</span>
            </button>

            <button
              onClick={() => setActiveMenu('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeMenu === 'profile'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <UserCircle className="w-4 h-4" />
              <span>Profil Petugas</span>
            </button>

            <button
              onClick={() => setActiveMenu('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeMenu === 'users'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Users & Access</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* ==================================================== */}
        {/* VIEW 1: DASHBOARD LAPORAN & INVESTIGASI PIPELINE     */}
        {/* ==================================================== */}
        {(activeMenu === 'dashboard' || activeMenu === 'investigasi') && (
          <>
            {/* KPI STATS CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* Total Laporan */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="text-[11px] font-semibold text-slate-400">Total Laporan</div>
                <div className="text-2xl font-extrabold text-white mt-1">{totalReports}</div>
                <div className="text-[10px] text-slate-500 mt-1">Seluruh Tiket Masuk</div>
              </div>

              {/* Laporan Baru */}
              <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-xl">
                <div className="text-[11px] font-semibold text-amber-400">Baru Masuk</div>
                <div className="text-2xl font-extrabold text-amber-300 mt-1">{baruCount}</div>
                <div className="text-[10px] text-amber-500/80 mt-1">Perlu Ditelaah</div>
              </div>

              {/* Sedang Investigasi */}
              <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4 shadow-xl">
                <div className="text-[11px] font-semibold text-blue-400">Investigasi Aktif</div>
                <div className="text-2xl font-extrabold text-blue-300 mt-1">{investigasiCount}</div>
                <div className="text-[10px] text-blue-500/80 mt-1">Pemeriksaan Bukti</div>
              </div>

              {/* Terbukti & Rilis */}
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-xl">
                <div className="text-[11px] font-semibold text-emerald-400">Terbukti Valid</div>
                <div className="text-2xl font-extrabold text-emerald-300 mt-1">{terbuktiCount}</div>
                <div className="text-[10px] text-emerald-500/80 mt-1">Reward Dirilis</div>
              </div>

              {/* Laporan Palsu / Hoax */}
              <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-4 shadow-xl">
                <div className="text-[11px] font-semibold text-red-400">Palsu / Hoax</div>
                <div className="text-2xl font-extrabold text-red-300 mt-1">{hoaxCount}</div>
                <div className="text-[10px] text-red-500/80 mt-1">Tidak Terbukti</div>
              </div>

              {/* Total Reward Dirilis */}
              <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-4 shadow-xl">
                <div className="text-[11px] font-semibold text-cyan-400">Reward Dirilis</div>
                <div className="text-base font-extrabold text-cyan-300 mt-1 truncate font-mono">
                  Rp {totalRewardReleased.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-cyan-500/80 mt-1">Hak Whistleblower</div>
              </div>
            </div>

            {/* ALUR MEKANISME NOTICE BANNER */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl space-y-3">
              <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>Alur Kerja Investigasi Kepatuhan Perusahaan & Admin PT</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">1</span>
                    Pelapor Scan QR PT
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Pelapor membuat laporan anonim lewat QR code poster resmi tanpa perlu login identitas diri.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="font-bold text-blue-400 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-[10px]">2</span>
                    Masuk ke Dashboard PT & Admin
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Laporan terenkripsi langsung masuk bersamaan ke Dashboard Direksi PT & Dashboard Admin Perusahaan.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="font-bold text-purple-400 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px]">3</span>
                    Investigasi Menyeluruh
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Admin PT & Direksi melakukan telaah bukti, audit dokumen, dan wawancara internal independen.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px]">4</span>
                    Keputusan: Terbukti vs Hoax
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Jika <strong>Terbukti</strong> maka reward langsung dirilis. Jika <strong>Tidak Terbukti</strong> ditutup sebagai Hoax.
                  </p>
                </div>
              </div>
            </div>

            {/* SEARCH & FILTER BAR */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xl">
              <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nomor tiket, judul kasus, atau kategori..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Semua Status Kasus</option>
                  <option value="baru">Laporan Baru Masuk</option>
                  <option value="investigasi">Sedang Investigasi Menyeluruh</option>
                  <option value="terbukti">Terbukti & Reward Rilis</option>
                  <option value="palsu_hoax">Laporan Palsu / Hoax</option>
                </select>

                {/* Category Filter */}
                {uniqueCategories.length > 0 && (
                  <select
                    value={kategoriFilter}
                    onChange={(e) => setKategoriFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">Semua Kategori</option>
                    {uniqueCategories.map((kat) => (
                      <option key={kat} value={kat}>
                        {kat}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="text-xs text-slate-400 self-center">
                Menampilkan <strong className="text-white">{filteredReports.length}</strong> dari {totalReports} laporan
              </div>
            </div>

            {/* REPORTS TABLE / CARDS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Daftar Laporan Dugaan Pelanggaran</h3>
                    <p className="text-[11px] text-slate-400">
                      Seluruh pengaduan yang masuk via QR code atau formulir whistleblowing resmi {companyName}
                    </p>
                  </div>
                </div>
              </div>

              {filteredReports.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-300">Tidak Ada Laporan yang Cocok</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Belum ada laporan yang sesuai dengan filter pencarian Anda, atau belum ada laporan baru dari pelapor.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Tiket & Tanggal</th>
                        <th className="py-3.5 px-4">Judul & Kategori Kasus</th>
                        <th className="py-3.5 px-4">Estimasi Kerugian / Tipe</th>
                        <th className="py-3.5 px-4">Status & Progres</th>
                        <th className="py-3.5 px-4">Hak Reward</th>
                        <th className="py-3.5 px-4 text-right">Rincian & Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filteredReports.map((report) => {
                        const isFinansial = report.tipePelanggaran === 'finansial';
                        const rewardValue =
                          report.rewardAmount ||
                          report.rewardMinAmount ||
                          (isFinansial && report.estimasiKerugian
                            ? Math.round(report.estimasiKerugian * 0.02)
                            : 100000);

                        return (
                          <tr key={report.id} className="hover:bg-slate-800/40 transition-colors">
                            {/* Tiket & Date */}
                            <td className="py-3.5 px-4">
                              <div className="font-mono font-bold text-amber-400 text-xs">
                                #{report.tokenAkses}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {report.createdAt?.seconds
                                  ? new Date(report.createdAt.seconds * 1000).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })
                                  : 'Baru saja'}
                              </div>
                              {report.pelaporAnonim && (
                                <span className="inline-block mt-1 text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                  Anonim
                                </span>
                              )}
                            </td>

                            {/* Title & Category */}
                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="font-bold text-white line-clamp-1">{report.judul}</div>
                              <div className="text-[11px] text-slate-400 line-clamp-1">{report.kategori}</div>
                              {report.buktiFiles && report.buktiFiles.length > 0 && (
                                <div className="text-[10px] text-cyan-400 mt-1 flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  <span>{report.buktiFiles.length} Berkas Bukti Terlampir</span>
                                </div>
                              )}
                            </td>

                            {/* Kerugian & Tipe */}
                            <td className="py-3.5 px-4">
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border mb-1">
                                {isFinansial ? (
                                  <span className="text-amber-300 border-amber-500/30">Finansial / Kerugian</span>
                                ) : (
                                  <span className="text-purple-300 border-purple-500/30">Pelanggaran Etik / K3</span>
                                )}
                              </div>
                              {isFinansial && report.estimasiKerugian ? (
                                <div className="font-mono font-bold text-slate-200">
                                  Rp {report.estimasiKerugian.toLocaleString('id-ID')}
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-400">Non-Finansial</div>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              {report.status === 'terbukti' || report.status === 'valid' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Terbukti Valid
                                </span>
                              ) : report.status === 'palsu_hoax' || report.status === 'ditolak' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-bold">
                                  <XCircle className="w-3 h-3" />
                                  Laporan Palsu / Hoax
                                </span>
                              ) : report.status === 'investigasi' ||
                                report.investigasiStatus === 'investigasi_berjalan' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-bold">
                                  <Scale className="w-3 h-3 animate-pulse" />
                                  Investigasi Menyeluruh
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
                                  <Clock className="w-3 h-3" />
                                  Baru Masuk
                                </span>
                              )}
                            </td>

                            {/* Reward Status */}
                            <td className="py-3.5 px-4">
                              {report.rewardReleased ? (
                                <div>
                                  <div className="font-mono font-bold text-emerald-400">
                                    Rp {rewardValue.toLocaleString('id-ID')}
                                  </div>
                                  <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                    Reward Dirilis
                                  </span>
                                </div>
                              ) : report.status === 'palsu_hoax' || report.status === 'ditolak' ? (
                                <span className="text-slate-500 text-[11px]">Dibatalkan (Hoax)</span>
                              ) : (
                                <div>
                                  <div className="font-mono text-slate-400">
                                    Rp {rewardValue.toLocaleString('id-ID')}
                                  </div>
                                  <span className="text-[10px] text-amber-400/80">Siap Saat Terbukti</span>
                                </div>
                              )}
                            </td>

                            {/* Action Button */}
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedReport(report);
                                  setInvestigationNotes(report.investigasiNotes || '');
                                  setShowHoaxConfirm(false);
                                  setShowTerbuktiConfirm(false);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Rincian & Investigasi</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ==================================================== */}
        {/* VIEW 2: SOP & MEKANISME INVESTIGASI KEPATUHAN       */}
        {/* ==================================================== */}
        {activeMenu === 'sop' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Standar Operasional Prosedur (SOP) Investigasi Whistleblowing
                  </h2>
                  <p className="text-xs text-slate-400">
                    Panduan kepatuhan penyelidikan internal dan rilis reward berstandar ISO 37002 & ISO 37001
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
                <div className="space-y-3">
                  <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    1. Prinsip Kerahasiaan & Investigasi
                  </h4>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300 leading-relaxed">
                    <li>
                      <strong>Zero Retaliation (Bebas Intimidasi):</strong> Pelapor dilindungi secara mutlak. Data pribadi, IP, atau identitas perangkat tidak pernah dibuka ke publik.
                    </li>
                    <li>
                      <strong>Investigasi Menyeluruh:</strong> Setiap laporan yang masuk wajib melalui verifikasi dokumen bukti, telaah kronologi kejadian, dan cross-check pembukuan internal.
                    </li>
                    <li>
                      <strong>Kolaborasi PT & Admin:</strong> Direksi Perusahaan dan Admin Perusahaan bersama-sama mengawal temuan audit demi transparansi tata kelola (Good Corporate Governance).
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    2. Keputusan & Pencairan Reward
                  </h4>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300 leading-relaxed">
                    <li>
                      <strong>Kriteria Kasus Terbukti:</strong> Dinyatakan terbukti bila bukti audit forensik, pengakuan saksi, atau data transaksi mengonfirmasi terjadinya fraud atau pelanggaran etik.
                    </li>
                    <li>
                      <strong>Rilis Reward Otomatis:</strong> Saat ditetapkan Terbukti, dana reward garansi perusahaan langsung dirilis dan siap diklaim pelapor melalui nomor tiket unik.
                    </li>
                    <li>
                      <strong>Penetapan Hoax:</strong> Bila laporan terbukti rekayasa, fitnah tanpa dasar, atau tidak memenuhi syarat pembuktian, ditutup resmi sebagai <em>Laporan Palsu / Hoax</em> tanpa reward.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 3: PROFIL PETUGAS & PENUGASAN PT                */}
        {/* ==================================================== */}
        {activeMenu === 'profile' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold text-2xl">
                  {(profile?.picName || profile?.email || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{profile?.picName || 'Admin Perusahaan'}</h2>
                  <p className="text-xs text-cyan-400 font-medium">{profile?.email}</p>
                  <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Petugas Admin Kepatuhan Terverifikasi
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[11px]">Perusahaan yang Diawasi</div>
                  <div className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    {companyName}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[11px]">Jabatan Struktural</div>
                  <div className="font-bold text-white text-sm">
                    {profile?.jabatan || 'Investigator Internal / Admin Kepatuhan'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[11px]">Divisi / Departemen</div>
                  <div className="font-bold text-white text-sm">
                    {profile?.departemen || 'Divisi Kepatuhan & Audit Internal'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[11px]">Nomor Kontak / WhatsApp</div>
                  <div className="font-bold text-white text-sm">
                    {profile?.telepon || '-'}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Hak Akses & Otoritas Sistem
                </div>
                <p className="text-[11px] leading-relaxed">
                  Akun ini memiliki kewenangan menyelidiki kasus dugaan kecurangan pada entitas <strong>{companyName}</strong>, menerbitkan catatan audit forensik, menetapkan validitas temuan (Terbukti vs Hoax), serta mengeksekusi rilis reward pelapor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 4: USERS & ACCESS (PENGELOLAAN TIM & PENGGUNA) */}
        {/* ==================================================== */}
        {activeMenu === 'users' && (
          <div className="space-y-6">
            <CompanyUsersView
              companyId={targetCompanyId}
              companyName={companyName}
              currentUserEmail={user?.email || undefined}
              currentUserId={user?.uid}
            />
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL: RINCIAN LAPORAN & KONTROL INVESTIGASI         */}
      {/* ==================================================== */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-amber-400 text-sm">
                      #{selectedReport.tokenAkses}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {selectedReport.kategori}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white truncate max-w-md">
                    {selectedReport.judul}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Tanggal Kejadian</span>
                  <div className="font-bold text-white mt-0.5">
                    {selectedReport.tanggalKejadian || 'Tidak ditentukan'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Lokasi / Divisi</span>
                  <div className="font-bold text-white mt-0.5">
                    {selectedReport.lokasi || 'Lingkungan Perusahaan'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Estimasi Kerugian</span>
                  <div className="font-bold text-amber-300 font-mono mt-0.5">
                    {selectedReport.estimasiKerugian
                      ? `Rp ${selectedReport.estimasiKerugian.toLocaleString('id-ID')}`
                      : 'Kasus Etik'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Nilai Reward Pelapor</span>
                  <div className="font-bold text-emerald-300 font-mono mt-0.5">
                    Rp{' '}
                    {(
                      selectedReport.rewardAmount ||
                      selectedReport.rewardMinAmount ||
                      100000
                    ).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Status Saat Ini:</span>
                  {selectedReport.status === 'terbukti' || selectedReport.status === 'valid' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      TERBUKTI VALID (Reward Telah Dirilis)
                    </span>
                  ) : selectedReport.status === 'palsu_hoax' || selectedReport.status === 'ditolak' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      LAPORAN PALSU / HOAX (Kasus Ditutup)
                    </span>
                  ) : selectedReport.status === 'investigasi' ||
                    selectedReport.investigasiStatus === 'investigasi_berjalan' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 animate-pulse" />
                      SEDANG INVESTIGASI MENYELURUH
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      LAPORAN BARU MASUK
                    </span>
                  )}
                </div>

                {selectedReport.rewardReleased && (
                  <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 font-mono">
                    <Award className="w-4 h-4 text-emerald-400" />
                    REWARD SUDAH DIRILIS KE PELAPOR
                  </div>
                )}
              </div>

              {/* Deskripsi & Kronologi */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Kronologi Lengkap Pengaduan:
                </h4>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                  {selectedReport.deskripsi}
                </div>
              </div>

              {/* Bukti-Bukti Lampiran */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  Berkas & Bukti Lampiran ({selectedReport.buktiFiles?.length || 0}):
                </h4>
                {selectedReport.buktiFiles && selectedReport.buktiFiles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedReport.buktiFiles.map((fileData, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="text-xs text-slate-200 truncate">
                            Bukti Lampiran #{idx + 1}
                          </span>
                        </div>
                        {fileData.startsWith('data:image') ? (
                          <a
                            href={fileData}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold shrink-0 transition-colors"
                          >
                            Lihat Foto
                          </a>
                        ) : (
                          <a
                            href={fileData}
                            download={`Bukti_${selectedReport.tokenAkses}_${idx + 1}`}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold shrink-0 transition-colors"
                          >
                            Unduh File
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-500">
                    Tidak ada lampiran berkas langsung dalam pengaduan ini.
                  </div>
                )}
              </div>

              {/* Log Investigasi & Catatan */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Riwayat & Catatan Investigasi:
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1.5 max-h-36 overflow-y-auto font-mono text-[11px]">
                  {selectedReport.investigasiNotes ? (
                    <div className="whitespace-pre-line text-slate-300">
                      {selectedReport.investigasiNotes}
                    </div>
                  ) : (
                    <span className="text-slate-500">Belum ada riwayat investigasi formal yang dicatat.</span>
                  )}
                </div>
              </div>

              {/* Input Catatan Investigasi Baru */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Tambah Catatan Hasil Pemeriksaan / Telaah Bukti:
                </label>
                <textarea
                  rows={3}
                  placeholder="Ketik catatan hasil investigasi, temuan audit forensik, hasil wawancara, atau kesimpulan..."
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Confirmation Box: Rilis Reward Terbukti */}
              {showTerbuktiConfirm && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-emerald-300 text-sm">
                        Konfirmasi: Kasus Dinyatakan Terbukti & Rilis Reward
                      </div>
                      <p className="text-emerald-200/80 leading-relaxed">
                        Anda akan menetapkan bahwa laporan ini <strong>TERBUKTI VALID</strong>. Sistem akan merilis dana reward pelapor sebesar{' '}
                        <strong className="text-white font-mono">
                          Rp{' '}
                          {(
                            selectedReport.rewardAmount ||
                            selectedReport.rewardMinAmount ||
                            100000
                          ).toLocaleString('id-ID')}
                        </strong>{' '}
                        dan hak klaim whistleblower akan langsung aktif.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTerbuktiConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={processingAction}
                      onClick={handleSetTerbuktiDanRilisReward}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {processingAction ? 'Memproses...' : 'Ya, Tetapkan Terbukti & Rilis Reward'}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirmation Box: Tetapkan Palsu / Hoax */}
              {showHoaxConfirm && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-red-300 text-sm">
                        Konfirmasi: Tetapkan Laporan Palsu / Hoax
                      </div>
                      <p className="text-red-200/80 leading-relaxed">
                        Jika hasil investigasi membuktikan tuduhan tidak benar, rekayasa, atau palsu, masukkan alasan resmi berikut. Kasus akan ditutup dan reward dibatalkan.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-red-200 mb-1">
                      Alasan Penetapan Laporan Palsu / Hoax <span className="text-red-400">*</span>:
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Contoh: Bukti transfer terbukti hasil manipulasi grafis, oknum yang dituduh tidak berada di lokasi, dan verifikasi fisik gudang menunjukkan stok utuh."
                      value={hoaxReasonInput}
                      onChange={(e) => setHoaxReasonInput(e.target.value)}
                      className="w-full bg-slate-950 border border-red-500/40 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowHoaxConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={processingAction || !hoaxReasonInput.trim()}
                      onClick={handleSetPalsuHoax}
                      className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {processingAction ? 'Memproses...' : 'Tutup Kasus Sebagai Laporan Palsu (Hoax)'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              {/* Action Triggers */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Mulai Investigasi */}
                {selectedReport.status === 'baru' && (
                  <button
                    disabled={processingAction}
                    onClick={() => handleStartInvestigation(selectedReport)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <Scale className="w-4 h-4" />
                    <span>Mulai Investigasi Menyeluruh</span>
                  </button>
                )}

                {/* 2. Tetapkan Palsu / Hoax Trigger */}
                {selectedReport.status !== 'palsu_hoax' &&
                  selectedReport.status !== 'ditolak' &&
                  selectedReport.status !== 'terbukti' && (
                    <button
                      disabled={processingAction}
                      onClick={() => {
                        setShowHoaxConfirm(true);
                        setShowTerbuktiConfirm(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>Tidak Terbukti (Palsu / Hoax)</span>
                    </button>
                  )}

                {/* 3. Tetapkan Terbukti & Rilis Reward Trigger */}
                {selectedReport.status !== 'terbukti' && selectedReport.status !== 'valid' && (
                  <button
                    disabled={processingAction}
                    onClick={() => {
                      setShowTerbuktiConfirm(true);
                      setShowHoaxConfirm(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-white" />
                    <span>Terbukti & Rilis Reward</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POSTER MODAL */}
      <PosterModal
        isOpen={isPosterModalOpen}
        onClose={() => setIsPosterModalOpen(false)}
        company={{
          uid: targetCompanyId,
          namaPT: companyName,
          sektor: profile?.sektor || 'Manufaktur & Bisnis',
          danaTersedia: 10000000
        }}
      />
    </div>
  );
};
