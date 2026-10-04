import React, { useEffect, useState } from 'react';
import { X, Download, QrCode, CheckCircle2, Copy, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import { generateQrCodeDataUrl, renderPosterToCanvas, downloadPoster, PosterOptions } from '../utils/posterGenerator';

interface PosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: PosterOptions;
}

export const PosterModal: React.FC<PosterModalProps> = ({ isOpen, onClose, company }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://integritas360.web.app';
  const laporUrl = `${origin}/lapor/${company.uid}`;

  useEffect(() => {
    if (!isOpen) {
      setQrDataUrl('');
      setPreviewDataUrl('');
      setLoading(true);
      return;
    }

    let isMounted = true;
    async function preparePoster() {
      try {
        setLoading(true);
        // 1. Generate QR Code directly as base64 data URL
        const qrUrl = await generateQrCodeDataUrl(company.uid);
        if (!isMounted) return;
        setQrDataUrl(qrUrl);

        // 2. Render to canvas 1080x1920
        const canvas = await renderPosterToCanvas(company, qrUrl);
        if (!isMounted) return;
        setPreviewDataUrl(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('Gagal generate poster canvas:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    preparePoster();

    return () => {
      isMounted = false;
    };
  }, [isOpen, company.uid, company.namaPT, company.danaTersedia, company.sektor]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!qrDataUrl || downloading) return;
    try {
      setDownloading(true);
      await downloadPoster(company, qrDataUrl);
    } catch (err) {
      console.error('Error downloading poster:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(laporUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
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
                Untuk: <span className="text-white font-medium">{company.namaPT}</span> • Format Siap Cetak A3/A4
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Poster Live Preview */}
          <div className="md:col-span-6 flex flex-col items-center justify-center bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 min-h-[460px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-sm font-medium text-slate-300">Menghasilkan QR Code & Render Canvas...</p>
                <p className="text-xs text-slate-500">Menyiapkan resolusi tinggi 1080x1920 tanpa bug</p>
              </div>
            ) : previewDataUrl ? (
              <div className="relative group max-h-[500px] flex items-center justify-center">
                <img
                  src={previewDataUrl}
                  alt={`Poster Whistleblowing ${company.namaPT}`}
                  className="rounded-lg shadow-2xl max-h-[480px] w-auto border border-amber-500/40 object-contain"
                />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur px-3 py-1 rounded-full border border-slate-700 text-[11px] text-slate-300 font-medium opacity-90">
                  Preview Canvas 1080 × 1920
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-400">Gagal memuat preview poster.</p>
            )}
          </div>

          {/* Right: Controls & Details */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Target Perusahaan</span>
                  <span className="font-semibold text-white">{company.namaPT}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Total Reward Tersedia</span>
                  <span className="font-mono font-bold text-emerald-400">
                    Rp {Number(company.danaTersedia || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>QR Resolusi</span>
                  <span className="text-amber-400 font-mono">500px High-ECC Base64</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Status Mesin</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Fixed Bug QR Ready
                  </span>
                </div>
              </div>

              {/* URL Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tautan Pelaporan Whistleblowing Publik (Didalam QR):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={laporUrl}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
                    title="Salin Tautan"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copied && <p className="text-[11px] text-emerald-400 mt-1">Tautan berhasil disalin!</p>}
              </div>

              {/* Tips */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Instruksi Penempelan Poster:
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Cetak poster ini dengan ukuran A3 atau A4 dan tempelkan di area strategis seperti papan pengumuman
                  kantor, kantin, loker karyawan, dan area pabrik untuk memenuhi regulasi kepatuhan.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                id="btn-download-poster"
                disabled={loading || !qrDataUrl || downloading}
                onClick={handleDownload}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan Poster...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Poster PNG (1080 × 1920)
                  </>
                )}
              </button>

              <a
                href={`/lapor/${company.uid}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Uji Buka Form Pelaporan Whistleblower
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
