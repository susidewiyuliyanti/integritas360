export type UserRole = 'owner' | 'perusahaan' | 'admin_perusahaan' | 'auditor';

export type CompanyStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
export type CompanyUserStatus = 'ACTIVE' | 'SUSPENDED' | 'INVITED' | 'INACTIVE';
export type CompanyUserRole = 'company_admin' | 'finance' | 'hr' | 'company_user';

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  holderName: string;
}

// ==========================================
// LEVEL 2 ENTITY: COMPANY (COMPANIES)
// ==========================================
export interface Company {
  id: string; // Document ID (often same as company_id or auto id)
  company_id: string; // Unique tenant identifier, e.g. 'CMP-000001'
  company_code: string; // e.g. 'PTABC'
  company_name: string; // Legal company name
  company_email: string;
  company_phone: string;
  company_address: string;
  pic_name: string;
  pic_position: string;
  pic_phone: string;
  pic_email: string;
  status: CompanyStatus;

  // Financial balances
  deposit_balance: number;
  available_balance: number;
  locked_balance: number;
  bank_details?: BankDetails;

  // QR & Poster info
  qr_status?: 'active' | 'inactive';
  qr_code?: string;
  activation_status?: 'active' | 'pending';

  // Sector & Legal
  sektor?: string;
  npwp?: string;
  statusVerifikasiDokumen?: 'pending' | 'terverifikasi' | 'ditolak' | 'belum_upload';
  dokumenUrl?: string;
  dokumenNama?: string;
  kebijakanReward?: {
    rewardKasusEtik: number;
    persenFinansial: number;
    minPersenFinansial: number;
  };

  created_at: any;
  updated_at?: any;
}

// ==========================================
// LEVEL 3 ENTITY: COMPANY USER (COMPANY_USERS)
// ==========================================
export interface CompanyUser {
  id: string; // Document ID (usually same as user_id / auth uid)
  user_id: string; // Firebase Auth UID
  company_id: string; // Foreign key referencing Company.company_id
  company_name: string;
  full_name: string;
  email: string;
  phone: string;
  role: CompanyUserRole;
  status: CompanyUserStatus;
  initial_password?: string;
  created_at: any;
  updated_at?: any;
}

// ==========================================
// AUDIT LOG ENTITY (AUDIT_LOGS)
// ==========================================
export interface AuditLog {
  id?: string;
  audit_log_id: string;
  actor_user_id: string;
  actor_email?: string;
  actor_role: string;
  company_id?: string;
  company_name?: string;
  action: string;
  entity_type: 'COMPANY' | 'COMPANY_USER' | 'REPORT' | 'FINANCE' | 'SYSTEM';
  entity_id: string;
  timestamp: any;
  metadata?: Record<string, any>;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  namaPT: string;
  sektor: string;
  alamat: string;
  deskripsi: string;
  telepon?: string;
  npwp?: string;
  picName?: string;
  photoURL?: string;   // Foto Profil Perusahaan (Logo) atau Foto Profil Auditor
  perusahaanId?: string; // Khusus role 'admin_perusahaan': Terikat dengan ID Perusahaan
  perusahaanName?: string; // Khusus role 'admin_perusahaan': Nama PT yang diawasi
  company_id?: string; // Standardized tenant ID (e.g. 'CMP-000001')
  company_code?: string;
  company_name?: string;
  jabatan?: string;    // Jabatan (misal: Admin Kepatuhan, Head of Internal Investigation)
  departemen?: string; // Departemen/Divisi (Audit Internal, Legal, HR)
  statusAkun?: 'aktif' | 'nonaktif' | 'suspended';
  status?: CompanyUserStatus;
  danaTersedia: number;// Disinkronkan dengan danaTerkunci untuk penjaminan whistleblowing
  saldo: number;       // Saldo terbuka / bebas yang dapat ditarik, di-deposit, atau dikunci
  danaTerkunci?: number;// Dana yang dikunci khusus penjaminan integritas
  biayaJasaPerKasus?: number; // Biaya jasa auditor per kasus (minimal 100.000, default 150.000)
  nomorLisensi?: string; // Nomor Lisensi / Izin Praktik / Registrasi Profesi Auditor
  gelarProfesi?: string; // Gelar Profesi Auditor (CPA, CA, CFE, CFrA, Ak., dsb)
  spesialisasiAudit?: string; // Spesialisasi Bidang Audit
  isLocked?: boolean;  // Status kunci saldo/akun (Lock atau Terbuka)
  lockReason?: string; // Alasan penguncian saldo oleh Admin
  rekeningBank?: BankDetails;
  namaBank?: string;
  nomorRekening?: string;
  pemilikRekening?: string;
  statusVerifikasiDokumen?: 'pending' | 'terverifikasi' | 'ditolak' | 'belum_upload';
  dokumenUrl?: string;
  dokumenNama?: string;
  catatanVerifikasi?: string;
  kebijakanReward?: {
    rewardKasusEtik: number;       // Nominal kasus etik: minimal Rp 100.000, dapat disesuaikan kebijakan perusahaan
    persenFinansial: number;       // Persen dari kerugian kasus finansial (default 2%)
    minPersenFinansial: number;    // Aturan wajib min 2%
  };
  kataSandiAwal?: string; // Kata sandi awal untuk log in perusahaan / admin
  password?: string;      // Password awal
  createdAt?: any;
}

