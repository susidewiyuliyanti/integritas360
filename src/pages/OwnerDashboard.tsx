import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  setDoc,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import {
  db,
  OWNER_EMAIL,
  isOwnerEmail,
  createFirebaseAuthUser,
  generateCompanyId,
  logAuditEvent,
  sendPasswordReset
} from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  Eye,
  Wallet,
  FileCheck,
  CreditCard,
  Award,
  RefreshCw,
  Coins,
  FileText,
  Filter,
  Check,
  X,
  ExternalLink,
  MessageCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  Lock,
  Unlock,
  Trash2,
  UserCheck,
  Users,
  Settings,
  Plus
} from 'lucide-react';
import { UserProfile, WhistleblowingReport, CompanyUser } from '../types';
import { PosterModal } from '../components/PosterModal';
import { PosterOptions } from '../utils/posterGenerator';

// Modular Admin Components
import { AdminBalanceOverview } from '../components/admin/AdminBalanceOverview';
import { AdminPerusahaanTable } from '../components/admin/AdminPerusahaanTable';
import { AdminAuditorTable } from '../components/admin/AdminAuditorTable';
import { AdminReportsManager } from '../components/admin/AdminReportsManager';
import { AdminPerusahaanAdminTable } from '../components/admin/AdminPerusahaanAdminTable';
import { AdminAuditLogsView } from '../components/admin/AdminAuditLogsView';
import {
  LockModal,
  EditSaldoModal,
  EditAuditorSaldoModal,
  EditProfileModal,
  EditReportModal,
  ConfirmDeleteModal,
  AddPerusahaanModal,
  DetailPerusahaanModal,
  NewCompanyData,
  NewPerusahaanData,
  AddCompanyUserModal,
  AddAdminPerusahaanModal,
  EditAdminPerusahaanModal,
  NewCompanyUserData,
  NewAdminPerusahaanData,
  ResetCompanyUserPasswordModal
} from '../components/admin/AdminModals';

interface AdminTransaction {
  id: string;
  userId?: string;
  type: 'deposit' | 'withdrawal' | 'lock' | 'unlock' | 'claim_reward';
  amount: number;
  status: 'pending' | 'selesai' | 'ditolak';
  keterangan?: string;
  method?: string;
  metode?: string;
  cryptoCurrency?: string;
  cryptoAmount?: number;
  txHash?: string;
  bankName?: string;
  accountNumber?: string;
  holderName?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    holderName: string;
  };
  claimReportToken?: string;
  claimReportId?: string;
  companyName?: string;
  whatsapp?: string;
  userEmail?: string;
  catatanAdmin?: string;
  createdAt?: any;
}

