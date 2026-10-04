import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import {
  Receipt,
  Coins,
  CreditCard,
  FileSpreadsheet,
  Users,
  AlertOctagon,
  ShieldCheck,
  Building2,
  QrCode,
  ArrowRight,
  TrendingDown,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  MessageCircle
} from 'lucide-react';

interface CaseStudy {
  id: number;
  judul: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  skenario: string;
  modus: string;
  kerugian: string;
  solusi: string;
  pencegahanDetail: string[];
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 1,
    judul: 'Mark-up Pengadaan Barang',
    icon: Receipt,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/30',
    skenario:
      'Manager pengadaan bekerjasama dengan vendor rekanan. Harga ATK & logistik yang harusnya Rp 50 juta digelembungkan menjadi Rp 120 juta. Selisih dana Rp 70 juta dibagi rata masuk kantong pribadi.',
    modus: 'Membuat 3 berkas penawaran harga fiktif agar seolah-olah lolos lelang harga terendah.',
    kerugian: 'Rp 70.000.000 / kali pengadaan (Bisa mencapai ratusan juta per tahun)',
    solusi: 'Karyawan gudang atau staf finance lapor secara anonim lewat scan QR poster di ruang kerja.',
    pencegahanDetail: [
      'Staf staf lapangan atau gudang yang mengetahui harga asli dapat memotret nota/faktur fisik tanpa takut dipecat.',
      'Sistem tidak mencatat alamat IP atau identitas pelapor, sehingga aman dari pembalasan oknum manager.',
      'Auditor independen langsung memeriksa kebenaran vendor pembanding secara objektif.'
    ]
  },
  {
    id: 2,
    judul: 'Gratifikasi & Suap Proyek',
    icon: Coins,
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/10 border-yellow-500/30',
    skenario:
      'Kontraktor memberikan komisi fee 10% secara terselubung kepada Kepala Proyek agar memenangkan tender pembangunan gedung pabrik baru.',
    modus: 'Transfer fee diarahkan melalui rekening bank atas nama keluarga atau pihak ketiga untuk samaran.',
    kerugian: 'Kualitas spesifikasi material bangunan diturunkan drastis, perusahaan rugi Miliaran saat struktur retak.',
    solusi: 'Whistleblower mendapat perlindungan identitas 100% dan laporan langsung diteruskan ke Tim Auditor.',
    pencegahanDetail: [
      'Anggota tim tender yang ditekan untuk menyetujui dokumen fiktif dapat melapor seketika via smartphone.',
      'Bukti transfer dan chat negosiasi fee dapat diunggah dengan enkripsi mandiri.',
      'Owner menerima audit independen sebelum pencairan termin pembayaran tahap akhir ke kontraktor.'
    ]
  },
  {
    id: 3,
    judul: 'Penyalahgunaan Aset Perusahaan',
    icon: CreditCard,
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/10 border-rose-500/30',
    skenario:
      'Oknum Direktur atau petinggi divisi menggunakan mobil dinas operasional dan fasilitas kartu kredit perusahaan untuk keperluan liburan pribadi dan keluarga.',
    modus: 'Mengklaim seluruh struk bensin, hotel keluarga, dan restoran mewah sebagai "Biaya Entertain Klien Operasional".',
    kerugian: 'Rp 300.000.000 / tahun kebocoran kas perusahaan',
    solusi: 'Laporan whistleblowing masuk langsung ke Dewan Owner/Komisaris, bukan ke atasan langsung pelaku.',
    pencegahanDetail: [
      'Memutus rantai konflik kepentingan karena laporan tidak dapat diblokir oleh sekretaris atau manajer internal.',
      'Driver atau staf administrasi keuangan dapat mengunggah bukti rute dan manifes penumpang asli secara rahasia.',
      'Pemberian teguran atau audit forensik dapat dilakukan tanpa menimbulkan kegaduhan kantor.'
    ]
  },
  {
    id: 4,
    judul: 'Manipulasi Laporan Keuangan',
    icon: FileSpreadsheet,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/30',
    skenario:
      'Divisi Finance menutupi akumulasi piutang macet tak tertagih dan memajukan pengakuan laba fiktif agar target bonus tahunan manajemen tercapai.',
    modus: 'Memalsukan faktur penjualan akhir tahun dan menahan pelaporan retur barang yang cacat.',
    kerugian: 'Investor & Owner salah mengambil keputusan ekspansi berisiko fatal, arus kas riil defisit.',
    solusi: 'Auditor independen mendapatkan bukti awal audit trail dari whistleblower internal sebelum buku ditutup.',
    pencegahanDetail: [
      'Staf akunting junior yang diancam jika membocorkan angka dapat melapor tanpa jejak login.',
      'Lampiran kertas kerja Excel dan rekonsiliasi bank asli dapat dikirimkan langsung ke dewan auditor.',
      'Mencegah tuntutan pidana dan sanksi denda pajak dengan mengoreksi laporan lebih dini.'
    ]
  },
  {
    id: 5,
    judul: 'Konflik Kepentingan Rekrutmen',
    icon: Users,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/30',
    skenario:
      'Oknum pimpinan HRD meloloskan anggota keluarga dan kerabat dekat ke posisi kunci tanpa proses uji kompetensi dan wawancara standar.',
    modus: 'Lowongan kerja tidak diumumkan secara terbuka ke publik atau calon profesional sengaja digugurkan pada tahap awal.',
    kerugian: 'Kinerja divisi menurun drastis, timbul kecemburuan sosial antar karyawan, turnover staf berbakat tinggi.',
    solusi: 'Karyawan dan sesama tim HRD berani melapor karena jaminan anonimitas mutlak tanpa intervensi lokal.',
    pencegahanDetail: [
      'Mendokumentasikan bukti hubungan kekerabatan dan perbandingan skor tes kompetensi pelamar.',
      'Mendorong budaya kerja meritokrasi yang sehat di mana prestasi kerja adalah acuan utama.',
      'Pemberitahuan instan ke pihak Owner untuk meninjau ulang surat keputusan rekrutmen.'
    ]
  },
  {
    id: 6,
    judul: 'Pelecehan & Intimidasi di Tempat Kerja',
    icon: AlertOctagon,
    iconColor: 'text-red-400',
    iconBg: 'bg-red-500/10 border-red-500/30',
    skenario:
      'Atasan menekan bawahan untuk lembur setiap hari tanpa kompensasi uang lembur, disertai ancaman mutasi ke daerah terpencil jika menolak.',
    modus: 'Instruksi diberikan secara lisan di ruang tertutup tanpa ada perintah kerja tertulis resmi.',
    kerugian: 'Kesehatan mental dan moral staf hancur, perusahaan berisiko dituntut pidana UU Ketenagakerjaan.',
    solusi: 'Korban dan saksi dapat melapor dan mengunggah rekaman percakapan tanpa takut identitasnya terbongkar.',
    pencegahanDetail: [
      'Memberikan saluran aman ketika jalur HRD konvensional dipimpin oleh rekan dekat pelaku intimidasi.',
      'Pelapor dapat menyertakan nomor WhatsApp rahasia jika bersedia menerima tindak lanjut mediasi independen.',
      'Menciptakan efek jera bagi oknum atasan karena poster QR terpasang jelas di setiap sudut fasilitas kantor.'
    ]
  }
];

