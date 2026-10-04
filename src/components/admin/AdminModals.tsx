import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Coins,
  Building2,
  Eye,
  EyeOff,
  Key,
  Copy,
  Mail,
  FileText,
  AlertTriangle,
  Trash2,
  X,
  Check,
  Save,
  Plus,
  PlusCircle,
  Phone,
  CreditCard,
  ShieldCheck,
  ExternalLink,
  QrCode,
  Sliders,
  DollarSign,
  MessageCircle,
  CheckCircle2,
  Clock,
  Info,
  UserCheck,
  Users,
  KeyRound
} from 'lucide-react';
import { UserProfile, WhistleblowingReport, Company, CompanyUser, CompanyStatus } from '../../types';

export const getAppUrl = () => (typeof window !== 'undefined' ? window.location.origin : '');

// ==========================================
// 1. LOCK / UNLOCK MODAL
// ==========================================
interface LockModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: UserProfile | null;
  initialAction: 'lock' | 'unlock';
  onConfirm: (entityId: string, action: 'lock' | 'unlock', amount: number, reason: string) => Promise<void>;
}

export const LockModal: React.FC<LockModalProps> = ({
  isOpen,
  onClose,
  entity,
  initialAction,
  onConfirm
}) => {
  const [action, setAction] = useState<'lock' | 'unlock'>(initialAction);
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAction(initialAction);
    if (entity) {
      if (initialAction === 'lock') {
        setAmount(entity.danaTersedia || 5000000);
        setReason('Penguncian saldo oleh Administrator untuk penjaminan investigasi whistleblowing.');
      } else {
        setAmount(entity.danaTerkunci || 0);
        setReason('Pembukaan kunci saldo perusahaan telah disetujui Administrator.');
      }
    }
  }, [initialAction, entity]);

  if (!isOpen || !entity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    try {
      setLoading(true);
      await onConfirm(entity.uid, action, amount, reason.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            {action === 'lock' ? (
              <Lock className="w-5 h-5 text-red-400" />
            ) : (
              <Unlock className="w-5 h-5 text-emerald-400" />
            )}
            {action === 'lock' ? 'Kunci Saldo Perusahaan (LOCK)' : 'Buka Kunci Saldo (UNLOCK)'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
          <div className="text-slate-400">Entitas Perusahaan:</div>
          <div className="text-sm font-bold text-white">{entity.namaPT}</div>
          <div className="flex justify-between pt-1 font-mono text-[11px]">
            <span className="text-slate-400">
              Saldo Terbuka: <strong className="text-emerald-400">Rp {Number(entity.danaTersedia || 0).toLocaleString('id-ID')}</strong>
            </span>
            <span className="text-slate-400">
              Saldo Terkunci: <strong className="text-red-400">Rp {Number(entity.danaTerkunci || 0).toLocaleString('id-ID')}</strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Pilihan Aksi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAction('lock')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  action === 'lock'
                    ? 'bg-red-500/20 border-red-500/50 text-red-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" /> Kunci Saldo (Lock)
              </button>
              <button
                type="button"
                onClick={() => setAction('unlock')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  action === 'unlock'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Unlock className="w-3.5 h-3.5" /> Buka Kunci (Unlock)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nominal Dana yang Di-{action === 'lock' ? 'kunci' : 'buka'} (Rp)
            </label>
            <input
              type="number"
              min={0}
              step={100000}
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Alasan Administrator (Tercatat di Riwayat Audit)
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              placeholder="Contoh: Penguncian saldo penjaminan saat audit investigasi dugaan pelanggaran..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                action === 'lock'
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {loading ? 'Memproses...' : action === 'lock' ? 'Konfirmasi Kunci Saldo' : 'Konfirmasi Buka Saldo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. KELOLA / EDIT SALDO PERUSAHAAN MODAL
// ==========================================
interface EditSaldoModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: UserProfile | null;
  onSave: (entityId: string, danaTersedia: number, saldo: number, danaTerkunci: number) => Promise<void>;
  onTopUp: (entityId: string, amount: number) => Promise<void>;
}

export const EditSaldoModal: React.FC<EditSaldoModalProps> = ({
  isOpen,
  onClose,
  entity,
  onSave,
  onTopUp
}) => {
  const [tab, setTab] = useState<'topup' | 'custom'>('topup');
  const [topUpAmount, setTopUpAmount] = useState<number>(10000000);
  const [danaTersedia, setDanaTersedia] = useState<number>(0);
  const [saldo, setSaldo] = useState<number>(0);
  const [danaTerkunci, setDanaTerkunci] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entity) {
      setDanaTersedia(Number(entity.danaTersedia || 0));
      setSaldo(Number(entity.saldo || 0));
      setDanaTerkunci(Number(entity.danaTerkunci || 0));
      setTopUpAmount(10000000);
    }
  }, [entity]);

  if (!isOpen || !entity) return null;

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topUpAmount <= 0) return;
    try {
      setLoading(true);
      await onTopUp(entity.uid, topUpAmount);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave(entity.uid, danaTersedia, saldo, danaTerkunci);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            Kelola Saldo Perusahaan
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <div className="font-bold text-white">{entity.namaPT}</div>
          <div className="text-slate-400 font-mono text-[11px]">{entity.email}</div>
        </div>

        {/* Tab switch: Top Up vs Custom Edit */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setTab('topup')}
            className={`py-1.5 rounded-lg font-bold cursor-pointer ${
              tab === 'topup' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            + Tambah Dana (Top Up)
          </button>
          <button
            type="button"
            onClick={() => setTab('custom')}
            className={`py-1.5 rounded-lg font-bold cursor-pointer ${
              tab === 'custom' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Koreksi Saldo Langsung
          </button>
        </div>

        {tab === 'topup' ? (
          <form onSubmit={handleTopUpSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nominal Penambahan Dana (Rupiah)
              </label>
              <input
                type="number"
                min={100000}
                step={100000}
                required
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[5000000, 10000000, 25000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopUpAmount(amt)}
                  className={`py-1 px-2 rounded-lg text-xs font-mono transition-colors border cursor-pointer ${
                    topUpAmount === amt
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  +{amt / 1000000} Jt
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {loading ? 'Menyimpan...' : 'Simpan Tambah Dana'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Saldo Terbuka / Tersedia (Rp)
              </label>
              <input
                type="number"
                min={0}
                required
                value={danaTersedia}
                onChange={(e) => setDanaTersedia(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Saldo Bebas Dompet (Rp)
              </label>
              <input
                type="number"
                min={0}
                required
                value={saldo}
                onChange={(e) => setSaldo(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Saldo Terkunci / Locked (Rp)
              </label>
              <input
                type="number"
                min={0}
                required
                value={danaTerkunci}
                onChange={(e) => setDanaTerkunci(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-red-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {loading ? 'Menyimpan...' : 'Perbarui Nilai Saldo'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 3. KELOLA / EDIT SALDO AUDITOR MODAL
// ==========================================
interface EditAuditorSaldoModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditor: UserProfile | null;
  onSave: (auditorId: string, saldoBaru: number) => Promise<void>;
  onTopUpFee: (auditorId: string, feeAmount: number) => Promise<void>;
}

export const EditAuditorSaldoModal: React.FC<EditAuditorSaldoModalProps> = ({
  isOpen,
  onClose,
  auditor,
  onSave,
  onTopUpFee
}) => {
  const [feeAmount, setFeeAmount] = useState<number>(2500000);
  const [saldoBaru, setSaldoBaru] = useState<number>(0);
  const [mode, setMode] = useState<'tambah' | 'koreksi'>('tambah');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auditor) {
      setSaldoBaru(Number(auditor.saldo || 0));
      setFeeAmount(2500000);
    }
  }, [auditor]);

  if (!isOpen || !auditor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (mode === 'tambah') {
        await onTopUpFee(auditor.uid, feeAmount);
      } else {
        await onSave(auditor.uid, saldoBaru);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-blue-400" />
            Atur Saldo Honorarium Auditor
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <div className="font-bold text-white">{auditor.namaPT}</div>
          <div className="text-slate-400 font-mono text-[11px]">{auditor.email}</div>
          <div className="text-slate-400 pt-1">
            Saldo Saat Ini:{' '}
            <span className="font-mono text-blue-400 font-bold">
              Rp {Number(auditor.saldo || 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setMode('tambah')}
            className={`py-1.5 rounded-lg font-bold cursor-pointer ${
              mode === 'tambah' ? 'bg-blue-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            + Tambah Fee Audit
          </button>
          <button
            type="button"
            onClick={() => setMode('koreksi')}
            className={`py-1.5 rounded-lg font-bold cursor-pointer ${
              mode === 'koreksi' ? 'bg-blue-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Koreksi Saldo Manual
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'tambah' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nominal Tambah Fee Audit (Rp)
              </label>
              <input
                type="number"
                min={100000}
                step={100000}
                required
                value={feeAmount}
                onChange={(e) => setFeeAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-base font-mono font-bold text-blue-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Saldo Honorarium Baru (Rp)
              </label>
              <input
                type="number"
                min={0}
                required
                value={saldoBaru}
                onChange={(e) => setSaldoBaru(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-base font-mono font-bold text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              {loading ? 'Menyimpan...' : 'Simpan Saldo Auditor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 4. EDIT PROFIL ENTITAS MODAL (PT / AUDITOR)
// ==========================================
interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: UserProfile | null;
  onSave: (entityId: string, updatedData: Partial<UserProfile>) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  entity,
  onSave
}) => {
  const [namaPT, setNamaPT] = useState('');
  const [email, setEmail] = useState('');
  const [kataSandiAwal, setKataSandiAwal] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sektor, setSektor] = useState('');
  const [alamat, setAlamat] = useState('');
  const [telepon, setTelepon] = useState('');
  const [npwp, setNpwp] = useState('');
  const [picName, setPicName] = useState('');
  const [namaBank, setNamaBank] = useState('');
  const [nomorRekening, setNomorRekening] = useState('');
  const [pemilikRekening, setPemilikRekening] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entity) {
      setNamaPT(entity.namaPT || '');
      setEmail(entity.email || '');
      setKataSandiAwal(entity.kataSandiAwal || entity.password || '');
      setSektor(entity.sektor || '');
      setAlamat(entity.alamat || '');
      setTelepon(entity.telepon || '');
      setNpwp(entity.npwp || '');
      setPicName(entity.picName || '');
      setNamaBank(entity.namaBank || entity.rekeningBank?.bankName || '');
      setNomorRekening(entity.nomorRekening || entity.rekeningBank?.accountNumber || '');
      setPemilikRekening(entity.pemilikRekening || entity.rekeningBank?.holderName || '');
    }
  }, [entity]);

  if (!isOpen || !entity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave(entity.uid, {
        namaPT,
        email: email.trim(),
        kataSandiAwal: kataSandiAwal.trim(),
        password: kataSandiAwal.trim(),
        sektor,
        alamat,
        telepon,
        npwp,
        picName,
        namaBank,
        nomorRekening,
        pemilikRekening,
        rekeningBank: {
          bankName: namaBank,
          accountNumber: nomorRekening,
          holderName: pemilikRekening
        }
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            Edit Data Entitas ({entity.role === 'perusahaan' ? 'Perusahaan' : 'Auditor'})
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              {entity.role === 'perusahaan' ? 'Nama Perusahaan (PT)' : 'Nama Auditor / Lembaga'}
            </label>
            <input
              type="text"
              required
              value={namaPT}
              onChange={(e) => setNamaPT(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Kredensial Akses Log In (Khusus Perusahaan) */}
          {entity.role === 'perusahaan' && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-amber-500/20 space-y-2">
              <span className="font-bold text-amber-400 block text-xs flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> Kredensial Log In Akun Perusahaan
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Email untuk Log In
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email.login@perusahaan.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Kata Sandi Awal / Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={kataSandiAwal}
                      onChange={(e) => setKataSandiAwal(e.target.value)}
                      placeholder="Contoh: Perusahaan@2025"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-2.5 pr-8 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                {entity.role === 'perusahaan' ? 'Sektor Industri' : 'Spesialisasi Audit'}
              </label>
              <input
                type="text"
                value={sektor}
                onChange={(e) => setSektor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Telepon / WhatsApp</label>
              <input
                type="text"
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">PIC / Petugas Resmi</label>
              <input
                type="text"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">NPWP / NIB / Sertifikasi</label>
              <input
                type="text"
                value={npwp}
                onChange={(e) => setNpwp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Alamat Resmi</label>
            <input
              type="text"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-800">
            <span className="font-bold text-slate-300 block mb-2">Informasi Rekening Bank:</span>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Bank (BCA/Mandiri)"
                value={namaBank}
                onChange={(e) => setNamaBank(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
              />
              <input
                type="text"
                placeholder="No Rekening"
                value={nomorRekening}
                onChange={(e) => setNomorRekening(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-mono"
              />
              <input
                type="text"
                placeholder="Atas Nama"
                value={pemilikRekening}
                onChange={(e) => setPemilikRekening(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 5. EDIT LAPORAN WHISTLEBLOWING MODAL
// ==========================================
interface EditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: WhistleblowingReport | null;
  auditorList: UserProfile[];
  onSave: (reportId: string, updatedData: Partial<WhistleblowingReport>) => Promise<void>;
}

export const EditReportModal: React.FC<EditReportModalProps> = ({
  isOpen,
  onClose,
  report,
  auditorList,
  onSave
}) => {
  const [status, setStatus] = useState<WhistleblowingReport['status']>('baru');
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [estimasiKerugian, setEstimasiKerugian] = useState<number>(0);
  const [selectedAuditorId, setSelectedAuditorId] = useState<string>('');
  const [catatanAuditor, setCatatanAuditor] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (report) {
      setStatus(report.status || 'baru');
      setRewardAmount(report.rewardAmount || report.rewardMinAmount || 0);
      setEstimasiKerugian(report.estimasiKerugian || 0);
      setSelectedAuditorId(report.targetAuditorId || report.auditorId || '');
      setCatatanAuditor(report.catatanAuditor || '');
    }
  }, [report]);

  if (!isOpen || !report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const matchedAuditor = auditorList.find((a) => a.uid === selectedAuditorId);

      await onSave(report.id!, {
        status,
        rewardAmount,
        estimasiKerugian,
        targetAuditorId: selectedAuditorId,
        targetAuditorName: matchedAuditor?.namaPT || report.targetAuditorName || '',
        catatanAuditor: catatanAuditor.trim()
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            Kelola Laporan #{report.tokenAkses}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
          <div className="font-bold text-white text-sm">{report.judul}</div>
          <div className="text-slate-400">
            Perusahaan: <strong className="text-slate-200">{report.companyName}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Status Investigasi Laporan</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="baru">Laporan Baru (Menunggu Penelaahan)</option>
              <option value="investigasi">Sedang Investigasi Menyeluruh</option>
              <option value="proses">Dalam Proses Penyelidikan</option>
              <option value="valid">✅ Valid Terverifikasi</option>
              <option value="terbukti">🎉 Terbukti Sah & Reward Dirilis</option>
              <option value="selesai">Selesai (Kasus Ditutup)</option>
              <option value="palsu_hoax">❌ Laporan Palsu / Hoax (Tidak Terbukti)</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Estimasi Kerugian (Rp)</label>
              <input
                type="number"
                min={0}
                value={estimasiKerugian}
                onChange={(e) => setEstimasiKerugian(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Besaran Reward Pelapor (Rp)</label>
              <input
                type="number"
                min={0}
                value={rewardAmount}
                onChange={(e) => setRewardAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Tugaskan Auditor Independen</label>
            <select
              value={selectedAuditorId}
              onChange={(e) => setSelectedAuditorId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Pilih Auditor --</option>
              {auditorList.map((a) => (
                <option key={a.uid} value={a.uid}>
                  {a.namaPT} ({a.sektor || 'Investigator'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Catatan Evaluasi Administrator / Auditor</label>
            <textarea
              rows={3}
              value={catatanAuditor}
              onChange={(e) => setCatatanAuditor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              placeholder="Berikan catatan pertimbangan hukum atau hasil evaluasi bukti..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {loading ? 'Menyimpan...' : 'Perbarui Laporan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 6. CONFIRM DELETE MODAL
// ==========================================
interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: { type: 'user' | 'report' | 'transaksi'; id: string; name: string } | null;
  onConfirm: () => Promise<void>;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  target,
  onConfirm
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !target) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-red-400">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Konfirmasi Penghapusan</h3>
            <p className="text-xs text-red-400 font-semibold uppercase">{target.type}</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Apakah Anda yakin ingin menghapus data <strong className="text-white font-semibold">"{target.name}"</strong>?
          Tindakan ini permanen dan tidak dapat dibatalkan.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-500/20 cursor-pointer"
          >
            {loading ? 'Menghapus...' : 'Ya, Hapus Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 7. TAMBAH PERUSAHAAN BARU (ADD PERUSAHAAN)
// ==========================================
export interface NewCompanyData {
  namaPT: string;
  company_name?: string;
  company_code: string;
  email: string;
  company_email?: string;
  telepon: string;
  company_phone?: string;
  alamat: string;
  company_address?: string;
  picName: string;
  pic_name?: string;
  pic_position: string;
  picPosition?: string;
  pic_phone: string;
  picPhone?: string;
  pic_email: string;
  picEmail?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  sektor: string;
  npwp?: string;
  danaTersedia?: number;
  danaTerkunci?: number;
  saldo?: number;
  statusVerifikasiDokumen?: 'pending' | 'terverifikasi' | 'belum_upload';
  namaBank?: string;
  nomorRekening?: string;
  pemilikRekening?: string;
  kebijakanReward?: {
    rewardKasusEtik: number;
    persenFinansial: number;
    minPersenFinansial: number;
  };
}

export type NewPerusahaanData = NewCompanyData;

interface AddPerusahaanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewCompanyData) => Promise<void>;
}

const SEKTOR_OPTIONS = [
  'Manufaktur & Pabrikasi',
  'Perbankan & Jasa Keuangan',
  'Pertambangan & Energi',
  'Perkebunan & Pertanian',
  'Konstruksi & Properti',
  'Transportasi & Logistik',
  'Teknologi Informasi & Digital',
  'Kesehatan & Farmasi',
  'Perhotelan & Pariwisata',
  'Pendidikan & Yayasan',
  'Pemerintahan & BUMN',
  'Konsultan & Jasa Lainnya',
  'Lainnya'
];

const BANK_OPTIONS = ['BCA', 'Mandiri', 'BRI', 'BNI', 'BSI', 'CIMB Niaga', 'Permata', 'Danamon'];

export const AddPerusahaanModal: React.FC<AddPerusahaanModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [namaPT, setNamaPT] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [email, setEmail] = useState('');
  const [telepon, setTelepon] = useState('');
  const [alamat, setAlamat] = useState('');
  const [picName, setPicName] = useState('');
  const [picPosition, setPicPosition] = useState('Direktur Kepatuhan / PIC');
  const [picPhone, setPicPhone] = useState('');
  const [picEmail, setPicEmail] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'INACTIVE'>('ACTIVE');
  const [sektor, setSektor] = useState('Manufaktur & Pabrikasi');
  const [npwp, setNpwp] = useState('');
  const [danaTersedia, setDanaTersedia] = useState<number>(5000000);
  const [danaTerkunci, setDanaTerkunci] = useState<number>(0);
  const [rewardKasusEtik, setRewardKasusEtik] = useState<number>(100000);
  const [persenFinansial, setPersenFinansial] = useState<number>(2);
  const [namaBank, setNamaBank] = useState('BCA');
  const [nomorRekening, setNomorRekening] = useState('');
  const [pemilikRekening, setPemilikRekening] = useState('');
  const [statusVerifikasi, setStatusVerifikasi] = useState<'pending' | 'terverifikasi' | 'belum_upload'>('terverifikasi');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!namaPT.trim()) {
      setErrorMsg('Company Name (Nama Perusahaan) wajib diisi.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Company Email tidak valid.');
      return;
    }

    const genCode = companyCode.trim()
      ? companyCode.trim().toUpperCase()
      : namaPT.replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase();

    try {
      setLoading(true);
      await onSubmit({
        namaPT: namaPT.trim(),
        company_name: namaPT.trim(),
        company_code: genCode,
        email: email.trim().toLowerCase(),
        company_email: email.trim().toLowerCase(),
        telepon: telepon.trim(),
        company_phone: telepon.trim(),
        alamat: alamat.trim(),
        company_address: alamat.trim(),
        picName: picName.trim(),
        pic_name: picName.trim(),
        pic_position: picPosition.trim() || 'PIC Kepatuhan',
        pic_phone: picPhone.trim() || telepon.trim(),
        pic_email: picEmail.trim() || email.trim(),
        status,
        sektor,
        npwp: npwp.trim(),
        danaTersedia: Number(danaTersedia) || 0,
        danaTerkunci: Number(danaTerkunci) || 0,
        saldo: Number(danaTersedia) || 0,
        statusVerifikasiDokumen: statusVerifikasi,
        namaBank,
        nomorRekening: nomorRekening.trim(),
        pemilikRekening: pemilikRekening.trim() || namaPT.trim(),
        kebijakanReward: {
          rewardKasusEtik: Math.max(100000, Number(rewardKasusEtik) || 100000),
          persenFinansial: Math.max(2, Number(persenFinansial) || 2),
          minPersenFinansial: 2
        }
      });
      // Reset form
      setNamaPT('');
      setCompanyCode('');
      setEmail('');
      setAlamat('');
      setTelepon('');
      setPicName('');
      setPicPosition('Direktur Kepatuhan / PIC');
      setPicPhone('');
      setPicEmail('');
      setStatus('ACTIVE');
      setNpwp('');
      setNomorRekening('');
      setPemilikRekening('');
      onClose();
    } catch (err: any) {
      console.error('Error adding company:', err);
      setErrorMsg(err.message || 'Gagal menambahkan data perusahaan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Company (Tambah Perusahaan)</h3>
              <p className="text-xs text-slate-400">Daftarkan entitas perusahaan baru ke dalam sistem Integritas360</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs cursor-pointer p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice: No login account created here */}
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-white">Catatan Pemisahan Entitas:</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Formulir ini murni untuk mendaftarkan <strong>Data Perusahaan (Company)</strong>. Akun login pengguna (Company User / Company Admin) dibuat terpisah di menu <strong>Company Users &rarr; Add Company User</strong> setelah perusahaan selesai didaftarkan.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Section 1: Profil Legal & Identitas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              1. Data Perusahaan (Company Information)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">
                  Company Name (Nama Resmi PT / CV) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Sumber Alam Makmur"
                  value={namaPT}
                  onChange={(e) => setNamaPT(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Company Code (Singkatan/Kode)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SAM"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono uppercase text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Company Email <span className="text-amber-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="info@ptperusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Company Phone (Telepon Kantor)
                </label>
                <input
                  type="text"
                  placeholder="021-xxxxxxxx"
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Status Perusahaan
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="ACTIVE" className="text-emerald-400 font-bold">ACTIVE (Aktif)</option>
                  <option value="SUSPENDED" className="text-red-400 font-bold">SUSPENDED (Ditangguhkan)</option>
                  <option value="INACTIVE" className="text-slate-400">INACTIVE (Nonaktif)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Sektor Industri
                </label>
                <select
                  value={sektor}
                  onChange={(e) => setSektor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {SEKTOR_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  NPWP / NIB Perusahaan
                </label>
                <input
                  type="text"
                  placeholder="01.234.567.8-901.000"
                  value={npwp}
                  onChange={(e) => setNpwp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Company Address (Alamat Lengkap Perusahaan)
              </label>
              <textarea
                rows={2}
                placeholder="Jl. Jend. Sudirman Kav. 52, Gedung Sentra Mulia Lt. 10, Jakarta Selatan"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Section 2: Data Person in Charge (PIC) */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              2. Data Penanggung Jawab Resmi (PIC)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  PIC Name (Nama Lengkap PIC) <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso, S.H."
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  PIC Position (Jabatan PIC)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Direktur Kepatuhan & Legal"
                  value={picPosition}
                  onChange={(e) => setPicPosition(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  PIC Phone (WhatsApp / Telepon Seluler)
                </label>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  value={picPhone}
                  onChange={(e) => setPicPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  PIC Email (Email Pribadi / Dinas PIC)
                </label>
                <input
                  type="email"
                  placeholder="budi@perusahaan.com"
                  value={picEmail}
                  onChange={(e) => setPicEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Keuangan Awal & Saldo */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" />
              3. Saldo Awal Deposit & Verifikasi Dokumen
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Deposit Saldo Awal (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  step={500000}
                  value={danaTersedia}
                  onChange={(e) => setDanaTersedia(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Dana Terkunci Escrow (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  step={500000}
                  value={danaTerkunci}
                  onChange={(e) => setDanaTerkunci(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-red-400 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Verifikasi Dokumen Legal
                </label>
                <select
                  value={statusVerifikasi}
                  onChange={(e) => setStatusVerifikasi(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="terverifikasi">Terverifikasi Langsung</option>
                  <option value="pending">Menunggu Review (Pending)</option>
                  <option value="belum_upload">Belum Unggah Dokumen</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Membuat Perusahaan...' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 8. DETAIL & KELOLA LENGKAP PERUSAHAAN MODAL
// ==========================================
interface DetailPerusahaanModalProps {
  isOpen: boolean;
  onClose: () => void;
  perusahaan: any;
  companyUsers?: CompanyUser[];
  onOpenLockModal: (pt: any, action: 'lock' | 'unlock') => void;
  onOpenEditSaldoModal: (pt: any) => void;
  onOpenEditProfileModal: (pt: any) => void;
  onOpenPosterModal: (pt: any) => void;
  onDeleteUser: (pt: any) => void;
  onToggleCompanyStatus?: (companyId: string, currentStatus: string) => Promise<void>;
  onResetUserPassword?: (user: CompanyUser) => void;
  onToggleUserStatus?: (user: CompanyUser) => void;
  onDeleteCompanyUser?: (user: CompanyUser) => void;
  onAddUserForCompany?: (company: any) => void;
}

export const DetailPerusahaanModal: React.FC<DetailPerusahaanModalProps> = ({
  isOpen,
  onClose,
  perusahaan,
  companyUsers = [],
  onOpenLockModal,
  onOpenEditSaldoModal,
  onOpenEditProfileModal,
  onOpenPosterModal,
  onDeleteUser,
  onToggleCompanyStatus,
  onResetUserPassword,
  onToggleUserStatus,
  onDeleteCompanyUser,
  onAddUserForCompany
}) => {
  const [detailTab, setDetailTab] = useState<'info' | 'finance' | 'qr' | 'users'>('info');
  const [togglingStatus, setTogglingStatus] = useState(false);

  if (!isOpen || !perusahaan) return null;

  const companyId = perusahaan.company_id || perusahaan.uid || 'CMP-000001';
  const companyName = perusahaan.company_name || perusahaan.namaPT || 'PT Tanpa Nama';
  const companyCode = perusahaan.company_code || (perusahaan as any).code || '-';
  const companyEmail = perusahaan.company_email || (perusahaan as any).email || '-';
  const companyPhone = perusahaan.company_phone || (perusahaan as any).telepon || '-';
  const companyAddress = perusahaan.company_address || (perusahaan as any).alamat || '-';
  const picName = perusahaan.pic_name || (perusahaan as any).picName || '-';
  const picPosition = (perusahaan as any).pic_position || (perusahaan as any).picPosition || (perusahaan as any).jabatan || 'Direktur Kepatuhan / PIC';
  const picPhone = (perusahaan as any).pic_phone || (perusahaan as any).telepon || '-';
  const picEmail = (perusahaan as any).pic_email || (perusahaan as any).email || '-';
  const companyStatus: CompanyStatus = (perusahaan as any).status || (perusahaan.isLocked ? 'SUSPENDED' : 'ACTIVE');

  const isLocked = Boolean(perusahaan.isLocked || (Number((perusahaan as any).danaTerkunci || 0) > 0 && !(perusahaan as any).danaTersedia));
  const danaTerbuka = Number((perusahaan as any).deposit_balance !== undefined ? (perusahaan as any).deposit_balance : (perusahaan as any).danaTersedia || 0);
  const danaTerkunci = Number((perusahaan as any).locked_balance !== undefined ? (perusahaan as any).locked_balance : (perusahaan as any).danaTerkunci || 0);
  const totalAset = danaTerbuka + danaTerkunci;

  // Filter users specifically belonging to this company
  const assignedUsers = companyUsers.filter(
    (u) => u.company_id === companyId || u.company_id === perusahaan.uid || u.company_name === companyName
  );

  const handleToggleStatus = async () => {
    if (!onToggleCompanyStatus) return;
    try {
      setTogglingStatus(true);
      await onToggleCompanyStatus(perusahaan.uid || companyId, companyStatus);
    } finally {
      setTogglingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/20 to-blue-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-white">{companyName}</h3>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 border border-amber-500/30 text-amber-400">
                  {companyId}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    companyStatus === 'ACTIVE'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : companyStatus === 'SUSPENDED'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      companyStatus === 'ACTIVE'
                        ? 'bg-emerald-400 animate-pulse'
                        : companyStatus === 'SUSPENDED'
                        ? 'bg-red-400'
                        : 'bg-slate-400'
                    }`}
                  />
                  {companyStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                <span className="text-amber-400 font-medium">{perusahaan.sektor || 'Manufaktur & Korporasi'}</span>
                <span>•</span>
                <span className="font-mono">{companyEmail}</span>
                {companyCode !== '-' && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-cyan-300">Kode: {companyCode}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs inside Detail */}
        <div className="flex border-b border-slate-800 text-xs font-semibold gap-1 pb-1">
          <button
            onClick={() => setDetailTab('info')}
            className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              detailTab === 'info'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Company Information
          </button>
          <button
            onClick={() => setDetailTab('finance')}
            className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              detailTab === 'finance'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Financial Information
          </button>
          <button
            onClick={() => setDetailTab('qr')}
            className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              detailTab === 'qr'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            QR Information
          </button>
          <button
            onClick={() => setDetailTab('users')}
            className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 relative ${
              detailTab === 'users'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            Company Users
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-cyan-300 text-[10px] font-mono font-bold">
              {assignedUsers.length}
            </span>
          </button>
        </div>

        {/* TAB 1: COMPANY INFORMATION */}
        {detailTab === 'info' && (
          <div className="space-y-4 text-xs">
            {/* Status & Action */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-[11px] text-slate-400">Status Operasional Perusahaan:</span>
                <div className="font-bold text-white text-sm flex items-center gap-2 mt-0.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      companyStatus === 'ACTIVE'
                        ? 'bg-emerald-400 animate-pulse'
                        : companyStatus === 'SUSPENDED'
                        ? 'bg-red-400'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span>{companyStatus === 'ACTIVE' ? 'Aktif (Beroperasi Normal)' : companyStatus === 'SUSPENDED' ? 'DITANGGUHKAN (SUSPENDED)' : 'Nonaktif'}</span>
                </div>
                {companyStatus === 'SUSPENDED' && (
                  <p className="text-[11px] text-red-300 mt-1">
                    Saat perusahaan berstatus SUSPENDED, seluruh pengguna login di bawah PT ini tidak dapat mengakses portal.
                  </p>
                )}
              </div>

              {onToggleCompanyStatus && (
                <button
                  type="button"
                  disabled={togglingStatus}
                  onClick={handleToggleStatus}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    companyStatus === 'ACTIVE'
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  }`}
                >
                  {togglingStatus
                    ? 'Memproses...'
                    : companyStatus === 'ACTIVE'
                    ? 'Suspend Perusahaan'
                    : 'Aktifkan Kembali Perusahaan'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Identitas Legal */}
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" /> Profil & Identitas Perusahaan
                </h4>
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Company ID:</span>
                    <span className="font-mono font-bold text-amber-400">{companyId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nama Resmi:</span>
                    <span className="font-semibold text-white">{companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kode Perusahaan:</span>
                    <span className="font-mono text-cyan-300">{companyCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email Resmi:</span>
                    <span className="font-mono">{companyEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Telepon Kantor:</span>
                    <span className="font-mono text-emerald-400">{companyPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">NPWP / NIB:</span>
                    <span className="font-mono">{perusahaan.npwp || '-'}</span>
                  </div>
                  <div className="pt-1 text-[11px] text-slate-400">
                    <span className="block text-slate-400 mb-0.5">Alamat Lengkap:</span>
                    <span className="text-slate-300">{companyAddress}</span>
                  </div>
                </div>
              </div>

              {/* Data PIC */}
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Penanggung Jawab (PIC)
                </h4>
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nama PIC:</span>
                    <span className="font-semibold text-white">{picName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jabatan:</span>
                    <span className="text-slate-200">{picPosition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Telepon / WA:</span>
                    <span className="font-mono text-emerald-400 font-semibold">{picPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email PIC:</span>
                    <span className="font-mono">{picEmail}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400">Status Verifikasi:</span>
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Terverifikasi
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FINANCIAL INFORMATION */}
        {detailTab === 'finance' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Deposit Balance (Total)</span>
                <div className="text-xl font-mono font-bold text-white mt-1">
                  Rp {totalAset.toLocaleString('id-ID')}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Total penjaminan integritas</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-emerald-800/40">
                <span className="text-[10px] text-emerald-400 uppercase font-mono tracking-wider">Available Balance</span>
                <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                  Rp {danaTerbuka.toLocaleString('id-ID')}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Saldo bebas yang dapat ditarik/dipakai</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-red-800/40">
                <span className="text-[10px] text-red-400 uppercase font-mono tracking-wider">Locked Balance</span>
                <div className="text-xl font-mono font-bold text-red-400 mt-1">
                  Rp {danaTerkunci.toLocaleString('id-ID')}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Dana terkunci khusus penjaminan</p>
              </div>
            </div>

            {/* Status Lock Banner */}
            <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
              isLocked
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <div className="flex items-center gap-2">
                {isLocked ? <Lock className="w-4 h-4 text-red-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
                <span>Status Lock Saldo: <strong>{isLocked ? 'TERKUNCI (LOCKED)' : 'TERBUKA (AKTIF)'}</strong></span>
                {perusahaan.lockReason && <span className="text-slate-400 italic">({perusahaan.lockReason})</span>}
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenLockModal(perusahaan, isLocked ? 'unlock' : 'lock');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isLocked
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-red-500 hover:bg-red-400 text-white'
                }`}
              >
                {isLocked ? 'Buka Kunci (Unlock)' : 'Kunci Saldo (Lock)'}
              </button>
            </div>

            {/* Rekening Bank & Reward Policy */}
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 font-semibold block mb-1">Rekening Bank Penarikan:</span>
                <div className="font-mono text-slate-200">
                  {perusahaan.namaBank || perusahaan.rekeningBank?.bankName || 'BCA'} -{' '}
                  <span className="text-white font-bold">{perusahaan.nomorRekening || perusahaan.rekeningBank?.accountNumber || '-'}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  a.n. {perusahaan.pemilikRekening || perusahaan.rekeningBank?.holderName || companyName}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Kebijakan Reward Standar (ISO 37002):</span>
                <div className="text-slate-300">
                  Etik: <strong className="text-amber-400">Rp {(perusahaan.kebijakanReward?.rewardKasusEtik || 100000).toLocaleString('id-ID')}</strong> | Finansial: <strong className="text-blue-400">{perusahaan.kebijakanReward?.persenFinansial || 2}%</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QR INFORMATION */}
        {detailTab === 'qr' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-white text-sm">QR Code & Link Pelaporan Publik</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[11px]">
                  QR Status: ACTIVE
                </span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="text-slate-400 block text-[11px]">URL Pelaporan Khusus Perusahaan Ini:</span>
                <div className="flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-mono text-amber-300 truncate text-[11px]">
                    {`${getAppUrl()}/lapor?pt=${companyId}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${getAppUrl()}/lapor?pt=${companyId}`);
                      alert('Link formulir pelaporan berhasil disalin!');
                    }}
                    className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] shrink-0"
                  >
                    Salin URL
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Poster QR resmi mencantumkan penjaminan integritas, logo perusahaan, dan QR code yang dapat dipindai oleh karyawan atau masyarakat untuk melapor secara anonim 100%.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPosterModal(perusahaan);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Buka & Unduh Poster QR Siap Cetak (A4 / A3)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COMPANY USERS (LEVEL 3) */}
        {detailTab === 'users' && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Daftar Akun Pengguna ({companyName})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Data berasal dari entity terisolasi <code>COMPANY_USERS</code> yang terikat dengan <code>company_id: {companyId}</code>
                </p>
              </div>

              {onAddUserForCompany && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAddUserForCompany(perusahaan);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah User PT Ini</span>
                </button>
              )}
            </div>

            {assignedUsers.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-slate-400 font-medium">Belum ada akun pengguna login untuk {companyName}.</p>
                <p className="text-[11px] text-slate-500">
                  Owner/Super Admin dapat membuat akun login pertama (Company Admin, Finance, HR) melalui tombol di atas atau menu Company Users.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px] uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Nama Lengkap</th>
                      <th className="py-2.5 px-3">Email Login</th>
                      <th className="py-2.5 px-3">Peran / Role</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {assignedUsers.map((u) => {
                      const isUserActive = u.status === 'ACTIVE';
                      return (
                        <tr key={u.id || u.user_id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {u.full_name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-300">
                            {u.email}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300 font-semibold text-[11px]">
                              {u.role === 'company_admin'
                                ? 'Company Admin'
                                : u.role === 'finance'
                                ? 'Finance'
                                : u.role === 'hr'
                                ? 'HR'
                                : 'Company User'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isUserActive
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                  : 'bg-red-500/10 border-red-500/30 text-red-400'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {onResetUserPassword && (
                                <button
                                  type="button"
                                  title="Reset Kata Sandi Pengguna"
                                  onClick={() => onResetUserPassword(u)}
                                  className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-semibold transition-colors"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {onToggleUserStatus && (
                                <button
                                  type="button"
                                  title={isUserActive ? 'Suspend Akun User' : 'Aktifkan Akun User'}
                                  onClick={() => onToggleUserStatus(u)}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    isUserActive
                                      ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  }`}
                                >
                                  {isUserActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                </button>
                              )}
                              {onDeleteCompanyUser && (
                                <button
                                  type="button"
                                  title="Hapus User"
                                  onClick={() => onDeleteCompanyUser(u)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Action Toolbar */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onDeleteUser(perusahaan);
              }}
              className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus Perusahaan
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenPosterModal(perusahaan);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" /> Unduh Poster QR
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenEditSaldoModal(perusahaan);
              }}
              className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5" /> Atur Saldo
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenEditProfileModal(perusahaan);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" /> Edit Profil Lengkap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 10. ADD COMPANY USER MODAL (LEVEL 3)
// ==========================================
export interface NewCompanyUserData {
  full_name: string;
  email: string;
  phone: string;
  company_id: string;
  company_name: string;
  role: 'company_admin' | 'finance' | 'hr' | 'company_user';
  password: string;
  confirm_password?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INVITED' | 'INACTIVE';
}

// Backwards-compatible alias for existing imports
export type NewAdminPerusahaanData = NewCompanyUserData;

interface AddCompanyUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  perusahaanList: any[];
  defaultCompanyId?: string;
  onSubmit: (data: NewCompanyUserData) => Promise<void>;
}

export const AddCompanyUserModal: React.FC<AddCompanyUserModalProps> = ({
  isOpen,
  onClose,
  perusahaanList,
  defaultCompanyId,
  onSubmit
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [role, setRole] = useState<'company_admin' | 'finance' | 'hr' | 'company_user'>('company_admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'INVITED' | 'INACTIVE'>('ACTIVE');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      setRole('company_admin');
      setStatus('ACTIVE');
      setErrorMsg('');

      if (defaultCompanyId) {
        setCompanyId(defaultCompanyId);
      } else if (perusahaanList.length > 0) {
        setCompanyId(perusahaanList[0].company_id || perusahaanList[0].uid || '');
      }
    }
  }, [isOpen, defaultCompanyId, perusahaanList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !email.trim()) {
      setErrorMsg('Full Name dan Email wajib diisi.');
      return;
    }

    if (!companyId) {
      setErrorMsg('Harap pilih perusahaan tujuan.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Kata sandi wajib diisi minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    const assignedCompany = perusahaanList.find(
      (p) => (p.company_id || p.uid) === companyId
    );
    const assignedCompanyName = assignedCompany
      ? assignedCompany.company_name || assignedCompany.namaPT
      : 'Perusahaan';

    try {
      setLoading(true);
      await onSubmit({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        company_id: companyId,
        company_name: assignedCompanyName,
        role,
        password: password.trim(),
        confirm_password: confirmPassword.trim(),
        status
      });
      onClose();
    } catch (err: any) {
      console.error('Error creating company user:', err);
      setErrorMsg(err.message || 'Gagal menambahkan akun pengguna perusahaan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Add Company User (Akun Login Perusahaan)</h3>
              <p className="text-[11px] text-slate-400">
                Buat kredensial autentikasi login untuk Admin, Finance, atau HR perusahaan
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Target Company */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Company (Perusahaan) <span className="text-amber-400">*</span>
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {perusahaanList.length === 0 ? (
                <option value="">Belum ada perusahaan terdaftar</option>
              ) : (
                perusahaanList.map((pt) => {
                  const cId = pt.company_id || pt.uid;
                  const cName = pt.company_name || pt.namaPT;
                  return (
                    <option key={cId} value={cId}>
                      {cName} ({cId})
                    </option>
                  );
                })
              )}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              User ini otomatis terikat secara permanen ke tenant perusahaan yang dipilih.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Full Name (Nama Lengkap) <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Email Akun Login <span className="text-amber-400">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="admin@ptabc.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Phone */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Phone (No. Telepon / WhatsApp)
              </label>
              <input
                type="tel"
                placeholder="081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Role (Peran Pengguna) <span className="text-amber-400">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
              >
                <option value="company_admin">Company Admin (Pengelola Penuh)</option>
                <option value="finance">Finance (Keuangan & Saldo)</option>
                <option value="hr">HR (Personalia / Investigasi Etik)</option>
                <option value="company_user">Company User (Staf Internal)</option>
              </select>
            </div>
          </div>

          {/* Password & Confirm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Password <span className="text-amber-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Min. 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Confirm Password <span className="text-amber-400">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Ulangi kata sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Status Akun
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ACTIVE">ACTIVE (Aktif Langsung)</option>
              <option value="INVITED">INVITED (Undangan)</option>
              <option value="SUSPENDED">SUSPENDED (Ditangguhkan)</option>
              <option value="INACTIVE">INACTIVE (Nonaktif)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Mendaftarkan User...' : 'Create Company User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Aliases for compatibility
export const AddAdminPerusahaanModal = AddCompanyUserModal;

// ==========================================
// 11. EDIT ADMIN PERUSAHAAN MODAL
// ==========================================
interface EditAdminPerusahaanModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminUser: UserProfile | null;
  perusahaanList: UserProfile[];
  onSave: (uid: string, updates: Partial<UserProfile>) => Promise<void>;
}

export const EditAdminPerusahaanModal: React.FC<EditAdminPerusahaanModalProps> = ({
  isOpen,
  onClose,
  adminUser,
  perusahaanList,
  onSave
}) => {
  const [nama, setNama] = useState('');
  const [selectedPTId, setSelectedPTId] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [departemen, setDepartemen] = useState('');
  const [telepon, setTelepon] = useState('');
  const [statusAkun, setStatusAkun] = useState<'aktif' | 'nonaktif'>('aktif');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (adminUser) {
      setNama(adminUser.picName || '');
      setSelectedPTId(adminUser.perusahaanId || '');
      setJabatan(adminUser.jabatan || 'Admin Kepatuhan');
      setDepartemen(adminUser.departemen || 'Divisi Kepatuhan Internal');
      setTelepon(adminUser.telepon || '');
      setStatusAkun((adminUser.statusAkun as any) || (adminUser.isLocked ? 'nonaktif' : 'aktif'));
      setErrorMsg('');
    }
  }, [adminUser]);

  if (!isOpen || !adminUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nama.trim()) {
      setErrorMsg('Nama admin tidak boleh kosong.');
      return;
    }

    const assignedPT = perusahaanList.find((p) => p.uid === selectedPTId);
    const assignedPTName = assignedPT ? assignedPT.namaPT : adminUser.perusahaanName || 'PT Terkait';

    try {
      setLoading(true);
      await onSave(adminUser.uid, {
        picName: nama.trim(),
        perusahaanId: selectedPTId,
        perusahaanName: assignedPTName,
        jabatan: jabatan.trim(),
        departemen: departemen.trim(),
        telepon: telepon.trim(),
        statusAkun,
        isLocked: statusAkun === 'nonaktif'
      });
      onClose();
    } catch (err: any) {
      console.error('Error updating admin perusahaan:', err);
      setErrorMsg(err.message || 'Gagal memperbarui admin perusahaan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Kelola & Edit Admin Perusahaan</h3>
              <p className="text-[11px] text-slate-400">{adminUser.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Perusahaan Assignment */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Perusahaan yang Ditugaskan
            </label>
            <select
              value={selectedPTId}
              onChange={(e) => setSelectedPTId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {perusahaanList.map((pt) => (
                <option key={pt.uid} value={pt.uid}>
                  {pt.namaPT} ({pt.sektor || 'Umum'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Nama Admin */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Nama Lengkap Petugas
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Status Akun */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Status Akun
              </label>
              <select
                value={statusAkun}
                onChange={(e) => setStatusAkun(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="aktif">Aktif (Dapat Login & Investigasi)</option>
                <option value="nonaktif">Nonaktif (Akses Ditutup Sementara)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Jabatan */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Jabatan
              </label>
              <input
                type="text"
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Departemen */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Departemen
              </label>
              <input
                type="text"
                value={departemen}
                onChange={(e) => setDepartemen(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Telepon */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Nomor WhatsApp / Telepon
            </label>
            <input
              type="tel"
              value={telepon}
              onChange={(e) => setTelepon(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Menyimpan...' : 'Perbarui Data Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 12. RESET PASSWORD COMPANY USER MODAL
// ==========================================
interface ResetCompanyUserPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: CompanyUser | null;
  onResetPassword: (user: CompanyUser, newPassword?: string) => Promise<void>;
}

export const ResetCompanyUserPasswordModal: React.FC<ResetCompanyUserPasswordModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onResetPassword
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [useEmailReset, setUseEmailReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setUseEmailReset(false);
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!useEmailReset) {
      if (!newPassword || newPassword.length < 6) {
        setErrorMsg('Kata sandi baru minimal 6 karakter.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Konfirmasi kata sandi baru tidak cocok.');
        return;
      }
    }

    try {
      setLoading(true);
      await onResetPassword(targetUser, useEmailReset ? undefined : newPassword.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengatur ulang kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Reset Kata Sandi Pengguna</h3>
              <p className="text-[11px] text-slate-400">{targetUser.full_name} ({targetUser.email})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[11px]">Perusahaan Terikat:</span>
            <span className="font-bold text-white text-xs">{targetUser.company_name}</span>
            <span className="font-mono text-amber-400 text-[10px] block">({targetUser.company_id})</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="useEmailReset"
              checked={useEmailReset}
              onChange={(e) => setUseEmailReset(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
            />
            <label htmlFor="useEmailReset" className="text-slate-300 text-[11px] cursor-pointer">
              Kirim link reset kata sandi ke email pengguna ({targetUser.email})
            </label>
          </div>

          {!useEmailReset && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-60 cursor-pointer"
            >
              {loading
                ? 'Memproses...'
                : useEmailReset
                ? 'Kirim Link Reset Email'
                : 'Simpan Kata Sandi Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