export const OwnerDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { navigate } = useNavigation();

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'perusahaan'
    | 'admin_perusahaan'
    | 'auditor'
    | 'laporan'
    | 'dokumen'
    | 'keuangan'
    | 'reward'
    | 'audit_logs'
  >('overview');

  // Core Data States
  const [perusahaanList, setPerusahaanList] = useState<UserProfile[]>([]);
  const [adminPerusahaanList, setAdminPerusahaanList] = useState<UserProfile[]>([]);
  const [auditorList, setAuditorList] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<WhistleblowingReport[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);

  // Filter States
  const [docFilter, setDocFilter] = useState<'semua' | 'pending' | 'terverifikasi' | 'ditolak'>('semua');
  const [txFilter, setTxFilter] = useState<'semua' | 'pending' | 'selesai' | 'ditolak'>('semua');

  // Modal States
  const [lockModalState, setLockModalState] = useState<{
    isOpen: boolean;
    entity: UserProfile | null;
    action: 'lock' | 'unlock';
  }>({ isOpen: false, entity: null, action: 'lock' });

  const [editSaldoState, setEditSaldoState] = useState<{
    isOpen: boolean;
    entity: UserProfile | null;
  }>({ isOpen: false, entity: null });

  const [editAuditorSaldoState, setEditAuditorSaldoState] = useState<{
    isOpen: boolean;
    auditor: UserProfile | null;
  }>({ isOpen: false, auditor: null });

  const [editProfileState, setEditProfileState] = useState<{
    isOpen: boolean;
    entity: UserProfile | null;
  }>({ isOpen: false, entity: null });

  const [editReportState, setEditReportState] = useState<{
    isOpen: boolean;
    report: WhistleblowingReport | null;
  }>({ isOpen: false, report: null });

  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    target: { type: 'user' | 'report' | 'transaksi'; id: string; name: string } | null;
  }>({ isOpen: false, target: null });

  // Add & Detail Perusahaan Modal States
  const [isAddPerusahaanOpen, setIsAddPerusahaanOpen] = useState(false);
  const [detailPerusahaanTarget, setDetailPerusahaanTarget] = useState<UserProfile | null>(null);

  // Admin Perusahaan Modal States
  const [isAddAdminPerusahaanOpen, setIsAddAdminPerusahaanOpen] = useState(false);
  const [editAdminPerusahaanTarget, setEditAdminPerusahaanTarget] = useState<UserProfile | null>(null);
  const [resetPasswordState, setResetPasswordState] = useState<{
    isOpen: boolean;
    targetUser: any | null;
  }>({ isOpen: false, targetUser: null });

  // Poster Modal State
  const [selectedPTForPoster, setSelectedPTForPoster] = useState<PosterOptions | null>(null);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);

  // Rejection Modal State
  const [rejectionTarget, setRejectionTarget] = useState<{
    type: 'dokumen' | 'transaksi' | 'reward';
    id: string;
    subId?: string;
    nominal?: number;
    userId?: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Feedback Notification
  const [toastFeedback, setToastFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastFeedback({ type, message });
    setTimeout(() => setToastFeedback(null), 4000);
  };

  // ProtectedRoute Check: superadmin check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (!isOwnerEmail(user.email)) {
        navigate('/perusahaan');
      }
    }
  }, [user, authLoading, navigate]);

  // Realtime Subscriptions
  useEffect(() => {
    if (!user || !isOwnerEmail(user.email)) return;

    // 1. Perusahaan List
    const qPerusahaan = query(collection(db, 'users'), where('role', '==', 'perusahaan'));
    const unsubPerusahaan = onSnapshot(qPerusahaan, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          uid: docSnap.id,
          email: d.email || '',
          role: 'perusahaan',
          namaPT: d.namaPT || 'PT Tanpa Nama',
          sektor: d.sektor || 'Umum',
          alamat: d.alamat || '-',
          deskripsi: d.deskripsi || '-',
          telepon: d.telepon || '',
          npwp: d.npwp || '',
          picName: d.picName || '',
          danaTersedia: Number(d.danaTersedia || 0),
          saldo: Number(d.saldo || 0),
          danaTerkunci: Number(d.danaTerkunci || 0),
          isLocked: Boolean(d.isLocked || (Number(d.danaTerkunci || 0) > 0 && !d.danaTersedia)),
          lockReason: d.lockReason || '',
          statusVerifikasiDokumen: d.statusVerifikasiDokumen || 'belum_upload',
          dokumenUrl: d.dokumenUrl,
          dokumenNama: d.dokumenNama,
          catatanVerifikasi: d.catatanVerifikasi || '',
          namaBank: d.namaBank || d.rekeningBank?.bankName,
          nomorRekening: d.nomorRekening || d.rekeningBank?.accountNumber,
          pemilikRekening: d.pemilikRekening || d.rekeningBank?.holderName,
          rekeningBank: d.rekeningBank,
          createdAt: d.createdAt
        });
      });
      setPerusahaanList(list);
    });

    // 2. Auditor List
    const qAuditor = query(collection(db, 'users'), where('role', '==', 'auditor'));
    const unsubAuditor = onSnapshot(qAuditor, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          uid: docSnap.id,
          email: d.email || '',
          role: 'auditor',
          namaPT: d.namaPT || 'Auditor',
          sektor: d.sektor || 'Investigator Independen',
          alamat: d.alamat || '-',
          deskripsi: d.deskripsi || '-',
          telepon: d.telepon || '',
          npwp: d.npwp || '',
          picName: d.picName || '',
          danaTersedia: Number(d.danaTersedia || 0),
          saldo: Number(d.saldo || 0),
          danaTerkunci: Number(d.danaTerkunci || 0),
          isLocked: Boolean(d.isLocked),
          lockReason: d.lockReason || '',
          statusVerifikasiDokumen: d.statusVerifikasiDokumen || 'belum_upload',
          dokumenUrl: d.dokumenUrl,
          dokumenNama: d.dokumenNama,
          catatanVerifikasi: d.catatanVerifikasi || '',
          namaBank: d.namaBank || d.rekeningBank?.bankName,
          nomorRekening: d.nomorRekening || d.rekeningBank?.accountNumber,
          pemilikRekening: d.pemilikRekening || d.rekeningBank?.holderName,
          rekeningBank: d.rekeningBank,
          createdAt: d.createdAt
        });
      });
      setAuditorList(list);
    });

    // 3. Admin Perusahaan List
    const qAdminPerusahaan = query(collection(db, 'users'), where('role', '==', 'admin_perusahaan'));
    const unsubAdminPerusahaan = onSnapshot(qAdminPerusahaan, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          uid: docSnap.id,
          email: d.email || '',
          role: 'admin_perusahaan',
          namaPT: d.namaPT || d.perusahaanName || 'PT Terkait',
          perusahaanId: d.perusahaanId || '',
          perusahaanName: d.perusahaanName || '',
          sektor: d.sektor || 'Kepatuhan Internal',
          alamat: d.alamat || '-',
          deskripsi: d.deskripsi || '-',
          telepon: d.telepon || '',
          jabatan: d.jabatan || 'Admin Kepatuhan & Investigator',
          departemen: d.departemen || 'Divisi Kepatuhan Internal',
          statusAkun: d.statusAkun || 'aktif',
          picName: d.picName || '',
          danaTersedia: 0,
          saldo: 0,
          isLocked: Boolean(d.isLocked || d.statusAkun === 'nonaktif'),
          createdAt: d.createdAt
        });
      });
      setAdminPerusahaanList(list);
    });

    // 3. Whistleblowing Reports
    const qReports = collection(db, 'reports');
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      const list: WhistleblowingReport[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          companyId: d.companyId || '',
          companyName: d.companyName || 'Perusahaan',
          judul: d.judul || 'Laporan Dugaan Pelanggaran',
          kategori: d.kategori || 'Umum',
          tipePelanggaran: d.tipePelanggaran || 'finansial',
          estimasiKerugian: Number(d.estimasiKerugian || 0),
          deskripsi: d.deskripsi || '',
          tanggalKejadian: d.tanggalKejadian || '',
          lokasi: d.lokasi || '',
          status: d.status || 'baru',
          tokenAkses: d.tokenAkses || '',
          pelaporAnonim: Boolean(d.pelaporAnonim),
          targetAuditorId: d.targetAuditorId || d.auditorId,
          targetAuditorName: d.targetAuditorName || d.auditorName,
          catatanAuditor: d.catatanAuditor || '',
          rewardAmount: Number(d.rewardAmount || 0),
          rewardMinAmount: Number(d.rewardMinAmount || 0),
          rewardClaimStatus: d.rewardClaimStatus || 'none',
          rewardClaimed: Boolean(d.rewardClaimed),
          whatsappPelapor: d.whatsappPelapor || '',
          buktiFiles: d.buktiFiles || [],
          createdAt: d.createdAt
        });
      });
      // Newest first
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setReports(list);
    });

    // 4. Financial Transactions
    const qTx = collection(db, 'transactions');
    const unsubTx = onSnapshot(qTx, (snapshot) => {
      const list: AdminTransaction[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          userId: d.userId,
          type: d.type,
          amount: Number(d.amount || 0),
          status: d.status || 'pending',
          keterangan: d.keterangan || '',
          method: d.method || d.metode,
          metode: d.metode || d.method,
          cryptoCurrency: d.cryptoCurrency,
          cryptoAmount: d.cryptoAmount !== undefined ? Number(d.cryptoAmount) : undefined,
          txHash: d.txHash,
          bankName: d.bankName || d.bankDetails?.bankName,
          accountNumber: d.accountNumber || d.bankDetails?.accountNumber,
          holderName: d.holderName || d.bankDetails?.holderName,
          bankDetails: d.bankDetails,
          claimReportToken: d.claimReportToken,
          claimReportId: d.claimReportId,
          companyName: d.companyName,
          whatsapp: d.whatsapp,
          userEmail: d.userEmail,
          catatanAdmin: d.catatanAdmin,
          createdAt: d.createdAt
        });
      });
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setTransactions(list);
    });

    return () => {
      unsubPerusahaan();
      unsubAuditor();
      unsubAdminPerusahaan();
      unsubReports();
      unsubTx();
    };
  }, [user]);

  // Combined documents for verification
  const allEntitiesWithDocs = [...perusahaanList, ...auditorList].filter(
    (e) => e.dokumenUrl || (e.statusVerifikasiDokumen && e.statusVerifikasiDokumen !== 'belum_upload')
  );

  // Pending Badges
  const pendingDocsCount = allEntitiesWithDocs.filter((e) => e.statusVerifikasiDokumen === 'pending').length;
  const pendingFinanceTxCount = transactions.filter(
    (t) => (t.type === 'deposit' || t.type === 'withdrawal') && t.status === 'pending'
  ).length;
  const pendingRewardsCount = transactions.filter(
    (t) => t.type === 'claim_reward' && t.status === 'pending'
  ).length;

  // ==========================================
  // HANDLERS: LOCK / UNLOCK SALDO PERUSAHAAN
  // ==========================================
  const handleLockConfirm = async (
    entityId: string,
    action: 'lock' | 'unlock',
    amount: number,
    reason: string
  ) => {
    try {
      const userRef = doc(db, 'users', entityId);

      if (action === 'lock') {
        // Lock: mark isLocked = true, lockReason, move amount to danaTerkunci
        await updateDoc(userRef, {
          isLocked: true,
          lockReason: reason,
          danaTersedia: increment(-amount),
          danaTerkunci: increment(amount)
        });

        await addDoc(collection(db, 'transactions'), {
          userId: entityId,
          type: 'lock',
          amount,
          status: 'selesai',
          keterangan: `Penguncian saldo oleh Administrator: ${reason}`,
          catatanAdmin: reason,
          processedBy: user?.email || OWNER_EMAIL,
          createdAt: serverTimestamp()
        });

        showToast(`Saldo berhasil dikunci (LOCKED). Status entitas diperbarui.`);
      } else {
        // Unlock: mark isLocked = false, clear lockReason, return amount to danaTersedia
        await updateDoc(userRef, {
          isLocked: false,
          lockReason: '',
          danaTerkunci: increment(-amount),
          danaTersedia: increment(amount)
        });

        await addDoc(collection(db, 'transactions'), {
          userId: entityId,
          type: 'unlock',
          amount,
          status: 'selesai',
          keterangan: `Pembukaan kunci saldo oleh Administrator: ${reason}`,
          catatanAdmin: reason,
          processedBy: user?.email || OWNER_EMAIL,
          createdAt: serverTimestamp()
        });

        showToast(`Saldo berhasil dibuka (UNLOCKED). Perusahaan dapat kembali bertransaksi.`);
      }
    } catch (err: any) {
      console.error('Error locking/unlocking saldo:', err);
      showToast('Gagal memproses lock/unlock: ' + err.message, 'error');
    }
  };

  // ==========================================
  // HANDLERS: ADD PERUSAHAAN (TAMBAH PERUSAHAAN BARU)
  // Sesuai Aturan: Perusahaan TIDAK memiliki password atau akun login
  // ==========================================
  const handleAddCompany = async (data: NewCompanyData) => {
    try {
      const generatedCompanyId = await generateCompanyId();
      const compCode = data.company_code?.trim() || generatedCompanyId;
      const compName = (data.namaPT || data.company_name || 'PT Baru').trim();
      const compEmail = (data.email || '').trim().toLowerCase();
      const compPassword = (data.password || '').trim();
      const compPhone = (data.telepon || data.company_phone || '').trim();
      const compAddress = (data.alamat || data.company_address || '-').trim();
      const picName = (data.picName || '').trim();
      const picPosition = (data.picPosition || data.pic_position || 'PIC / Legal').trim();
      const picPhone = (data.picPhone || data.pic_phone || compPhone).trim();
      const picEmail = (data.picEmail || data.pic_email || compEmail).trim();
      const compStatus = data.status || 'ACTIVE';

      if (!compEmail || !compEmail.includes('@')) {
        throw new Error('Email akun perusahaan wajib valid.');
      }
      if (!compPassword || compPassword.length < 6) {
        throw new Error('Password akun perusahaan wajib minimal 6 karakter.');
      }

      const authUid = await createFirebaseAuthUser(compEmail, compPassword);

      await setDoc(doc(db, 'companies', generatedCompanyId), {
        company_id: generatedCompanyId,
        company_code: compCode,
        company_name: compName,
        company_email: compEmail,
        company_phone: compPhone,
        company_address: compAddress,
        pic_name: picName,
        pic_position: picPosition,
        pic_phone: picPhone,
        pic_email: picEmail,
        primary_user_id: authUid,
        status: compStatus,
        danaTersedia: data.danaTersedia || 0,
        danaTerkunci: data.danaTerkunci || 0,
        saldo: (data.danaTersedia || 0) + (data.danaTerkunci || 0),
        isLocked: compStatus === 'SUSPENDED' || Boolean(data.danaTerkunci && !data.danaTersedia),
        statusVerifikasiDokumen: data.statusVerifikasiDokumen || 'terverifikasi',
        namaBank: data.namaBank || '',
        nomorRekening: data.nomorRekening || '',
        pemilikRekening: data.pemilikRekening || '',
        rekeningBank: {
          bankName: data.namaBank || '',
          accountNumber: data.nomorRekening || '',
          holderName: data.pemilikRekening || ''
        },
        kebijakanReward: data.kebijakanReward || { rewardKasusEtik: 100000, persenFinansial: 2, minPersenFinansial: 2 },
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      // Profil tenant perusahaan tetap disimpan di users/{companyId} agar tabel Owner,
      // saldo, laporan, dan modul lama tetap mengenali entitas perusahaan.
      await setDoc(doc(db, 'users', generatedCompanyId), {
        uid: generatedCompanyId,
        company_id: generatedCompanyId,
        company_code: compCode,
        company_name: compName,
        role: 'perusahaan',
        email: compEmail,
        namaPT: compName,
        sektor: data.sektor || 'Umum',
        alamat: compAddress,
        telepon: compPhone,
        picName: picName,
        picPosition: picPosition,
        picPhone: picPhone,
        picEmail: picEmail,
        npwp: data.npwp || '',
        deskripsi: `Entitas perusahaan ${compName} terdaftar manual oleh Owner / Super Admin.`,
        danaTersedia: data.danaTersedia || 0,
        saldo: (data.danaTersedia || 0) + (data.danaTerkunci || 0),
        danaTerkunci: data.danaTerkunci || 0,
        isLocked: compStatus === 'SUSPENDED' || Boolean(data.danaTerkunci && !data.danaTersedia),
        status: compStatus,
        statusAkun: compStatus === 'ACTIVE' ? 'aktif' : 'nonaktif',
        statusVerifikasiDokumen: data.statusVerifikasiDokumen || 'terverifikasi',
        namaBank: data.namaBank || '',
        nomorRekening: data.nomorRekening || '',
        pemilikRekening: data.pemilikRekening || '',
        rekeningBank: {
          bankName: data.namaBank || '',
          accountNumber: data.nomorRekening || '',
          holderName: data.pemilikRekening || ''
        },
        kebijakanReward: data.kebijakanReward || { rewardKasusEtik: 100000, persenFinansial: 2, minPersenFinansial: 2 },
        createdAt: serverTimestamp()
      });

      await setDoc(doc(db, 'company_users', authUid), {
        user_id: authUid,
        company_id: generatedCompanyId,
        company_name: compName,
        full_name: picName || compName,
        email: compEmail,
        phone: compPhone,
        role: 'company_admin',
        status: compStatus === 'ACTIVE' ? 'ACTIVE' : compStatus,
        is_primary_company_account: true,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      await setDoc(doc(db, 'users', authUid), {
        uid: authUid,
        email: compEmail,
        role: 'admin_perusahaan',
        company_id: generatedCompanyId,
        company_name: compName,
        namaPT: compName,
        picName: picName || compName,
        perusahaanId: generatedCompanyId,
        perusahaanName: compName,
        jabatan: 'Company Admin',
        departemen: 'Kepatuhan Internal',
        telepon: compPhone,
        statusAkun: compStatus === 'ACTIVE' ? 'aktif' : 'nonaktif',
        status: compStatus,
        isLocked: compStatus === 'SUSPENDED',
        sektor: data.sektor || 'Umum',
        alamat: compAddress,
        deskripsi: `Akun utama perusahaan ${compName} dibuat oleh Owner / Super Admin.`,
        danaTersedia: 0,
        saldo: 0,
        createdAt: serverTimestamp()
      });

      if ((data.danaTersedia || 0) > 0 || (data.danaTerkunci || 0) > 0) {
        await addDoc(collection(db, 'transactions'), {
          userId: generatedCompanyId,
          companyId: generatedCompanyId,
          userName: compName,
          type: 'deposit',
          amount: (data.danaTersedia || 0) + (data.danaTerkunci || 0),
          status: 'selesai',
          keterangan: 'Setoran modal kas awal entitas perusahaan oleh Administrator',
          processedBy: user?.email || OWNER_EMAIL,
          createdAt: serverTimestamp()
        });
      }

      logAuditEvent({
        actor_user_id: user?.uid || 'superadmin',
        actor_email: user?.email || OWNER_EMAIL,
        actor_role: 'owner',
        company_id: generatedCompanyId,
        company_name: compName,
        action: 'CREATE_COMPANY',
        entity_type: 'COMPANY',
        entity_id: generatedCompanyId,
        metadata: {
          company_code: compCode,
          primary_user_id: authUid,
          primary_user_email: compEmail,
          pic_name: picName,
          status: compStatus,
          note: 'Company dan akun login utama dibuat oleh Owner / Super Admin'
        }
      });

      showToast(`Perusahaan "${compName}" berhasil dibuat beserta akun login utama. Email: ${compEmail}`);
    } catch (err: any) {
      console.error('Error adding company:', err);
      showToast('Gagal menambahkan perusahaan: ' + err.message, 'error');
      throw err;
    }
  };

  // ==========================================
  // HANDLERS: EDIT SALDO & TOP UP PERUSAHAAN
  // ==========================================
  const handleSaveCompanySaldo = async (
    entityId: string,
    danaTersedia: number,
    saldo: number,
    danaTerkunci: number
  ) => {
    try {
      const userRef = doc(db, 'users', entityId);
      await updateDoc(userRef, {
        danaTersedia,
        saldo,
        danaTerkunci,
        isLocked: danaTerkunci > 0 && danaTersedia === 0
      });

      // Update companies collection if exists
      try {
        const compRef = doc(db, 'companies', entityId);
        await updateDoc(compRef, {
          danaTersedia,
          saldo,
          danaTerkunci,
          isLocked: danaTerkunci > 0 && danaTersedia === 0,
          updated_at: serverTimestamp()
        });
      } catch (cErr) {
        // Optional if not yet migrated
      }

      showToast('Nilai saldo perusahaan berhasil diperbarui!');
    } catch (err: any) {
      showToast('Gagal mengubah saldo: ' + err.message, 'error');
    }
  };

  const handleTopUpCompany = async (entityId: string, amount: number) => {
    try {
      const userRef = doc(db, 'users', entityId);
      await updateDoc(userRef, {
        danaTersedia: increment(amount),
        saldo: increment(amount)
      });

      try {
        const compRef = doc(db, 'companies', entityId);
        await updateDoc(compRef, {
          danaTersedia: increment(amount),
          saldo: increment(amount),
          updated_at: serverTimestamp()
        });
      } catch (cErr) {}

      await addDoc(collection(db, 'transactions'), {
        userId: entityId,
        companyId: entityId,
        type: 'deposit',
        amount,
        status: 'selesai',
        keterangan: 'Top up dana kepatuhan langsung oleh Administrator Integritas360',
        processedBy: user?.email || OWNER_EMAIL,
        createdAt: serverTimestamp()
      });
      showToast(`Berhasil menambah dana sebesar Rp ${amount.toLocaleString('id-ID')}!`);
    } catch (err: any) {
      showToast('Gagal menambah dana: ' + err.message, 'error');
    }
  };

  // ==========================================
  // HANDLERS: EDIT SALDO AUDITOR
  // ==========================================
  const handleSaveAuditorSaldo = async (auditorId: string, saldoBaru: number) => {
    try {
      const userRef = doc(db, 'users', auditorId);
      await updateDoc(userRef, {
        saldo: saldoBaru
      });
      showToast('Saldo honorarium auditor berhasil diperbarui!');
    } catch (err: any) {
      showToast('Gagal mengubah saldo auditor: ' + err.message, 'error');
    }
  };

  const handleTopUpAuditorFee = async (auditorId: string, feeAmount: number) => {
    try {
      const userRef = doc(db, 'users', auditorId);
      await updateDoc(userRef, {
        saldo: increment(feeAmount)
      });
      await addDoc(collection(db, 'transactions'), {
        userId: auditorId,
        type: 'deposit',
        amount: feeAmount,
        status: 'selesai',
        keterangan: 'Pemberian fee / honorarium investigasi audit oleh Administrator',
        processedBy: user?.email || OWNER_EMAIL,
        createdAt: serverTimestamp()
      });
      showToast(`Honorarium auditor berhasil ditambahkan sebesar Rp ${feeAmount.toLocaleString('id-ID')}!`);
    } catch (err: any) {
      showToast('Gagal menambah honorarium auditor: ' + err.message, 'error');
    }
  };

  // ==========================================
  // HANDLERS: COMPANY USERS (LEVEL 3 - REAL AUTH CREDENTIAL)
  // ==========================================
  const handleAddAdminPerusahaan = async (data: NewCompanyUserData) => {
    try {
      const cleanEmail = data.email.trim().toLowerCase();
      const targetCompanyId = data.company_id;
      const targetCompanyName = data.company_name;

      if (!data.password || data.password.length < 6) {
        throw new Error('Kata sandi wajib minimal 6 karakter.');
      }

      // 1. Buat kredensial AUTHENTICATION sebenarnya melalui secondary app
      const authUid = await createFirebaseAuthUser(cleanEmail, data.password);

      // 2. Simpan entity ke collection 'company_users' (Entity Level 3)
      await setDoc(doc(db, 'company_users', authUid), {
        user_id: authUid,
        company_id: targetCompanyId,
        company_name: targetCompanyName,
        full_name: data.full_name,
        email: cleanEmail,
        phone: data.phone || '',
        role: data.role || 'company_admin',
        status: data.status || 'ACTIVE',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      // 3. Simpan / sinkronkan ke collection 'users' agar query autentikasi & RBAC aplikasi bekerja instan
      await setDoc(doc(db, 'users', authUid), {
        uid: authUid,
        email: cleanEmail,
        role: data.role === 'company_admin' ? 'admin_perusahaan' : data.role,
        company_id: targetCompanyId,
        company_name: targetCompanyName,
        namaPT: targetCompanyName,
        picName: data.full_name,
        perusahaanId: targetCompanyId,
        perusahaanName: targetCompanyName,
        jabatan: data.role === 'company_admin' ? 'Company Admin' : data.role.toUpperCase(),
        departemen: data.role === 'finance' ? 'Keuangan' : data.role === 'hr' ? 'HR / Personalia' : 'Kepatuhan Internal',
        telepon: data.phone || '',
        statusAkun: data.status === 'ACTIVE' ? 'aktif' : 'nonaktif',
        isLocked: data.status === 'SUSPENDED',
        sektor: 'Kepatuhan Internal',
        alamat: 'Indonesia',
        deskripsi: `Petugas Admin Kepatuhan ${targetCompanyName}`,
        danaTersedia: 0,
        saldo: 0,
        createdAt: serverTimestamp()
      });

      // 4. Catat Audit Log
      logAuditEvent({
        actor_user_id: user?.uid || 'superadmin',
        actor_email: user?.email || OWNER_EMAIL,
        actor_role: 'owner',
        company_id: targetCompanyId,
        company_name: targetCompanyName,
        action: 'CREATE_COMPANY_USER',
        entity_type: 'COMPANY_USER',
        entity_id: authUid,
        metadata: {
          user_name: data.full_name,
          user_email: cleanEmail,
          role: data.role,
          company_id: targetCompanyId
        }
      });

      showToast(`Akun login "${data.full_name}" (${cleanEmail}) berhasil dibuat untuk ${targetCompanyName}!`);
    } catch (err: any) {
      console.error('Error adding company user:', err);
      showToast('Gagal menambahkan akun user perusahaan: ' + err.message, 'error');
      throw err;
    }
  };

  const handleSaveAdminPerusahaan = async (uid: string, updates: Partial<UserProfile>) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, updates);

      // Juga perbarui di company_users jika ada
      try {
        const cUserRef = doc(db, 'company_users', uid);
        await updateDoc(cUserRef, {
          ...(updates.picName ? { full_name: updates.picName } : {}),
          ...(updates.telepon ? { phone: updates.telepon } : {}),
          updated_at: serverTimestamp()
        });
      } catch (cErr) {}

      showToast('Data Pengguna Perusahaan berhasil diperbarui!');
    } catch (err: any) {
      showToast('Gagal memperbarui pengguna perusahaan: ' + err.message, 'error');
    }
  };

  const handleToggleStatusAdminPerusahaan = async (admin: UserProfile) => {
    try {
      const currentActive = (admin.statusAkun || 'aktif') === 'aktif' && !admin.isLocked;
      const nextStatus = currentActive ? 'nonaktif' : 'aktif';
      const userRef = doc(db, 'users', admin.uid);
      await updateDoc(userRef, {
        statusAkun: nextStatus,
        isLocked: !currentActive
      });

      try {
        const cUserRef = doc(db, 'company_users', admin.uid);
        await updateDoc(cUserRef, {
          status: currentActive ? 'SUSPENDED' : 'ACTIVE',
          updated_at: serverTimestamp()
        });
      } catch (cErr) {}

      logAuditEvent({
        actor_user_id: user?.uid || 'superadmin',
        actor_email: user?.email || OWNER_EMAIL,
        actor_role: 'owner',
        company_id: admin.perusahaanId || admin.company_id,
        company_name: admin.perusahaanName || admin.namaPT,
        action: currentActive ? 'SUSPEND_COMPANY_USER' : 'ACTIVATE_COMPANY_USER',
        entity_type: 'COMPANY_USER',
        entity_id: admin.uid,
        metadata: { target_email: admin.email, new_status: nextStatus }
      });

      showToast(`Status user ${admin.picName || admin.email} diubah menjadi ${nextStatus.toUpperCase()}`);
    } catch (err: any) {
      showToast('Gagal mengubah status admin: ' + err.message, 'error');
    }
  };

  const handleResetCompanyUserPassword = async (targetUser: any, newPassword?: string) => {
    try {
      await sendPasswordReset(targetUser.email);
      showToast(`Instruksi pengaturan ulang kata sandi telah dikirim ke email ${targetUser.email}.`);

      logAuditEvent({
        actor_user_id: user?.uid || 'superadmin',
        actor_email: user?.email || OWNER_EMAIL,
        actor_role: 'owner',
        company_id: targetUser.company_id || targetUser.perusahaanId,
        company_name: targetUser.company_name || targetUser.namaPT,
        action: 'RESET_USER_PASSWORD',
        entity_type: 'COMPANY_USER',
        entity_id: targetUser.uid || targetUser.user_id,
        metadata: { target_email: targetUser.email }
      });
    } catch (err: any) {
      showToast('Gagal mereset kata sandi: ' + err.message, 'error');
    }
  };

  // ==========================================
  // HANDLERS: EDIT PROFILE (PT / AUDITOR)
  // ==========================================
  const handleSaveProfile = async (entityId: string, updatedData: Partial<UserProfile>) => {
    try {
      const userRef = doc(db, 'users', entityId);
      await updateDoc(userRef, updatedData);
      showToast('Data entitas berhasil diperbarui!');
    } catch (err: any) {
      showToast('Gagal menyimpan data entitas: ' + err.message, 'error');
    }
  };

  // ==========================================
  // HANDLERS: EDIT REPORT
  // ==========================================
  const handleSaveReport = async (reportId: string, updatedData: Partial<WhistleblowingReport>) => {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, updatedData);
      showToast('Data berkas laporan whistleblowing berhasil diperbarui!');
    } catch (err: any) {
      showToast('Gagal memperbarui laporan: ' + err.message, 'error');
    }
  };

  // ==========================================
  // HANDLERS: DELETE ITEMS
  // ==========================================
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmState.target) return;
    const { type, id } = deleteConfirmState.target;

    try {
      if (type === 'user') {
        await deleteDoc(doc(db, 'users', id));
        showToast('Data pengguna / entitas berhasil dihapus secara permanen.');
      } else if (type === 'report') {
        await deleteDoc(doc(db, 'reports', id));
        showToast('Data laporan whistleblowing berhasil dihapus.');
      } else if (type === 'transaksi') {
        await deleteDoc(doc(db, 'transactions', id));
        showToast('Data mutasi transaksi berhasil dihapus.');
      }
    } catch (err: any) {
      showToast('Gagal menghapus data: ' + err.message, 'error');
    }
  };

  // ==========================================
  // HANDLERS: APPROVE & REJECT TRANSAKSI / DOCS
  // ==========================================
  const handleApproveDocument = async (entity: UserProfile) => {
    try {
      setProcessingAction(true);
      const userRef = doc(db, 'users', entity.uid);
      await updateDoc(userRef, {
        statusVerifikasiDokumen: 'terverifikasi',
        catatanVerifikasi: 'Dokumen legalitas telah diverifikasi dan disetujui oleh Administrator INTEGRITAS360.'
      });
      showToast('Dokumen legalitas berhasil disetujui!');
    } catch (err: any) {
      showToast('Gagal menyetujui dokumen: ' + err.message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleApproveTransaction = async (tx: AdminTransaction) => {
    try {
      setProcessingAction(true);
      const txRef = doc(db, 'transactions', tx.id);

      if (tx.type === 'deposit') {
        await updateDoc(txRef, {
          status: 'selesai',
          processedAt: serverTimestamp(),
          processedBy: user?.email || OWNER_EMAIL
        });

        if (tx.userId) {
          const userRef = doc(db, 'users', tx.userId);
          await updateDoc(userRef, {
            saldo: increment(tx.amount),
            danaTersedia: increment(tx.amount)
          });
        }
        showToast('Deposit saldo berhasil disetujui & ditambahkan ke akun!');
      } else if (tx.type === 'withdrawal') {
        await updateDoc(txRef, {
          status: 'selesai',
          processedAt: serverTimestamp(),
          processedBy: user?.email || OWNER_EMAIL
        });
        showToast('Penarikan dana telah disetujui & ditransfer!');
      }
    } catch (err: any) {
      showToast('Gagal memproses transaksi: ' + err.message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleApproveClaimReward = async (tx: AdminTransaction) => {
    try {
      setProcessingAction(true);
      const txRef = doc(db, 'transactions', tx.id);

      await updateDoc(txRef, {
        status: 'selesai',
        processedAt: serverTimestamp(),
        processedBy: user?.email || OWNER_EMAIL
      });

      if (tx.claimReportId) {
        const reportRef = doc(db, 'reports', tx.claimReportId);
        await updateDoc(reportRef, {
          rewardClaimStatus: 'selesai',
          rewardClaimed: true
        });
      }
      showToast('Pencairan klaim reward pelapor berhasil diselesaikan!');
    } catch (err: any) {
      showToast('Gagal menyelesaikan klaim reward: ' + err.message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionTarget || !rejectionReason.trim()) return;

    try {
      setProcessingAction(true);

      if (rejectionTarget.type === 'dokumen') {
        const userRef = doc(db, 'users', rejectionTarget.id);
        await updateDoc(userRef, {
          statusVerifikasiDokumen: 'ditolak',
          catatanVerifikasi: rejectionReason.trim()
        });
        showToast('Dokumen ditolak dengan catatan.');
      } else if (rejectionTarget.type === 'transaksi') {
        const txRef = doc(db, 'transactions', rejectionTarget.id);
        await updateDoc(txRef, {
          status: 'ditolak',
          catatanAdmin: rejectionReason.trim(),
          processedAt: serverTimestamp(),
          processedBy: user?.email || OWNER_EMAIL
        });

        // Refund withdrawal balance
        if (rejectionTarget.subId === 'withdrawal' && rejectionTarget.userId && rejectionTarget.nominal) {
          const userRef = doc(db, 'users', rejectionTarget.userId);
          await updateDoc(userRef, {
            saldo: increment(rejectionTarget.nominal)
          });
        }
        showToast('Transaksi ditolak.');
      } else if (rejectionTarget.type === 'reward') {
        const txRef = doc(db, 'transactions', rejectionTarget.id);
        await updateDoc(txRef, {
          status: 'ditolak',
          catatanAdmin: rejectionReason.trim(),
          processedAt: serverTimestamp(),
          processedBy: user?.email || OWNER_EMAIL
        });

        if (rejectionTarget.subId) {
          const reportRef = doc(db, 'reports', rejectionTarget.subId);
          await updateDoc(reportRef, {
            rewardClaimStatus: 'ditolak'
          });
        }
        showToast('Klaim reward ditolak.');
      }

      setRejectionTarget(null);
      setRejectionReason('');
    } catch (err: any) {
      showToast('Gagal menolak: ' + err.message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const openPosterModal = (pt: UserProfile) => {
    setSelectedPTForPoster({
      uid: pt.uid,
      namaPT: pt.namaPT,
      danaTersedia: pt.danaTersedia,
      sektor: pt.sektor
    });
    setIsPosterModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mr-2" />
        Memeriksa Otoritas Administrator Pusat...
      </div>
    );
  }

  // Filtered lists for sub-tabs
  const filteredDocEntities = allEntitiesWithDocs.filter((e) => {
    if (docFilter === 'semua') return true;
    return e.statusVerifikasiDokumen === docFilter;
  });

  const filteredFinanceTx = transactions
    .filter((t) => t.type === 'deposit' || t.type === 'withdrawal')
    .filter((t) => {
      if (txFilter === 'semua') return true;
      return t.status === txFilter;
    });

  const rewardClaimTx = transactions.filter((t) => t.type === 'claim_reward');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* TOAST FEEDBACK NOTIFICATION */}
        {toastFeedback && (
          <div
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
              toastFeedback.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                : 'bg-red-950/90 border-red-500/50 text-red-300'
            }`}
          >
            {toastFeedback.type === 'success' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
            <span>{toastFeedback.message}</span>
          </div>
        )}

        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              PANEL ADMINISTRATOR PUSAT
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Pusat Kendali Ekosistem & Manajemen Data Integritas360
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Administrator Resmi:{' '}
              <span className="font-mono text-red-300 font-bold">{user?.email || OWNER_EMAIL}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              Otoritas Kelola Penuh Aktif
            </div>
          </div>
        </div>

        {/* ALWAYS VISIBLE SUMMARY: SEMUA SALDO (Card Overview) */}
        <AdminBalanceOverview
          perusahaanList={perusahaanList}
          auditorList={auditorList}
          totalReportsCount={reports.length}
        />

        {/* MASTER NAVIGATION TABS */}
        <div className="space-y-2 border-b border-slate-800 pb-3 pt-2">
          {/* Main Category Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. DASHBOARD */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            {/* DIVIDER */}
            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            {/* 2. COMPANIES */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-amber-400" /> Companies:
              </span>
              <button
                onClick={() => setActiveTab('perusahaan')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'perusahaan'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>All Companies</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-amber-300 font-mono text-[10px]">
                  {perusahaanList.length}
                </span>
              </button>
              <button
                onClick={() => setIsAddPerusahaanOpen(true)}
                className="px-2 py-1.5 rounded-lg text-xs font-bold text-amber-400 hover:bg-amber-500/10 flex items-center gap-1 transition-colors cursor-pointer border border-amber-500/20"
                title="Tambah Perusahaan Baru (Tanpa Password Login)"
              >
                <Plus className="w-3 h-3" />
                <span>Add Company</span>
              </button>
            </div>

            {/* DIVIDER */}
            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            {/* 3. COMPANY USERS */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
                <Users className="w-3 h-3 text-cyan-400" /> Company Users:
              </span>
              <button
                onClick={() => setActiveTab('admin_perusahaan')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'admin_perusahaan'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>All Company Users</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-cyan-300 font-mono text-[10px]">
                  {adminPerusahaanList.length}
                </span>
              </button>
              <button
                onClick={() => setIsAddAdminPerusahaanOpen(true)}
                className="px-2 py-1.5 rounded-lg text-xs font-bold text-cyan-400 hover:bg-cyan-500/10 flex items-center gap-1 transition-colors cursor-pointer border border-cyan-500/20"
                title="Buat Akun Login Pengguna Perusahaan"
              >
                <Plus className="w-3 h-3" />
                <span>Add Company User</span>
              </button>
            </div>

            {/* DIVIDER */}
            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            {/* 4. REPORTS */}
            <button
              onClick={() => setActiveTab('laporan')}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'laporan'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>All Reports</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono text-[10px]">
                {reports.length}
              </span>
            </button>

            {/* 5. FINANCE */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-emerald-400" /> Finance:
              </span>
              <button
                onClick={() => setActiveTab('keuangan')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'keuangan'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>Deposits & Mutasi</span>
                {pendingFinanceTxCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-mono text-[10px] font-bold">
                    {pendingFinanceTxCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('reward')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'reward'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>Rewards</span>
                {pendingRewardsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-mono text-[10px] font-bold">
                    {pendingRewardsCount}
                  </span>
                )}
              </button>
            </div>

            {/* 6. AUDITOR */}
            <button
              onClick={() => setActiveTab('auditor')}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'auditor'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Auditor</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-blue-300 font-mono text-[10px]">
                {auditorList.length}
              </span>
            </button>

            {/* 7. SYSTEM */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
                <Settings className="w-3 h-3 text-purple-400" /> System:
              </span>
              <button
                onClick={() => setActiveTab('audit_logs')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'audit_logs'
                    ? 'bg-purple-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Audit Logs</span>
              </button>
              <button
                onClick={() => setActiveTab('dokumen')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'dokumen'
                    ? 'bg-purple-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileCheck className="w-3 h-3" />
                <span>Legalitas / Docs</span>
                {pendingDocsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-mono text-[10px] font-bold">
                    {pendingDocsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* TAB CONTENT: 1. OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <AdminPerusahaanTable
              perusahaanList={perusahaanList}
              onAddPerusahaan={() => setIsAddPerusahaanOpen(true)}
              onOpenDetailModal={(pt) => setDetailPerusahaanTarget(pt)}
              onOpenLockModal={(pt, action) =>
                setLockModalState({ isOpen: true, entity: pt, action })
              }
              onOpenEditSaldoModal={(pt) =>
                setEditSaldoState({ isOpen: true, entity: pt })
              }
              onOpenEditProfileModal={(pt) =>
                setEditProfileState({ isOpen: true, entity: pt })
              }
              onOpenPosterModal={openPosterModal}
              onDeleteUser={(pt) =>
                setDeleteConfirmState({
                  isOpen: true,
                  target: { type: 'user', id: pt.uid, name: pt.namaPT }
                })
              }
            />

            <AdminAuditorTable
              auditorList={auditorList}
              onOpenEditSaldoAuditor={(auditor) =>
                setEditAuditorSaldoState({ isOpen: true, auditor })
              }
              onOpenEditProfileModal={(auditor) =>
                setEditProfileState({ isOpen: true, entity: auditor })
              }
              onDeleteAuditor={(auditor) =>
                setDeleteConfirmState({
                  isOpen: true,
                  target: { type: 'user', id: auditor.uid, name: auditor.namaPT }
                })
              }
            />
          </div>
        )}

        {/* TAB CONTENT: 2. PERUSAHAAN (LOCK / TERBUKA) */}
        {activeTab === 'perusahaan' && (
          <AdminPerusahaanTable
            perusahaanList={perusahaanList}
            onAddPerusahaan={() => setIsAddPerusahaanOpen(true)}
            onOpenDetailModal={(pt) => setDetailPerusahaanTarget(pt)}
            onOpenLockModal={(pt, action) =>
              setLockModalState({ isOpen: true, entity: pt, action })
            }
            onOpenEditSaldoModal={(pt) =>
              setEditSaldoState({ isOpen: true, entity: pt })
            }
            onOpenEditProfileModal={(pt) =>
              setEditProfileState({ isOpen: true, entity: pt })
            }
            onOpenPosterModal={openPosterModal}
            onDeleteUser={(pt) =>
              setDeleteConfirmState({
                isOpen: true,
                target: { type: 'user', id: pt.uid, name: pt.namaPT }
              })
            }
          />
        )}

        {/* TAB CONTENT: 2.5 ADMIN PERUSAHAAN (ADD & KELOLA) */}
        {activeTab === 'admin_perusahaan' && (
          <AdminPerusahaanAdminTable
            adminList={adminPerusahaanList}
            perusahaanList={perusahaanList}
            onAddAdmin={() => setIsAddAdminPerusahaanOpen(true)}
            onEditAdmin={(admin) => setEditAdminPerusahaanTarget(admin)}
            onToggleStatus={handleToggleStatusAdminPerusahaan}
            onResetPassword={(admin) => setResetPasswordState({ isOpen: true, targetUser: admin })}
            onDeleteAdmin={(admin) =>
              setDeleteConfirmState({
                isOpen: true,
                target: {
                  type: 'user',
                  id: admin.uid,
                  name: `User: ${admin.picName || admin.email} (${admin.perusahaanName || 'PT'})`
                }
              })
            }
          />
        )}

        {/* TAB CONTENT: 3. AUDITOR */}
        {activeTab === 'auditor' && (
          <AdminAuditorTable
            auditorList={auditorList}
            onOpenEditSaldoAuditor={(auditor) =>
              setEditAuditorSaldoState({ isOpen: true, auditor })
            }
            onOpenEditProfileModal={(auditor) =>
              setEditProfileState({ isOpen: true, entity: auditor })
            }
            onDeleteAuditor={(auditor) =>
              setDeleteConfirmState({
                isOpen: true,
                target: { type: 'user', id: auditor.uid, name: auditor.namaPT }
              })
            }
          />
        )}

        {/* TAB CONTENT: 4. LAPORAN (CRUD) */}
        {activeTab === 'laporan' && (
          <AdminReportsManager
            reports={reports}
            onOpenEditReportModal={(report) =>
              setEditReportState({ isOpen: true, report })
            }
            onDeleteReport={(report) =>
              setDeleteConfirmState({
                isOpen: true,
                target: { type: 'report', id: report.id!, name: `Laporan #${report.tokenAkses} (${report.judul})` }
              })
            }
          />
        )}

        {/* TAB CONTENT: 5. DOKUMEN LEGALITAS */}
        {activeTab === 'dokumen' && (
          <div className="space-y-6">
            <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Verifikasi Legalitas Entitas & Kredensial Auditor</h3>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Dokumen legalitas perusahaan (NIB/SIUP/NPWP/Akta) dan sertifikasi auditor (SKKNI/ACFE/KTP)
                  harus diverifikasi secara langsung oleh Administrator sebelum status terverifikasi disetujui.
                </p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold mr-2">
                <Filter className="w-3.5 h-3.5" /> Filter Status:
              </span>
              {(['semua', 'pending', 'terverifikasi', 'ditolak'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setDocFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                    docFilter === st
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {filteredDocEntities.length === 0 ? (
              <div className="py-16 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
                <FileCheck className="w-10 h-10 mx-auto text-slate-700" />
                <p className="text-sm font-medium">Tidak ada dokumen dengan status '{docFilter}'.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocEntities.map((entitas) => (
                  <div
                    key={entitas.uid}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {entitas.role === 'perusahaan' ? 'Perusahaan (PT)' : 'Auditor Independen'}
                        </span>
                        <h4 className="text-base font-bold text-white mt-1">{entitas.namaPT}</h4>
                        <p className="text-xs font-mono text-slate-400">{entitas.email}</p>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                          entitas.statusVerifikasiDokumen === 'terverifikasi'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : entitas.statusVerifikasiDokumen === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                            : entitas.statusVerifikasiDokumen === 'ditolak'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {entitas.statusVerifikasiDokumen === 'terverifikasi'
                          ? 'Terverifikasi'
                          : entitas.statusVerifikasiDokumen === 'pending'
                          ? 'Menunggu Review'
                          : entitas.statusVerifikasiDokumen === 'ditolak'
                          ? 'Ditolak'
                          : 'Belum Upload'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="truncate text-slate-200">
                          {entitas.dokumenNama || 'Berkas Dokumen'}
                        </span>
                      </div>

                      {entitas.dokumenUrl ? (
                        <a
                          href={entitas.dokumenUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Buka Dokumen
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Belum ada file</span>
                      )}
                    </div>

                    {entitas.catatanVerifikasi && (
                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">Catatan: </span>
                        {entitas.catatanVerifikasi}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      {entitas.statusVerifikasiDokumen !== 'ditolak' && (
                        <button
                          disabled={processingAction}
                          onClick={() => {
                            setRejectionTarget({
                              type: 'dokumen',
                              id: entitas.uid
                            });
                            setRejectionReason('');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Tolak Dokumen
                        </button>
                      )}

                      {entitas.statusVerifikasiDokumen !== 'terverifikasi' && (
                        <button
                          disabled={processingAction}
                          onClick={() => handleApproveDocument(entitas)}
                          className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Setujui Dokumen
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: 6. VERIFIKASI DEPOSIT & PENARIKAN */}
        {activeTab === 'keuangan' && (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Verifikasi Mutasi Transaksi Keuangan</h3>
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  Permintaan deposit saldo aktif dan penarikan dana (withdrawal) harus diverifikasi dan disetujui oleh Administrator.
                  Setelah deposit disetujui, saldo entitas akan otomatis ditambahkan ke sistem.
                </p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold mr-2">
                <Filter className="w-3.5 h-3.5" /> Filter Status:
              </span>
              {(['semua', 'pending', 'selesai', 'ditolak'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setTxFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                    txFilter === st
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {filteredFinanceTx.length === 0 ? (
              <div className="py-16 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
                <CreditCard className="w-10 h-10 mx-auto text-slate-700" />
                <p className="text-sm font-medium">Tidak ada transaksi keuangan dengan status '{txFilter}'.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFinanceTx.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-md flex items-center gap-1 ${
                            tx.type === 'deposit'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {tx.type === 'deposit' ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3" /> Deposit
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3" /> Penarikan
                            </>
                          )}
                        </span>

                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            tx.status === 'selesai'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : tx.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {tx.status === 'selesai'
                            ? 'Selesai / Terverifikasi'
                            : tx.status === 'pending'
                            ? 'Menunggu Review'
                            : 'Ditolak'}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-white">
                        {tx.keterangan || (tx.type === 'deposit' ? 'Permintaan Deposit' : 'Permintaan Penarikan Dana')}
                      </div>

                      <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                        {tx.method && <span>Metode: <strong className="text-slate-200">{tx.method}</strong></span>}
                        {tx.cryptoCurrency && (
                          <span className="inline-flex items-center gap-1 text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-lg text-[11px] font-mono">
                            Crypto: <strong>{tx.cryptoAmount} {tx.cryptoCurrency}</strong>
                          </span>
                        )}
                        {tx.txHash && (
                          <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-lg text-[11px] font-mono">
                            TXID: <span className="max-w-[140px] truncate" title={tx.txHash}>{tx.txHash}</span>
                          </span>
                        )}
                        {tx.bankName && <span>Bank: <strong className="text-slate-200">{tx.bankName}</strong></span>}
                        {tx.accountNumber && (
                          <span>
                            Rekening: <strong className="text-slate-200 font-mono">{tx.accountNumber}</strong> ({tx.holderName})
                          </span>
                        )}
                      </div>

                      {tx.catatanAdmin && (
                        <p className="text-[11px] text-red-300 bg-red-950/40 border border-red-800/40 p-1.5 rounded-lg">
                          Catatan Admin: {tx.catatanAdmin}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Nominal
                        </span>
                        <span
                          className={`text-lg sm:text-xl font-bold font-mono ${
                            tx.type === 'deposit' ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {tx.type === 'deposit' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {tx.status === 'pending' && (
                          <>
                            <button
                              disabled={processingAction}
                              onClick={() => {
                                setRejectionTarget({
                                  type: 'transaksi',
                                  id: tx.id,
                                  subId: tx.type,
                                  nominal: tx.amount,
                                  userId: tx.userId
                                });
                                setRejectionReason('');
                              }}
                              className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Tolak
                            </button>

                            <button
                              disabled={processingAction}
                              onClick={() => handleApproveTransaction(tx)}
                              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" />
                              {tx.type === 'deposit' ? 'Setujui & Tambah Saldo' : 'Setujui Transfer'}
                            </button>
                          </>
                        )}

                        <button
                          title="Hapus Transaksi"
                          onClick={() =>
                            setDeleteConfirmState({
                              isOpen: true,
                              target: { type: 'transaksi', id: tx.id, name: `Transaksi ${tx.type} Rp ${tx.amount.toLocaleString('id-ID')}` }
                            })
                          }
                          className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: 7. VERIFIKASI KLAIM REWARD PELAPOR */}
        {activeTab === 'reward' && (
          <div className="space-y-6">
            <div className="p-5 bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/10 rounded-2xl border-2 border-amber-500/40 space-y-2">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">
                  Regulasi Whistleblower Reward Integritas360
                </h3>
              </div>
              <p className="text-xs text-amber-200/95 leading-relaxed">
                <strong>Ketentuan Wajib:</strong> Tidak ada batasan waktu untuk klaim reward. Pelapor yang laporannya dinyatakan valid
                dan terbukti berhak mengklaim hadiah tunai kapan saja tanpa tanggal kedaluwarsa.
                Setiap klaim reward akan diverifikasi secara teliti oleh Administrator sebelum dana ditransfer ke rekening bank pelapor.
              </p>
            </div>

            {rewardClaimTx.length === 0 ? (
              <div className="py-16 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
                <Award className="w-10 h-10 mx-auto text-slate-700" />
                <p className="text-sm font-medium">Belum ada pengajuan klaim reward dari pelapor.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rewardClaimTx.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Tiket #{tx.claimReportToken || 'ANONIM'}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              tx.status === 'selesai'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : tx.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}
                          >
                            {tx.status === 'selesai'
                              ? 'Selesai / Ditransfer'
                              : tx.status === 'pending'
                              ? 'Menunggu Review Admin'
                              : 'Ditolak'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1.5">
                          {tx.keterangan || 'Klaim Reward Pelapor'}
                        </h4>
                        {tx.companyName && (
                          <p className="text-xs text-slate-400">
                            Entitas Terlapor: <strong className="text-slate-200">{tx.companyName}</strong>
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Nominal Reward
                        </span>
                        <span className="text-xl font-bold font-mono text-amber-400">
                          Rp {tx.amount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Rekening Pencairan:</span>
                        <p className="font-bold text-white">
                          {tx.bankName} - <span className="font-mono text-amber-400">{tx.accountNumber}</span>
                        </p>
                        <p className="text-slate-300">a.n. {tx.holderName}</p>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">Notifikasi WhatsApp:</span>
                        {tx.whatsapp ? (
                          <p className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {tx.whatsapp}
                          </p>
                        ) : (
                          <p className="text-slate-500 italic">Tidak mencantumkan nomor</p>
                        )}
                      </div>
                    </div>

                    {tx.catatanAdmin && (
                      <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-800/40 text-xs text-red-300">
                        <strong>Catatan Administrator:</strong> {tx.catatanAdmin}
                      </div>
                    )}

                    {tx.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          disabled={processingAction}
                          onClick={() => {
                            setRejectionTarget({
                              type: 'reward',
                              id: tx.id,
                              subId: tx.claimReportId
                            });
                            setRejectionReason('');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Tolak Klaim
                        </button>

                        <button
                          disabled={processingAction}
                          onClick={() => handleApproveClaimReward(tx)}
                          className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Setujui & Selesaikan Pencairan Reward
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: 8. AUDIT LOGS (SYSTEM) */}
        {activeTab === 'audit_logs' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  Audit Trail & Log Aktivitas Sistem
                </h3>
                <p className="text-xs text-slate-400">
                  Rekam jejak seluruh mutasi perusahaan, pembuatan akun login, perubahan role, dan akses tenant terisolasi.
                </p>
              </div>
            </div>
            <AdminAuditLogsView />
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* ALL INTERACTIVE MODALS */}
      {/* ========================================================= */}

      {/* 1. LOCK / UNLOCK MODAL */}
      <LockModal
        isOpen={lockModalState.isOpen}
        onClose={() => setLockModalState({ isOpen: false, entity: null, action: 'lock' })}
        entity={lockModalState.entity}
        initialAction={lockModalState.action}
        onConfirm={handleLockConfirm}
      />

      {/* 2. EDIT / TOP UP SALDO PERUSAHAAN MODAL */}
      <EditSaldoModal
        isOpen={editSaldoState.isOpen}
        onClose={() => setEditSaldoState({ isOpen: false, entity: null })}
        entity={editSaldoState.entity}
        onSave={handleSaveCompanySaldo}
        onTopUp={handleTopUpCompany}
      />

      {/* 3. EDIT / TOP UP SALDO AUDITOR MODAL */}
      <EditAuditorSaldoModal
        isOpen={editAuditorSaldoState.isOpen}
        onClose={() => setEditAuditorSaldoState({ isOpen: false, auditor: null })}
        auditor={editAuditorSaldoState.auditor}
        onSave={handleSaveAuditorSaldo}
        onTopUpFee={handleTopUpAuditorFee}
      />

      {/* 4. EDIT PROFIL ENTITAS (PT / AUDITOR) MODAL */}
      <EditProfileModal
        isOpen={editProfileState.isOpen}
        onClose={() => setEditProfileState({ isOpen: false, entity: null })}
        entity={editProfileState.entity}
        onSave={handleSaveProfile}
      />

      {/* 5. EDIT LAPORAN WHISTLEBLOWING MODAL */}
      <EditReportModal
        isOpen={editReportState.isOpen}
        onClose={() => setEditReportState({ isOpen: false, report: null })}
        report={editReportState.report}
        auditorList={auditorList}
        onSave={handleSaveReport}
      />

      {/* 6. CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={deleteConfirmState.isOpen}
        onClose={() => setDeleteConfirmState({ isOpen: false, target: null })}
        target={deleteConfirmState.target}
        onConfirm={handleDeleteConfirm}
      />

      {/* 7. REJECTION REASON MODAL */}
      {rejectionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Alasan Penolakan Administrator
              </h3>
              <button
                onClick={() => setRejectionTarget(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRejectionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Berikan Catatan atau Alasan Penolakan:
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Dokumen buram, nomor rekening tidak sesuai, atau bukti belum memenuhi syarat..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectionTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
                >
                  {processingAction ? 'Memproses...' : 'Konfirmasi Tolak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. POSTER MODAL COMPONENT */}
      {selectedPTForPoster && (
        <PosterModal
          isOpen={isPosterModalOpen}
          onClose={() => {
            setIsPosterModalOpen(false);
            setSelectedPTForPoster(null);
          }}
          company={selectedPTForPoster}
        />
      )}

      {/* 9. ADD PERUSAHAAN MODAL */}
      <AddPerusahaanModal
        isOpen={isAddPerusahaanOpen}
        onClose={() => setIsAddPerusahaanOpen(false)}
        onSubmit={handleAddCompany}
      />

      {/* 10. DETAIL & KELOLA PERUSAHAAN MODAL */}
      <DetailPerusahaanModal
        isOpen={Boolean(detailPerusahaanTarget)}
        onClose={() => setDetailPerusahaanTarget(null)}
        perusahaan={detailPerusahaanTarget}
        onOpenLockModal={(pt, action) =>
          setLockModalState({ isOpen: true, entity: pt, action })
        }
        onOpenEditSaldoModal={(pt) =>
          setEditSaldoState({ isOpen: true, entity: pt })
        }
        onOpenEditProfileModal={(pt) =>
          setEditProfileState({ isOpen: true, entity: pt })
        }
        onOpenPosterModal={openPosterModal}
        onDeleteUser={(pt) =>
          setDeleteConfirmState({
            isOpen: true,
            target: { type: 'user', id: pt.uid, name: pt.namaPT }
          })
        }
      />

      {/* 11. ADD ADMIN PERUSAHAAN MODAL */}
      <AddAdminPerusahaanModal
        isOpen={isAddAdminPerusahaanOpen}
        onClose={() => setIsAddAdminPerusahaanOpen(false)}
        perusahaanList={perusahaanList}
        onSubmit={handleAddAdminPerusahaan}
      />

      {/* 12. EDIT ADMIN PERUSAHAAN MODAL */}
      <EditAdminPerusahaanModal
        isOpen={Boolean(editAdminPerusahaanTarget)}
        onClose={() => setEditAdminPerusahaanTarget(null)}
        adminUser={editAdminPerusahaanTarget}
        perusahaanList={perusahaanList}
        onSave={handleSaveAdminPerusahaan}
      />

      {/* 13. RESET PASSWORD COMPANY USER MODAL */}
      <ResetCompanyUserPasswordModal
        isOpen={resetPasswordState.isOpen}
        onClose={() => setResetPasswordState({ isOpen: false, targetUser: null })}
        targetUser={resetPasswordState.targetUser}
        onResetPassword={handleResetCompanyUserPassword}
      />
    </div>
  );
};
