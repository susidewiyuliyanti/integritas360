import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Building2,
  Eye,
  Lock,
  QrCode,
  CheckCircle,
  ArrowRight,
  Award,
  ShieldAlert,
  BookOpen,
  FileText,
  MessageCircle
} from 'lucide-react';
import { ReportFormSection } from '../components/ReportFormSection';
import { LegalModal } from '../components/LegalModal';
import { BrandLogo } from '../components/BrandLogo';

export const LandingPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { user, isOwner, role } = useAuth();
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy'>('terms');

  const openLegalModal = (tab: 'terms' | 'privacy') => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(245,158,11,0.15),transparent)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="flex justify-center">
              <BrandLogo size="xl" className="shadow-2xl shadow-amber-500/20" />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Platform Whistleblowing Independen Terintegrasi Nasional
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Kawal Integritas Bisnis dengan{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
                INTEGRITAS360
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Sistem pelaporan pelanggaran etika dan kecurangan (Whistleblowing) terenkripsi mandiri.
              Menghubungkan <span className="text-amber-400 font-semibold">Perusahaan Patuh</span> dan{' '}
              <span className="text-emerald-400 font-semibold">Auditor Independen</span>.{' '}
              <span className="text-emerald-400 font-bold underline decoration-emerald-500/40 underline-offset-4">
                Pelapor 100% Anonim.
              </span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              {/* Tombol Studi Kasus (sebelum tombol form pelaporan) */}
              <button
                id="btn-hero-studi-kasus"
                onClick={() => navigate('/studi-kasus')}
                className="px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-amber-200 font-bold text-sm border border-amber-500/40 shadow-lg shadow-amber-500/10 flex items-center gap-2 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                Studi Kasus
              </button>

              {/* Primary Report Form Button */}
              <button
                id="btn-hero-form-pelaporan"
                onClick={() => {
                  const el = document.getElementById('form-pelaporan-section');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate('/lapor');
                  }
                }}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm shadow-xl shadow-red-600/25 flex items-center gap-2 transition-all cursor-pointer ring-2 ring-red-500/30"
              >
                <ShieldAlert className="w-4 h-4" />
                Form Pelaporan (Tanpa Login - 100% Anonim)
              </button>

              {user ? (
                <button
                  id="btn-goto-dashboard"
                  onClick={() => {
                    if (isOwner) navigate('/owner');
                    else if (role === 'perusahaan') navigate('/perusahaan');
                    else if (role === 'auditor') navigate('/auditor');
                    else navigate('/perusahaan');
                  }}
                  className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer"
                >
                  Buka Dashboard Saya
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="btn-masuk-daftar"
                  onClick={() => navigate('/login')}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Portal Masuk (Khusus PT & Auditor)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Micro proof badges */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Kerahasiaan Pelapor 100% Terjamin
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Poster HD 1080x1920 Otomatis
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Total Reward Tersedia Realtime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Embedded Live Report Form Section - Contoh / Simulasi Mode */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        <ReportFormSection isEmbedded={true} isContohMode={true} />
      </section>

      {/* Poster Generation Showcase */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Award className="w-3.5 h-3.5" />
                Fitur Unggulan Poster Siap Cetak
              </div>
              <h2 className="text-3xl font-extrabold text-white leading-snug">
                QR Code Untuk Di Tempel Di Lingkungan Perusahaan
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Poster dirancang dengan border keemasan resmi, teks nama perusahaan, total reward tersedia, dan QR Code terenkripsi
                langsung yang dapat dipindai oleh kamera smartphone mana pun.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <QrCode className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">QR Code Beresolusi 500px</h4>
                    <p className="text-xs text-slate-400">
                      Menggunakan library QR native tanpa ketergantungan tangkapan layar DOM untuk menjamin hasil render tajam.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Tautan Pelaporan Langsung</h4>
                    <p className="text-xs text-slate-400">
                      Mengarahkan pelapor ke URL terverifikasi portal resmi: /lapor/[UID_PERUSAHAAN]
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 flex justify-center">
              <div className="relative p-3 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl max-w-sm w-full">
                <div className="border-4 border-amber-400 bg-slate-900 rounded-xl p-5 text-center space-y-3">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                    PORTAL RESMI INTEGRITAS NASIONAL
                  </div>
                  <div className="text-xl font-black text-white">INTEGRITAS360</div>
                  <div className="text-[11px] font-semibold text-amber-300">INDEPENDENT WHISTLEBLOWING SYSTEM</div>
                  <div className="h-0.5 w-24 bg-amber-400 mx-auto" />
                  <div className="text-xs text-slate-300">PT MAJU BERSAMA INTEGRITAS</div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">TOTAL REWARD TERSEDIA</div>
                    <div className="text-base font-mono font-bold text-emerald-400">Rp 50.000.000</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg mx-auto w-36 h-36 flex items-center justify-center shadow-lg">
                    <QrCode className="w-28 h-28 text-slate-950" />
                  </div>
                  <div className="text-[11px] font-bold text-amber-400">SCAN UNTUK LAPOR SECARA ANONIM</div>
                  <div className="text-[10px] text-slate-400">100% Rahasia • Tanpa Rekam Identitas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-slate-950 border-t border-slate-800/80 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold">
            <button
              onClick={() => openLegalModal('terms')}
              className="text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              Syarat & Ketentuan
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => openLegalModal('privacy')}
              className="text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Kebijakan Privasi
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => navigate('/studi-kasus')}
              className="text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              Studi Kasus Fraud
            </button>
            <span className="text-slate-700">•</span>
            <a
              href="https://wa.me/6287879625033"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer font-bold"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              Hubungi Kami (087879625033)
            </a>
          </div>

          <p className="text-slate-500 pt-2 border-t border-slate-900">
            © 2026 INTEGRITAS360. Seluruh hak cipta dilindungi undang-undang. Dikelola oleh Dewan Integritas & Tim Auditor Independen Berlisensi.
          </p>
        </div>
      </footer>

      {/* Legal & Privacy Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        defaultTab={legalModalTab}
      />
    </div>
  );
};
