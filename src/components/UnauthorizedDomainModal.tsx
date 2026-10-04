import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Cloud, X, HelpCircle, ArrowRight, ShieldCheck, Globe } from 'lucide-react';

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseEmailAuth?: () => void;
  projectId?: string;
}

export const UnauthorizedDomainModal: React.FC<UnauthorizedDomainModalProps> = ({
  isOpen,
  onClose,
  onUseEmailAuth,
}) => {
  const [copied, setCopied] = useState(false);
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const cloudflareDashboardUrl = 'https://dash.cloudflare.com';

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!currentHostname) return;
    navigator.clipboard.writeText(currentHostname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-orange-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Glow Header */}
        <div className="bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-transparent p-5 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Alur Proteksi & Routing Domain Cloudflare</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Cloudflare DNS & Proxy
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Alur domain resmi dan proteksi jaringan web dialihkan melalui Cloudflare.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {/* Quick Explanation */}
          <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/20 text-xs text-slate-300 space-y-1">
            <p className="leading-relaxed">
              Sistem mengarahkan alur otorisasi domain dan proteksi keamanan melalui arsitektur <strong className="text-orange-400 font-semibold">Cloudflare</strong> (WAF, SSL Strict, & DNS Management) untuk perlindungan integritas maksimal dan pencegahan serangan bot/DDoS.
            </p>
          </div>

          {/* Domain Box */}
          <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                Target Hostname / Domain Web Saat Ini:
              </span>
              <span className="text-[11px] text-orange-400 font-medium">Domain Aktif</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-lg p-2 px-3">
              <code className="text-xs text-emerald-400 font-mono flex-1 truncate select-all">
                {currentHostname || 'ais-dev-...run.app'}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-semibold border border-orange-500/40 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Domain</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Two Solutions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Solution A: Use Email/Password (Instant) */}
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>⚡ Opsi 1: Langsung Masuk (Instan)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Login & verifikasi dengan <strong>Email & Kata Sandi</strong> langsung aktif 100% tanpa kendala domain.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onUseEmailAuth) onUseEmailAuth();
                }}
                className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                Gunakan Email & Password
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Solution B: Manage in Cloudflare */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-orange-400 font-semibold text-xs">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Opsi 2: Kelola via Cloudflare</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Arahkan CNAME / DNS Records & aktifkan <strong>Proxy Cloudflare</strong> untuk proteksi SSL.
                </p>
              </div>
              <a
                href={cloudflareDashboardUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="w-full py-2 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-orange-500/40 transition-colors shadow-md shadow-orange-600/20"
              >
                Buka Dashboard Cloudflare
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Cloudflare SOP Steps */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-orange-400" />
              Alur Pengaturan DNS & Proxy Cloudflare:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 ml-1">
              <li>Masuk ke akun Cloudflare di <strong className="text-orange-300 font-mono text-[10px]">dash.cloudflare.com</strong>.</li>
              <li>Pilih domain kustom perusahaan Anda, lalu buka menu <strong>DNS &rarr; Records</strong>.</li>
              <li>Tambahkan record (CNAME / Custom Hostname) yang mengarah ke target domain: <strong className="text-emerald-300 font-mono text-[10px]">{currentHostname}</strong>.</li>
              <li>Pastikan <strong>Proxy Status</strong> menyala (ikon awan oranye) untuk proteksi SSL otomatis.</li>
              <li>Gunakan <strong>Login Email & Kata Sandi</strong> di formulir untuk akses langsung ke portal.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
