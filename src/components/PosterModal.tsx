import React, { useEffect, useState } from 'react';
import { X, Download, QrCode, CheckCircle2, Copy, Loader2, ShieldCheck } from 'lucide-react';
import { generateQrCodeDataUrl, renderPosterToCanvas, downloadPoster, resolveCompanyId, resolvePublicReportUrl, PosterOptions } from '../utils/posterGenerator';
import { useLanguage } from '../context/LanguageContext';

interface PosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: PosterOptions;
}

export const PosterModal: React.FC<PosterModalProps> = ({ isOpen, onClose, company }) => {
  const { language } = useLanguage();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [liveRewardBalance, setLiveRewardBalance] = useState<number | null>(null);
  const [resolvedCompany, setResolvedCompany] = useState<PosterOptions | null>(null);
  const [identityReady, setIdentityReady] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  const liveIdentity: PosterOptions = { ...company, ...(resolvedCompany || {}), lang: language };
  const companyId = resolveCompanyId(liveIdentity);
  const laporUrl = companyId ? resolvePublicReportUrl(companyId, liveIdentity.customUrl) : '';
  const liveCompany: PosterOptions = { ...liveIdentity, danaTersedia: liveRewardBalance ?? liveIdentity.danaTersedia, rewardBalance: liveRewardBalance ?? liveIdentity.rewardBalance };

  // Resolve the tenant identity from the authenticated D1 API before generating the QR.
  useEffect(() => {
    if (!isOpen) {
      setResolvedCompany(null);
      setIdentityReady(false);
      setLiveRewardBalance(null);
      return;
    }
    let active = true;
    setIdentityReady(false);
    setError('');
    (async () => {
      try {
        const response = await fetch('/api/company/me', { credentials: 'include', cache: 'no-store' });
        const result = await response.json().catch(() => ({}));
        if (response.ok && result?.company?.company_id) {
          const row = result.company;
          // Fetch the public, no-cache D1 record as the authoritative source for
          // the tenant name, canonical company ID, sector and current reward balance.
          const publicResponse = await fetch('/api/public/company?companyId=' + encodeURIComponent(String(row.company_id)), {
            credentials: 'omit',
            cache: 'no-store'
          });
          const publicResult = await publicResponse.json().catch(() => ({}));
          if (!publicResponse.ok || !publicResult?.company?.company_id) {
            throw new Error(publicResult?.error || 'Data perusahaan tidak dapat diverifikasi dari database D1.');
          }
          const d1 = publicResult.company;
          const d1Balance = Number(d1.deposit_balance);
          if (!Number.isFinite(d1Balance) || d1Balance < 0) {
            throw new Error('Saldo reward dari database D1 tidak valid. Poster tidak dibuat agar data tidak keliru.');
          }
          const canonical: PosterOptions = {
            ...company,
            uid: String(d1.company_id),
            companyId: String(d1.company_id),
            company_id: String(d1.company_id),
            namaPT: String(d1.company_name || '').trim(),
            sektor: String(d1.sector || 'Kepatuhan & Integritas'),
            danaTersedia: d1Balance,
            rewardBalance: d1Balance
          };
          if (!canonical.namaPT) throw new Error('Nama perusahaan tidak ditemukan di database D1.');
          if (active) {
            setResolvedCompany(canonical);
            setLiveRewardBalance(d1Balance);
          }
        } else {
          throw new Error(result?.error || 'Akun ini tidak terhubung ke perusahaan yang terdaftar di database D1.');
        }
      } catch (err) {
        console.error('Gagal memverifikasi identitas tenant untuk QR:', err);
        if (active) setError(err instanceof Error ? err.message : 'Gagal memverifikasi perusahaan.');
      } finally {
        if (active) setIdentityReady(true);
      }
    })();
    return () => { active = false; };
  }, [isOpen, company.uid, company.company_id, company.namaPT]);

  useEffect(() => {
    if (!isOpen || !identityReady || !companyId) return;
    let active = true;
    const refreshBalance = async () => {
      try {
        const response = await fetch('/api/public/company?companyId=' + encodeURIComponent(companyId), { credentials: 'omit', cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        const balance = Number(data?.company?.deposit_balance);
        if (active && Number.isFinite(balance) && balance >= 0) setLiveRewardBalance(balance);
        if (active && data?.company?.company_name) {
          setResolvedCompany((prev) => ({ ...(prev || liveIdentity), namaPT: String(data.company.company_name), uid: String(data.company.company_id), company_id: String(data.company.company_id), companyId: String(data.company.company_id), danaTersedia: balance, rewardBalance: balance }));
        }
      } catch (err) { console.warn('Gagal menyegarkan saldo reward perusahaan:', err); }
    };
    void refreshBalance();
    const timer = window.setInterval(refreshBalance, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [isOpen, identityReady, companyId]);

  useEffect(() => {
    if (!isOpen) {
      setQrDataUrl('');
      setPreviewDataUrl('');
      setError('');
      setLoading(true);
      return;
    }

    if (!identityReady) { setLoading(true); return; }
    if (error) { setQrDataUrl(''); setPreviewDataUrl(''); setLoading(false); return; }
    let isMounted = true;
    async function preparePoster() {
      try {
        setLoading(true);
        if (!companyId) throw new Error('ID perusahaan tidak tersedia di database D1. QR Code tidak dapat dibuat.');
        const timeout = new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error('Pembuatan QR melewati batas waktu 15 detik. Tutup lalu buka kembali poster, atau tekan Coba Lagi.')), 15000);
        });
        const qrUrl = await Promise.race([generateQrCodeDataUrl(companyId, liveIdentity.customUrl), timeout]);
        if (!isMounted) return;
        setQrDataUrl(qrUrl);

        const canvas = await Promise.race([
          renderPosterToCanvas({ ...liveCompany, uid: companyId, lang: language }, qrUrl),
          timeout
        ]);
        if (!isMounted) return;
        setPreviewDataUrl(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('Gagal generate poster canvas:', err);
        if (isMounted) {
          setQrDataUrl('');
          setPreviewDataUrl('');
          setError(err instanceof Error ? err.message : 'Gagal membuat QR Code.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    preparePoster();

    return () => {
      isMounted = false;
    };
  }, [isOpen, identityReady, companyId, liveIdentity.customUrl, liveIdentity.namaPT, liveIdentity.danaTersedia, liveIdentity.rewardBalance, liveIdentity.sektor, liveRewardBalance, error, retryNonce]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!qrDataUrl || downloading) return;
    try {
      setDownloading(true);
      await downloadPoster({ ...liveCompany, uid: companyId, lang: language }, qrDataUrl || undefined);
    } catch (err) {
      console.error('Error downloading poster:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    if (!laporUrl) return;
    navigator.clipboard.writeText(laporUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Poster Whistleblowing Resmi
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  1080 x 1920 HD
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Untuk: <span className="text-white font-medium">{liveCompany.namaPT}</span> • Format Siap Cetak A3/A4
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 flex flex-col items-center justify-center bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 min-h-[460px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-sm font-medium text-slate-300">Menghasilkan QR Code & Render Canvas...</p>
                <p className="text-xs text-slate-500">Menyiapkan resolusi tinggi 1080x1920 tanpa bug</p>
              </div>
            ) : previewDataUrl ? (
              <div className="relative group max-h-[500px] flex items-center justify-center">
                <img src={previewDataUrl} alt={`Poster Whistleblowing ${liveCompany.namaPT}`} className="rounded-lg shadow-2xl max-h-[480px] w-auto border border-amber-500/40 object-contain" />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur px-3 py-1 rounded-full border border-slate-700 text-[11px] text-slate-300 font-medium opacity-90">
                  Preview Canvas 1080 × 1920
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-red-400">{error || 'Gagal memuat preview poster.'}</p>
              </div>
            )}
          </div>

          <div className="md:col-span-6 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Nama Perusahaan Tenant</span>
                  <span className="font-semibold text-white">{liveCompany.namaPT}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Total Reward Tersedia</span>
                  <span className="font-mono font-bold text-emerald-400">Rp {Number(liveCompany.danaTersedia ?? liveCompany.rewardBalance ?? 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>QR Resolusi</span>
                  <span className="text-amber-400 font-mono">500px High-ECC</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Status Mesin</span>
                  <span className={`flex items-center gap-1 font-semibold ${error ? 'text-red-400' : 'text-emerald-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {error ? 'QR ERROR' : loading ? 'MEMUAT QR' : qrDataUrl && previewDataUrl ? 'QR SIAP' : 'QR BELUM SIAP'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tautan Pelaporan Whistleblowing Publik (Didalam QR):</label>
                <div className="flex items-center gap-2">
                  <input type="text" readOnly value={laporUrl} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none" />
                  <button onClick={handleCopyLink} disabled={!laporUrl} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors disabled:opacity-50" title="Salin Tautan">
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copied && <p className="text-[11px] text-emerald-400 mt-1">Tautan berhasil disalin!</p>}
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-300"><ShieldCheck className="w-3.5 h-3.5" />Instruksi Penempelan Poster:</div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Cetak poster ini dengan ukuran A3 atau A4 dan tempelkan di area strategis seperti papan pengumuman kantor, kantin, loker karyawan, dan area pabrik untuk memenuhi regulasi kepatuhan.
                </p>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button id="btn-download-poster" disabled={loading || !qrDataUrl || downloading} onClick={handleDownload} className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                {downloading ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan Poster...</> : <><Download className="w-4 h-4" />Download Poster PNG (1080 × 1920)</>}
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
