import React from 'react';
import { useNavigation } from '../context/NavigationContext';
import { ShieldCheck, ArrowRight, MessageCircle, Building2, LockKeyhole } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

export const RegisterPage: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo size="lg" className="shadow-xl shadow-amber-500/20" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-400">
            <LockKeyhole className="w-3.5 h-3.5" />
            Pendaftaran Mandiri Ditiadakan
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            Pendaftaran Terpusat
          </h2>
          <p className="text-xs text-slate-400">
            Standar Kepatuhan ISO 37002 & Tata Kelola Integritas360
          </p>
        </div>

        {/* Informative Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 text-xs">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <Building2 className="w-6 h-6 shrink-0 text-amber-400" />
            <div className="space-y-0.5">
              <span className="font-bold text-white block">Perusahaan Didaftarkan Manual</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Untuk menjamin legalitas dan validitas penjaminan saldo whistleblowing, seluruh entitas perusahaan didaftarkan langsung oleh <strong>Super Admin / Dewan Pengawas</strong> melalui Owner Panel.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-slate-300 text-[11px] leading-relaxed">
            <p>
              Akun login perusahaan (Company Admin, Finance, HR) diterbitkan secara resmi setelah verifikasi legalitas perusahaan selesai.
            </p>
            <p>
              Jika perusahaan Anda telah terdaftar dan memiliki akun, silakan langsung masuk menggunakan email dan kata sandi yang telah diberikan.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <span>Masuk ke Halaman Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="https://wa.me/6287879625033?text=Halo%20Super%20Admin%20Integritas360%2C%20saya%20ingin%20mendaftarkan%20perusahaan%20kami"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Hubungi Super Admin via WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Pelapor Note */}
        <div className="text-center">
          <button
            onClick={() => navigate('/lapor')}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Pelapor whistleblower? <span className="text-emerald-400 font-semibold underline">Lapor secara anonim tanpa login di sini</span>
          </button>
        </div>
      </div>
    </div>
  );
};
