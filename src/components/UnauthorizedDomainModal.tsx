import React from 'react';
import { X, ArrowRight, ShieldCheck, KeyRound, MessageCircle } from 'lucide-react';

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
  if (!isOpen) return null;

  const handleCopy = () => {
    if (!currentHostname) return;
    navigator.clipboard.writeText(currentHostname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        <div className="bg-gradient-to-r from-emerald-500/15 via-amber-500/10 to-transparent p-5 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Akses Portal Perusahaan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Login perusahaan dikelola melalui akun yang dibuat Owner / Super Admin.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 text-sm">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <KeyRound className="w-4 h-4" />
              Gunakan Email & Kata Sandi Perusahaan
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Perusahaan tidak perlu mengatur DNS, CNAME, Proxy, atau login melalui dashboard Cloudflare. Cloudflare hanya digunakan sebagai infrastruktur hosting dan proteksi sistem.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-2">
            <p><strong className="text-white">Alur resmi:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Owner / Super Admin mendaftarkan perusahaan.</li>
              <li>Owner membuat email dan password akun utama perusahaan.</li>
              <li>Perusahaan login menggunakan kredensial tersebut.</li>
              <li>Setelah masuk, perusahaan dapat mengelola admin/staf tambahan sesuai hak akses.</li>
            </ol>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
            Jika Anda belum menerima kredensial login, hubungi Super Admin Integritas360.
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onUseEmailAuth?.();
            }}
            className="w-full py-2.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            Gunakan Login Email & Password
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" />Hubungi Super Admin jika akun belum tersedia.</span>
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer">Tutup</button>
        </div>
      </div>
    </div>
  );
};
