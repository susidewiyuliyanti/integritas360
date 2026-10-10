import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { BrandLogo } from './BrandLogo';
import { ShieldCheck, LogOut, UserCircle, Building2, Eye, LayoutDashboard, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, isOwner, role, logout } = useAuth();
  const { path, navigate } = useNavigation();

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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-16 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
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

        <nav aria-label="Navigasi utama" className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:justify-end w-full md:w-auto">
          <button
            id="nav-btn-studi-kasus"
            onClick={() => navigate('/studi-kasus')}
            className={`px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer min-h-10 ${path === '/studi-kasus' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'}`}
          >
            Studi Kasus
          </button>

          <button
            onClick={handleOpenReport}
            className={`px-2.5 sm:px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer min-h-10 ${path.startsWith('/lapor') ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40'}`}
            title="Pelaporan anonim dan terenkripsi"
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-400" />
            <span>Lapor Anonim</span>
          </button>

          {user ? (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
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
                <button onClick={() => navigate('/owner')} className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors flex items-center gap-1.5 cursor-pointer min-h-10">
                  <LayoutDashboard className="w-3.5 h-3.5 shrink-0" /><span>Owner Panel</span>
                </button>
              )}
              {role === 'admin_perusahaan' && path !== '/admin-perusahaan' && (
                <button onClick={() => navigate('/admin-perusahaan')} className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors flex items-center gap-1.5 cursor-pointer min-h-10">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" /><span>Dashboard Admin PT</span>
                </button>
              )}
              {role === 'perusahaan' && path !== '/perusahaan' && (
                <button onClick={() => navigate('/perusahaan')} className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-colors flex items-center gap-1.5 cursor-pointer min-h-10">
                  <Building2 className="w-3.5 h-3.5 shrink-0" /><span>perusahaan</span>
                </button>
              )}
              {role === 'auditor' && path !== '/auditor' && (
                <button onClick={() => navigate('/auditor')} className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1.5 cursor-pointer min-h-10">
                  <Eye className="w-3.5 h-3.5 shrink-0" /><span>Auditor</span>
                </button>
              )}

              <button
                onClick={() => navigate('/profile')}
                className={`px-2.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer min-h-10 ${path === '/profile' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'}`}
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

              <button onClick={handleLogout} title="Keluar" aria-label="Keluar" className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-800/40 cursor-pointer min-h-10 min-w-10 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button id="nav-btn-masuk-daftar" onClick={() => navigate('/login')} className="px-3 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5 min-h-10" title="Khusus Akun Perusahaan & Auditor (Pelapor tidak perlu login)">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span>Masuk PT & Auditor</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
