import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'id' | 'en';

const PHRASES: Record<string, string> = {
  'Platform Pelaporan Pelanggaran Perusahaan':'Corporate Whistleblowing Platform',
  'Studi Kasus':'Case Studies','Lapor Anonim':'Anonymous Report','Pelaporan anonim dan terenkripsi':'Anonymous and encrypted reporting',
  'Pendaftaran Mandiri Ditiadakan':'Self-registration is disabled','Pendaftaran Terpusat':'Centralized Registration',
  'Kembali ke Beranda INTEGRITAS360':'Back to INTEGRITAS360 Home','Hubungi Kami':'Contact Us',
  'Masuk':'Sign In','Keluar':'Sign Out','Daftar':'Register','Beranda':'Home','Dashboard':'Dashboard',
  'Owner Panel':'Owner Panel','Dashboard Admin PT':'Company Admin Dashboard','Profil Petugas':'Staff Profile',
  'Profil & Honorarium':'Profile & Fees','Profil & Saldo':'Profile & Balance','ADMIN OWNER':'OWNER ADMIN',
  'Nama Perusahaan':'Company Name','Nama PT':'Company Name','Alamat Perusahaan':'Company Address',
  'Simpan Perubahan':'Save Changes','Simpan':'Save','Batal':'Cancel','Kembali':'Back','Lanjutkan':'Continue',
  'Tambah Perusahaan':'Add Company','Edit Perusahaan':'Edit Company','Hapus':'Delete','Ubah':'Edit',
  'Cari':'Search','Filter':'Filter','Muat Ulang':'Refresh','Menyimpan...':'Saving...',
  'Memuat data...':'Loading data...','Memuat...':'Loading...','Tidak ada data':'No data available',
  'Data berhasil disimpan':'Data saved successfully','Gagal menyimpan data':'Failed to save data',
  'Apakah Anda yakin ingin menghapus data ini?':'Are you sure you want to delete this data?',
  'Apakah Anda yakin?':'Are you sure?','Berhasil':'Success','Gagal':'Failed','Peringatan':'Warning',
  'Informasi':'Information','Detail':'Details','Status':'Status','Aksi':'Actions','Tanggal':'Date',
  'Nama':'Name','Email':'Email','Kata Sandi':'Password','Konfirmasi Kata Sandi':'Confirm Password',
  'Lupa kata sandi?':'Forgot password?','Reset Kata Sandi':'Reset Password','Kirim':'Submit',
  'Kirim Laporan':'Submit Report','Laporan':'Reports','Pelapor':'Reporter','Perusahaan':'Company',
  'Auditor':'Auditor','Admin Perusahaan':'Company Admin','Profil':'Profile','Pengaturan':'Settings',
  'Saldo':'Balance','Deposit':'Deposit','Penarikan':'Withdrawal','Transaksi':'Transactions',
  'Riwayat Transaksi':'Transaction History','Nominal':'Amount','Metode Pembayaran':'Payment Method',
  'Pilih Metode Pembayaran':'Select Payment Method','Unggah Dokumen':'Upload Document',
  'Ganti Foto':'Change Photo','Foto Profil':'Profile Photo','Dokumen Perusahaan':'Company Documents',
  'Verifikasi Dokumen':'Document Verification','Terverifikasi':'Verified','Belum Terverifikasi':'Not Verified',
  'Menunggu Verifikasi':'Pending Verification','Ditolak':'Rejected','Disetujui':'Approved',
  'Nama PIC':'Contact Person','Nomor Telepon':'Phone Number','Alamat':'Address','Deskripsi':'Description',
  'Sektor Industri':'Industry Sector','Sektor':'Sector','NPWP':'Tax ID (NPWP)','Rekening Bank':'Bank Account',
  'Simpan Profil':'Save Profile','Perbarui Profil':'Update Profile','Data Perusahaan':'Company Information',
  'Data berhasil diperbarui':'Information updated successfully','Perubahan berhasil disimpan':'Changes saved successfully',
  'Tidak ditemukan':'Not found','Tidak ada laporan':'No reports available','Belum ada transaksi':'No transactions yet',
  'Pilih file':'Choose file','Pilih gambar':'Choose image','Unggah':'Upload','Unduh':'Download',
  'Lihat Detail':'View Details','Lihat':'View','Tutup':'Close','Konfirmasi':'Confirm',
  'Ya, Hapus':'Yes, Delete','Ya':'Yes','Tidak':'No','Proses':'In Progress','Selesai':'Completed',
  'Baru':'New','Aktif':'Active','Nonaktif':'Inactive','Semua':'All','Hari ini':'Today',
  'Bulan ini':'This Month','Total':'Total','Ringkasan':'Summary','Ringkasan Dashboard':'Dashboard Summary',
  'Keamanan':'Security','Privasi':'Privacy','Syarat dan Ketentuan':'Terms and Conditions',
  'Kebijakan Privasi':'Privacy Policy','Pelaporan Pelanggaran':'Whistleblowing Report',
  'Laporkan pelanggaran secara aman dan rahasia':'Report misconduct safely and confidentially',
  'Laporan Anda akan dijaga kerahasiaannya':'Your report will be kept confidential',
  'Pilih Bahasa':'Choose Language','Bahasa Indonesia':'Indonesian','Bahasa Inggris':'English',
  'Ganti Bahasa':'Change Language','Bahasa':'Language',
  'Email atau kata sandi tidak cocok.':'Email or password is incorrect.',
  'Silakan coba lagi.':'Please try again.','Terjadi kesalahan':'An error occurred',
  'Sesi Anda telah berakhir. Silakan masuk kembali.':'Your session has expired. Please sign in again.',
  'Apakah Anda yakin ingin keluar?':'Are you sure you want to sign out?',
  'Nomor laporan':'Report number','Buat Laporan':'Create Report','Formulir Pelaporan':'Report Form',
  'Pelaporan Rahasia':'Confidential Reporting','Kirimkan laporan Anda':'Submit your report',
  'Wajib diisi':'Required','Opsional':'Optional','Pilih':'Select','Pilih status':'Select status',
  'Belum ada data perusahaan':'No company data yet','Perbarui Data':'Update Information',
  'Nama Perusahaan Terdaftar':'Registered Company Name','Informasi Perusahaan':'Company Information',
  'Kontak':'Contact','Bantuan':'Help','Hubungi Kami via WhatsApp':'Contact us via WhatsApp',
  'Selamat datang':'Welcome','Selamat datang kembali':'Welcome back','Masuk ke akun Anda':'Sign in to your account',
  'Akun Perusahaan':'Company Account','Akun Auditor':'Auditor Account','Akun Anda':'Your Account',
  'Tampilkan':'Show','Sembunyikan':'Hide','Lanjut':'Next','Sebelumnya':'Previous',
  'Tidak tersedia':'Not available','Belum tersedia':'Not available yet','Sedang diproses':'Processing',
  'Jumlah':'Quantity','Catatan':'Notes','Tambahkan Catatan':'Add Notes','Simpan Catatan':'Save Notes',
  'Status Verifikasi':'Verification Status','Informasi Dasar':'Basic Information',
  'Biaya Jasa':'Service Fee','Nomor Lisensi':'License Number','Gelar Profesi':'Professional Title',
  'Spesialisasi Audit':'Audit Specialization','Alasan Penolakan':'Reason for Rejection',
  'Verifikasi':'Verification','Pencarian':'Search','Cari perusahaan':'Search companies',
  'Akses ditolak':'Access denied','Anda tidak memiliki akses ke halaman ini':'You do not have access to this page',
  'Kembali ke Dashboard':'Back to Dashboard','Kelola Perusahaan':'Manage Companies',
  'Kelola Pengguna':'Manage Users','Pengguna':'Users','Pengguna Aktif':'Active Users',
  'Data berhasil dihapus':'Data deleted successfully','Gagal memuat data':'Failed to load data',
  'Perubahan belum disimpan':'Unsaved changes','Yakin ingin melanjutkan?':'Are you sure you want to continue?',
  'Terima kasih':'Thank you','Pilih perusahaan':'Select a company','Nama lengkap':'Full name',
  'Nomor WhatsApp':'WhatsApp number','Kirim permintaan':'Send request','Pendaftaran':'Registration',
  'Khusus Akun Perusahaan & Auditor (Pelapor tidak perlu login)':'For Company and Auditor accounts only (reporters do not need to sign in)',
  'Isi formulir berikut':'Complete the following form','Perlindungan Pelapor':'Reporter Protection',
  'Laporan anonim':'Anonymous report',  'Laporkan Sekarang':'Report Now',
  'Sederhana untuk Pelapor, Terukur untuk Perusahaan':'Simple for Reporters, Measurable for Companies',
  'Perusahaan meninjau laporan':'The company reviews the report',
  'Scan QR perusahaan':'Scan the company QR code','Saldo reward dikunci sebelum kasus dibuka':'Reward balance is locked before the case is opened',
  'SCAN UNTUK LAPOR SECARA ANONIM':'SCAN TO REPORT ANONYMOUSLY','QR KHUSUS PERUSAHAAN':'COMPANY-SPECIFIC QR CODE',
  'PELAPORAN ANONIM PERUSAHAAN':'CORPORATE ANONYMOUS REPORTING',
  'Sistem tidak mencatat alamat IP atau identitas pelapor, sehingga aman dari pembalasan oknum manager.':'The system does not record the reporter’s IP address or identity, helping protect them from retaliation.',
  'Laporan whistleblowing masuk langsung ke Dewan Owner/Komisaris, bukan ke atasan langsung pelaku.':'Whistleblowing reports go directly to the owner or board of commissioners, not to the alleged offender’s direct supervisor.',
  'Kami akan mengirim link reset ke email Anda':'We will send a password reset link to your email',
  'Harap masukkan email dan kata sandi.':'Please enter your email and password.',
  'Akun login Anda sedang dinonaktifkan / ditangguhkan.':'Your account has been disabled or suspended.',
  'Gagal masuk. Silakan coba lagi.':'Sign-in failed. Please try again.',
  'Koneksi ke server gagal. Periksa koneksi internet dan coba lagi.':'Could not connect to the server. Check your internet connection and try again.',
  'Harap masukkan alamat email Anda.':'Please enter your email address.',
  'Fitur reset kata sandi sedang dipindahkan ke sistem Cloudflare. Hubungi Owner / Super Admin untuk reset sementara.':'Password reset is being migrated to Cloudflare. Contact the Owner / Super Admin for a temporary reset.',
  'Login Google sudah dinonaktifkan. Gunakan email dan kata sandi yang diterbitkan Owner / Super Admin.':'Google sign-in is disabled. Use the email and password issued by the Owner / Super Admin.',
  'Masuk ke Sistem':'Sign In to the System','Atur Ulang Kata Sandi':'Reset Password','Mengirim...':'Sending...','Kirim Link':'Send Link',
  'Perusahaan Didaftarkan Manual':'Company Registration Is Manual',
  'Pelapor whistleblower?':'Are you a whistleblower?',
  'Lapor secara anonim tanpa login di sini':'Submit an anonymous report without signing in here',
  'Memverifikasi akses Super Admin…':'Verifying Super Admin access…',
  'Control plane SaaS — data lintas tenant':'SaaS control plane — cross-tenant data',
  'Semua Tenant':'All Tenants','Semua Laporan':'All Reports','Saldo & Transaksi':'Balances & Transactions',
  'Total Tenant':'Total Tenants','Saldo Tersedia':'Available Balance','Saldo Terkunci':'Locked Balance',
  'Laporan Aktif':'Active Reports','Transaksi Pending':'Pending Transactions','Ringkasan sistem':'System Summary',
  'Panel ini khusus Owner/Super Admin untuk memantau seluruh tenant, laporan, saldo, transaksi, dan jejak audit. Tenant tetap masuk melalui portal tenant terpisah.':'This panel is for the Owner/Super Admin to monitor all tenants, reports, balances, transactions, and audit trails. Tenants continue to use their separate portal.',
  'Kelola Tenant':'Manage Tenants','Portal Tenant':'Tenant Portal','Tambah Tenant Perusahaan':'Add Company Tenant',
  'Buat ruang perusahaan yang terpisah beserta akun admin pertamanya. Tenant baru berstatus DEPOSIT_REQUIRED.':'Create an isolated company workspace and its first admin account. New tenants have DEPOSIT_REQUIRED status.',
  'Tenant tidak berhasil dibuat.':'Failed to create tenant.','Tenant berhasil dibuat. ID:':'Tenant created. ID:',
  'Admin perusahaan pertama':'First Company Admin','Setiap tenant maksimal memiliki 3 akun admin termasuk akun pertama.':'Each tenant can have a maximum of 3 admin accounts, including the first.',
  'Nama perusahaan belum terdaftar':'Company name not registered','Tarik saldo honorarium ke rekening bank':'Withdraw fee balance to a bank account',
  'Kelola profil praktisi dan dokumen lisensi profesi':'Manage practitioner profile and professional license documents',
  'Total Berkas Masuk':'Total Incoming Cases','Laporan Baru':'New Reports','Kasus Selesai':'Completed Cases',
  'Spesialisasi Audit':'Audit Specialization','Saldo Honorarium':'Fee Balance',
  'Data profil dan legalitas perusahaan berhasil disimpan!':'Company profile and legal documents saved successfully!',
  'Profil praktisi auditor, lisensi profesi, tarif jasa, dan rekening bank berhasil disimpan!':'Auditor profile, professional license, service fees, and bank account saved successfully!',
  'Dokumen berhasil diunggah dan seluruh data pengisian perusahaan tersimpan aman! Menunggu verifikasi Administrator.':'Documents uploaded and all company details saved securely! Awaiting administrator verification.',
  'Foto profil berhasil diperbarui dan data pengisian tetap tersimpan!':'Profile photo updated and profile details remain saved!',
  'Regulasi Wajib: Persentase reward kasus finansial minimal adalah 2% dari nilai kerugian.':'Mandatory regulation: The reward for financial cases must be at least 2% of the loss amount.',
  'Ketentuan: Reward kasus pelanggaran etik minimal adalah Rp 100.000 (dapat disesuaikan dengan kebijakan perusahaan).':'Requirement: The minimum reward for an ethics violation case is IDR 100,000 (subject to company policy).',
  'Audit Kepatuhan & Investigasi':'Compliance & Investigation Audit',
  'Laporan Dugaan Pelanggaran':'Suspected Misconduct Report',
  'Menunggu verifikasi Administrator':'Awaiting administrator verification',
  'Periksa koneksi internet dan coba lagi.':'Check your internet connection and try again.',
  'Menerima laporan secara anonim':'Receive reports anonymously',
  'Laporan Anda akan diproses secara rahasia':'Your report will be handled confidentially',
  'Sederhana untuk Pelapor, Terukur untuk Perusahaan':'Simple for Reporters, Measurable for Companies',
  'Scan QR perusahaan':'Scan the company QR code',
  'Perusahaan meninjau laporan':'The company reviews the report',
  'Saldo reward dikunci sebelum kasus dibuka':'Reward balance is locked before the case is opened',
  'Laporan akan ditinjau oleh auditor independen':'Reports will be reviewed by an independent auditor',
  'Identitas Anda akan tetap dirahasiakan':'Your identity will remain confidential',
  'Laporkan pelanggaran secara aman dan rahasia':'Report misconduct safely and confidentially',
  'Laporan Anda akan dijaga kerahasiaannya':'Your report will be kept confidential',
  'Perusahaan Didaftarkan Manual':'Company Registration Is Manual',
  'Pelapor whistleblower?':'Are you a whistleblower?',
  'Lapor secara anonim tanpa login di sini':'Submit an anonymous report without signing in here',
  'Harap masukkan email dan kata sandi.':'Please enter your email and password.',
  'Akun login Anda sedang dinonaktifkan / ditangguhkan.':'Your account has been disabled or suspended.',
  'Gagal masuk. Silakan coba lagi.':'Sign-in failed. Please try again.',
  'Koneksi ke server gagal. Periksa koneksi internet dan coba lagi.':'Could not connect to the server. Check your internet connection and try again.',
  'Harap masukkan alamat email Anda.':'Please enter your email address.',
  'Fitur reset kata sandi sedang dipindahkan ke sistem Cloudflare. Hubungi Owner / Super Admin untuk reset sementara.':'Password reset is being migrated to Cloudflare. Contact the Owner / Super Admin for a temporary reset.',
  'Login Google sudah dinonaktifkan. Gunakan email dan kata sandi yang diterbitkan Owner / Super Admin.':'Google sign-in is disabled. Use the email and password issued by the Owner / Super Admin.',
  'Masuk ke Sistem':'Sign In to the System',
  'Atur Ulang Kata Sandi':'Reset Password',
  'Kami akan mengirim link reset ke email Anda':'We will send a password reset link to your email',
  'Perusahaan meninjau laporan':'The company reviews the report',
  'Memverifikasi akses Super Admin…':'Verifying Super Admin access…',
  'Control plane SaaS — data lintas tenant':'SaaS control plane — cross-tenant data',
  'Semua Tenant':'All Tenants',
  'Semua Laporan':'All Reports',
  'Saldo & Transaksi':'Balances & Transactions',
  'Total Tenant':'Total Tenants',
  'Saldo Tersedia':'Available Balance',
  'Saldo Terkunci':'Locked Balance',
  'Laporan Aktif':'Active Reports',
  'Transaksi Pending':'Pending Transactions',
  'Ringkasan sistem':'System Summary',
  'Panel ini khusus Owner/Super Admin untuk memantau seluruh tenant, laporan, saldo, transaksi, dan jejak audit. Tenant tetap masuk melalui portal tenant terpisah.':'This panel is for the Owner/Super Admin to monitor all tenants, reports, balances, transactions, and audit trails. Tenants continue to use their separate portal.',
  'Kelola Tenant':'Manage Tenants',
  'Portal Tenant':'Tenant Portal',
  'Tambah Tenant Perusahaan':'Add Company Tenant',
  'Buat ruang perusahaan yang terpisah beserta akun admin pertamanya. Tenant baru berstatus DEPOSIT_REQUIRED.':'Create an isolated company workspace and its first admin account. New tenants have DEPOSIT_REQUIRED status.',
  'Setiap tenant maksimal memiliki 3 akun admin termasuk akun pertama.':'Each tenant can have a maximum of 3 admin accounts, including the first.',
  'Tarik saldo honorarium ke rekening bank':'Withdraw fee balance to a bank account',
  'Kelola profil praktisi dan dokumen lisensi profesi':'Manage practitioner profile and professional license documents',
  'Total Berkas Masuk':'Total Incoming Cases',
  'Laporan Baru':'New Reports',
  'Kasus Selesai':'Completed Cases',
  'Spesialisasi Audit':'Audit Specialization',
  'Saldo Honorarium':'Fee Balance',
  'Data profil dan legalitas perusahaan berhasil disimpan!':'Company profile and legal documents saved successfully!',
  'Profil praktisi auditor, lisensi profesi, tarif jasa, dan rekening bank berhasil disimpan!':'Auditor profile, professional license, service fees, and bank account saved successfully!',
  'Dokumen berhasil diunggah dan seluruh data pengisian perusahaan tersimpan aman! Menunggu verifikasi Administrator.':'Documents uploaded and all company details saved securely! Awaiting administrator verification.',
  'Foto profil berhasil diperbarui dan data pengisian tetap tersimpan!':'Profile photo updated and profile details remain saved!',
  'Regulasi Wajib: Persentase reward kasus finansial minimal adalah 2% dari nilai kerugian.':'Mandatory regulation: The reward for financial cases must be at least 2% of the loss amount.',
  'Ketentuan: Reward kasus pelanggaran etik minimal adalah Rp 100.000 (dapat disesuaikan dengan kebijakan perusahaan).':'Requirement: The minimum reward for an ethics violation case is IDR 100,000 (subject to company policy).',
  'Audit Kepatuhan & Investigasi':'Compliance & Investigation Audit',
  'Laporan Dugaan Pelanggaran':'Suspected Misconduct Report',
  'Menunggu verifikasi Administrator':'Awaiting administrator verification',
  'Laporan Anda akan dijaga kerahasiaannya':'Your report will be kept confidential'
};

