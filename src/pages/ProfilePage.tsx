import React, { useEffect, useState, useRef } from 'react';
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import {
  UserCircle,
  Building2,
  Wallet,
  Lock,
  Unlock,
  ArrowDownLeft,
  ArrowUpRight,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  ShieldCheck,
  Phone,
  FileText,
  BadgeCheck,
  RefreshCw,
  PlusCircle,
  Banknote,
  History,
  Upload,
  FileCheck,
  ExternalLink,
  AlertTriangle,
  Camera,
  Coins,
  Eye
} from 'lucide-react';
import { UserProfile, WalletTransaction, BankDetails } from '../types';
import { QrisStaticCard } from '../components/QrisStaticCard';
import { NowPaymentsModal } from '../components/NowPaymentsModal';

const SEKTOR_OPTIONS = [
  'Manufaktur & Pabrikasi',
  'Perbankan & Jasa Keuangan',
  'Pertambangan & Energi',
  'Perkebunan & Pertanian',
  'Konstruksi & Properti',
  'Transportasi & Logistik',
  'Teknologi Informasi & Digital',
  'Kesehatan & Farmasi',
  'Perhotelan & Pariwisata',
  'Pendidikan & Yayasan',
  'Pemerintahan & BUMN',
  'Konsultan & Audit Independen',
  'Lainnya',
];

const AUDITOR_SPESIALISASI_OPTIONS = [
  'Audit Forensik & Investigasi Fraud',
  'Audit Kepatuhan & Anti-Penyuapan (ISO 37001)',
  'Audit Finansial & Investigasi Perpajakan',
  'Audit Ketenagakerjaan & Kode Etik SDM',
  'Audit Sistem Informasi & Keamanan Siber',
  'Audit Pengadaan Barang & Jasa (Procurement)',
  'Audit Lingkungan & Tata Kelola ESG',
  'Umum / Multidisiplin Independen',
];

const BANK_OPTIONS = ['BCA', 'Mandiri', 'BRI', 'BNI', 'BSI', 'CIMB Niaga', 'Permata', 'Danamon'];

