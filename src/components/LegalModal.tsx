import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Lock,
  X,
  CheckCircle2,
  Clock,
  Building2,
  Eye,
  Wallet,
  AlertCircle
} from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'terms' | 'privacy';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'terms'
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                Legalitas & Tata Kelola INTEGRITAS360
              </h2>
              <p className="text-xs text-slate-400">
                Transparansi, Kebijakan Privasi & Ketentuan Layanan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 border-b border-slate-800 bg-slate-950/30 flex gap-4">
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Syarat & Ketentuan
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            Kebijakan Privasi & Perlindungan Saksi
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {activeTab === 'terms' ? (
            /* SYARAT & KETENTUAN */
            <div className="space-y-6">
              {/* Highlight Box Verifikasi Administrator */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  Verifikasi Penuh Oleh Administrator Sistem
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Demi menegakkan integritas tertinggi, seluruh dokumen legalitas perusahaan, kredensial auditor independen,
                  serta transaksi finansial (deposit, penarikan dana, dan klaim reward) wajib melalui proses pemeriksaan dan verifikasi
                  resmi oleh Administrator INTEGRITAS360.
                </p>
              </div>

              {/* Point 1: Dokumen Perusahaan & Auditor */}
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <h3 className="text-white font-bold flex items-center gap-2 text-sm sm:text-base">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  1. Verifikasi Dokumen Perusahaan & Auditor
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 pl-2">
                  <li>
                    <strong className="text-white">Dokumen Perusahaan (PT):</strong> Setiap perusahaan terdaftar wajib mengunggah
                    dokumen legalitas resmi (NIB, SIUP, NPWP, atau Akta Perusahaan). Dokumen akan diverifikasi oleh Administrator sebelum
                    sistem menerbitkan poster QR whistleblowing resmi yang bergaransi.
                  </li>
                  <li>
                    <strong className="text-white">Dokumen Auditor Independen:</strong> Auditor wajib melampirkan bukti lisensi atau
                    sertifikasi keahlian investigasi (IAPI, ACFE, SKKNI, atau KTP). Administrator memverifikasi kredibilitas auditor
                    guna memastikan independensi mutlak dari pihak perusahaan terlapor.
                  </li>
                </ul>
              </div>

              {/* Point 2: Verifikasi Deposit, Penarikan & Klaim Finansial */}
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <h3 className="text-white font-bold flex items-center gap-2 text-sm sm:text-base">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  2. Verifikasi Transaksi Finansial (Deposit, Penarikan & Reward)
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 pl-2">
                  <li>
                    <strong className="text-white">Deposit Dana Penjaminan:</strong> Dana yang disetorkan oleh perusahaan akan diverifikasi
                    oleh Administrator sebelum saldo aktif dan dana terkunci penjaminan whistleblowing bertambah di dashboard.
                  </li>
                  <li>
                    <strong className="text-white">Penarikan Dana (Withdrawal):</strong> Setiap pengajuan penarikan dana perusahaan diverifikasi
                    oleh Administrator untuk memastikan tidak melanggar komitmen alokasi penjaminan laporan aktif.
                  </li>
                  <li>
                    <strong className="text-white">Pencairan Klaim Reward:</strong> Pengajuan klaim reward pelapor diverifikasi langsung oleh
                    Administrator setelah auditor independen menyatakan laporan valid dan terbukti.
                  </li>
                </ul>
              </div>

              {/* Point 3: Tidak Ada Batasan Waktu Klaim Reward */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                <h3 className="text-emerald-300 font-bold flex items-center gap-2 text-sm sm:text-base">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  3. Masa Berlaku Reward: Tidak Ada Batasan Waktu
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed">
                  <strong className="text-emerald-400 font-semibold">TIDAK ADA BATASAN WAKTU UNTUK KLAIM REWARD.</strong>{' '}
                  Pelapor yang laporannya telah divalidasi oleh auditor independen dapat mengklaim hak reward tunai kapan saja.
                  Nomor tiket rahasia berlaku secara permanen tanpa tanggal kedaluwarsa, memastikan keamanan waktu dan kenyamanan
                  bagi saksi pelapor.
                </p>
              </div>

              {/* Point 4: Tata Kelola Laporan & Bukti */}
              <div className="space-y-2">
                <h3 className="text-white font-bold flex items-center gap-2 text-sm sm:text-base">
                  <Eye className="w-4 h-4 text-amber-400" />
                  4. Kewajiban Bukti & Mekanisme Whistleblowing
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Setiap laporan dugaan penyimpangan wajib menyertakan minimal 2 bukti/foto autentik (dokumen transaksi, percakapan,
                  foto fisik, dsb.) untuk mencegah fitnah atau laporan fiktif. Pelapor dapat menambahkan bukti tambahan jika ada.
                </p>
              </div>
            </div>
          ) : (
            /* KEBIJAKAN PRIVASI */
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  Komitmen Kerahasiaan 100% Saksi Pelapor
                </div>
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  INTEGRITAS360 dirancang dengan arsitektur Zero-Knowledge untuk pelapor anonim. Sistem tidak pernah merekam IP address,
                  identitas ISP, peramban (browser fingerprint), maupun data geolokasi pengguna.
                </p>
              </div>

              <div className="space-y-2 border-b border-slate-800 pb-4">
                <h3 className="text-white font-bold text-sm sm:text-base">
                  1. Perlindungan Kerahasiaan Nomor WhatsApp
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pengisian nomor WhatsApp bersifat <strong className="text-white">opsional</strong> dan semata-mata digunakan oleh
                  sistem untuk mengirimkan notifikasi status laporan atau pemberitahuan bahwa reward siap dicairkan. Nomor WhatsApp ini
                  disimpan secara terenkripsi dan <strong className="text-amber-400">TIDAK PERNAH</strong> diberikan kepada pihak manajemen
                  perusahaan yang dilaporkan.
                </p>
              </div>

              <div className="space-y-2 border-b border-slate-800 pb-4">
                <h3 className="text-white font-bold text-sm sm:text-base">
                  2. Enkripsi Berkas Bukti & Hak Akses Terisolasi
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Foto dan dokumen bukti yang diunggah dikompresi serta dienkripsi di sisi klien sebelum disimpan. Berkas bukti hanya
                  dapat diakses oleh Auditor Independen berlisensi dan Administrator sistem yang ditugaskan secara resmi.
                </p>
              </div>

              <div className="space-y-2 border-b border-slate-800 pb-4">
                <h3 className="text-white font-bold text-sm sm:text-base">
                  3. Nomor Tiket Akses Mandiri
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pelacakan status laporan dilakukan menggunakan nomor tiket unik (contoh: <code className="text-amber-400 bg-slate-950 px-1 py-0.5 rounded font-mono">WB-XXXXXX-XXX</code>).
                  Pelapor tidak perlu mendaftar akun atau memasukkan email untuk memantau proses investigasi maupun mengajukan klaim pencairan reward.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-bold text-sm sm:text-base">
                  4. Kepatuhan Undang-Undang Perlindungan Saksi
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Prinsip kerahasiaan INTEGRITAS360 merujuk pada standar tata kelola perlindungan saksi dan korban, mengacu pada UU No. 13 Tahun 2006
                  serta ISO 37002 (Whistleblowing Management Systems) untuk menjamin pelapor bebas dari intimidasi atau pembalasan.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            INTEGRITAS360 • Standar Perlindungan Whistleblowing Indonesia
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Saya Memahami
          </button>
        </div>
      </div>
    </div>
  );
};