const WORDS: Record<string,string> = {
  'Beranda':'Home','Masuk':'Sign In','Keluar':'Sign Out','Daftar':'Register','Simpan':'Save','Batal':'Cancel',
  'Kembali':'Back','Lanjutkan':'Continue','Tambah':'Add','Hapus':'Delete','Ubah':'Edit','Cari':'Search',
  'Nama':'Name','Alamat':'Address','Telepon':'Phone','Email':'Email','Password':'Password','Kata':'Password',
  'Sandi':'Password','Perusahaan':'Company','Laporan':'Reports','Pelapor':'Reporter','Pengguna':'Users',
  'Saldo':'Balance','Deposit':'Deposit','Penarikan':'Withdrawal','Transaksi':'Transactions','Tanggal':'Date',
  'Status':'Status','Aksi':'Actions','Detail':'Details','Catatan':'Notes','Deskripsi':'Description',
  'Unggah':'Upload','Unduh':'Download','Dokumen':'Documents','Foto':'Photo','Profil':'Profile',
  'Pengaturan':'Settings','Verifikasi':'Verification','Terverifikasi':'Verified','Ditolak':'Rejected',
  'Disetujui':'Approved','Menunggu':'Pending','Selesai':'Completed','Aktif':'Active','Tidak':'No',
  'Semua':'All','Pilih':'Select','Jumlah':'Amount','Total':'Total','Hari':'Day','Bulan':'Month',
  'Tahun':'Year','Admin':'Admin','Auditor':'Auditor','Petugas':'Staff','Perbarui':'Update',
  'Informasi':'Information','Keamanan':'Security','Privasi':'Privacy','Bantuan':'Help','Hubungi':'Contact',
  'Berhasil':'Successful','Gagal':'Failed','Peringatan':'Warning','Kirim':'Submit','Laporan':'Report'
};

