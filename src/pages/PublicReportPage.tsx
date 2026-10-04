import React from 'react';
import { useNavigation } from '../context/NavigationContext';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { ReportFormSection } from '../components/ReportFormSection';

export const PublicReportPage: React.FC<{ companyIdFromUrl?: string }> = ({ companyIdFromUrl }) => {
  const { path, query: navQuery, navigate } = useNavigation();

  // Extract ID from /lapor/:companyId or ?id=...
  let companyId = companyIdFromUrl;
  if (!companyId) {
    const parts = path.split('/');
    if (parts.length >= 3 && parts[1] === 'lapor') {
      companyId = parts[2];
    } else if (navQuery.id) {
      companyId = navQuery.id;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        {/* Back Link */}
        <button
          onClick={() => navigate('/')}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda INTEGRITAS360
        </button>

        {/* Protection Alert */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-xs text-slate-300 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              100% Bebas, Anonim & Terenkripsi
            </div>
            <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
              Tanpa Registrasi / Tanpa Akun
            </span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Sebagai pelapor, Anda <strong>TIDAK PERLU</strong> registrasi ataupun menggunakan identitas pribadi. Laporan Anda langsung diteruskan kepada Auditor Independen yang Anda pilih. Alamat IP, identitas perangkat, dan email Anda tidak akan pernah direkam untuk menjamin keselamatan saksi pelapor.
          </p>
        </div>

        {/* Core Reporting Form - Official Portal Mode */}
        <ReportFormSection initialCompanyId={companyId} isContohMode={false} />
      </div>
    </div>
  );
};