export interface WhistleblowingReport {
  id?: string;
  companyId: string;
  companyName: string;
  judul: string;
  kategori: string;
  tipePelanggaran?: 'finansial' | 'etik';
  estimasiKerugian?: number;
  deskripsi: string;
  tanggalKejadian?: string;
  lokasi?: string;
  status: 'baru' | 'investigasi' | 'terbukti' | 'palsu_hoax' | 'proses' | 'valid' | 'selesai' | 'ditolak';
  tokenAkses: string;
  pelaporAnonim: boolean;
  namaPelapor?: string;
  kontakPelapor?: string;
  whatsappPelapor?: string; // Optional untuk notifikasi pencairan reward
  buktiFiles?: string[];    // Minimal 2 bukti file (base64 data url / nama file bukti)
  isContoh?: boolean;       // True jika dikirim lewat contoh form di halaman utama
  targetAuditorId?: string; // Auditor tunggal yang dipilih
  targetAuditorName?: string;
  targetAuditorIds?: string[]; // Tetap sediakan untuk kompatibilitas filter
  targetAuditorNames?: string[];
  catatanAuditor?: string;
  auditorId?: string;
  auditorName?: string;
  biayaAuditor?: number;    // Biaya jasa auditor per kasus (dari setting auditor, default 150.000)
  auditorVerified?: boolean;// True jika diverifikasi valid oleh auditor
  auditorVerifiedAt?: any;  // Waktu verifikasi valid auditor
  // Workflow Investigasi Menyeluruh Perusahaan & Admin Perusahaan
  investigasiStatus?: 'belum_dimulai' | 'investigasi_berjalan' | 'investigasi_selesai';
  investigasiStartedAt?: any;
  investigasiCompletedAt?: any;
  investigasiNotes?: string;
  investigatorName?: string;
  investigatorRole?: 'perusahaan' | 'admin_perusahaan' | 'auditor';
  hasilInvestigasi?: 'terbukti' | 'palsu_hoax' | 'belum_konklusif';
  hoaxReason?: string; // Alasan keputusan palsu/hoax
  terbuktiNotes?: string;
  companyCaseStatus?: 'menunggu_ambil' | 'kasus_diambil' | 'sanksi_ditetapkan' | 'selesai';
  takenAt?: any;            // Waktu perusahaan klik ambil kasus
  autoReleaseDeadline?: any;// Deadline 24 jam setelah kasus diambil (ISO string atau timestamp)
  sanksiKaryawan?: string;  // Keterangan sanksi yang dijatuhkan pada oknum
  rewardReleased?: boolean; // True jika reward sudah dirilis ke pelapor & saldo lock terpotong
  rewardReleasedAt?: any;
  rewardReleaseType?: 'manual_perusahaan' | 'admin_perusahaan' | 'auto_sistem_24jam';
  // Reward & Claim
  rewardAmount?: number;
  rewardMinAmount?: number;
  rewardStatusPerusahaan?: 'belum_ditentukan' | 'disetujui' | 'dicairkan';
  rewardClaimed?: boolean;
  rewardClaimStatus?: 'none' | 'pending' | 'siap_diklaim' | 'selesai' | 'ditolak';
  rewardClaimBank?: BankDetails;
  rewardClaimWhatsapp?: string;
  createdAt?: any;
}

export interface WalletTransaction {
  id?: string;
  userId: string;
  userName?: string;
  type: 'deposit' | 'withdrawal' | 'lock' | 'unlock' | 'claim_reward' | 'potong_lock_reward' | 'potong_lock_auditor' | 'fee_auditor_masuk';
  amount: number;
  status: 'selesai' | 'pending' | 'dibatalkan' | 'ditolak';
  keterangan: string;
  metode?: string;
  bankDetails?: BankDetails;
  cryptoCurrency?: string;
  cryptoAmount?: number;
  txHash?: string;
  buktiTransferUrl?: string;
  claimReportToken?: string;
  claimReportId?: string;
  whatsapp?: string;
  companyName?: string;
  catatanAdmin?: string;
  processedBy?: string;
  processedAt?: any;
  createdAt?: any;
}
