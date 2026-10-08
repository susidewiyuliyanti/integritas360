import QRCode from 'qrcode';

export interface PosterOptions {
  uid: string;
  namaPT: string;
  danaTersedia: number;
  sektor?: string;
  customUrl?: string;
}

export function resolveCompanyId(options: Partial<PosterOptions> & Record<string, any>): string {
  return String(options.uid ?? options.companyId ?? options.company_id ?? options.perusahaanId ?? options.id ?? '').trim();
}

export function resolvePublicReportUrl(companyId: string, customUrl?: string): string {
  const id = String(companyId || '').trim();
  if (!id) throw new Error('ID perusahaan tidak tersedia untuk QR Code.');
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://integritas360.pages.dev';
  return customUrl || origin + '/lapor/' + encodeURIComponent(id);
}

export async function generateQrCodeDataUrl(uid: string, customUrl?: string): Promise<string> {
  const url = resolvePublicReportUrl(uid, customUrl);
  return QRCode.toDataURL(url, { width: 500, margin: 2, color: { dark: '#0f172a', light: '#ffffff' }, errorCorrectionLevel: 'H' });
}

export async function renderPosterToCanvas(options: PosterOptions, qrDataUrl?: string): Promise<HTMLCanvasElement> {
  const companyId = resolveCompanyId(options);
  if (!companyId) throw new Error('ID perusahaan tidak tersedia. QR Code tidak dapat dibuat.');
  const { namaPT, danaTersedia, sektor } = options;
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = '#fbbf24'; ctx.fillRect(20, 20, 1040, 1880);
  ctx.fillStyle = '#0f172a'; ctx.fillRect(30, 30, 1020, 1860);
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)'; ctx.lineWidth = 2; ctx.strokeRect(45, 45, 990, 1830);

  const drawCorner = (x: number, y: number, angle: number) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate((angle * Math.PI) / 180);
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(0, 0, 35, 6); ctx.fillRect(0, 0, 6, 35); ctx.restore();
  };
  drawCorner(55, 55, 0); drawCorner(1025, 55, 90); drawCorner(1025, 1865, 180); drawCorner(55, 1865, 270);

  ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(340, 100, 400, 50, 25); ctx.fill();
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('PORTAL RESMI INTEGRITAS360', 540, 132);

  ctx.fillStyle = '#ffffff'; ctx.font = '900 68px "Plus Jakarta Sans", sans-serif'; ctx.fillText('INTEGRITAS360', 540, 230);
  ctx.fillStyle = '#fbbf24'; ctx.font = '600 32px "Plus Jakarta Sans", sans-serif'; ctx.fillText('PLATFORM PELAPORAN PELANGGARAN', 540, 280);

  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(340, 320); ctx.lineTo(740, 320); ctx.stroke();

  ctx.fillStyle = '#94a3b8'; ctx.font = '500 24px "Plus Jakarta Sans", sans-serif'; ctx.fillText('SISTEM PELAPORAN KHUSUS UNTUK:', 540, 390);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 50px "Plus Jakarta Sans", sans-serif';
  const displayPT = namaPT.length > 30 ? namaPT.substring(0, 28) + '...' : namaPT;
  ctx.fillText(displayPT, 540, 460);
  if (sektor) { ctx.fillStyle = '#38bdf8'; ctx.font = '600 24px "Plus Jakarta Sans", sans-serif'; ctx.fillText(`Sektor: ${sektor}`, 540, 505); }

  ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(140, 560, 800, 160, 20); ctx.fill();
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif'; ctx.fillText('TOTAL REWARD TERSEDIA', 540, 610);
  const formattedDana = `Rp ${Number(danaTersedia || 0).toLocaleString('id-ID')}`;
  ctx.fillStyle = '#4ade80'; ctx.font = 'bold 54px "Plus Jakarta Sans", monospace'; ctx.fillText(formattedDana, 540, 680);

  ctx.fillStyle = '#fef08a'; ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif'; ctx.fillText('LIHAT PELANGGARAN? JANGAN DIAM!', 540, 780);
  ctx.fillStyle = '#cbd5e1'; ctx.font = '400 24px "Plus Jakarta Sans", sans-serif'; ctx.fillText('Laporkan penyalahgunaan aset atau pelanggaran etika secara anonim.', 540, 825);

  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(310, 870, 460, 460, 24); ctx.fill();
  const qrCanvas = document.createElement('canvas');
  const qrUrl = resolvePublicReportUrl(companyId, options.customUrl);
  await QRCode.toCanvas(qrCanvas, qrUrl, { width: 400, margin: 2, color: { dark: '#0f172a', light: '#ffffff' }, errorCorrectionLevel: 'H' });
  ctx.drawImage(qrCanvas, 340, 900, 400, 400);

  ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif'; ctx.fillText('SCAN QR CODE DI ATAS', 540, 1380);
  ctx.fillStyle = '#ffffff'; ctx.font = '500 22px "Plus Jakarta Sans", sans-serif'; ctx.fillText('atau akses langsung portal laporan:', 540, 1420);
  ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 22px "Plus Jakarta Sans", monospace'; ctx.fillText(resolvePublicReportUrl(companyId), 540, 1455);

  const guarantees = [
    { title: '100% ANONIM', sub: 'Tanpa menampilkan identitas pelapor' },
    { title: 'LANGSUNG KE PERUSAHAAN', sub: 'Ditinjau melalui dashboard perusahaan' },
    { title: 'REWARD PELAPOR', sub: 'Dibayarkan sesuai ketentuan kasus' },
  ];
  guarantees.forEach((g, idx) => {
    const yPos = 1530 + idx * 85;
    ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(140, yPos, 800, 70, 14); ctx.fill();
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif'; ctx.textAlign = 'left'; ctx.fillText(`✓  ${g.title}`, 170, yPos + 43);
    ctx.fillStyle = '#94a3b8'; ctx.font = '400 20px "Plus Jakarta Sans", sans-serif'; ctx.textAlign = 'right'; ctx.fillText(g.sub, 910, yPos + 43);
  });

  ctx.textAlign = 'center'; ctx.fillStyle = '#64748b'; ctx.font = '400 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Dokumen informasi pelaporan perusahaan • Kerahasiaan pelapor dijaga', 540, 1820);
  return canvas;
}

export async function downloadPoster(options: PosterOptions, qrDataUrl?: string): Promise<void> {
  const canvas = await renderPosterToCanvas(options, qrDataUrl);
  const dataUrl = canvas.toDataURL('image/png');
  const safeName = (options.namaPT || 'PERUSAHAAN').replace(/[^a-zA-Z0-9]/g, '_');
  const link = document.createElement('a');
  link.download = `POSTER_INTEGRITAS360_${safeName}.png`;
  link.href = dataUrl;
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
}
