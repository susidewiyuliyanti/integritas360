import React, { useEffect, useRef, useState } from 'react';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  updateDoc,
  addDoc,
  serverTimestamp
} from '../lib/publicApi';

import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import {
  Building2,
  Wallet,
  QrCode,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Download,
  Coins,
  Scale,
  Award,
  Loader2,
  UserCheck,
  Lock,
  Unlock,
  AlertCircle,
  FileCheck,
  Send,
  Info,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  DollarSign,
  RefreshCw,
  CreditCard
} from 'lucide-react';
import { UserProfile, WhistleblowingReport } from '../types';
import { PosterModal } from '../components/PosterModal';
import { QrisStaticCard } from '../components/QrisStaticCard';
import { NowPaymentsModal } from '../components/NowPaymentsModal';

 
const normalizeEvidenceUrl = (item: unknown): string => {
  if (typeof item === 'string') return item.trim();
  if (!item || typeof item !== 'object') return '';
  const file = item as Record<string, unknown>;
  for (const key of ['dataUrl', 'fileDataUrl', 'url', 'fileUrl', 'downloadUrl', 'src']) {
    if (typeof file[key] === 'string' && String(file[key]).trim()) return String(file[key]).trim();
  }
  return '';
};

const downloadReportEvidence = async (fileUrl: string, fileName: string) => {
  if (!fileUrl) {
    window.alert('URL berkas bukti tidak tersedia dari database. Muat ulang data atau hubungi administrator.');
    return;
  }
  try {
    const response = await fetch(fileUrl, { credentials: 'include', cache: 'no-store' });
    if (!response.ok) throw new Error('File tidak dapat diunduh langsung');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (error) {
    // Some external file hosts disallow fetch via CORS; open the original file as a fallback.
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  }
};

export const PerusahaanDashboard: React.FC = () => {
  const { user, profile: authProfile, loading: authLoading, role } = useAuth();
  const { navigate } = useNavigation();

  // Inisialisasi dengan null — jangan pakai authProfile yang bisa berubah saat AuthContext
  // menimpa datanya dari dua sumber berbeda (/api/auth.me lalu /api/company/me).
  const [companyProfile, setCompanyProfile] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<WhistleblowingReport[]>([]);
  const [dataReady, setDataReady] = useState(false);
  const [tenantLoadError, setTenantLoadError] = useState<string | null>(null);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [reportFilter, setReportFilter] = useState<'all' | 'menunggu_ambil' | 'kasus_diambil' | 'selesai'>('all');

  // Reward & Sanksi Management State
  const [editingRewardReportId, setEditingRewardReportId] = useState<string | null>(null);
  const [rewardInputVal, setRewardInputVal] = useState<string>('');
  const [sanksiInputMap, setSanksiInputMap] = useState<Record<string, string>>({});
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal Deposit Saldo State (QRIS & NOWPayments)
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showNowPaymentsModal, setShowNowPaymentsModal] = useState(false);
  const [depositTab, setDepositTab] = useState<'qris' | 'nowpayments' | 'bank'>('qris');
  const [depositAmount, setDepositAmount] = useState<number>(5000000);
  const [depositMethod, setDepositMethod] = useState('QRIS Statis Nasional (INTEGRITAS360)');
  const [paymentProof, setPaymentProof] = useState<{ name: string; type: string; dataUrl: string } | null>(null);
  const [processingDeposit, setProcessingDeposit] = useState(false);
  const autoRewardAttempts = useRef<Set<string>>(new Set());

  // Modal Kebijakan Reward (Etik & Finansial min 10%)
  const [showRewardPolicyModal, setShowRewardPolicyModal] = useState(false);
  const [policyEtikNominal, setPolicyEtikNominal] = useState<number>(2500000);
  const [policyFinansialPersen, setPolicyFinansialPersen] = useState<number>(10);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Live Timer Ticker for 24h Countdown & Auto-Release
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (role === 'auditor') {
        navigate('/auditor');
      }
    }
  }, [user, authLoading, role, navigate]);

  // Effective Company Tenant ID
  const effectiveCompanyId = authProfile?.company_id || authProfile?.perusahaanId || (authProfile as any)?.companyId || (user?.uid || user?.id) || '';

  // D1 is the single source of truth for tenant profile, balance and reports.
  // Polling replaces legacy Firebase snapshots, which could overwrite saved D1 values after refresh.
  useEffect(() => {
    if (!user || authLoading || !effectiveCompanyId) return;
    let active = true;
    let tenantRefreshInFlight = false;
    const loadCanonicalTenantData = async () => {
      // Prevent slow polls from finishing out of order and overwriting newer data.
      if (tenantRefreshInFlight) return;
      tenantRefreshInFlight = true;
      try {
        const response = await fetch('/api/company/me', {
          credentials: 'include',
          cache: 'no-store',
          headers: { 'cache-control': 'no-cache' }
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result?.company?.company_id) {
          throw new Error(result?.error || 'Data perusahaan tidak tersedia dari D1.');
        }
        const company = result.company;
        const profile = result.profile || {};
        // The authenticated D1 session is authoritative. AuthContext can briefly
        // contain a stale legacy tenant ID after refresh; rejecting a valid D1
        // session here made the dashboard look empty even when the records existed.
        const canonicalId = String(company.company_id);
        const balance = Number(company.deposit_balance ?? 0);
        const locked = Number(company.locked_balance ?? 0);
        const rewardPolicy = company.kebijakanReward || profile.kebijakanReward || {
          rewardKasusEtik: 100000,
          persenFinansial: 2,
          minPersenFinansial: 2
        };
        if (active) {
          setCompanyProfile({
            ...(profile as UserProfile),
            ...company,
            uid: String(user.uid || user.id),
            company_id: canonicalId,
            companyId: canonicalId,
            email: profile.email || company.email || user.email || '',
            role: profile.role || user.role || 'perusahaan',
            namaPT: String(company.company_name || company.namaPT || profile.namaPT || '').trim(),
            company_name: String(company.company_name || company.namaPT || profile.namaPT || '').trim(),
            sektor: company.sektor || company.sector || profile.sektor || '-',
            alamat: company.alamat || profile.alamat || '-',
            deskripsi: company.deskripsi || profile.deskripsi || '-',
            danaTersedia: balance,
            deposit_balance: balance,
            rewardBalance: balance,
            reward_balance: balance,
            saldoReward: balance,
            saldo: balance,
            danaTerkunci: locked,
            locked_balance: locked,
            status: company.status || 'ACTIVE',
            isLocked: company.status === 'SUSPENDED',
            kebijakanReward: rewardPolicy
          } as UserProfile);
          setPolicyEtikNominal(Number(rewardPolicy.rewardKasusEtik || 100000));
          setPolicyFinansialPersen(Math.max(10, Number(rewardPolicy.persenFinansial || 10)));
        }

        const reportsResponse = await fetch('/api/public/data?collection=reports&companyId=' + encodeURIComponent(canonicalId), {
          credentials: 'include',
          cache: 'no-store',
          headers: { 'cache-control': 'no-cache' }
        });
        const reportsResult = await reportsResponse.json().catch(() => ({}));
        if (!reportsResponse.ok) throw new Error(reportsResult?.error || 'Gagal memuat laporan perusahaan dari D1.');
        if (active) {
          setTenantLoadError(null);
          const items = Array.isArray(reportsResult?.items) ? reportsResult.items : [];
          setReports(items.map((d: any) => ({
            ...d,
            id: String(d.id),
            companyId: d.companyId || d.company_id || canonicalId,
            judul: d.judul || d.title || 'Laporan Dugaan Pelanggaran',
            kategori: d.kategori || d.category || 'Umum',
            tipePelanggaran: d.tipePelanggaran || d.violation_type || (d.estimasiKerugian || d.estimated_loss ? 'finansial' : 'etik'),
            estimasiKerugian: Number(d.estimasiKerugian ?? d.estimated_loss ?? 0),
            rewardMinAmount: Number(d.rewardMinAmount ?? d.reward_min_amount ?? 0),
            rewardAmount: d.rewardAmount !== undefined ? Number(d.rewardAmount) : d.reward_amount !== undefined ? Number(d.reward_amount) : undefined,
            deskripsi: d.deskripsi || d.description || '',
            tanggalKejadian: d.tanggalKejadian || d.incident_date,
            lokasi: d.lokasi || d.location,
            status: d.status || 'baru',
            tokenAkses: '', // Claim ticket identifiers are reserved for reporters and Super Admin.
            buktiFiles: (Array.isArray(d.buktiFiles) ? d.buktiFiles : [])
              .map((file: unknown) => normalizeEvidenceUrl(file))
              .filter((url: string) => Boolean(url)),
            rewardClaimed: Boolean(d.rewardClaimed ?? d.reward_claimed),
            rewardReleased: Boolean(d.rewardReleased ?? d.reward_released),
            auditorName: d.auditorName || d.auditor_name || d.targetAuditorName,
            companyCaseStatus: d.companyCaseStatus || (d.status === 'valid' ? 'menunggu_ambil' : d.status === 'selesai' ? 'selesai' : undefined),
            createdAt: d.createdAt || d.created_at
          } as WhistleblowingReport)));
        }
      } catch (error) {
        console.error('Gagal menyegarkan data tenant dari D1:', error);
        // Never present a failed database read as a genuine empty tenant.
        setTenantLoadError(error instanceof Error ? error.message : 'Data gagal dimuat dari database. Sistem akan mencoba lagi otomatis.');
      } finally {
        tenantRefreshInFlight = false;
        if (active) setDataReady(true);
      }
    };
    void loadCanonicalTenantData();
    const timer = window.setInterval(() => { void loadCanonicalTenantData(); }, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [user?.id, user?.uid, user?.email, user?.role, authLoading, effectiveCompanyId]);

  const namaPT = companyProfile?.namaPT || 'PT Anda';
  // Canonical tenant funds come from the companies row (D1 deposit_balance).
  const saldoTerbuka = Number((companyProfile as any)?.deposit_balance ?? companyProfile?.danaTersedia ?? companyProfile?.saldo ?? 0);
  const danaTersedia = saldoTerbuka;

  // HANDLER: DEPOSIT SALDO (QRIS & BANK) - Menunggu Verifikasi Administrator
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || depositAmount <= 0) return;
    if (!paymentProof) {
      setActionFeedback({ type: 'error', message: 'Unggah bukti pembayaran terlebih dahulu sebelum mengajukan deposit.' });
      return;
    }

    try {
      setProcessingDeposit(true);
      const response = await fetch('/api/company/data', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          operation: 'create-transaction',
          data: {
            userName: namaPT,
            type: 'deposit',
            amount: depositAmount,
            method: depositMethod,
            paymentProofName: paymentProof.name,
            paymentProofType: paymentProof.type,
            paymentProofDataUrl: paymentProof.dataUrl,
            keterangan: `Deposit saldo perusahaan via ${depositMethod}: Rp ${depositAmount.toLocaleString('id-ID')} (Menunggu verifikasi Administrator)`
          }
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) throw new Error(result?.error || 'Gagal menyimpan deposit ke database.');

      setShowDepositModal(false);
      setPaymentProof(null);
      setActionFeedback({
        type: 'success',
        message: `Permintaan deposit Rp ${depositAmount.toLocaleString('id-ID')} berhasil diajukan! Semua transaksi akan diverifikasi oleh Administrator sebelum saldo aktif ditambahkan.`
      });
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: 'Gagal mengajukan deposit: ' + err.message
      });
    } finally {
      setProcessingDeposit(false);
    }
  };

  // HANDLER: NOWPAYMENTS CRYPTO DEPOSIT CONFIRMATION
  const handleNowPaymentsConfirm = async (cryptoInfo: {
    cryptoCurrency: string;
    cryptoAmount: number;
    txHash: string;
    apiKeyUsed: string;
  }) => {
    if (!user || depositAmount <= 0) return;
    if (!paymentProof) {
      setActionFeedback({ type: 'error', message: 'Unggah bukti pembayaran terlebih dahulu sebelum mengajukan deposit.' });
      return;
    }

    try {
      setProcessingDeposit(true);
      const method = `NOWPayments (${cryptoInfo.cryptoCurrency})`;
      const response = await fetch('/api/company/data', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          operation: 'create-transaction',
          data: {
            userName: namaPT,
            type: 'deposit',
            amount: depositAmount,
            method,
            cryptoCurrency: cryptoInfo.cryptoCurrency,
            cryptoAmount: cryptoInfo.cryptoAmount,
            txHash: cryptoInfo.txHash,
            paymentProofName: paymentProof.name,
            paymentProofType: paymentProof.type,
            paymentProofDataUrl: paymentProof.dataUrl,
            keterangan: `Deposit Crypto via NOWPayments: ${cryptoInfo.cryptoAmount} ${cryptoInfo.cryptoCurrency} (TXID: ${cryptoInfo.txHash}) - Menunggu verifikasi Administrator`
          }
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) throw new Error(result?.error || 'Gagal menyimpan konfirmasi deposit ke database.');

      setShowNowPaymentsModal(false);
      setShowDepositModal(false);
      setPaymentProof(null);
      setActionFeedback({
        type: 'success',
        message: `Konfirmasi deposit crypto sebesar ${cryptoInfo.cryptoAmount} ${cryptoInfo.cryptoCurrency} (setara Rp ${depositAmount.toLocaleString('id-ID')}) berhasil dikirim! Administrator akan memverifikasi TXID blockchain sebelum saldo aktif ditambahkan.`
      });
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: 'Gagal konfirmasi pembayaran crypto: ' + err.message
      });
    } finally {
      setProcessingDeposit(false);
    }
  };

  // HANDLER: SIMPAN KEBIJAKAN REWARD PERUSAHAAN (ETIK & FINANSIAL MIN 10%)
  const handleSaveRewardPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (policyFinansialPersen < 10) {
      alert('Ketentuan wajib: Persentase reward kasus finansial minimal adalah 10% dari nilai kerugian terverifikasi.');
      return;
    }
    if (policyEtikNominal < 100000) {
      alert('Ketentuan: Reward kasus pelanggaran etik minimal adalah Rp 100.000 (dapat disesuaikan dengan kebijakan perusahaan).');
      return;
    }

    try {
      setSavingPolicy(true);
      const kebijakanReward = {
        rewardKasusEtik: Number(policyEtikNominal),
        persenFinansial: Number(policyFinansialPersen),
        minPersenFinansial: 2
      };
      const response = await fetch('/api/company/data', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ operation: 'save-company-profile', data: { kebijakanReward } })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || 'Kebijakan reward gagal disimpan ke database D1.');
      }
      setCompanyProfile((prev) => prev ? ({ ...prev, kebijakanReward }) : prev);

      setShowRewardPolicyModal(false);
      setActionFeedback({
        type: 'success',
        message: `Kebijakan reward berhasil diperbarui (Kasus Etik: Rp ${Number(policyEtikNominal).toLocaleString('id-ID')} - min Rp 100.000, Kasus Finansial: ${policyFinansialPersen}% - min 10%).`
      });
    } catch (err: any) {
      alert('Gagal menyimpan kebijakan reward: ' + err.message);
    } finally {
      setSavingPolicy(false);
    }
  };

  // Format Remaining Time Helper
  const formatRemainingTime = (deadlineIso?: string) => {
    if (!deadlineIso) return { text: '24:00:00', isExpired: false };
    const diff = new Date(deadlineIso).getTime() - now;
    if (diff <= 0) return { text: '00:00:00 (Sistem Merilis...)', isExpired: true };
    const totalSec = Math.floor(diff / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const text = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return { text, isExpired: false };
  };

  // 1. Ambil Kasus Handler
  const handleTakeCase = async (report: WhistleblowingReport) => {
    if (!report.id || !user) return;

    try {
      setActionLoadingId(report.id);
      setActionFeedback(null);

      // Deadline 24 jam ke depan
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const response = await fetch('/api/company/data', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ operation: 'take-case', id: report.id })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) throw new Error(result?.error || 'Gagal menyimpan status kasus ke D1.');

      setActionFeedback({
        type: 'success',
        message: `Kasus "${report.judul}" berhasil diambil! Akses bukti dan uraian investigasi telah dibuka. Anda wajib mengenakan sanksi pada oknum dan merilis reward dalam 1x24 jam.`
      });
    } catch (err: any) {
      console.error('Error taking case:', err);
      setActionFeedback({
        type: 'error',
        message: 'Gagal mengambil kasus: ' + (err.message || 'Terjadi kesalahan sistem')
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reward otomatis diproses dari saldo aktif perusahaan saat laporan berstatus VALID.
  const handleReleaseReward = async (report: WhistleblowingReport, isAuto = true) => {
    if (!user || !report.id || report.rewardReleased) return;
    const attemptKey = `${report.id}:${saldoTerbuka}`;
    if (isAuto && autoRewardAttempts.current.has(attemptKey)) return;
    if (isAuto) autoRewardAttempts.current.add(attemptKey);
    const kerugian = Number(report.estimasiKerugian || 0);
    const minReward = report.tipePelanggaran === 'finansial'
      ? Math.ceil(kerugian * 0.10)
      : Math.max(100000, Number(companyProfile?.kebijakanReward?.rewardKasusEtik || 100000));
    const nominalReward = Math.max(Number(report.rewardAmount || report.rewardMinAmount || 0), minReward);

    try {
      setActionLoadingId(report.id);
      setActionFeedback(null);
      const response = await fetch('/api/company/data', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'release-reward', id: report.id, rewardAmount: nominalReward })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Reward tidak dapat diproses.');
      }
      setActionFeedback({
        type: 'success',
        message: `Reward Rp ${Number(result.rewardAmount || nominalReward).toLocaleString('id-ID')} berhasil dirilis otomatis setelah laporan VALID. Saldo aktif perusahaan tersisa Rp ${Number(result.remainingBalance || 0).toLocaleString('id-ID')}.`
      });
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: 'Gagal merilis reward: ' + (err.message || 'Terjadi kesalahan sistem')
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Automatic release is triggered for every newly VALID report; no 24-hour timer or locked balance is used.
  useEffect(() => {
    reports.forEach((rep) => {
      if (rep.id && String(rep.status || '').toLowerCase() === 'valid' && !rep.rewardReleased && actionLoadingId !== rep.id) {
        handleReleaseReward(rep, true);
      }
    });
  }, [reports, actionLoadingId, saldoTerbuka]);

  // Save Nominal Reward (Optional adjustment by company)
  const handleSaveReward = async (report: WhistleblowingReport) => {
    if (!report.id) return;
    const cleanAmount = Number(rewardInputVal.replace(/\D/g, '')) || 0;

    if (String(report.tipePelanggaran || '').toLowerCase().includes('finansial') || String(report.tipePelanggaran || '').toLowerCase().includes('financial') || Number(report.estimasiKerugian || 0) > 0) {
      const min10Percent = Math.ceil((report.estimasiKerugian || 0) * 0.10);
      if (cleanAmount < min10Percent) {
        setActionFeedback({
          type: 'error',
          message: `Untuk pelanggaran finansial, reward minimal adalah 10% dari kerugian terverifikasi (minimal Rp ${min10Percent.toLocaleString('id-ID')}).`
        });
        return;
      }
    } else {
      if (cleanAmount < 100000) {
        setActionFeedback({
          type: 'error',
          message: 'Untuk pelanggaran etik, reward minimal adalah Rp 100.000 dan dapat disesuaikan dengan kebijakan perusahaan.'
        });
        return;
      }
    }

    try {
      setActionLoadingId(report.id);
      setActionFeedback(null);
      const response = await fetch('/api/company/data', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ operation: 'set-report-reward', id: report.id, rewardAmount: cleanAmount })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) throw new Error(result?.error || 'Gagal menyimpan reward ke D1.');
      setEditingRewardReportId(null);
      setRewardInputVal('');
      setActionFeedback({
        type: 'success',
        message: `Besaran reward untuk laporan "${report.judul}" berhasil disesuaikan menjadi Rp ${cleanAmount.toLocaleString('id-ID')}.`
      });
    } catch (err: any) {
      console.error('Error saving reward:', err);
      setActionFeedback({
        type: 'error',
        message: 'Gagal memperbarui reward: ' + (err.message || 'Terjadi kesalahan')
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter reports
  const filteredReports = reports.filter((r) => {
    if (reportFilter === 'all') return true;
    if (reportFilter === 'menunggu_ambil') {
      return r.companyCaseStatus === 'menunggu_ambil' || (r.status === 'valid' && !r.takenAt);
    }
    if (reportFilter === 'kasus_diambil') {
      return r.companyCaseStatus === 'kasus_diambil' && !r.rewardReleased;
    }
    if (reportFilter === 'selesai') {
      return r.rewardReleased === true || r.status === 'selesai';
    }
    return true;
  });

  const countMenungguAmbil = reports.filter((r) => r.companyCaseStatus === 'menunggu_ambil' || (r.status === 'valid' && !r.takenAt)).length;
  const countSedangInvestigasi = reports.filter((r) => r.companyCaseStatus === 'kasus_diambil' && !r.rewardReleased).length;
  const countSelesai = reports.filter((r) => r.rewardReleased || r.status === 'selesai').length;

  if (companyProfile?.status === 'SUSPENDED') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-xl shadow-red-500/10">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
          Akses Perusahaan Ditangguhkan (SUSPENDED)
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          Akun perusahaan "{namaPT}" ({effectiveCompanyId}) sedang ditangguhkan oleh Super Admin.
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
    <div className="tenant-dashboard-v18 min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="tenant-dashboard-content max-w-7xl mx-auto space-y-6">
        {tenantLoadError && (
          <div role="alert" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            <div className="font-bold">Data belum berhasil dimuat dari database</div>
            <p className="mt-1 text-amber-100/80">{tenantLoadError}</p>
            <p className="mt-1 text-xs text-amber-100/70">Data tidak dihapus. Halaman akan mencoba memuat ulang otomatis; jangan membuat data atau transaksi duplikat.</p>
          </div>
        )}
        {/* Top Company Executive Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              {/* Corporate Monogram Emblem */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-800 via-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-black text-amber-400 text-lg shadow-md shrink-0">
                {(namaPT || 'PT').replace(/PT|CV|\./gi, '').trim().slice(0, 2).toUpperCase() || 'PT'}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold font-mono uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5" />
                    perusahaan
                  </div>
                  {companyProfile?.statusVerifikasiDokumen === 'terverifikasi' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Kepatuhan Terverifikasi ISO 37002
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Status Kepatuhan: Review
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {namaPT}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-medium">
                    <span>Sektor: <strong className="text-slate-200">{companyProfile?.sektor || '-'}</strong></span>
                    <span className="text-slate-700">·</span>
                    <span>Alamat: <span className="text-slate-300">{companyProfile?.alamat || '-'}</span></span>
                    <span className="text-slate-700">·</span>
                    <span>PIC: <span className="text-slate-300">{companyProfile?.picName || user?.email}</span></span>
                    {companyProfile?.npwp && (
                      <>
                        <span className="text-slate-700">·</span>
                        <span>NPWP: <span className="text-slate-300 font-mono">{companyProfile.npwp}</span></span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                id="btn-generate-poster-pt"
                onClick={() => setIsPosterModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <QrCode className="w-4 h-4 text-slate-950" />
                <span>Unduh Poster Whistleblowing</span>
              </button>

              <button
                onClick={() => setShowRewardPolicyModal(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                title="Kebijakan Reward Pelapor (Etik & Min 10% Finansial)"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Kebijakan Reward</span>
              </button>

              <button
                onClick={() => navigate('/profile')}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Profil & Keuangan</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Financial & Governance Command Center Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Saldo Kas Bebas */}
          <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-400 uppercase tracking-wider font-mono">
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-blue-400" />
                  Saldo Kas Bebas
                </span>
                <span className="text-[10px] text-blue-300 font-mono bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded">
                  LIQUID
                </span>
              </div>
              <div className="text-3xl font-black font-mono tracking-tight text-white">
                Rp {saldoTerbuka.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Saldo aktif perusahaan yang tersedia untuk operasional reward pelapor.
              </p>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center gap-2">
              <button
                onClick={() => { setPaymentProof(null); setShowDepositModal(true); }}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                Deposit
              </button>

            </div>
          </div>

          {/* Card 3: Kebijakan Reward & Biaya Investigasi */}
          <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Kebijakan Reward & Audit
                </span>
                <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                  ISO 37002
                </span>
              </div>
              
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Reward Kasus Etik:</span>
                  <span className="font-mono font-bold text-amber-400">Rp {policyEtikNominal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Reward Kasus Finansial:</span>
                  <span className="font-mono font-bold text-blue-400">{policyFinansialPersen}% kerugian</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Biaya Auditor Independen:</span>
                  <span className="font-mono font-bold text-emerald-400">Rp 150.000 / kasus</span>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-slate-500 border-t border-slate-800/80">
                Total Aset Entitas: <strong className="text-white font-mono">Rp {totalAset.toLocaleString('id-ID')}</strong>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
              <button
                onClick={() => setShowRewardPolicyModal(true)}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20"
              >
                <Sliders className="w-3.5 h-3.5" />
                Ubah Kebijakan
              </button>
              <button
                onClick={() => setIsPosterModalOpen(true)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                title="Cetak Poster HD"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Executive KPI Stats Bar (4 Columns) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Laporan Masuk</div>
              <div className="text-2xl font-black font-mono text-white mt-1">{reports.length}</div>
            </div>
            <FileText className="w-6 h-6 text-slate-600" />
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-400 font-medium">Perlu Diambil Kasus</div>
              <div className="text-2xl font-black font-mono text-blue-300 mt-1">{countMenungguAmbil}</div>
            </div>
            <AlertCircle className="w-6 h-6 text-blue-500/50" />
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-amber-400 font-medium">Investigasi & SLA 24h</div>
              <div className="text-2xl font-black font-mono text-amber-300 mt-1">{countSedangInvestigasi}</div>
            </div>
            <Clock className="w-6 h-6 text-amber-500/50" />
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-400 font-medium">Selesai & Dirilis</div>
              <div className="text-2xl font-black font-mono text-emerald-300 mt-1">{countSelesai}</div>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-500/50" />
          </div>
        </div>

        {/* Laporan Whistleblowing Masuk untuk PT ini */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Berkas Investigasi & Kasus Whistleblowing
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Alur ISO 37002: Verifikasi Auditor &rarr; Ambil Kasus & Buka Bukti &rarr; Sanksi Disipliner &rarr; Rilis Reward (Auto 1x24 Jam)
              </p>
            </div>

            {/* Filter Tabs (Segmented Control) */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {[
                { id: 'all', label: `Semua (${reports.length})` },
                {
                  id: 'menunggu_ambil',
                  label: `Perlu Diambil (${countMenungguAmbil})`
                },
                {
                  id: 'kasus_diambil',
                  label: `Investigasi (${countSedangInvestigasi})`
                },
                {
                  id: 'selesai',
                  label: `Selesai (${countSelesai})`
                }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setReportFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    reportFilter === tab.id
                      ? 'bg-blue-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {actionFeedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-fadeIn ${
                actionFeedback.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-red-950/60 border-red-500/50 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {actionFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{actionFeedback.message}</span>
              </div>
              <button
                onClick={() => setActionFeedback(null)}
                className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}

          {filteredReports.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/40" />
              <p className="text-sm font-medium text-slate-300">Tidak ada kasus pada kategori ini.</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Laporan pelanggaran yang diverifikasi auditor akan muncul di sini untuk diambil kasusnya oleh perusahaan.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredReports.map((report) => {
                const kerugian = Number(report.estimasiKerugian || 0);
                const isFinansial = String(report.tipePelanggaran || '').toLowerCase().includes('finansial') || String(report.tipePelanggaran || '').toLowerCase().includes('financial') || kerugian > 0;
                const min10Persen = Math.ceil(kerugian * 0.10);
                const currentReward = report.rewardAmount !== undefined ? report.rewardAmount : (isFinansial ? min10Persen : 5000000);
  const auditorFee = Number(report.biayaAuditor || 150000);

                const isNeedsTake = report.companyCaseStatus === 'menunggu_ambil' || (report.status === 'valid' && !report.takenAt);
                const isTakenInProgress = report.companyCaseStatus === 'kasus_diambil' && !report.rewardReleased;
                const isReleased = report.rewardReleased === true || report.status === 'selesai';
                const isProcessing = actionLoadingId === report.id;
                const isEditingReward = editingRewardReportId === report.id;

                const timerInfo = formatRemainingTime(report.autoReleaseDeadline);

                return (
                  <div
                    key={report.id}
                    className={`p-6 rounded-2xl border transition-all space-y-5 shadow-xl ${
                      isNeedsTake
                        ? 'bg-slate-950/90 border-blue-500/40 ring-1 ring-blue-500/20'
                        : isTakenInProgress
                        ? 'bg-slate-950/90 border-amber-500/40 ring-1 ring-amber-500/20'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    {/* Header Baris 1: Judul, Status Verifikasi Auditor & Perusahaan */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-white">{report.judul}</span>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                          {report.kategori}
                        </span>

                        {isFinansial ? (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                            <Coins className="w-3 h-3 text-amber-400" />
                            Pelanggaran Finansial
                          </span>
                        ) : (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1">
                            <Scale className="w-3 h-3 text-purple-400" />
                            Pelanggaran Etik
                          </span>
                        )}

                        <span className="text-[10px] font-mono text-slate-400">ID klaim dirahasiakan untuk menjaga anonimitas pelapor.</span>
                      </div>

                      {/* Status Workflow Tag */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isNeedsTake ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            Valid Auditor: Perlu Tindakan
                          </div>
                        ) : isTakenInProgress ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                            Investigasi Perusahaan (SLA 24 Jam)
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            Reward Dirilis & Kasus Selesai
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TAHAP 1: KASUS BELUM DIAMBIL (HARUS KLIK AMBIL KASUS) */}
                    {isNeedsTake && (
                      <div className="p-5 rounded-2xl bg-blue-950/30 border border-blue-500/40 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="space-y-1">
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                              <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                              Laporan Telah Dinyatakan VALID oleh Auditor Independen
                            </div>
                            <p className="text-xs text-slate-300">
                              Auditor penelaah: <strong className="text-emerald-400">{report.auditorName || 'Auditor Independen'}</strong> • Biaya Jasa: <strong className="text-emerald-400 font-mono">Rp {auditorFee.toLocaleString('id-ID')}</strong>
                            </p>
                          </div>

                          <button
                            disabled={isProcessing}
                            onClick={() => handleTakeCase(report)}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer shrink-0 transition-transform active:scale-95"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                            Ambil Kasus & Buka Bukti
                          </button>
                        </div>

                        {/* Catatan Auditor */}
                        {report.catatanAuditor && (
                          <div className="p-3 bg-slate-900/90 rounded-xl border border-blue-500/20 text-xs text-slate-300">
                            <span className="text-[11px] font-semibold text-blue-300 block mb-0.5">Catatan Validasi Auditor:</span>
                            "{report.catatanAuditor}"
                          </div>
                        )}

                        {/* Locked Evidence Placeholder */}
                        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center space-y-2 text-xs text-slate-400">
                          <Lock className="w-6 h-6 text-slate-500 mx-auto" />
                          <p className="font-semibold text-slate-300">
                            Bukti Dokumen/Foto & Kronologi Lengkap Sedang Terkunci
                          </p>
                          <p className="text-[11px] max-w-lg mx-auto text-slate-400">
                            Sesuai SOP, perusahaan wajib mengklik tombol <strong>"Ambil Kasus & Buka Bukti"</strong> untuk membuka berkas laporan, melakukan tindakan disipliner pada oknum karyawan, dan memulai hitung mundur 1x24 jam rilis reward.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* TAHAP 2: KASUS SUDAH DIAMBIL ATAU SUDAH DIRILIS (BUKTI TERBUKA) */}
                    {!isNeedsTake && (
                      <div className="space-y-4">
                        {/* Deskripsi Laporan Lengkap */}
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-slate-400">Kronologi & Uraian Dugaan Pelanggaran:</span>
                          <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 whitespace-pre-wrap">
                            {report.deskripsi}
                          </p>
                        </div>

                        {/* Galeri Bukti Dokumen / Foto */}
                        {report.buktiFiles && report.buktiFiles.length > 0 && (
                          <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
                            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                              <FileCheck className="w-4 h-4 text-emerald-400" />
                              Berkas Bukti / Dokumen Investigasi ({report.buktiFiles.length} Berkas):
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                              {report.buktiFiles.map((bUrl, idx) => (
                                <div key={idx} className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow">
                                  <a
                                    href={bUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group relative block hover:border-amber-400"
                                    aria-label={`Buka bukti laporan ${idx + 1} di tab baru`}
                                  >
                                    {/^data:image\\//i.test(bUrl) || /\\.(png|jpe?g|gif|webp|bmp)(?:[?#]|$)/i.test(bUrl) ? (
                                      <img
                                        src={bUrl}
                                        alt={`Pratinjau bukti ${idx + 1}`}
                                        className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                                      />
                                    ) : (
                                      <div className="w-full h-24 flex flex-col items-center justify-center gap-1 text-slate-300">
                                        <FileCheck className="w-6 h-6 text-emerald-400" />
                                        <span className="text-[10px]">Dokumen bukti #{idx + 1}</span>
                                      </div>
                                    )}
                                    <div className="bg-slate-900 p-1.5 text-[10px] text-center text-slate-300 font-medium">
                                      Buka Bukti #{idx + 1}
                                    </div>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => void downloadReportEvidence(bUrl, `Bukti_Laporan_${idx + 1}`)}
                                    className="w-full flex items-center justify-center gap-1.5 p-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border-t border-emerald-400/30 transition-colors"
                                    aria-label={`Download file bukti laporan ${idx + 1}`}
                                    title={`Unduh bukti laporan ${idx + 1}`}
                                  >
                                    <Download className="w-4 h-4" />
                                    Download File
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Info Kerugian & Auditor */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {isFinansial && (
                            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-amber-300/90 space-y-1">
                              <div className="font-semibold text-amber-200 flex items-center gap-1">
                                <Coins className="w-3.5 h-3.5 text-amber-400" />
                                Estimasi Nilai Kerugian:
                              </div>
                              <div className="text-base font-bold font-mono text-white">
                                Rp {kerugian.toLocaleString('id-ID')}
                              </div>
                              <div className="text-[11px] text-amber-400/90">
                                Aturan reward: Minimal 10% dari kerugian terverifikasi = <strong>Rp {min10Persen.toLocaleString('id-ID')}</strong>
                              </div>
                            </div>
                          )}

                          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-300 space-y-1">
                            <div className="font-semibold text-slate-200 flex items-center gap-1 text-xs">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                              Auditor Independen Penelaah:
                            </div>
                            <div className="text-xs font-bold text-emerald-400">
                              {report.auditorName || 'Auditor Terpilih'} • Biaya Jasa: Rp {auditorFee.toLocaleString('id-ID')}
                            </div>
                            {report.catatanAuditor ? (
                              <p className="text-[11px] text-slate-300 italic pt-0.5">"{report.catatanAuditor}"</p>
                            ) : (
                              <p className="text-[11px] text-slate-500 italic pt-0.5">Verifikasi validitas telah terbit.</p>
                            )}
                          </div>
                        </div>

                        {/* TAHAP 2A: SEDANG DIINVESTIGASI OLEH PERUSAHAAN (1x24 JAM TIMER & FORM SANKSI) */}
                        {isTakenInProgress && (
                          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 border border-amber-500/40 space-y-4">
                            {/* Live Countdown Timer Widget */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/30">
                              <div className="space-y-0.5">
                                <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                                  Batas Waktu Rilis Reward (Maksimal 1x24 Jam)
                                </div>
                                <p className="text-[11px] text-slate-400">
                                  Jika perusahaan tidak merilis reward sebelum batas waktu, sistem otomatis mengeksekusi rilis reward & memotong saldo lock.
                                </p>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="text-lg sm:text-xl font-black font-mono text-amber-400 tracking-wider">
                                  {timerInfo.text}
                                </div>
                                <span className="text-[10px] text-slate-400 block">Sisa Waktu Otomatisasi</span>
                              </div>
                            </div>

                            {/* Form Input Sanksi Karyawan */}
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-slate-200">
                                Keterangan Tindakan Sanksi Karyawan / Oknum Terlapor:
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Contoh: Dikenakan sanksi Surat Peringatan III (SP3), pencopotan jabatan, dan pengembalian aset/kerugian perusahaan..."
                                value={sanksiInputMap[report.id!] || ''}
                                onChange={(e) =>
                                  setSanksiInputMap((prev) => ({
                                    ...prev,
                                    [report.id!]: e.target.value
                                  }))
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                              />
                            </div>

                            {/* Rincian reward dari saldo aktif perusahaan */}
                            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
                              <div className="flex flex-wrap items-center justify-between text-slate-300">
                                <span>Nominal Reward Pelapor:</span>
                                <span className="font-mono font-bold text-amber-400">Rp {currentReward.toLocaleString('id-ID')}</span>
                              </div>
                              <div className="flex flex-wrap items-center justify-between font-bold text-white pt-1 border-t border-slate-800">
                                <span>Reward yang diproses dari saldo aktif:</span>
                                <span className="font-mono text-emerald-300">Rp {currentReward.toLocaleString('id-ID')}</span>
                              </div>
                            </div>

                            {/* Tombol Rilis Reward */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                              <div className="text-[11px] text-slate-400">
                                Reward akan diproses otomatis saat laporan dinyatakan VALID, dengan syarat saldo aktif mencukupi.
                              </div>

                              <button
                                disabled={isProcessing}
                                onClick={() => handleReleaseReward(report, false)}
                                className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950 cursor-pointer transition-transform active:scale-95"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                                Proses Reward (Rp {currentReward.toLocaleString('id-ID')})
                              </button>
                            </div>
                          </div>
                        )}

                        {/* TAHAP 2B: REWARD TELAH DIRILIS (SELESAI) */}
                        {isReleased && (
                          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-3 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>
                                  Reward Berhasil Dirilis ({report.rewardReleaseType === 'auto_valid' ? 'Otomatis setelah status VALID' : 'Sistem'})
                                </span>
                              </div>
                              <span className="text-[11px] text-emerald-400 font-mono">
                                Reward dari Saldo Aktif: Rp {Number(report.rewardAmount || currentReward).toLocaleString('id-ID')}
                              </span>
                            </div>

                            {report.sanksiKaryawan && (
                              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-emerald-500/20 text-slate-300">
                                <span className="text-[11px] font-semibold text-emerald-300 block mb-0.5">Sanksi Karyawan Diterapkan:</span>
                                {report.sanksiKaryawan}
                              </div>
                            )}

                            {/* Rekening Tujuan Pelapor jika sudah diklaim */}
                            {report.rewardClaimBank ? (
                              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                <span>Tujuan Transfer: <strong>{report.rewardClaimBank.bankName}</strong> ({report.rewardClaimBank.accountNumber} a/n {report.rewardClaimBank.holderName})</span>
                                {report.whatsappPelapor && <span className="text-emerald-400">WA: {report.whatsappPelapor}</span>}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 italic">
                                Nomor tiket klaim hanya dapat dilihat oleh pelapor dan Super Admin.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer Info */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-900">
                      <span>
                        Pelapor: {report.pelaporAnonim ? '100% Anonim' : 'Identitas Terproteksi'}
                        {report.whatsappPelapor && ` • WA Notif: ${report.whatsappPelapor}`}
                      </span>
                      <span className="text-slate-500 italic">Kerahasiaan Pelapor Terjamin Mutlak</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SOP Penempelan Poster */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Info className="w-4 h-4 text-amber-400" />
            Panduan Kepatuhan Penempelan Poster Whistleblowing
          </div>
          <p className="leading-relaxed">
            Perusahaan yang telah menempelkan poster resmi integritas wajib mematuhi alur penanganan laporan. Ketika auditor independen menelaah berkas dan menyatakan valid, manajemen perusahaan diberikan akses investigasi penuh setelah mengklik <strong>"Ambil Kasus"</strong>. Penetapan sanksi terhadap karyawan pelanggar serta rilis reward harus diselesaikan dalam kurun waktu <strong>1x24 jam</strong>.
          </p>
        </div>
      </div>

      {/* Poster HD Modal Component */}
      <PosterModal
        isOpen={isPosterModalOpen}
        onClose={() => setIsPosterModalOpen(false)}
        company={{
          uid: String(companyProfile?.company_id || companyProfile?.perusahaanId || (companyProfile as any)?.companyId || (user?.uid || user?.id) || ''),
          namaPT: companyProfile?.namaPT || (companyProfile as any)?.company_name || 'PT Anda',
          danaTersedia: Number((companyProfile as any)?.deposit_balance ?? (companyProfile as any)?.danaTersedia ?? 0),
          rewardBalance: Number((companyProfile as any)?.deposit_balance ?? (companyProfile as any)?.danaTersedia ?? 0),
          sektor: companyProfile?.sektor,
        }}
      />

      {/* MODAL 2: DEPOSIT SALDO PERUSAHAAN (QRIS & CRYPTO) */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 my-6 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Deposit Saldo Perusahaan</h3>
                  <p className="text-[11px] text-slate-400">Pilih metode pembayaran resmi INTEGRITAS360</p>
                </div>
              </div>
              <button
                onClick={() => { setShowDepositModal(false); setPaymentProof(null); }}
                className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setDepositTab('qris')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  depositTab === 'qris'
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>QRIS Nasional</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDepositTab('nowpayments');
                  setShowNowPaymentsModal(true);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  depositTab === 'nowpayments'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>NOWPayments (Crypto)</span>
              </button>

            </div>

            {/* Konten QRIS; transaksi crypto dibuka melalui NOWPayments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Kolom Kiri: Visual Pembayaran */}
              <div className="flex flex-col items-center">
                {depositTab === 'qris' ? (
                  <>
                    <p className="text-xs font-semibold text-slate-300 mb-2 text-center">
                      Pindai QRIS Statis Resmi (NMID: ID1026539516033)
                    </p>
                    <QrisStaticCard nominal={depositAmount} companyName="INTEGRITAS360" showRewardBalance={false} />
                  </>
                ) : (
                  <div className="w-full p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 text-xs text-cyan-100">
                    Pembayaran crypto dilakukan melalui jendela NOWPayments. Pilih QRIS untuk melihat kode QR dan mengajukan deposit QRIS.
                  </div>
                )}
              </div>

              {/* Kolom Kanan: Form Input Nominal & Konfirmasi */}
              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nominal Deposit (Rupiah) *
                  </label>
                  <input
                    type="number"
                    min={500000}
                    step={500000}
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold text-blue-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Pilihan Cepat Nominal:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1000000, 2500000, 5000000, 10000000, 25000000, 50000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-mono transition-colors border cursor-pointer ${
                          depositAmount === amt
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 font-bold'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        +{amt / 1000000} Jt
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Metode Pembayaran</label>
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white">
                    QRIS Statis Nasional (Semua Bank &amp; E-Wallet)
                  </div>
                </div>

                <div>
                  <label htmlFor="deposit-payment-proof" className="block text-xs font-semibold text-slate-300 mb-1.5">Bukti Pembayaran * (JPG, PNG, WEBP, atau PDF; maks. 1,5 MB)</label>
                  <input
                    id="deposit-payment-proof"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    required
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      if (!file) { setPaymentProof(null); return; }
                      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
                      if (!allowed.includes(file.type)) {
                        setPaymentProof(null);
                        e.currentTarget.value = '';
                        setActionFeedback({ type: 'error', message: 'Format bukti pembayaran harus JPG, PNG, WEBP, atau PDF.' });
                        return;
                      }
                      if (file.size > 1.5 * 1024 * 1024) {
                        setPaymentProof(null);
                        e.currentTarget.value = '';
                        setActionFeedback({ type: 'error', message: 'Ukuran bukti pembayaran maksimal 1,5 MB.' });
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') setPaymentProof({ name: file.name, type: file.type, dataUrl: reader.result });
                      };
                      reader.onerror = () => setActionFeedback({ type: 'error', message: 'Bukti pembayaran gagal dibaca. Silakan pilih file kembali.' });
                      reader.readAsDataURL(file);
                    }}
                    className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-500/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-300 hover:file:bg-blue-500/25 bg-slate-950 border border-slate-800 rounded-xl p-2"
                  />
                  {paymentProof && <p className="mt-1.5 text-[11px] text-emerald-300">Bukti dipilih: {paymentProof.name}</p>}
                  <p className="mt-1 text-[10px] text-slate-500">Bukti ini akan dilampirkan pada transaksi untuk diperiksa Administrator sebelum saldo ditambahkan.</p>
                </div>

                {/* Admin Verification Requirement Notice */}
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-[11px] text-blue-200 leading-relaxed space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-blue-300">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Ketentuan Verifikasi Administrator:
                  </div>
                  <p className="text-slate-300">
                    Semua transaksi deposit melalui QRIS atau NOWPayments <strong>akan diverifikasi oleh Administrator</strong> sebelum saldo aktif ditambahkan ke akun Anda.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowDepositModal(false); setPaymentProof(null); }}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                  >
                    Batal
                  </button>

                  {depositMethod.includes('NOWPayments') ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!paymentProof) {
                          setActionFeedback({ type: 'error', message: 'Unggah bukti pembayaran terlebih dahulu.' });
                          return;
                        }
                        setShowNowPaymentsModal(true);
                      }}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <Coins className="w-4 h-4" />
                      Buka Pembayaran Crypto
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={processingDeposit}
                      className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60 cursor-pointer"
                    >
                      {processingDeposit ? 'Memproses...' : 'Konfirmasi Sudah Transfer'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* NOWPAYMENTS CRYPTO MODAL */}
      <NowPaymentsModal
        isOpen={showNowPaymentsModal}
        onClose={() => setShowNowPaymentsModal(false)}
        depositAmountIdr={depositAmount}
        onConfirmDeposit={handleNowPaymentsConfirm}
        isProcessing={processingDeposit}
      />

      {/* MODAL 3: KEBIJAKAN BESARAN REWARD (ETIK & FINANSIAL MIN 10%) */}
      {showRewardPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Kebijakan Besaran Reward Whistleblower</h3>
                  <p className="text-[11px] text-slate-400">Pengaturan standar reward untuk kasus Etik & Finansial</p>
                </div>
              </div>
              <button
                onClick={() => setShowRewardPolicyModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRewardPolicy} className="space-y-4">
              {/* Kasus Etik */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-blue-400" />
                  1. Besaran Reward Kasus Pelanggaran Etik (Nominal Tetap)
                </label>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Diberikan kepada pelapor atas kasus non-finansial (pelecehan, gratifikasi etik, konflik kepentingan, dll). Minimal Rp 100.000 dan dapat disesuaikan dengan kebijakan perusahaan.
                </p>
                <div className="relative mt-1">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    min={100000}
                    step={50000}
                    required
                    value={policyEtikNominal}
                    onChange={(e) => setPolicyEtikNominal(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-mono font-bold text-blue-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  * Minimal Rp 100.000, dapat disesuaikan lebih tinggi sesuai ketentuan kebijakan perusahaan.
                </p>
              </div>

              {/* Kasus Finansial (Min 10%) */}
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <label className="block text-xs font-bold text-amber-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    2. Besaran Reward Kasus Finansial (% Kerugian)
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                    Ketentuan: Min 10%
                  </span>
                </label>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Diberikan dari persentase total estimasi kerugian finansial yang berhasil diselamatkan. Ketentuan Integritas360 menetapkan <strong>minimal 10%</strong> dari kerugian terverifikasi.
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="number"
                    min={10}
                    max={20}
                    step={0.5}
                    required
                    value={policyFinansialPersen}
                    onChange={(e) => setPolicyFinansialPersen(Math.max(10, Number(e.target.value)))}
                    className="w-32 bg-slate-900 border border-amber-500/50 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-sm font-bold text-slate-300">% dari Estimasi Kerugian</span>
                </div>
              </div>

              {/* Simulasi */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-1">
                <div className="font-semibold text-slate-300">Contoh Kalkulasi Kasus Finansial:</div>
                <div className="text-slate-400">
                  Kerugian Rp 100.000.000 &rarr; Reward Pelapor: <strong>Rp {Math.round(100000000 * (policyFinansialPersen / 100)).toLocaleString('id-ID')}</strong> ({policyFinansialPersen}%)
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRewardPolicyModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingPolicy}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                >
                  {savingPolicy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>{savingPolicy ? 'Menyimpan...' : 'Simpan Kebijakan Reward'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