const originals = new WeakMap<Node, string>();
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&');
}

function translateText(input: string, lang: Language): string {
  if (lang === 'id') return input;
  const trimmed = input.trim();
  if (!trimmed) return input;
  if (PHRASES[trimmed]) return input.replace(trimmed, PHRASES[trimmed]);
  let result = input;
  const preserveCase = (match: string, translated: string) => {
    if (match === match.toUpperCase()) return translated.toUpperCase();
    if (match.length > 0 && match[0] === match[0].toUpperCase()) return translated.charAt(0).toUpperCase() + translated.slice(1);
    return translated;
  };
  for (const phrase of Object.keys(PHRASES).sort((a, b) => b.length - a.length)) {
    const translated = PHRASES[phrase];
    if (!phrase || !translated) continue;
    const pattern = '(^|[^\\p{L}\\p{N}_])(' + escapeRegExp(phrase) + ')(?=$|[^\\p{L}\\p{N}_])';
    const regex = new RegExp(pattern, 'giu');
    result = result.replace(regex, (_match: string, prefix: string, phraseMatch: string) => prefix + preserveCase(phraseMatch, translated));
  }
  // Word-level fallback is safe for short labels only; avoid mangling full sentences and report narratives.
  if (trimmed.length <= 48 && trimmed.split(/\\s+/).length <= 6) {
    for (const [id, en] of Object.entries(WORDS)) {
      const regex = new RegExp('(^|[^\\p{L}\\p{N}_])(' + escapeRegExp(id) + ')(?=$|[^\\p{L}\\p{N}_])', 'giu');
      result = result.replace(regex, (_match, prefix, word) => prefix + preserveCase(word, en));
    }
  }
  return result;
}

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; toggleLanguage: () => void };
const LanguageContext = createContext<LanguageContextValue>({language:'id',setLanguage:()=>{},toggleLanguage:()=>{}});

