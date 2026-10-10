import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { Building2, Wallet, FileText, History, RefreshCw, Search, ShieldAlert, LogOut, ExternalLink, Users, Activity, KeyRound } from 'lucide-react';

type Company = Record<string, any>;
type Report = Record<string, any>;
type Transaction = Record<string, any>;
type AuditLog = Record<string, any>;

const money = (v: unknown) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v || 0));
const date = (v: unknown) => {
  if (!v) return '-';
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString('id-ID');
};

export const SuperAdminDashboard: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const { navigate } = useNavigation();
  const [tab, setTab] = useState<'overview'|'tenants'|'reports'|'transactions'|'audit'|'security'>('overview');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) navigate('/login');
    else if (user.role !== 'owner') navigate('/login');
  }, [user, loading, navigate]);

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/overview', { credentials: 'include', cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Gagal memuat data Super Admin.');
      setCompanies(Array.isArray(data.companies) ? data.companies : []);
      setReports(Array.isArray(data.reports) ? data.reports : []);
      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      setAuditLogs(Array.isArray(data.auditLogs) ? data.auditLogs : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { if (user?.role === 'owner') void load(); }, [user?.id, user?.role]);

  const filteredCompanies = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return companies;
    return companies.filter(c => [c.company_name,c.namaPT,c.company_email,c.company_id,c.company_code,c.status].some(v => String(v || '').toLowerCase().includes(q)));
  }, [companies, query]);

  const filteredReports = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return reports;
    return reports.filter(r => [r.report_code,r.judul,r.title,r.companyName,r.company_name,r.company_id,r.status,r.kategori].some(v => String(v || '').toLowerCase().includes(q)));
  }, [reports, query]);

  const filteredTransactions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return transactions;
    return transactions.filter(t => [t.id,t.company_name,t.company_id,t.type,t.status,t.tx_hash,t.keterangan].some(v => String(v || '').toLowerCase().includes(q)));
  }, [transactions, query]);

  const totalAvailable = companies.reduce((sum,c) => sum + Number(c.deposit_balance ?? c.danaTersedia ?? c.saldo ?? 0), 0);
  const totalLocked = companies.reduce((sum,c) => sum + Number(c.locked_balance ?? c.danaTerkunci ?? 0), 0);
  const openReports = reports.filter(r => !['selesai','closed','resolved','ditolak'].includes(String(r.status || '').toLowerCase())).length;
  const pendingTx = transactions.filter(t => String(t.status || '').toLowerCase() === 'pending').length;

  if (loading || !user || user.role !== 'owner') return <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">Memverifikasi akses Super Admin…</div>;

  const tabs = [
    ['overview','Ringkasan',Activity],
    ['tenants','Semua Tenant',Building2],
    ['reports','Semua Laporan',FileText],
    ['transactions','Saldo & Transaksi',Wallet],
    ['audit','History & Audit Log',History],
    ['security','Keamanan Akun',KeyRound],
  ] as const;

  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <header className="border-b border-slate-800 bg-slate-900/90">
      <div className="max-w-7xl mx-auto px-4 py-5 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-amber-500/15 p-3 text-amber-400"><ShieldAlert className="w-6 h-6"/></div><div><h1 className="text-xl font-extrabold">INTEGRITAS360 · Super Admin</h1><p className="text-xs text-slate-400">Control plane SaaS — data lintas tenant</p></div></div>
        <div className="flex items-center gap-2"><span className="text-xs text-slate-400 hidden sm:inline">{user.email}</span><button onClick={() => void load()} className="rounded-lg border border-slate-700 px-3 py-2 text-sm flex gap-2 items-center hover:bg-slate-800"><RefreshCw className={`w-4 h-4 ${busy?'animate-spin':''}`}/>Refresh</button><button onClick={async()=>{await logout();navigate('/login');}} className="rounded-lg border border-slate-700 px-3 py-2 text-sm flex gap-2 items-center hover:bg-slate-800"><LogOut className="w-4 h-4"/>Keluar</button></div>
      </div>
    </header>
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <nav className="flex gap-2 overflow-x-auto pb-1">{tabs.map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} className={`shrink-0 rounded-xl px-4 py-3 text-sm font-semibold flex gap-2 items-center border ${tab===id?'bg-amber-500 text-slate-950 border-amber-400':'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'}`}><Icon className="w-4 h-4"/>{label}</button>)}</nav>
      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}<p className="text-xs text-red-200/70 mt-1">Dashboard ini menunggu endpoint admin yang terautentikasi; tidak menggunakan endpoint publik lintas tenant.</p></div>}
      {tab !== 'overview' && <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari nama tenant, ID, kode laporan, transaksi..." className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-3 text-sm outline-none focus:border-amber-500"/></div>}
      {tab==='overview' && <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[[Building2,'Total Tenant',companies.length],[Wallet,'Saldo Tersedia',money(totalAvailable)],[Wallet,'Saldo Terkunci',money(totalLocked)],[FileText,'Laporan Aktif',openReports],[History,'Transaksi Pending',pendingTx]] .map(([Icon,label,value]:any)=><div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex items-center justify-between text-slate-400 text-sm"><span>{label}</span><Icon className="w-5 h-5 text-amber-400"/></div><div className="mt-3 text-2xl font-extrabold break-words">{value}</div></div>)}
        </div>
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="font-bold mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-amber-400"/>Ringkasan sistem</h2><p className="text-sm text-slate-400">Panel ini khusus Owner/Super Admin untuk memantau seluruh tenant, laporan, saldo, transaksi, dan jejak audit. Tenant tetap masuk melalui portal tenant terpisah.</p><div className="flex flex-wrap gap-3 mt-4"><button onClick={()=>setTab('tenants')} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950">Kelola Tenant</button><a href="/login" className="rounded-lg border border-slate-700 px-4 py-2 text-sm flex items-center gap-2">Portal Tenant <ExternalLink className="w-4 h-4"/></a></div></section>
      </>}
      {tab==='tenants' && <section className="rounded-2xl border border-slate-800 bg-slate-900 overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-800/70 text-slate-300"><tr>{['Perusahaan / Tenant','Tenant ID','Email','Saldo Tersedia','Terkunci','Status','Dibuat'].map(x=><th key={x} className="text-left p-3 whitespace-nowrap">{x}</th>)}</tr></thead><tbody>{filteredCompanies.map((c,i)=><tr key={c.id||c.company_id||i} className="border-t border-slate-800"><td className="p-3 font-semibold">{c.company_name||c.namaPT||'-'}</td><td className="p-3 font-mono text-xs">{c.company_id||c.id||'-'}</td><td className="p-3">{c.company_email||c.email||'-'}</td><td className="p-3 whitespace-nowrap">{money(c.deposit_balance??c.danaTersedia??c.saldo)}</td><td className="p-3 whitespace-nowrap">{money(c.locked_balance??c.danaTerkunci)}</td><td className="p-3">{c.status||c.statusAkun||'-'}</td><td className="p-3 whitespace-nowrap">{date(c.created_at||c.createdAt)}</td></tr>)}{filteredCompanies.length===0&&<tr><td colSpan={7} className="p-8 text-center text-slate-500">Tidak ada data tenant.</td></tr>}</tbody></table></section>}
      {tab==='reports' && <section className="rounded-2xl border border-slate-800 bg-slate-900 overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-800/70 text-slate-300"><tr>{['Kode laporan','Tenant','Judul','Kategori','Estimasi kerugian','Status','Tanggal'].map(x=><th key={x} className="text-left p-3 whitespace-nowrap">{x}</th>)}</tr></thead><tbody>{filteredReports.map((r,i)=><tr key={r.id||i} className="border-t border-slate-800"><td className="p-3 font-mono text-xs">{r.report_code||r.reportCode||r.id}</td><td className="p-3">{r.company_name||r.companyName||r.company_id||r.companyId||'-'}</td><td className="p-3 min-w-48">{r.title||r.judul||'-'}</td><td className="p-3">{r.category||r.kategori||'-'}</td><td className="p-3 whitespace-nowrap">{money(r.estimated_loss??r.estimasiKerugian)}</td><td className="p-3">{r.status||'-'}</td><td className="p-3 whitespace-nowrap">{date(r.created_at||r.createdAt)}</td></tr>)}{filteredReports.length===0&&<tr><td colSpan={7} className="p-8 text-center text-slate-500">Tidak ada data laporan.</td></tr>}</tbody></table></section>}
      {tab==='transactions' && <section className="rounded-2xl border border-slate-800 bg-slate-900 overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-800/70 text-slate-300"><tr>{['Tanggal','Tenant','Tipe','Nominal','Status','Referensi'].map(x=><th key={x} className="text-left p-3 whitespace-nowrap">{x}</th>)}</tr></thead><tbody>{filteredTransactions.map((t,i)=><tr key={t.id||i} className="border-t border-slate-800"><td className="p-3 whitespace-nowrap">{date(t.created_at||t.createdAt)}</td><td className="p-3">{t.company_name||t.companyName||t.company_id||t.companyId||'-'}</td><td className="p-3">{t.type||'-'}</td><td className="p-3 whitespace-nowrap">{money(t.amount)}</td><td className="p-3">{t.status||'-'}</td><td className="p-3 font-mono text-xs">{t.tx_hash||t.txHash||t.id||'-'}</td></tr>)}{filteredTransactions.length===0&&<tr><td colSpan={6} className="p-8 text-center text-slate-500">Tidak ada transaksi.</td></tr>}</tbody></table></section>}
      {tab==='audit' && <section className="rounded-2xl border border-slate-800 bg-slate-900 overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-800/70 text-slate-300"><tr>{['Waktu','Tenant','Aksi','Aktor','Detail'].map(x=><th key={x} className="text-left p-3 whitespace-nowrap">{x}</th>)}</tr></thead><tbody>{auditLogs.map((a,i)=><tr key={a.id||i} className="border-t border-slate-800"><td className="p-3 whitespace-nowrap">{date(a.created_at||a.timestamp)}</td><td className="p-3">{a.company_name||a.company_id||'-'}</td><td className="p-3">{a.action||a.event||a.type||'-'}</td><td className="p-3">{a.actor_email||a.user_email||a.actor||'-'}</td><td className="p-3 max-w-md break-words">{typeof a.metadata==='object'?JSON.stringify(a.metadata):String(a.metadata_json||a.metadata||a.description||'-')}</td></tr>)}{auditLogs.length===0&&<tr><td colSpan={5} className="p-8 text-center text-slate-500">Tidak ada audit log.</td></tr>}</tbody></table></section>}
      {tab==='security' && <section className="max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <h2 className="font-bold text-lg flex items-center gap-2"><KeyRound className="w-5 h-5 text-amber-400"/> Keamanan Akun Owner</h2>
        <p className="text-sm text-slate-400 mt-2">Akun Owner utama: <strong className="text-slate-200">support.integritas360@gmail.com</strong>. Ubah kata sandi dari halaman ini. Kata sandi disimpan dalam bentuk hash, bukan teks biasa.</p>
        {passwordMessage && <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{passwordMessage}</div>}
        {passwordError && <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{passwordError}</div>}
        <form className="mt-5 space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          setPasswordError('');
          setPasswordMessage('');
          setPasswordBusy(true);
          try {
            const response = await fetch('/api/auth/change-password', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.ok) throw new Error(data.error || 'Gagal mengubah kata sandi.');
            setPasswordMessage(data.message || 'Kata sandi berhasil diperbarui.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          } catch (err) {
            setPasswordError(err instanceof Error ? err.message : 'Gagal mengubah kata sandi.');
          } finally {
            setPasswordBusy(false);
          }
        }}>
          <label className="block text-sm text-slate-300">Kata sandi saat ini
            <input required type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-amber-500"/>
          </label>
          <label className="block text-sm text-slate-300">Kata sandi baru (minimal 10 karakter)
            <input required minLength={10} type="password" autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-amber-500"/>
          </label>
          <label className="block text-sm text-slate-300">Konfirmasi kata sandi baru
            <input required minLength={10} type="password" autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-amber-500"/>
          </label>
          <button type="submit" disabled={passwordBusy} className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-60">{passwordBusy ? 'Menyimpan...' : 'Ubah Kata Sandi'}</button>
        </form>
      </section>}
      <footer className="text-xs text-slate-500 flex flex-wrap gap-2 items-center"><Users className="w-4 h-4"/> Panel khusus Super Admin. Jangan bagikan akses ini kepada akun tenant.</footer>
    </main>
  </div>;
};
