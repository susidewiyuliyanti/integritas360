import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import {
  ShieldCheck, Eye, EyeOff, ArrowRight, Loader2, AlertCircle,
  KeyRound, CheckCircle2, MessageCircle
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

export const LoginPage: React.FC = () => {
  const { navigate } = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const routeByRole = (user: any) => {
    const role = user?.role;
    if (role === 'owner') navigate('/owner');
    else if (role === 'auditor') navigate('/auditor');
    else if (role === 'company_admin' || role === 'admin_perusahaan') navigate('/admin-perusahaan');
    else navigate('/perusahaan');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('Harap masukkan email dan kata sandi.');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok || !data?.user) {
        if (response.status === 401) setErrorMsg('Email atau kata sandi tidak cocok.');
        else if (response.status === 403) setErrorMsg('Akun login Anda sedang dinonaktifkan / ditangguhkan.');
        else setErrorMsg(data?.error || 'Gagal masuk. Silakan coba lagi.');
        return;
      }
      routeByRole(data.user);
    } catch (err: any) {
      console.warn('Cloudflare login error:', err);
      setErrorMsg('Koneksi ke server gagal. Periksa koneksi internet dan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    const targetEmail = resetEmail.trim() || email.trim();
    if (!targetEmail) {
      setResetError('Harap masukkan alamat email Anda.');
      return;
    }
    setResetError('Fitur reset kata sandi sedang dipindahkan ke sistem Cloudflare. Hubungi Owner / Super Admin untuk reset sementara.');
  };

  const handleGoogleLogin = () => {
    setErrorMsg('Login Google sudah dinonaktifkan. Gunakan email dan kata sandi yang diterbitkan Owner / Super Admin.');
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo size="lg" className="shadow-xl shadow-amber-500/20" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-400">
            <ShieldCheck className="w-4 h-4" />
            Portal Masuk INTEGRITAS360
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Masuk ke Sistem</h2>
          <p className="text-xs text-slate-400">
            Gunakan email dan kata sandi akun yang diterbitkan oleh Owner / Super Admin.
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
                  </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Akun</label>
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Kata Sandi</label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetError('');
                    setResetSuccess('');
                    setResetModalOpen(true);
                  }}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk Sekarang
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 text-center">
            Login menggunakan email dan kata sandi akun Cloudflare yang diterbitkan Owner / Super Admin.
          </div>
        </div>

        {/* Hubungi Kami WhatsApp (Tombol Daftar di-hide sementara) */}
        <div className="text-center text-xs text-slate-400 space-y-2">
          <p>Belum memiliki akun atau ingin mendaftar?</p>
          <a
            href="https://wa.me/6287879625033?text=Halo%20Admin%20Integritas360%2C%20saya%20ingin%20mendaftar%20atau%20konsultasi%20layanan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 font-bold text-xs transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Hubungi Kami (WhatsApp: 0878-7962-5033)</span>
          </a>
        </div>


        {/* Password Reset Modal */}
        {resetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Atur Ulang Kata Sandi</h3>
                  <p className="text-[11px] text-slate-400">Kami akan mengirim link reset ke email Anda</p>
                </div>
              </div>

              {resetError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                  {resetSuccess}
                </div>
              )}

              <form onSubmit={handlePasswordReset} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email Terdaftar</label>
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors disabled:opacity-60"
                  >
                    {resetLoading ? 'Mengirim...' : 'Kirim Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