export const LanguageProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  const [language,setLanguageState] = useState<Language>(() => {
    try { return localStorage.getItem('integritas360-language') === 'en' ? 'en' : 'id'; } catch { return 'id'; }
  });
  const setLanguage = useCallback((next: Language) => {
    try { localStorage.setItem('integritas360-language',next); } catch {}
    setLanguageState(next);
  }, []);
  const toggleLanguage = useCallback(() => setLanguage(language === 'id' ? 'en' : 'id'),[language]);
  useEffect(() => {
    document.documentElement.lang = language === 'id' ? 'id' : 'en';
    const translateNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!originals.has(node)) originals.set(node,node.textContent || '');
        const original = originals.get(node) || '';
        const parent = node.parentElement;
        if (parent && !['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','INPUT','OPTION'].includes(parent.tagName) && !parent.closest('[data-no-translate]')) {
          const translated = translateText(original,language);
          if (node.textContent !== translated) node.textContent = translated;
        }
      } else if (node instanceof Element) {
        if (node.matches('input,textarea,select,script,style,noscript,[data-no-translate]')) return;
        for (const attr of ['placeholder','title','aria-label']) {
          const value = node.getAttribute(attr);
          if (value) {
            const key = attr+'|'+value;
            let store = (node as any).__i360OriginalAttrs as Record<string,string> | undefined;
            if (!store) { store = {}; (node as any).__i360OriginalAttrs = store; }
            if (!(key in store)) store[key] = value;
            const original = Object.entries(store).find(([k])=>k.startsWith(attr+'|'))?.[1] || value;
            node.setAttribute(attr,translateText(original,language));
          }
        }
        node.childNodes.forEach(translateNode);
      }
    };
    const run = () => document.body?.childNodes.forEach(translateNode);
    run();
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'characterData') translateNode(record.target);
        record.addedNodes.forEach(translateNode);
      }
    });
    if (document.body) observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    const oldAlert = window.alert.bind(window);
    const oldConfirm = window.confirm.bind(window);
    const oldPrompt = window.prompt.bind(window);
    window.alert = (message?: any) => oldAlert(translateText(String(message ?? ''),language));
    window.confirm = (message?: string) => oldConfirm(translateText(String(message ?? ''),language));
    window.prompt = (message?: string, defaultValue?: string) => oldPrompt(translateText(String(message ?? ''),language),defaultValue);
    return () => { observer.disconnect(); window.alert = oldAlert; window.confirm = oldConfirm; window.prompt = oldPrompt; };
  },[language]);
  const value = useMemo(()=>({language,setLanguage,toggleLanguage}),[language,setLanguage,toggleLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