export const StudiKasusPage: React.FC = () => {
  const { navigate } = useNavigation();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Fakta & Realita Pelanggaran di Dunia Bisnis
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Studi Kasus Pelanggaran Terbesar di{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
              Perusahaan Swasta
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Kecurangan (fraud) dan pelanggaran etika seringkali terjadi di depan mata karyawan, namun tidak pernah sampai ke telinga
            Owner karena ketakutan akan pembalasan. Pelajari bagaimana <strong className="text-amber-400">INTEGRITAS360</strong> memutus
            kebocoran kas perusahaan Anda.
          </p>
        </div>

        {/* Highlight Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto pt-2 pb-6">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-2xl font-black text-amber-400">75% Fraud</div>
            <div className="text-xs text-slate-400 mt-0.5">Terungkap pertama kali dari laporan karyawan internal</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-2xl font-black text-rose-400">Rp 50jt - Rp 1M+</div>
            <div className="text-xs text-slate-400 mt-0.5">Rata-rata potensi kerugian per kasus pengadaan & aset</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-2xl font-black text-emerald-400">100% Anonim</div>
            <div className="text-xs text-slate-400 mt-0.5">Menghilangkan rasa takut karyawan untuk bersuara</div>
          </div>
        </div>

        {/* 6 Grid Case Studies */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {CASE_STUDIES.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className="bg-slate-900/90 rounded-2xl border border-amber-500/30 hover:border-amber-400 transition-all duration-300 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group"
              >
                {/* Gold Glow subtle effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 group-hover:bg-amber-500/10 rounded-full blur-2xl pointer-events-none transition-colors" />

                <div className="space-y-4">
                  {/* Top Row: Icon + Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${item.iconBg}`}>
                      <Icon className={`w-6 h-6 ${item.iconColor}`} />
                    </div>

                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 tracking-wide uppercase">
                      Sering terjadi di PT Swasta
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                      KASUS #{item.id}
                    </span>
                    <h3 className="text-lg font-extrabold text-white group-hover:text-amber-300 transition-colors">
                      {item.judul}
                    </h3>
                  </div>

                  {/* Skenario */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Skenario Kejadian:
                    </span>
                    <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      {item.skenario}
                    </p>
                  </div>

                  {/* Modus */}
                  <div className="text-xs space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Modus Operandi:
                    </span>
                    <p className="text-slate-300 text-xs flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{item.modus}</span>
                    </p>
                  </div>

                  {/* Kerugian & Dampak */}
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-red-400 font-bold text-[11px] uppercase tracking-wider">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Kerugian & Dampak Bagi Perusahaan:
                    </div>
                    <div className="font-extrabold text-white text-xs sm:text-sm">
                      {item.kerugian}
                    </div>
                  </div>

                  {/* Solusi INTEGRITAS360 */}
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Solusi INTEGRITAS360:
                    </div>
                    <p className="text-emerald-200 text-xs font-medium leading-relaxed">
                      {item.solusi}
                    </p>
                  </div>
                </div>

                {/* Prevention Toggle Section */}
                <div className="pt-4 mt-4 border-t border-slate-800/90 space-y-3">
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-300 hover:text-amber-200 text-xs font-semibold border border-amber-500/30 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Bagaimana sistem ini mencegahnya?</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-amber-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-amber-400" />
                    )}
                  </button>

                  {/* Expanded Explanation */}
                  {isExpanded && (
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2 animate-fadeIn">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                        Mekanisme Proteksi Sistem:
                      </span>
                      <ul className="space-y-1.5 text-slate-300 text-[11px]">
                        {item.pencegahanDetail.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2 leading-relaxed">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM CTA: Pasang Poster QR Whistleblowing */}
        <section className="mt-16 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/50 border-2 border-amber-500/50 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
            <QrCode className="w-4 h-4 text-amber-400" />
            Langkah Nyata Mencegah Kebocoran Finansial
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
              Pasang Poster QR Whistleblowing di Kantor Anda Sekarang —{' '}
              <span className="text-amber-400 underline decoration-amber-500/50 underline-offset-4">
                Cegah Sebelum Rugi Miliaran
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Hanya butuh 2 menit untuk mendaftarkan perusahaan Anda, mengisi saldo penjaminan reward kepatuhan, dan mengunduh
              poster beresolusi HD 1080x1920 siap cetak untuk ditempel di koridor, area presensi, pabrik, dan gudang kantor Anda.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="https://wa.me/6287879625033?text=Halo%20Admin%20Integritas360%2C%20saya%20tertarik%20mendaftarkan%20perusahaan"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              Hubungi Kami (WhatsApp: 0878-7962-5033)
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              onClick={() => navigate('/lapor')}
              className="px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Coba Form Pelaporan Anonim
            </button>

            <button
              onClick={() => navigate('/')}
              className="px-4 py-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white font-medium text-sm border border-slate-800 transition-all cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Format Poster 1080x1920 HD
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              QR Code Terenkripsi Aktif
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Didukung Auditor Independen
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};