export const ProfilePage: React.FC = () => {
  const { user, profile: authProfile, loading: authLoading } = useAuth();
  const { navigate } = useNavigation();

  const [activeTab, setActiveTab] = useState<'profile' | 'keuangan' | 'riwayat'>('keuangan');
  const [profileData, setProfileData] = useState<UserProfile | null>(authProfile);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  // Form Edit Profile State (Perusahaan & Umum)
  const [namaPT, setNamaPT] = useState('');
  const [sektor, setSektor] = useState('');
  const [alamat, setAlamat] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [telepon, setTelepon] = useState('');
  const [npwp, setNpwp] = useState('');
  const [picName, setPicName] = useState('');
  const [bankName, setBankName] = useState('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName] = useState('');

  // Auditor-Specific Profile States
  const [nomorLisensi, setNomorLisensi] = useState('');
  const [gelarProfesi, setGelarProfesi] = useState('');
  const [spesialisasiAudit, setSpesialisasiAudit] = useState('Audit Forensik & Investigasi Fraud');
  const [biayaJasaPerKasus, setBiayaJasaPerKasus] = useState<number>(150000);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Profile Picture Upload State
  const [photoURL, setPhotoURL] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Dokumen Legalitas & Verifikasi State
  const [dokumenNama, setDokumenNama] = useState('');
  const [dokumenUrl, setDokumenUrl] = useState('');
  const [statusVerifikasiDokumen, setStatusVerifikasiDokumen] = useState<'pending' | 'terverifikasi' | 'ditolak' | 'belum_upload'>('belum_upload');
  const [catatanVerifikasi, setCatatanVerifikasi] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docUploadMsg, setDocUploadMsg] = useState('');

  // Modal Keuangan States
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showNowPaymentsModal, setShowNowPaymentsModal] = useState(false);
  const [depositTab, setDepositTab] = useState<'qris' | 'nowpayments' | 'bank'>('qris');
  const [depositAmount, setDepositAmount] = useState<number>(5000000);
  const [depositMethod, setDepositMethod] = useState('QRIS Statis Nasional (INTEGRITAS360)');
  const [processingDeposit, setProcessingDeposit] = useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(1000000);
  const [withdrawBank, setWithdrawBank] = useState('BCA');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawHolder, setWithdrawHolder] = useState('');
  const [processingWithdraw, setProcessingWithdraw] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  const [showLockModal, setShowLockModal] = useState(false);
  const [lockAmount, setLockAmount] = useState<number>(1000000);
  const [lockActionType, setLockActionType] = useState<'lock' | 'unlock'>('lock');
  const [processingLock, setProcessingLock] = useState(false);
  const [lockError, setLockError] = useState('');

  // Check login
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const hasInitializedForm = useRef(false);

  // Realtime Profile Listener
  useEffect(() => {
    if (!user) {
      hasInitializedForm.current = false;
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          const isAud = d.role === 'auditor';
          const p: UserProfile = {
            uid: user.uid,
            email: d.email || user.email || '',
            role: d.role || 'perusahaan',
            namaPT: d.namaPT || '',
            sektor: d.sektor || (isAud ? 'Audit Forensik & Investigasi Fraud' : 'Manufaktur & Bisnis'),
            alamat: d.alamat || '',
            deskripsi: d.deskripsi || '',
            telepon: d.telepon || '',
            npwp: d.npwp || '',
            picName: d.picName || d.email || user.email || '',
            nomorLisensi: d.nomorLisensi || '',
            gelarProfesi: d.gelarProfesi || '',
            spesialisasiAudit: d.spesialisasiAudit || d.sektor || 'Audit Forensik & Investigasi Fraud',
            biayaJasaPerKasus: Math.max(100000, Number(d.biayaJasaPerKasus) || 150000),
            danaTersedia: Number(d.danaTersedia || d.danaTerkunci || 0),
            saldo: Number(d.saldo || 0),
            danaTerkunci: Number(d.danaTerkunci || d.danaTersedia || 0),
            statusVerifikasiDokumen: d.statusVerifikasiDokumen || 'belum_upload',
            dokumenUrl: d.dokumenUrl || '',
            dokumenNama: d.dokumenNama || '',
            catatanVerifikasi: d.catatanVerifikasi || '',
            photoURL: d.photoURL || user.photoURL || '',
            rekeningBank: d.rekeningBank || { bankName: 'BCA', accountNumber: '', holderName: '' },
            createdAt: d.createdAt,
          };
          setProfileData(p);
          setPhotoURL(p.photoURL || '');
          setDokumenNama(p.dokumenNama || '');
          setDokumenUrl(p.dokumenUrl || '');
          setStatusVerifikasiDokumen(p.statusVerifikasiDokumen || 'belum_upload');
          setCatatanVerifikasi(p.catatanVerifikasi || '');

          // Hanya inisialisasi input formulir saat pertama kali memuat dari Firestore,
          // sehingga input/isian formulir perusahaan TIDAK ter-reset atau berubah ketika dokumen diunggah
          if (!hasInitializedForm.current) {
            hasInitializedForm.current = true;
            setNamaPT(p.namaPT);
            setSektor(p.sektor);
            setAlamat(p.alamat);
            setDeskripsi(p.deskripsi);
            setTelepon(p.telepon || '');
            setNpwp(p.npwp || '');
            setPicName(p.picName || d.email || user.email || '');
            setNomorLisensi(d.nomorLisensi || '');
            setGelarProfesi(d.gelarProfesi || '');
            setSpesialisasiAudit(d.spesialisasiAudit || d.sektor || 'Audit Forensik & Investigasi Fraud');
            setBiayaJasaPerKasus(Math.max(100000, Number(d.biayaJasaPerKasus) || 150000));
            if (p.rekeningBank) {
              setBankName(p.rekeningBank.bankName || 'BCA');
              setAccountNumber(p.rekeningBank.accountNumber || '');
              setHolderName(p.rekeningBank.holderName || '');
              setWithdrawBank(p.rekeningBank.bankName || 'BCA');
              setWithdrawAccount(p.rekeningBank.accountNumber || '');
              setWithdrawHolder(p.rekeningBank.holderName || '');
            }
          }
        }
      },
      (err) => console.error('Error listening to user profile:', err)
    );

    return () => unsub();
  }, [user]);

  // Realtime Transactions Listener
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'transactions'), where('userId', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: WalletTransaction[] = [];
        snapshot.forEach((snap) => {
          const d = snap.data();
          list.push({
            id: snap.id,
            userId: d.userId,
            type: d.type,
            amount: Number(d.amount || 0),
            status: d.status || 'selesai',
            keterangan: d.keterangan || '',
            metode: d.metode,
            bankDetails: d.bankDetails,
            createdAt: d.createdAt,
          });
        });
        // Sort descending by createdAt or local fallback
        list.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        setTransactions(list);
      },
      (err) => console.warn('Error fetching transactions:', err)
    );

    return () => unsub();
  }, [user]);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSavingProfile(true);
      setProfileErrorMsg('');
      setProfileSuccessMsg('');

      const isAud = profileData?.role === 'auditor';
      const cleanFee = Math.max(100000, Number(biayaJasaPerKasus) || 150000);

      const userRef = doc(db, 'users', user.uid);
      const updateData: any = {
        namaPT: namaPT.trim(),
        alamat: alamat.trim(),
        deskripsi: deskripsi.trim(),
        telepon: telepon.trim(),
        npwp: npwp.trim(),
        picName: picName.trim(),
        rekeningBank: {
          bankName,
          accountNumber: accountNumber.trim(),
          holderName: holderName.trim(),
        },
      };

      if (isAud) {
        updateData.nomorLisensi = nomorLisensi.trim();
        updateData.gelarProfesi = gelarProfesi.trim();
        updateData.spesialisasiAudit = spesialisasiAudit.trim();
        updateData.sektor = spesialisasiAudit.trim(); // sync for sector filters
        updateData.biayaJasaPerKasus = cleanFee;
      } else {
        updateData.sektor = sektor.trim() || 'Lainnya';
      }

      await updateDoc(userRef, updateData);

      setProfileSuccessMsg(
        isAud
          ? 'Profil praktisi auditor, lisensi profesi, tarif jasa, dan rekening bank berhasil disimpan!'
          : 'Data profil dan legalitas perusahaan berhasil disimpan!'
      );
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setProfileErrorMsg(err.message || 'Gagal menyimpan perubahan profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Quick fee updater for auditor
  const handleQuickUpdateFee = async (newFee: number) => {
    if (!user) return;
    const clean = Math.max(100000, newFee);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        biayaJasaPerKasus: clean,
      });
      setBiayaJasaPerKasus(clean);
      alert(`Tarif jasa investigasi per kasus berhasil diperbarui menjadi Rp ${clean.toLocaleString('id-ID')}.`);
    } catch (err: any) {
      console.error('Error updating auditor fee:', err);
      alert('Gagal mengubah tarif jasa: ' + err.message);
    }
  };

  // Handle Document Upload (Perusahaan / Auditor)
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploadingDoc(true);
      setDocUploadMsg('');

      // Convert to base64 with compression for images, or direct dataUrl
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const rawData = event.target?.result as string;
          let finalData = rawData;

          if (file.type.startsWith('image/')) {
            // Compress image to ensure fits well within document
            const img = new Image();
            img.src = rawData;
            await new Promise((res) => { img.onload = res; });
            const canvas = document.createElement('canvas');
            const maxDim = 1200;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h);
              finalData = canvas.toDataURL('image/jpeg', 0.75);
            }
          }

          const isAud = profileData?.role === 'auditor';
          const cleanFee = Math.max(100000, Number(biayaJasaPerKasus) || 150000);

          // Pertahankan semua isian formulir perusahaan / auditor agar tidak hilang saat dokumen diunggah
          const currentNamaPT = (namaPT || profileData?.namaPT || '').trim();
          const currentAlamat = (alamat || profileData?.alamat || '').trim();
          const currentDeskripsi = (deskripsi || profileData?.deskripsi || '').trim();
          const currentTelepon = (telepon || profileData?.telepon || '').trim();
          const currentNpwp = (npwp || profileData?.npwp || '').trim();
          const currentPicName = (picName || profileData?.picName || user.email || '').trim();
          const currentBank = bankName || profileData?.rekeningBank?.bankName || 'BCA';
          const currentAcc = (accountNumber || profileData?.rekeningBank?.accountNumber || '').trim();
          const currentHolder = (holderName || profileData?.rekeningBank?.holderName || '').trim();

          const updatePayload: any = {
            dokumenUrl: finalData,
            dokumenNama: file.name,
            statusVerifikasiDokumen: 'pending',
            catatanVerifikasi: '',
            // Seluruh data profil perusahaan dipastikan tersimpan dan dipertahankan
            namaPT: currentNamaPT,
            alamat: currentAlamat,
            deskripsi: currentDeskripsi,
            telepon: currentTelepon,
            npwp: currentNpwp,
            picName: currentPicName,
            rekeningBank: {
              bankName: currentBank,
              accountNumber: currentAcc,
              holderName: currentHolder,
            },
          };

          if (isAud) {
            updatePayload.nomorLisensi = (nomorLisensi || profileData?.nomorLisensi || '').trim();
            updatePayload.gelarProfesi = (gelarProfesi || profileData?.gelarProfesi || '').trim();
            updatePayload.spesialisasiAudit = (spesialisasiAudit || profileData?.spesialisasiAudit || 'Audit Forensik & Investigasi Fraud').trim();
            updatePayload.sektor = updatePayload.spesialisasiAudit;
            updatePayload.biayaJasaPerKasus = cleanFee;
          } else {
            updatePayload.sektor = (sektor || profileData?.sektor || 'Manufaktur & Pabrikasi').trim();
          }

          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, updatePayload);

          setDokumenUrl(finalData);
          setDokumenNama(file.name);
          setStatusVerifikasiDokumen('pending');
          setDocUploadMsg('Dokumen berhasil diunggah dan seluruh data pengisian perusahaan tersimpan aman! Menunggu verifikasi Administrator.');
          setTimeout(() => setDocUploadMsg(''), 6000);
        } catch (err: any) {
          console.error('Error saving document:', err);
          alert('Gagal mengunggah dokumen: ' + err.message);
        } finally {
          setUploadingDoc(false);
          if (e.target) e.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error reading document:', err);
      setUploadingDoc(false);
      if (e.target) e.target.value = '';
    }
  };

  // Handle Profile Photo Upload & Compression (Perusahaan & Auditor)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploadingPhoto(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const rawData = event.target?.result as string;
          const img = new Image();
          img.src = rawData;
          await new Promise((res) => { img.onload = res; });

          const canvas = document.createElement('canvas');
          const maxDim = 400;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
          }
          const compressed = canvas.toDataURL('image/jpeg', 0.85);

          const isAud = profileData?.role === 'auditor';
          const updatePayload: any = {
            photoURL: compressed,
            namaPT: (namaPT || profileData?.namaPT || '').trim(),
            alamat: (alamat || profileData?.alamat || '').trim(),
            deskripsi: (deskripsi || profileData?.deskripsi || '').trim(),
            telepon: (telepon || profileData?.telepon || '').trim(),
            npwp: (npwp || profileData?.npwp || '').trim(),
            picName: (picName || profileData?.picName || user.email || '').trim(),
            rekeningBank: {
              bankName: bankName || profileData?.rekeningBank?.bankName || 'BCA',
              accountNumber: (accountNumber || profileData?.rekeningBank?.accountNumber || '').trim(),
              holderName: (holderName || profileData?.rekeningBank?.holderName || '').trim(),
            },
          };

          if (isAud) {
            updatePayload.nomorLisensi = (nomorLisensi || profileData?.nomorLisensi || '').trim();
            updatePayload.gelarProfesi = (gelarProfesi || profileData?.gelarProfesi || '').trim();
            updatePayload.spesialisasiAudit = (spesialisasiAudit || profileData?.spesialisasiAudit || 'Audit Forensik & Investigasi Fraud').trim();
            updatePayload.sektor = updatePayload.spesialisasiAudit;
          } else {
            updatePayload.sektor = (sektor || profileData?.sektor || 'Manufaktur & Pabrikasi').trim();
          }

          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, updatePayload);
          setPhotoURL(compressed);
          alert('Foto profil berhasil diperbarui dan data pengisian tetap tersimpan!');
        } catch (err: any) {
          console.error('Error updating photo:', err);
          alert('Gagal mengunggah foto profil: ' + err.message);
        } finally {
          setUploadingPhoto(false);
          if (e.target) e.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error reading photo:', err);
      setUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  // Handle NOWPayments Crypto Deposit Confirmation (Diverifikasi oleh Administrator)
  const handleNowPaymentsConfirm = async (cryptoInfo: {
    cryptoCurrency: string;
    cryptoAmount: number;
    txHash: string;
    apiKeyUsed: string;
  }) => {
    if (!user || depositAmount <= 0) return;

    setProcessingDeposit(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        userName: profileData?.namaPT || user.email,
        type: 'deposit',
        amount: depositAmount,
        status: 'pending',
        metode: `NOWPayments (${cryptoInfo.cryptoCurrency})`,
        cryptoCurrency: cryptoInfo.cryptoCurrency,
        cryptoAmount: cryptoInfo.cryptoAmount,
        txHash: cryptoInfo.txHash,
        keterangan: `Deposit Crypto via NOWPayments: ${cryptoInfo.cryptoAmount} ${cryptoInfo.cryptoCurrency} (TXID: ${cryptoInfo.txHash}) - Menunggu verifikasi Administrator`,
        createdAt: serverTimestamp(),
      });

      setShowNowPaymentsModal(false);
      setShowDepositModal(false);
      alert(`Konfirmasi deposit crypto sebesar ${cryptoInfo.cryptoAmount} ${cryptoInfo.cryptoCurrency} (setara Rp ${depositAmount.toLocaleString('id-ID')}) berhasil diajukan! Administrator akan memverifikasi TXID blockchain Anda sebelum saldo aktif ditambahkan.`);
    } catch (err: any) {
      console.error('Error NOWPayments deposit:', err);
      alert('Gagal mengajukan konfirmasi deposit crypto: ' + err.message);
    } finally {
      setProcessingDeposit(false);
    }
  };

  // Handle Deposit (Diverifikasi oleh Administrator)
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || depositAmount <= 0) return;

    try {
      setProcessingDeposit(true);

      // Catat transaksi dengan status 'pending' (akan diverifikasi oleh Administrator)
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        userName: profileData?.namaPT || user.email,
        type: 'deposit',
        amount: depositAmount,
        status: 'pending',
        keterangan: `Permintaan Deposit saldo via ${depositMethod} (Menunggu verifikasi Administrator)`,
        metode: depositMethod,
        createdAt: serverTimestamp(),
      });

      setShowDepositModal(false);
      setDepositAmount(5000000);
      alert(`Permintaan deposit Rp ${depositAmount.toLocaleString('id-ID')} berhasil diajukan! Administrator akan memverifikasi pembayaran Anda sebelum saldo aktif ditambahkan.`);
    } catch (err: any) {
      console.error('Error depositing:', err);
      alert('Gagal melakukan deposit: ' + err.message);
    } finally {
      setProcessingDeposit(false);
    }
  };

  // Handle Withdrawal (Diverifikasi oleh Administrator)
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    if (!user || withdrawAmount <= 0) return;

    const currentSaldo = profileData?.saldo || 0;
    if (withdrawAmount > currentSaldo) {
      setWithdrawError(`Saldo aktif Anda tidak mencukupi. Saldo tersedia: Rp ${currentSaldo.toLocaleString('id-ID')}`);
      return;
    }

    try {
      setProcessingWithdraw(true);
      const userRef = doc(db, 'users', user.uid);

      // Kurangi saldo aktif sementara untuk reservasi dana penarikan
      await updateDoc(userRef, {
        saldo: increment(-withdrawAmount),
      });

      // Catat transaksi dengan status 'pending' (akan diverifikasi & ditransfer Administrator)
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        userName: profileData?.namaPT || user.email,
        type: 'withdrawal',
        amount: withdrawAmount,
        status: 'pending',
        keterangan: `Penarikan dana ke rekening ${withdrawBank} ${withdrawAccount} a.n. ${withdrawHolder} (Menunggu verifikasi & transfer Administrator)`,
        bankDetails: {
          bankName: withdrawBank,
          accountNumber: withdrawAccount.trim(),
          holderName: withdrawHolder.trim(),
        },
        createdAt: serverTimestamp(),
      });

      setShowWithdrawModal(false);
      setWithdrawAmount(1000000);
      alert(`Permintaan penarikan Rp ${withdrawAmount.toLocaleString('id-ID')} berhasil diajukan! Administrator akan memverifikasi dan mentransfer dana ke rekening ${withdrawBank} Anda.`);
    } catch (err: any) {
      console.error('Error withdrawing:', err);
      setWithdrawError(err.message || 'Gagal melakukan penarikan dana.');
    } finally {
      setProcessingWithdraw(false);
    }
  };

  // Handle Lock / Unlock Dana
  const handleLockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLockError('');
    if (!user || lockAmount <= 0) return;

    const currentSaldo = profileData?.saldo || 0;
    const currentLocked = profileData?.danaTerkunci || profileData?.danaTersedia || 0;

    if (lockActionType === 'lock') {
      if (lockAmount > currentSaldo) {
        setLockError(`Saldo aktif tidak mencukupi untuk dikunci. Saldo aktif: Rp ${currentSaldo.toLocaleString('id-ID')}`);
        return;
      }
    } else {
      if (lockAmount > currentLocked) {
        setLockError(`Dana terkunci tidak mencukupi untuk dibuka. Dana terkunci saat ini: Rp ${currentLocked.toLocaleString('id-ID')}`);
        return;
      }
    }

    try {
      setProcessingLock(true);
      const userRef = doc(db, 'users', user.uid);

      if (lockActionType === 'lock') {
        // Pindahkan dari saldo aktif -> danaTerkunci & danaTersedia
        await updateDoc(userRef, {
          saldo: increment(-lockAmount),
          danaTerkunci: increment(lockAmount),
          danaTersedia: increment(lockAmount),
        });

        await addDoc(collection(db, 'transactions'), {
          userId: user.uid,
          type: 'lock',
          amount: lockAmount,
          status: 'selesai',
          keterangan: 'Kunci dana penjaminan whistleblowing (dialokasikan ke poster)',
          createdAt: serverTimestamp(),
        });
      } else {
        // Pindahkan dari danaTerkunci & danaTersedia -> saldo aktif
        await updateDoc(userRef, {
          saldo: increment(lockAmount),
          danaTerkunci: increment(-lockAmount),
          danaTersedia: increment(-lockAmount),
        });

        await addDoc(collection(db, 'transactions'), {
          userId: user.uid,
          type: 'unlock',
          amount: lockAmount,
          status: 'selesai',
          keterangan: 'Buka kunci dana penjaminan kembali ke saldo aktif',
          createdAt: serverTimestamp(),
        });
      }

      setShowLockModal(false);
      setLockAmount(1000000);
    } catch (err: any) {
      console.error('Error locking/unlocking dana:', err);
      setLockError(err.message || 'Gagal mengubah status kunci dana.');
    } finally {
      setProcessingLock(false);
    }
  };

  const currentSaldo = Number(profileData?.saldo || 0);
  const currentDanaTerkunci = Number(profileData?.danaTerkunci || profileData?.danaTersedia || 0);
  const totalAset = currentSaldo + currentDanaTerkunci;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Identity Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="relative group shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 overflow-hidden">
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt="Foto Profil"
                      className="w-full h-full object-cover rounded-[14px]"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                      {profileData?.role === 'perusahaan' ? (
                        <Building2 className="w-9 h-9 text-amber-400" />
                      ) : (
                        <UserCircle className="w-9 h-9 text-amber-400" />
                      )}
                    </div>
                  )}
                </div>
                <label
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl flex items-center justify-center shadow-lg cursor-pointer transition-all border border-amber-300 group-hover:scale-110"
                  title="Ganti Foto Profil / Logo Perusahaan"
                >
                  {uploadingPhoto ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {profileData?.namaPT || (profileData?.role === 'auditor' ? 'Auditor Independen' : 'Lengkapi Nama Perusahaan')}
                    {profileData?.role === 'auditor' && profileData?.gelarProfesi && (
                      <span className="text-amber-400 font-bold ml-1.5 text-base sm:text-lg">, {profileData.gelarProfesi}</span>
                    )}
                  </h1>
                  {profileData?.statusVerifikasiDokumen === 'terverifikasi' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Terverifikasi ISO 37002
                    </span>
                  )}
                  <div
                    className={`inline-flex items-center gap-1 text-[11px] font-mono uppercase px-2 py-0.5 rounded-md border font-semibold tracking-wider ${
                      profileData?.role === 'owner'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : profileData?.role === 'admin_perusahaan'
                        ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                        : profileData?.role === 'perusahaan'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {profileData?.role === 'admin_perusahaan' ? (
                      <>
                        <ShieldCheck className="w-3 h-3 text-cyan-400" />
                        <span>ADMIN PT</span>
                      </>
                    ) : profileData?.role === 'perusahaan' ? (
                      <>
                        <Building2 className="w-3 h-3" />
                        <span>perusahaan</span>
                      </>
                    ) : profileData?.role === 'auditor' ? (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Auditor</span>
                      </>
                    ) : (
                      <span>ADMIN OWNER</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-medium">
                  <span className="font-mono text-slate-300">{user?.email}</span>
                  <span className="text-slate-700">·</span>
                  {profileData?.role === 'admin_perusahaan' ? (
                    <>
                      <span>Perusahaan Ditugaskan: <strong className="text-cyan-300">{profileData?.perusahaanName || profileData?.namaPT || 'PT Terkait'}</strong></span>
                      <span className="text-slate-700">·</span>
                      <span>Jabatan: <strong className="text-slate-200">{profileData?.jabatan || 'Admin Kepatuhan'}</strong></span>
                      <span className="text-slate-700">·</span>
                      <span>Divisi: <strong className="text-slate-200">{profileData?.departemen || 'Kepatuhan & Audit Internal'}</strong></span>
                    </>
                  ) : profileData?.role === 'auditor' ? (
                    <>
                      <span>Spesialisasi: <strong className="text-emerald-400">{profileData?.spesialisasiAudit || profileData?.sektor || 'Audit Forensik & Investigasi'}</strong></span>
                      <span className="text-slate-700">·</span>
                      <span>No. Lisensi: <strong className="text-slate-200 font-mono">{profileData?.nomorLisensi || 'Belum diisi'}</strong></span>
                    </>
                  ) : (
                    <>
                      <span>Sektor: <strong className="text-slate-200">{profileData?.sektor || '-'}</strong></span>
                      <span className="text-slate-700">·</span>
                      <span>PIC Kepatuhan: <strong className="text-slate-200">{profileData?.picName || 'Belum diisi'}</strong></span>
                      {profileData?.npwp && (
                        <>
                          <span className="text-slate-700">·</span>
                          <span>NPWP: <span className="font-mono text-slate-300">{profileData.npwp}</span></span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Balance Status in Header */}
            {profileData?.role === 'admin_perusahaan' ? (
              <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl p-4 flex items-center gap-4 shadow-inner">
                <div>
                  <p className="text-[10px] uppercase font-mono font-semibold text-cyan-400 tracking-wider">Akses Portal Kepatuhan</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {profileData?.perusahaanName || 'Perusahaan Kepatuhan'}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/admin-perusahaan')}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors shadow-md shadow-cyan-600/20 cursor-pointer"
                >
                  Buka Dashboard
                </button>
              </div>
            ) : profileData?.role === 'auditor' ? (
              <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-5 shadow-inner">
                <div>
                  <p className="text-[10px] uppercase font-mono font-semibold text-emerald-400 tracking-wider">Saldo Honorarium Cair</p>
                  <p className="text-xl sm:text-2xl font-mono font-bold text-white mt-0.5">
                    Rp {currentSaldo.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div>
                  <p className="text-[10px] uppercase font-mono font-semibold text-amber-400 tracking-wider">Tarif per Kasus</p>
                  <p className="text-base font-mono font-bold text-amber-300 mt-0.5">
                    Rp {Math.max(100000, Number(profileData?.biayaJasaPerKasus || biayaJasaPerKasus || 150000)).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center gap-5 shadow-inner">
                <div>
                  <p className="text-[10px] uppercase font-mono font-semibold text-slate-400 tracking-wider">Total Kas Entitas</p>
                  <p className="text-xl sm:text-2xl font-mono font-bold text-amber-400 mt-0.5">
                    Rp {totalAset.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div>
                  <p className="text-[10px] uppercase font-mono font-semibold text-emerald-400 tracking-wider">Dana Terkunci Escrow</p>
                  <p className="text-base font-mono font-bold text-emerald-300 mt-0.5">
                    Rp {currentDanaTerkunci.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs within Profile */}
          <div className="flex items-center gap-1.5 mt-6 pt-5 border-t border-slate-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              {profileData?.role === 'auditor' ? 'Profil & Sertifikasi Auditor' : 'Profil Perusahaan & Legalitas'}
            </button>

            <button
              onClick={() => setActiveTab('keuangan')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'keuangan'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              {profileData?.role === 'auditor'
                ? 'Honorarium & Payout'
                : 'Dompet & Saldo Kas (Deposit, Kunci, Tarik)'}
            </button>

            <button
              onClick={() => setActiveTab('riwayat')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'riwayat'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              {profileData?.role === 'auditor'
                ? `Riwayat Mutasi Honorarium (${transactions.length})`
                : `Riwayat Mutasi Transaksi (${transactions.length})`}
            </button>
          </div>
        </div>

        {/* TAB 1: KEUANGAN (SALDO, DEPOSIT, WITHDRAWAL, LOCK DANA) */}
        {activeTab === 'keuangan' && (
          <div className="space-y-6">
            {profileData?.role === 'auditor' ? (
              <>
                {/* Banner Edukasi Khusus Auditor */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-xs text-slate-300 space-y-2 relative overflow-hidden">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Portal Finansial Auditor Independen: Bebas Deposit & Bebas Kunci Dana</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-xs">
                    Sebagai Auditor Independen yang menjalankan fungsi investigasi profesional, <strong>Anda TIDAK PERLU melakukan deposit saldo dan TIDAK PERLU mengunci dana (lock penjaminan)</strong>.
                    Sistem INTEGRITAS360 menjamin seluruh pembiayaan investigasi ditanggung oleh Perusahaan Terlapor melalui alokasi lock escrow. Setiap laporan aduan yang Anda nyatakan valid akan secara otomatis menghasilkan honorarium jasa audit yang langsung masuk ke Saldo Honorarium Anda dan dapat dicairkan (ditarik) kapan saja ke rekening bank.
                  </p>
                </div>

                {/* Auditor Financial Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Card 1: Saldo Honorarium Bersih */}
                  <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          Saldo Honorarium Bersih
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Banknote className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black font-mono text-white mb-2">
                        Rp {currentSaldo.toLocaleString('id-ID')}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Akumulasi honorarium hasil verifikasi aduan yang telah dinyatakan valid. Seluruh saldo bersifat likuid dan dapat dicairkan langsung ke rekening bank Anda.
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setWithdrawError('');
                          setShowWithdrawModal(true);
                        }}
                        disabled={currentSaldo <= 0}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        Tarik Dana (Withdrawal)
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Tarif Jasa Investigasi per Kasus */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          Tarif Jasa per Kasus
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          Min. Rp 100.000
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mb-2">
                        Rp {Math.max(100000, Number(profileData?.biayaJasaPerKasus || biayaJasaPerKasus || 150000)).toLocaleString('id-ID')}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Imbalan profesional yang Anda terima per berkas kasus valid. Otomatis dipotong dari dana jaminan perusahaan saat kasus diambil atau melewati SLA 1x24 jam.
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-400">Pilihan Cepat Tarif:</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[150000, 250000, 500000].map((nominal) => (
                          <button
                            key={nominal}
                            type="button"
                            onClick={() => handleQuickUpdateFee(nominal)}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all border cursor-pointer ${
                              Math.max(100000, Number(profileData?.biayaJasaPerKasus || biayaJasaPerKasus || 150000)) === nominal
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            }`}
                          >
                            Rp {(nominal / 1000).toLocaleString('id-ID')}k
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setActiveTab('profile')}
                        className="w-full text-center text-xs text-amber-400 hover:underline pt-1 block cursor-pointer"
                      >
                        Ubah nominal kustom di Profil &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Rekening Bank Penarikan */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Rekening Penerima
                        </span>
                        <CreditCard className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="text-base font-bold text-white mb-1">
                        {profileData?.rekeningBank?.bankName || 'Belum diatur'}
                      </div>
                      <div className="text-sm font-mono text-amber-400 font-semibold">
                        {profileData?.rekeningBank?.accountNumber || 'Nomor rekening kosong'}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        a.n. {profileData?.rekeningBank?.holderName || 'Nama pemilik rekening'}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                        Pencairan honorarium akan ditransfer ke rekening bank ini setelah diajukan dan diverifikasi oleh admin dalam 1x24 jam.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('profile')}
                      className="mt-4 pt-3 border-t border-slate-800 text-xs text-amber-400 hover:underline font-semibold text-left flex items-center gap-1 cursor-pointer"
                    >
                      Kelola rekening di Profil & Sertifikasi &rarr;
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Balance Overview Cards Khusus Perusahaan */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Card 1: Saldo Bebas (Aktif) */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                        Saldo Bebas (Aktif)
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Banknote className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-white mb-2">
                      Rp {currentSaldo.toLocaleString('id-ID')}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Saldo yang dapat ditarik (*withdrawal*) kapan saja atau dipindahkan ke Lock Dana penjaminan integritas.
                    </p>

                    <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800">
                      <button
                        onClick={() => setShowDepositModal(true)}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        Deposit Saldo
                      </button>
                      <button
                        onClick={() => {
                          setWithdrawError('');
                          setShowWithdrawModal(true);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                        Withdrawal
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Lock Dana (Dana Terkunci) */}
                  <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        Lock Dana (Dana Terkunci)
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mb-2">
                      Rp {currentDanaTerkunci.toLocaleString('id-ID')}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Dana jaminan integritas whistleblowing (ISO 37002). Nominal ini otomatis tertera pada poster resmi PT.
                    </p>

                    <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setLockActionType('lock');
                          setLockError('');
                          setShowLockModal(true);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Kunci Dana
                      </button>
                      <button
                        onClick={() => {
                          setLockActionType('unlock');
                          setLockError('');
                          setShowLockModal(true);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5 text-amber-400" />
                        Buka Kunci
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Rekening Bank Penarikan Perusahaan */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Rekening Penarikan
                        </span>
                        <CreditCard className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="text-base font-bold text-white mb-1">
                        {profileData?.rekeningBank?.bankName || 'Belum diatur'}
                      </div>
                      <div className="text-sm font-mono text-amber-400 font-semibold">
                        {profileData?.rekeningBank?.accountNumber || 'Nomor rekening kosong'}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        a.n. {profileData?.rekeningBank?.holderName || 'Pemilik rekening'}
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('profile')}
                      className="mt-4 text-xs text-amber-400 hover:underline font-semibold text-left cursor-pointer"
                    >
                      Ubah data rekening pada tab Edit Profil &rarr;
                    </button>
                  </div>
                </div>

                {/* Information Box on Dana Kepatuhan */}
                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    Mekanisme Penjaminan Integritas & Kepatuhan
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Setiap perusahaan peserta diwajibkan mengalokasikan <strong>Lock Dana</strong> sebagai wujud
                    komitmen penjaminan perlindungan saksi, imbalan pelapor berintegritas, serta pembiayaan audit
                    independen. Dana yang dikunci tidak dapat ditarik secara sepihak selama proses investigasi aduan
                    whistleblowing sedang berlangsung.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: EDIT PROFILE & LENGKAPI PENDAFTARAN */}
        {activeTab === 'profile' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            {profileSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {profileErrorMsg && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            {profileData?.role === 'auditor' ? (
              /* ================= AUDITOR PROFILE FORM ================= */
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Profil Praktisi Auditor Independen & Kredensial Lisensi
                  </h2>
                  <p className="text-xs text-slate-400">
                    Lengkapi identitas auditor, gelar profesi, nomor izin lisensi/SKKNI/ACFE, keahlian investigasi, tarif jasa per kasus, dan rekening pencairan honorarium.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* Bagian 1: Identitas Auditor */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <UserCircle className="w-3.5 h-3.5" />
                      1. Identitas Praktisi & Kredensial Profesi
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Nama Lengkap Praktisi / Auditor *
                        </label>
                        <input
                          type="text"
                          required
                          value={namaPT}
                          onChange={(e) => setNamaPT(e.target.value)}
                          placeholder="Contoh: Budi Santoso, Ak."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Gelar Profesi
                        </label>
                        <input
                          type="text"
                          value={gelarProfesi}
                          onChange={(e) => setGelarProfesi(e.target.value)}
                          placeholder="Contoh: CPA, CFE, CFrA, CA, SH, M.H."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Nomor Lisensi / Izin Praktik Profesi
                        </label>
                        <input
                          type="text"
                          value={nomorLisensi}
                          onChange={(e) => setNomorLisensi(e.target.value)}
                          placeholder="Contoh: SK Kemenkeu No. 123/KM.1/2023 / ACFE-ID-9912"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Nama Kantor Akuntan Publik (KAP) / Kantor Hukum
                          <span className="text-slate-400 font-normal ml-1.5 text-[11px]">(Opsional jika perseorangan)</span>
                        </label>
                        <input
                          type="text"
                          value={picName}
                          onChange={(e) => setPicName(e.target.value)}
                          placeholder="Contoh: KAP Budi & Rekan (atau kosongkan)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Spesialisasi Bidang Audit *
                        </label>
                        <select
                          value={spesialisasiAudit}
                          onChange={(e) => setSpesialisasiAudit(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          {AUDITOR_SPESIALISASI_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Tarif Biaya Jasa per Kasus Valid (Rp) *
                        </label>
                        <input
                          type="number"
                          min={100000}
                          step={10000}
                          required
                          value={biayaJasaPerKasus}
                          onChange={(e) => setBiayaJasaPerKasus(Number(e.target.value))}
                          placeholder="150000"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-amber-400 font-bold focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">Minimal Rp 100.000 (otomatis dibayar saat investigasi valid).</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Nomor NIK KTP / NPWP Pribadi
                        </label>
                        <input
                          type="text"
                          value={npwp}
                          onChange={(e) => setNpwp(e.target.value)}
                          placeholder="3201xxxxxxxxxxxx"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Email Akun (Terdaftar)
                        </label>
                        <input
                          type="email"
                          disabled
                          value={user?.email || ''}
                          className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-400 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Alamat Domisili KTP / Kantor Praktik *
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={alamat}
                        onChange={(e) => setAlamat(e.target.value)}
                        placeholder="Alamat domisili lengkap sesuai KTP atau alamat kantor praktik..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Bio Singkat, Pengalaman Investigasi & Komitmen Independensi
                      </label>
                      <textarea
                        rows={3}
                        value={deskripsi}
                        onChange={(e) => setDeskripsi(e.target.value)}
                        placeholder="Deskripsikan riwayat pengalaman audit forensik, sertifikasi yang dimiliki, dan integritas independensi Anda..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Bagian 2: Kontak Narahubung */}
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      2. Kontak Narahubung & WhatsApp
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Nomor Telepon / WhatsApp Resmi *
                      </label>
                      <input
                        type="text"
                        required
                        value={telepon}
                        onChange={(e) => setTelepon(e.target.value)}
                        placeholder="Contoh: 0812-3456-7890"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Bagian 3: Rekening Bank Penarikan Honorarium */}
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      3. Rekening Bank Penarikan Honorarium
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Bank</label>
                        <select
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          {BANK_OPTIONS.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Nomor Rekening
                        </label>
                        <input
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Contoh: 1234567890"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Nama Pemilik Rekening
                        </label>
                        <input
                          type="text"
                          value={holderName}
                          onChange={(e) => setHolderName(e.target.value)}
                          placeholder="Nama di buku tabungan"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 4: Dokumen Lisensi & Sertifikasi Auditor */}
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5" />
                        4. Dokumen Lisensi / Sertifikasi Auditor
                      </h3>
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                          statusVerifikasiDokumen === 'terverifikasi'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : statusVerifikasiDokumen === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : statusVerifikasiDokumen === 'ditolak'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {statusVerifikasiDokumen === 'terverifikasi'
                          ? 'Terverifikasi'
                          : statusVerifikasiDokumen === 'pending'
                          ? 'Menunggu Verifikasi'
                          : statusVerifikasiDokumen === 'ditolak'
                          ? 'Ditolak'
                          : 'Belum Unggah'}
                      </span>
                    </div>

                    <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-xs text-emerald-200/90 leading-relaxed flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Verifikasi Kredensial Auditor:</strong> Unggah bukti sertifikasi profesi (CPA/CFE/CFrA/IAPI), surat izin praktik Kemenkeu, atau KTP praktisi untuk memperoleh status <em>Terverifikasi</em> di hadapan perusahaan pelapor.
                      </div>
                    </div>

                    {/* Status Box */}
                    {statusVerifikasiDokumen === 'terverifikasi' && (
                      <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <p className="font-bold text-white">Lisensi Terverifikasi oleh Administrator</p>
                          <p className="text-[11px] text-emerald-400/80">
                            Profil Anda berstatus Auditor Independen Terverifikasi.
                          </p>
                        </div>
                      </div>
                    )}

                    {statusVerifikasiDokumen === 'pending' && (
                      <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs flex items-center gap-2.5">
                        <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                        <div>
                          <p className="font-bold text-white">Dokumen Sedang Diverifikasi oleh Administrator</p>
                          <p className="text-[11px] text-amber-400/80">
                            Administrator sedang meninjau berkas lisensi profesi Anda.
                          </p>
                        </div>
                      </div>
                    )}

                    {statusVerifikasiDokumen === 'ditolak' && (
                      <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white">Dokumen Ditolak oleh Administrator</p>
                          <p className="text-[11px] text-red-300/80 mt-0.5">
                            {catatanVerifikasi || 'Dokumen lisensi tidak terbaca. Harap unggah scan dokumen yang jelas.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Upload Dokumen Input */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-200">
                            Unggah Sertifikat / Izin Praktik / KTP Auditor
                          </label>
                          <p className="text-[11px] text-slate-400">
                            Format: JPG, PNG, atau PDF (maks. 5MB).
                          </p>
                        </div>

                        <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors border border-slate-700 shrink-0">
                          <Upload className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{uploadingDoc ? 'Mengunggah...' : 'Pilih Berkas'}</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleDocumentUpload}
                            disabled={uploadingDoc}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {docUploadMsg && (
                        <p className="text-xs text-emerald-400 font-semibold">{docUploadMsg}</p>
                      )}

                      {dokumenNama && (
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="truncate">{dokumenNama}</span>
                          </div>
                          {dokumenUrl && (
                            <a
                              href={dokumenUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold text-[11px] shrink-0 ml-2"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Lihat Berkas
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {savingProfile ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Menyimpan Data Auditor...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Simpan Profil & Lisensi Auditor
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* ================= COMPANY PROFILE FORM ================= */
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-400" />
                    Edit Profil Perusahaan / Entitas & Kelengkapan Data
                  </h2>
                  <p className="text-xs text-slate-400">
                    Lengkapi identitas, penanggung jawab (PIC), dan rekening bank untuk keperluan pencetakan poster resmi dan verifikasi sistem.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* Bagian 1: Data Perusahaan */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      1. Informasi Perusahaan / Institusi
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Nama Perusahaan / PT / Institusi *
                        </label>
                        <input
                          type="text"
                          required
                          value={namaPT}
                          onChange={(e) => setNamaPT(e.target.value)}
                          placeholder="Contoh: PT Sumber Integritas Nusantara"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Sektor Industri *
                        </label>
                        <select
                          value={sektor}
                          onChange={(e) => setSektor(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          {SEKTOR_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Nomor Pokok Wajib Pajak (NPWP) / NIB
                        </label>
                        <input
                          type="text"
                          value={npwp}
                          onChange={(e) => setNpwp(e.target.value)}
                          placeholder="00.000.000.0-000.000"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Email Akun (Terdaftar)
                        </label>
                        <input
                          type="email"
                          disabled
                          value={user?.email || ''}
                          className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-400 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Alamat Lengkap Kantor *
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={alamat}
                        onChange={(e) => setAlamat(e.target.value)}
                        placeholder="Alamat kantor pusat, gedung, lantai, dan kota..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Deskripsi Singkat & Komitmen Kepatuhan
                      </label>
                      <textarea
                        rows={3}
                        value={deskripsi}
                        onChange={(e) => setDeskripsi(e.target.value)}
                        placeholder="Jelaskan bidang usaha, jumlah karyawan, dan komitmen penegakan tata kelola perusahaan yang bersih..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Bagian 2: Kontak PIC */}
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      2. Kontak PIC / Pejabat Kepatuhan (Compliance Officer)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Nama PIC / Pejabat Kepatuhan
                        </label>
                        <input
                          type="text"
                          value={picName}
                          onChange={(e) => setPicName(e.target.value)}
                          placeholder="Nama lengkap penanggung jawab"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Nomor Telepon / WhatsApp Resmi
                        </label>
                        <input
                          type="text"
                          value={telepon}
                          onChange={(e) => setTelepon(e.target.value)}
                          placeholder="0812-xxxx-xxxx"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 3: Rekening Bank Penarikan */}
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      3. Rekening Bank Utama (Untuk Penarikan / Withdrawal Saldo)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Bank</label>
                        <select
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          {BANK_OPTIONS.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Nomor Rekening
                        </label>
                        <input
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Contoh: 1234567890"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Nama Pemilik Rekening (Sesuai Buku Tabungan)
                        </label>
                        <input
                          type="text"
                          value={holderName}
                          onChange={(e) => setHolderName(e.target.value)}
                          placeholder="Nama di rekening bank"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 4: Dokumen Legalitas & Verifikasi Administrator */}
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5" />
                        4. Dokumen Legalitas & Verifikasi Administrator
                      </h3>
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                          statusVerifikasiDokumen === 'terverifikasi'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : statusVerifikasiDokumen === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : statusVerifikasiDokumen === 'ditolak'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {statusVerifikasiDokumen === 'terverifikasi'
                          ? 'Terverifikasi'
                          : statusVerifikasiDokumen === 'pending'
                          ? 'Menunggu Verifikasi'
                          : statusVerifikasiDokumen === 'ditolak'
                          ? 'Ditolak'
                          : 'Belum Unggah'}
                      </span>
                    </div>

                    <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Ketentuan Verifikasi:</strong> Dokumen legalitas perusahaan (NIB/SIUP/NPWP/Akta) untuk menjamin keabsahan akun dan kepatuhan sistem.
                      </div>
                    </div>

                    {/* Status Box */}
                    {statusVerifikasiDokumen === 'terverifikasi' && (
                      <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <p className="font-bold text-white">Dokumen Terverifikasi oleh Administrator</p>
                          <p className="text-[11px] text-emerald-400/80">
                            Entitas Anda telah diakui sebagai entitas resmi dan tersertifikasi.
                          </p>
                        </div>
                      </div>
                    )}

                    {statusVerifikasiDokumen === 'pending' && (
                      <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs flex items-center gap-2.5">
                        <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                        <div>
                          <p className="font-bold text-white">Dokumen Sedang Diverifikasi oleh Administrator</p>
                          <p className="text-[11px] text-amber-400/80">
                            Administrator sedang meninjau keabsahan berkas yang Anda unggah.
                          </p>
                        </div>
                      </div>
                    )}

                    {statusVerifikasiDokumen === 'ditolak' && (
                      <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white">Dokumen Ditolak oleh Administrator</p>
                          <p className="text-[11px] text-red-300/80 mt-0.5">
                            {catatanVerifikasi || 'Dokumen buram atau tidak sesuai. Silakan unggah ulang dokumen resmi.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Upload Dokumen Input */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-200">
                            Unggah Berkas Legalitas Perusahaan (NIB / SIUP / NPWP / Akta)
                          </label>
                          <p className="text-[11px] text-slate-400">
                            Format: JPG, PNG, atau PDF (maks. 5MB).
                          </p>
                        </div>

                        <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors border border-slate-700 shrink-0">
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          <span>{uploadingDoc ? 'Mengunggah...' : 'Pilih Berkas'}</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleDocumentUpload}
                            disabled={uploadingDoc}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {docUploadMsg && (
                        <p className="text-xs text-emerald-400 font-semibold">{docUploadMsg}</p>
                      )}

                      {dokumenNama && (
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="truncate">{dokumenNama}</span>
                          </div>
                          {dokumenUrl && (
                            <a
                              href={dokumenUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold text-[11px] shrink-0 ml-2"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Lihat Berkas
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {savingProfile ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Menyimpan Data...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Simpan Perubahan Profil
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RIWAYAT MUTASI & TRANSAKSI */}
        {activeTab === 'riwayat' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-400" />
                  Riwayat Mutasi Saldo & Dana Kepatuhan
                </h3>
                <p className="text-xs text-slate-400">
                  Daftar transaksi deposit, penarikan, penguncian, dan pembukaan kunci saldo
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                Total: {transactions.length} Transaksi
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <History className="w-10 h-10 mx-auto text-slate-700" />
                <p className="text-sm font-medium">Belum ada riwayat transaksi.</p>
                <p className="text-xs text-slate-600">
                  Lakukan deposit atau kunci dana untuk memulai operasional whistleblowing.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {transactions.map((tx) => {
                  const isPositive = tx.type === 'deposit' || tx.type === 'unlock';
                  return (
                    <div
                      key={tx.id}
                      className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            tx.type === 'deposit'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : tx.type === 'withdrawal'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : tx.type === 'lock'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                          }`}
                        >
                          {tx.type === 'deposit' && <ArrowDownLeft className="w-5 h-5" />}
                          {tx.type === 'withdrawal' && <ArrowUpRight className="w-5 h-5" />}
                          {tx.type === 'lock' && <Lock className="w-4 h-4" />}
                          {tx.type === 'unlock' && <Unlock className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-white capitalize">
                              {tx.type === 'deposit'
                                ? 'Deposit Saldo Aktif'
                                : tx.type === 'withdrawal'
                                ? 'Penarikan Dana (Withdrawal)'
                                : tx.type === 'lock'
                                ? 'Kunci Dana (Lock Penjaminan)'
                                : 'Buka Kunci Dana (Unlock)'}
                            </span>
                            <span
                              className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                                tx.status === 'selesai'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : tx.status === 'pending'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'bg-red-500/10 text-red-400 border-red-500/30'
                              }`}
                            >
                              {tx.status === 'pending' && <Clock className="w-2.5 h-2.5 animate-pulse" />}
                              {tx.status === 'selesai' && <CheckCircle2 className="w-2.5 h-2.5" />}
                              {tx.status === 'pending'
                                ? 'Menunggu Verifikasi Admin'
                                : tx.status === 'selesai'
                                ? 'Selesai / Terverifikasi'
                                : 'Ditolak'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{tx.keterangan}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-sm sm:text-base font-bold font-mono ${
                            isPositive ? 'text-emerald-400' : 'text-slate-200'
                          }`}
                        >
                          {isPositive ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: DEPOSIT SALDO DENGAN PILIHAN QRIS, NOWPAYMENTS & BANK */}
      {profileData?.role !== 'auditor' && showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 my-6 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Deposit Saldo Perusahaan
                  </h3>
                  <p className="text-[11px] text-slate-400">Pilih metode pembayaran resmi INTEGRITAS360</p>
                </div>
              </div>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setDepositTab('qris')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  depositTab === 'qris'
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>NOWPayments (Crypto)</span>
              </button>

              <button
                type="button"
                onClick={() => setDepositTab('bank')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  depositTab === 'bank'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Transfer Bank / VA</span>
              </button>
            </div>

            {/* Content for QRIS or Bank Tab */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Kolom Kiri: Visual Pembayaran */}
              <div className="flex flex-col items-center">
                {depositTab === 'qris' ? (
                  <>
                    <p className="text-xs font-semibold text-slate-300 mb-2 text-center">
                      Pindai QRIS Statis Resmi (NMID: ID1026539516033)
                    </p>
                    <QrisStaticCard nominal={depositAmount} />
                  </>
                ) : (
                  <div className="w-full space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                    <div className="font-bold text-amber-400 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Rekening Resmi PT INTEGRITAS360
                    </div>
                    <div className="space-y-2 text-slate-300">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase">Bank Central Asia (BCA)</div>
                        <div className="text-sm font-mono font-bold text-white">882-019-3821</div>
                        <div className="text-[11px] text-slate-400">a.n. PT INTEGRITAS TIGA ENAM PULUH</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase">Bank Mandiri</div>
                        <div className="text-sm font-mono font-bold text-white">131-00-998822-1</div>
                        <div className="text-[11px] text-slate-400">a.n. PT INTEGRITAS TIGA ENAM PULUH</div>
                      </div>
                    </div>
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Metode Pembayaran
                  </label>
                  <select
                    value={depositMethod}
                    onChange={(e) => setDepositMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="QRIS Statis Nasional (INTEGRITAS360)">
                      QRIS Statis Nasional (Semua Bank & E-Wallet)
                    </option>
                    <option value="NOWPayments (Crypto Gateway USDT/BTC/ETH)">
                      NOWPayments Crypto Gateway (USDT, BTC, ETH, SOL, TRX)
                    </option>
                    <option value="BCA Transfer Bank">BCA Transfer Rekening</option>
                    <option value="Mandiri Transfer Bank">Mandiri Transfer Rekening</option>
                    <option value="BRI Transfer Bank">BRI Transfer Rekening</option>
                  </select>
                </div>

                {/* Admin Verification Requirement Notice */}
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-[11px] text-blue-200 leading-relaxed space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-blue-300">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Ketentuan Verifikasi Transaksi:
                  </div>
                  <p className="text-slate-300">
                    Semua transaksi deposit melalui QRIS, Rekening Bank, maupun Crypto NOWPayments <strong>wajib diverifikasi dan disetujui oleh Administrator</strong> sebelum saldo aktif ditambahkan ke akun Anda.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDepositModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                  >
                    Batal
                  </button>

                  {depositMethod.includes('NOWPayments') ? (
                    <button
                      type="button"
                      onClick={() => setShowNowPaymentsModal(true)}
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

      {/* MODAL 2: WITHDRAWAL (PENARIKAN DANA) */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-amber-400" />
                Penarikan Dana (Withdrawal)
              </h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400">Saldo Bebas Tersedia untuk Ditarik:</span>
              <div className="text-base font-bold font-mono text-white">
                Rp {currentSaldo.toLocaleString('id-ID')}
              </div>
            </div>

            {withdrawError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{withdrawError}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nominal Penarikan (Rupiah)
                </label>
                <input
                  type="number"
                  min={100000}
                  max={currentSaldo}
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bank Tujuan</label>
                  <select
                    value={withdrawBank}
                    onChange={(e) => setWithdrawBank(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {BANK_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nomor Rekening</label>
                  <input
                    type="text"
                    required
                    value={withdrawAccount}
                    onChange={(e) => setWithdrawAccount(e.target.value)}
                    placeholder="Contoh: 1234567890"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Pemilik Rekening
                </label>
                <input
                  type="text"
                  required
                  value={withdrawHolder}
                  onChange={(e) => setWithdrawHolder(e.target.value)}
                  placeholder="Nama pemilik rekening bank"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-[11px] text-amber-200/90 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verifikasi & Transfer Administrator
                </div>
                <p>
                  Permintaan penarikan diverifikasi oleh Administrator dan dana akan ditransfer langsung ke rekening bank Anda.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processingWithdraw || currentSaldo <= 0}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-60 cursor-pointer"
                >
                  {processingWithdraw ? 'Memproses Penarikan...' : 'Kirim Penarikan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LOCK / UNLOCK DANA */}
      {profileData?.role !== 'auditor' && showLockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {lockActionType === 'lock' ? (
                  <>
                    <Lock className="w-5 h-5 text-emerald-400" />
                    Kunci Dana (Lock Dana Penjaminan)
                  </>
                ) : (
                  <>
                    <Unlock className="w-5 h-5 text-amber-400" />
                    Buka Kunci Dana (Unlock Dana)
                  </>
                )}
              </h3>
              <button
                onClick={() => setShowLockModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Toggle Action */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setLockActionType('lock');
                  setLockError('');
                }}
                className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  lockActionType === 'lock'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Kunci Saldo Baru
              </button>
              <button
                type="button"
                onClick={() => {
                  setLockActionType('unlock');
                  setLockError('');
                }}
                className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  lockActionType === 'unlock'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Buka Kunci Saldo
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              {lockActionType === 'lock' ? (
                <>
                  <span className="text-slate-400">Saldo Bebas Tersedia untuk Dikunci:</span>
                  <div className="text-base font-bold font-mono text-white">
                    Rp {currentSaldo.toLocaleString('id-ID')}
                  </div>
                </>
              ) : (
                <>
                  <span className="text-slate-400">Dana Terkunci Saat Ini:</span>
                  <div className="text-base font-bold font-mono text-emerald-400">
                    Rp {currentDanaTerkunci.toLocaleString('id-ID')}
                  </div>
                </>
              )}
            </div>

            {lockError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{lockError}</span>
              </div>
            )}

            <form onSubmit={handleLockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nominal {lockActionType === 'lock' ? 'yang Ingin Dikunci' : 'yang Ingin Dibuka'} (Rupiah)
                </label>
                <input
                  type="number"
                  min={500000}
                  max={lockActionType === 'lock' ? currentSaldo : currentDanaTerkunci}
                  step={500000}
                  required
                  value={lockAmount}
                  onChange={(e) => setLockAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                {lockActionType === 'lock'
                  ? 'Dana yang dikunci akan langsung disinkronkan ke nilai "Dana Tersedia" pada poster whistleblowing perusahaan Anda sebagai jaminan komitmen kepatuhan.'
                  : 'Membuka kunci dana akan mengembalikan saldo ke Saldo Bebas (Aktif) sehingga dapat ditarik (*withdrawal*) kapan saja.'}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLockModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processingLock}
                  className={`px-5 py-2 rounded-xl text-slate-950 text-xs font-bold transition-all shadow-lg disabled:opacity-60 cursor-pointer ${
                    lockActionType === 'lock'
                      ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'
                      : 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20'
                  }`}
                >
                  {processingLock
                    ? 'Menyimpan...'
                    : lockActionType === 'lock'
                    ? 'Kunci Dana Sekarang'
                    : 'Buka Kunci Dana Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
