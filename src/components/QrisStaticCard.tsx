import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, ShieldCheck } from 'lucide-react';

export const QRIS_PAYLOAD = "00020101021126690016ID.CO.QRIS.WWW01189360091410265395160330215ID10265395160330303UMI51440015ID.OR.GPN.WWW01189360091410265395160330215ID10265395160330303UMI5204541153033605802ID5913INTEGRITAS3606007JAKARTA61051011062110103A010708936009146304588C";
export const NMID_CODE = "ID1026539516033";

interface QrisStaticCardProps {
  nominal?: number;
  className?: string;
  showDownload?: boolean;
}

export const QrisStaticCard: React.FC<QrisStaticCardProps> = ({
  nominal,
  className = '',
  showDownload = true
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    QRCode.toDataURL(
      QRIS_PAYLOAD,
      {
        width: 480,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      },
      (err, url) => {
        if (!err && url) {
          setQrUrl(url);
        }
      }
    );
  }, []);

  const handleCopyNmid = () => {
    navigator.clipboard.writeText(NMID_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `QRIS-STATIS-INTEGRITAS360-${NMID_CODE}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Official QRIS Card Container */}
      <div className="relative w-full max-w-[340px] bg-white rounded-3xl p-5 shadow-2xl border-4 border-cyan-400 overflow-hidden text-slate-900 selection:bg-rose-500 selection:text-white">
        {/* Red Decorative Geometry */}
        <div className="absolute top-0 left-0 w-16 h-16 bg-red-600 -translate-x-8 -translate-y-8 rotate-45 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-14 h-14 bg-red-600 translate-x-7 translate-y-7 rotate-45 pointer-events-none" />

        {/* Header: QRIS & GPN Logos */}
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3 mb-3">
          {/* QRIS Logo */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-0.5">
                <span className="text-xl font-black tracking-tight text-slate-900 leading-none">QRIS</span>
              </div>
              <span className="text-[7.5px] font-bold text-slate-600 leading-tight">
                QR Code Standar<br />Pembayaran Nasional
              </span>
            </div>
          </div>

          {/* GPN Logo */}
          <div className="flex items-center gap-1">
            <div className="flex flex-col items-end">
              <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="text-[10px] font-black tracking-widest text-slate-900 leading-none">GPN</span>
            </div>
          </div>
        </div>

        {/* Merchant Branding */}
        <div className="text-center space-y-0.5 my-2">
          <h2 className="text-lg font-black tracking-wider text-slate-950 font-mono">
            INTEGRITAS360
          </h2>
          <p className="text-[11px] font-bold text-slate-700 tracking-wide font-mono">
            NMID: {NMID_CODE}
          </p>
          <p className="text-[10px] font-semibold text-slate-500">
            A01
          </p>
        </div>

        {/* QR Code Container */}
        <div className="relative my-3 p-2 bg-white rounded-xl border border-slate-300 shadow-inner flex items-center justify-center">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="QRIS Statis INTEGRITAS360"
              className="w-56 h-56 object-contain rounded-lg"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
              Memuat QRIS Statis...
            </div>
          )}
        </div>

        {/* Nominal Info (If specific amount selected) */}
        {nominal && nominal > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl py-1.5 px-3 text-center mb-2">
            <p className="text-[10px] text-amber-800 uppercase font-semibold">Nominal Deposit Diajukan</p>
            <p className="text-sm font-black font-mono text-slate-950">
              Rp {nominal.toLocaleString('id-ID')}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-600 font-medium">
          <span>Dicetak oleh: <strong>93600914</strong></span>
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            <ShieldCheck className="w-3 h-3" />
            Resmi Terverifikasi
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      {showDownload && (
        <div className="flex items-center justify-center gap-2 mt-3 w-full max-w-[340px]">
          <button
            type="button"
            onClick={handleCopyNmid}
            className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copied ? 'NMID Disalin!' : 'Salin NMID'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh QRIS</span>
          </button>
        </div>
      )}
    </div>
  );
};
