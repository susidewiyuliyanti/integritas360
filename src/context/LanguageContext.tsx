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
  'Laporan anonim':'Anonymous report','Laporkan Sekarang':'Report Now'
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
function translateText(input: string, lang: Language): string {
  if (lang === 'id') return input;
  const trimmed = input.trim();
  if (!trimmed) return input;
  if (PHRASES[trimmed]) return input.replace(trimmed, PHRASES[trimmed]);
  let result = input;
  const phrases = Object.keys(PHRASES).sort((a,b)=>b.length-a.length);
  for (const phrase of phrases) {
    if (!phrase || !PHRASES[phrase]) continue;
    result = result.replace(new RegExp('\\b' + phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\result = result.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), (match) => {') + '\\b', 'gi'), (match) => {
      const translated = PHRASES[phrase];
      return match === match.toUpperCase() ? translated.toUpperCase() : match[0] === match[0].toUpperCase() ? translated[0].toUpperCase()+translated.slice(1) : translated;
    });
  }
  for (const [id,en] of Object.entries(WORDS)) {
    result = result.replace(new RegExp('\\b'+id+'\\b','g'), en);
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
