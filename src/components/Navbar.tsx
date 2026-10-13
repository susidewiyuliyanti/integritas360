import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { BrandLogo } from './BrandLogo';
import { ShieldCheck, LogOut, UserCircle, Building2, Eye, LayoutDashboard, ShieldAlert, CheckCircle2, Languages, Menu, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Navbar: React.FC = () => {
  const { user, profile, isOwner, role, logout } = useAuth();
  const { path, navigate } = useNavigation();
  const { language, toggleLanguage } = useLanguage();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleOpenReport = () => {
    if (path === '/') {
      const el = document.getElementById('form-pelaporan-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate('/lapor');
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-16 py-2 flex flex-row items-center justify-between md:flex-row md:items-center md:justify-between gap-2">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 sm:gap-3 text-left focus:outline-none group cursor-pointer min-w-0 max-w-full">
          <BrandLogo size="md" className="group-hover:scale-105 transition-transform shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-base sm:text-lg text-white font-mono whitespace-nowrap">
                INTEGRITAS<span className="text-amber-400">360</span>
              </span>
              <span className="hidden sm:inline text-[10px] font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20 px-1.5 py-0.5 rounded">
                v1.0
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-400 font-medium leading-tight">Platform Pelaporan Pelanggaran Perusahaan</p>
          </div>
        </button>

        <nav aria-label="Navigasi utama" className="flex justify-end w-auto md:w-auto shrink-0">
          <details className="relative group">
            <summary className="list-none flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold cursor-pointer select-none transition-colors">
              <Menu className="w-4 h-4 text-amber-400" />
              <span>Menu</span>
              <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 w-52 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-700/80 bg-slate-900/98 p-1.5 shadow-xl shadow-black/30 backdrop-blur-xl flex flex-col gap-0.5">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={language === 'id' ? 'Switch to English' : 'Switch to Indonesian'}
            title={language === 'id' ? 'Switch to English' : 'Switch to Indonesian'}
            data-no-translate
            className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-md border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 text-amber-300 transition-colors cursor-pointer min-h-8 flex items-center gap-1.5"
          >
            <Languages className="w-4 h-4" />
            <span>{language === 'id' ? 'English' : 'Indonesian'}</span>
          </button>
          <button
            id="nav-btn-studi-kasus"
            onClick={() => navigate('/studi-kasus')}
            className={`w-full text-left px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer min-h-8 ${path === '/studi-kasus' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'}`}
          >
            Studi Kasus
          </button>

          <button
            onClick={handleOpenReport}
            className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer min-h-8 ${path.startsWith('/lapor') ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40'}`}
            title="Pelaporan anonim dan terenkripsi"
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-400" />
            <span>Lapor Anonim</span>
          </button>

          {user ? (
            <div className="flex flex-col items-stretch gap-1">
              <div className="flex items-center gap-2 px-2.5 py-1.5 mb-0.5 rounded-md bg-slate-800/70 border border-slate-700/50">
                {isOwner ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-xs font-bold text-red-300">ADMIN OWNER</span>
                  </>
                ) : role === 'admin_perusahaan' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-medium text-cyan-200 truncate max-w-[150px] flex items-center gap-1">
                      Admin PT {profile?.perusahaanName ? `(${profile.perusahaanName})` : ''}
                    </span>
                  </>
                ) : role === 'perusahaan' ? (
                  <>
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-medium text-slate-200 truncate max-w-[140px] flex items-center gap-1">
                      perusahaan
                      {profile?.statusVerifikasiDokumen === 'terverifikasi' && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                    </span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-300 truncate max-w-[140px] flex items-center gap-1">
                      Auditor
                      {profile?.statusVerifikasiDokumen === 'terverifikasi' && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                    </span>
                  </>
                )}
              </div>

              {isOwner && path !== '/owner' && (
                <button onClick={() => navigate('/owner')} className="w-full text-left px-2.5 py-1.5 text-xs font-medium rounded-md bg-red-500/10 hover:bg-red-500/15 text-red-300 border border-red-500/20 transition-colors flex items-center gap-1.5 cursor-pointer min-h-8">
                  <LayoutDashboard className="w-3.5 h-3.5 shrink-0" /><span>Owner Panel</span>
                </button>
              )}
              {role === 'admin_perusahaan' && path !== '/admin-perusahaan' && (
                <button onClick={() => navigate('/admin-perusahaan')} className="w-full text-left px-2.5 py-1.5 text-xs font-medium rounded-md bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 transition-colors flex items-center gap-1.5 cursor-pointer min-h-8">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" /><span>Dashboard Admin PT</span>
                </button>
              )}
              {role === 'perusahaan' && path !== '/perusahaan' && (
                <button onClick={() => navigate('/perusahaan')} className="w-full text-left px-2.5 py-1.5 text-xs font-medium rounded-md bg-blue-500/10 hover:bg-blue-500/15 text-blue-300 border border-blue-500/20 transition-colors flex items-center gap-1.5 cursor-pointer min-h-8">
                  <Building2 className="w-3.5 h-3.5 shrink-0" /><span>perusahaan</span>
                </button>
              )}
              {role === 'auditor' && path !== '/auditor' && (
                <button onClick={() => navigate('/auditor')} className="w-full text-left px-2.5 py-1.5 text-xs font-medium rounded-md bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 transition-colors flex items-center gap-1.5 cursor-pointer min-h-8">
                  <Eye className="w-3.5 h-3.5 shrink-0" /><span>Auditor</span>
                </button>
              )}

              <button
                onClick={() => navigate('/profile')}
                className={`w-full text-left px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer min-h-8 ${path === '/profile' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'}`}
              >
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Foto Profil" className="w-4 h-4 rounded-full object-cover border border-amber-400/60" />
                ) : (
                  <UserCircle className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="hidden sm:inline">
                  {role === 'admin_perusahaan' ? 'Profil Petugas' : role === 'auditor' ? 'Profil & Honorarium' : 'Profil & Saldo'}
                </span>
              </button>

              <button onClick={handleLogout} title="Keluar" aria-label="Keluar" className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors border border-transparent hover:border-red-800/40 cursor-pointer min-h-8 flex items-center justify-start gap-2">
                <LogOut className="w-3.5 h-3.5" /><span>Keluar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button id="nav-btn-masuk-daftar" onClick={() => navigate('/login')} className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-md bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 transition-all cursor-pointer flex items-center gap-1.5 min-h-8" title="Khusus Akun Perusahaan & Auditor (Pelapor tidak perlu login)">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span>Masuk</span>
              </button>
            </div>
          )}
            </div>
          </details>
        </nav>
      </div>
    </header>
  );
};
