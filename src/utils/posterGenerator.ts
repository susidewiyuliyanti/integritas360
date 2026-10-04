import QRCode from 'qrcode';

export interface PosterOptions {
  uid: string;
  namaPT: string;
  danaTersedia: number;
  sektor?: string;
  customUrl?: string;
}

export async function generateQrCodeDataUrl(uid: string, customUrl?: string): Promise<string> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://integritas360.web.app';
  const url = customUrl || `${origin}/lapor/${uid}`;
  return QRCode.toDataURL(url, {
    width: 500,
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}

export async function renderPosterToCanvas(
  options: PosterOptions,
  qrDataUrl: string
): Promise<HTMLCanvasElement> {
  const { namaPT, danaTersedia, sektor } = options;

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context');
  }

  // 1. Base dark background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1080, 1920);

  // 2. Gold border (outer)
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(20, 20, 1040, 1880);

  // 3. Inner dark layer
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(30, 30, 1020, 1860);

  // Decorative inner thin gold hairline
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(45, 45, 990, 1830);

  // Corner accents
  const drawCorner = (x: number, y: number, angle: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(0, 0, 35, 6);
    ctx.fillRect(0, 0, 6, 35);
    ctx.restore();
  };
  drawCorner(55, 55, 0);
  drawCorner(1025, 55, 90);
  drawCorner(1025, 1865, 180);
  drawCorner(55, 1865, 270);

  // 4. Header Badge
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(340, 100, 400, 50, 25);
  ctx.fill();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PORTAL RESMI INTEGRITAS NASIONAL', 540, 132);

  // 5. App Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 68px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('INTEGRITAS360', 540, 230);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '600 32px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('INDEPENDENT WHISTLEBLOWING SYSTEM', 540, 280);

  // Gold divider
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(340, 320);
  ctx.lineTo(740, 320);
  ctx.stroke();

  // Company Name Section
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('SISTEM PELAPORAN KHUSUS UNTUK:', 540, 390);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 50px "Plus Jakarta Sans", sans-serif';
  // truncate or wrap if too long
  const displayPT = namaPT.length > 30 ? namaPT.substring(0, 28) + '...' : namaPT;
  ctx.fillText(displayPT, 540, 460);

  if (sektor) {
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Sektor: ${sektor}`, 540, 505);
  }

  // Total Reward Tersedia Box
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(140, 560, 800, 160, 20);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('TOTAL REWARD TERSEDIA', 540, 610);

  const formattedDana = `Rp ${Number(danaTersedia || 0).toLocaleString('id-ID')}`;
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 54px "Plus Jakarta Sans", monospace';
  ctx.fillText(formattedDana, 540, 680);

  // Action Banner
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('LIHAT KECURANGAN? JANGAN DIAM!', 540, 780);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '400 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Laporkan korupsi, fraud, gratifikasi, atau pelanggaran etika secara anonim.', 540, 825);

  // 6. QR Code Card (Clean white backing for perfect scanability)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(310, 870, 460, 460, 24);
  ctx.fill();

  // Load and draw QR code
  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // ctx.drawImage(img, 340, 900, 400, 400) as specified in prompt
      ctx.drawImage(img, 340, 900, 400, 400);
      resolve();
    };
    img.onerror = (e) => reject(e);
    img.src = qrDataUrl;
  });

  // Instruction Below QR
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('SCAN QR CODE DI ATAS', 540, 1380);

  ctx.fillStyle = '#ffffff';
  ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('atau akses langsung portal laporan independen:', 540, 1420);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 22px "Plus Jakarta Sans", monospace';
  ctx.fillText(`https://integritas360-70e41.web.app/lapor/${options.uid}`, 540, 1455);

  // 3 Guarantees Badges
  const guarantees = [
    { title: '100% ANONIM', sub: 'Tanpa rekam identitas & IP' },
    { title: 'AUDITOR INDEPENDEN', sub: 'Ditinjau pihak netral berlisensi' },
    { title: 'PERLINDUNGAN HUKUM', sub: 'Kerahasiaan pelapor dijamin' },
  ];

  guarantees.forEach((g, idx) => {
    const yPos = 1530 + idx * 85;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(140, yPos, 800, 70, 14);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`✓  ${g.title}`, 170, yPos + 43);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(g.sub, 910, yPos + 43);
  });

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '400 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Dokumen Resmi Kepatuhan Perusahaan • Dilindungi Undang-Undang Ketenagakerjaan & Perlindungan Saksi', 540, 1820);

  return canvas;
}

export async function downloadPoster(options: PosterOptions, qrDataUrl: string): Promise<void> {
  const canvas = await renderPosterToCanvas(options, qrDataUrl);
  const dataUrl = canvas.toDataURL('image/png');
  const safeName = (options.namaPT || 'PERUSAHAAN').replace(/[^a-zA-Z0-9]/g, '_');
  const link = document.createElement('a');
  link.download = `POSTER_WHISTLEBLOWING_${safeName}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
