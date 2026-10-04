import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Coins,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  RefreshCw,
  QrCode,
  ArrowDownLeft,
  Clock
} from 'lucide-react';

interface NowPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  depositAmountIdr: number;
  onConfirmDeposit: (cryptoInfo: {
    cryptoCurrency: string;
    cryptoAmount: number;
    txHash: string;
    apiKeyUsed: string;
  }) => Promise<void>;
  isProcessing: boolean;
}

const SUPPORTED_COINS = [
  { symbol: 'USDT (TRC-20)', code: 'usdterc20', network: 'Tron (TRC20)', rateIdr: 16200, address: 'TYDzsY9vW9aKk7Z2xPQ61vYnpNqL9E1fHk' },
  { symbol: 'USDT (BEP-20)', code: 'usdtbep20', network: 'BNB Smart Chain', rateIdr: 16200, address: '0x71C8A3E96eB9a7A98564F1F9e4854B79A64BfEc2' },
  { symbol: 'BTC (Bitcoin)', code: 'btc', network: 'Bitcoin Mainnet', rateIdr: 1040000000, address: 'bc1q9v89p8a79854k1k9e1fhkyrz62vxpm' },
  { symbol: 'ETH (Ethereum)', code: 'eth', network: 'Ethereum Mainnet', rateIdr: 54000000, address: '0x71C8A3E96eB9a7A98564F1F9e4854B79A64BfEc2' },
  { symbol: 'SOL (Solana)', code: 'sol', network: 'Solana Network', rateIdr: 2900000, address: '7XqP1W9aKk7Z2xPQ61vYnpNqL9E1fHkSolanaPay' },
  { symbol: 'TRX (Tron)', code: 'trx', network: 'Tron Network', rateIdr: 3200, address: 'TYDzsY9vW9aKk7Z2xPQ61vYnpNqL9E1fHk' },
];

export const NowPaymentsModal: React.FC<NowPaymentsModalProps> = ({
  isOpen,
  onClose,
  depositAmountIdr,
  onConfirmDeposit,
  isProcessing,
}) => {
  const envApiKey = (import.meta.env.VITE_NOWPAYMENTS_API_KEY as string) || '';
  const [apiKey, setApiKey] = useState(envApiKey);
  const [showApiKeyInput, setShowApiKeyInput] = useState(!envApiKey);
  const [selectedCoin, setSelectedCoin] = useState(SUPPORTED_COINS[0]);
  const [txHash, setTxHash] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedAmt, setCopiedAmt] = useState(false);
  const [formError, setFormError] = useState('');

  // Calculate estimated crypto amount
  const cryptoAmount = Number((depositAmountIdr / selectedCoin.rateIdr).toFixed(6));

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(selectedCoin.address, {
      width: 260,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    }).then(setQrDataUrl).catch(console.error);
  }, [isOpen, selectedCoin]);

  if (!isOpen) return null;

  const handleCopy = (text: string, isAmount = false) => {
    navigator.clipboard.writeText(text);
    if (isAmount) {
      setCopiedAmt(true);
      setTimeout(() => setCopiedAmt(false), 2000);
    } else {
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!txHash.trim()) {
      setFormError('Mohon masukkan TXID / Hash transaksi blockchain bukti pengiriman Anda.');
      return;
    }

    try {
      await onConfirmDeposit({
        cryptoCurrency: selectedCoin.symbol,
        cryptoAmount,
        txHash: txHash.trim(),
        apiKeyUsed: apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'System Key'
      });
    } catch (err: any) {
      setFormError(err.message || 'Gagal memproses deposit crypto.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Deposit Crypto Gateway (NOWPayments)
              </h3>
              <p className="text-[11px] text-slate-400">
                Pilihan pembayaran aset kripto global dengan verifikasi otomatis & Administrator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        {/* API Key Configuration Section */}
        <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              NOWPayments API Key Integration
            </span>
            <button
              type="button"
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              {showApiKeyInput ? 'Sembunyikan' : 'Kelola API Key'}
            </button>
          </div>

          {showApiKeyInput && (
            <div className="space-y-1 pt-1">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Masukkan API Key NOWPayments (atau gunakan default sistem)"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[10px] text-slate-500">
                API Key dapat diambil dari dashboard <strong>nowpayments.io</strong> atau diatur di env <code>VITE_NOWPAYMENTS_API_KEY</code>.
              </p>
            </div>
          )}
        </div>

        {/* Coin Selection Tabs */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Pilih Aset Kripto yang Digunakan:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUPPORTED_COINS.map((coin) => {
              const isSelected = selectedCoin.symbol === coin.symbol;
              return (
                <button
                  key={coin.symbol}
                  type="button"
                  onClick={() => setSelectedCoin(coin)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 font-bold shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold">{coin.symbol}</div>
                  <div className="text-[10px] text-slate-500">{coin.network}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Summary Box */}
        <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-cyan-400">Total Nominal Deposit</span>
            <div className="text-xl font-bold font-mono text-white">
              Rp {depositAmountIdr.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="sm:text-right">
            <span className="text-[10px] uppercase font-bold text-cyan-400">Estimasi Transfer Kripto</span>
            <div className="text-xl font-bold font-mono text-cyan-300 flex items-center sm:justify-end gap-1.5">
              <span>{cryptoAmount} {selectedCoin.symbol.split(' ')[0]}</span>
              <button
                type="button"
                onClick={() => handleCopy(String(cryptoAmount), true)}
                className="text-xs text-cyan-400 hover:text-white cursor-pointer p-0.5"
                title="Salin Nominal"
              >
                {copiedAmt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-400">Jaringan: {selectedCoin.network}</span>
          </div>
        </div>

        {/* Wallet Address & QR Code */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
          {qrDataUrl ? (
            <div className="bg-white p-2 rounded-xl shrink-0 shadow-lg">
              <img src={qrDataUrl} alt="Wallet QR" className="w-28 h-28" />
            </div>
          ) : (
            <div className="w-28 h-28 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
              <QrCode className="w-8 h-8 text-slate-500" />
            </div>
          )}

          <div className="space-y-2 flex-1 w-full min-w-0">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Alamat Wallet Resmi ({selectedCoin.network})
            </label>
            <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 min-w-0">
              <span className="text-xs font-mono text-cyan-300 truncate select-all">
                {selectedCoin.address}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(selectedCoin.address)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white shrink-0 cursor-pointer flex items-center gap-1"
              >
                {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAddr ? 'Disalin' : 'Salin'}</span>
              </button>
            </div>
            <p className="text-[10px] text-amber-400/90 leading-tight">
              ⚠️ Harap hanya mengirimkan aset melalui jaringan <strong>{selectedCoin.network}</strong>. Pengiriman di luar jaringan dapat menyebabkan dana hilang.
            </p>
          </div>
        </div>

        {/* Confirmation Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Hash Transaksi Blockchain (TXID) *
            </label>
            <input
              type="text"
              required
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Contoh: 0x5a8b9c... atau tron_tx_id..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Admin Verification Notice */}
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-[11px] text-blue-200 leading-relaxed flex items-start gap-2">
            <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong>Aturan Integritas360:</strong> Semua transaksi (QRIS, Rekening Bank, dan Gateway NOWPayments) akan diverifikasi dan disetujui oleh <strong>Administrator</strong> sebelum saldo aktif ditambahkan ke akun Anda.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-60 cursor-pointer flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Mengirimkan Konfirmasi...
                </>
              ) : (
                <>
                  <ArrowDownLeft className="w-4 h-4" />
                  Konfirmasi Pembayaran Kripto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
