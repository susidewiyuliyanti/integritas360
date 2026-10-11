import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { Building2, Wallet, FileText, History, RefreshCw, Search, ShieldAlert, LogOut, ExternalLink, Users, Activity, KeyRound, Bot, MessageSquare, TrendingUp, Target, Sparkles, Send, User, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

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
  const [tab, setTab] = useState<'overview'|'tenants'|'reports'|'transactions'|'audit'|'security'|'ai-sales'>('overview');
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
  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantAdminName, setTenantAdminName] = useState('');
  const [tenantAdminEmail, setTenantAdminEmail] = useState('');
  const [tenantAdminPassword, setTenantAdminPassword] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantBusy, setTenantBusy] = useState(false);
  const [tenantMessage, setTenantMessage] = useState('');
  const [tenantError, setTenantError] = useState('');
  const [adminCompanyId, setAdminCompanyId] = useState('');
  const [extraAdminName, setExtraAdminName] = useState('');
  const [extraAdminEmail, setExtraAdminEmail] = useState('');
  const [extraAdminPassword, setExtraAdminPassword] = useState('');
  const [extraAdminPhone, setExtraAdminPhone] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [adminError, setAdminError] = useState('');

  // AI Sales Agent state
  const [aiMessages, setAiMessages] = useState<{role:'user'|'assistant';content:string;timestamp:number}[]>([
    {role:'assistant',content:'Halo! Saya AI Sales Agent Integritas360. Saya bisa membantu Anda menganalisis data tenant, memberikan rekomendasi follow-up, dan menjawab pertanyaan tentang sales performance. Ada yang bisa saya bantu?',timestamp:Date.now()}
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(true);

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
    ['ai-sales','AI Sales Agent',Bot],
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
      {tab==='tenants' && <div className="space-y-5">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4"><h2 className="text-lg font-bold flex items-center gap-2"><Building2 className="w-5 h-5 text-amber-400"/>Tambah Tenant Perusahaan</h2><p className="text-sm text-slate-400 mt-1">Buat ruang perusahaan yang terpisah beserta akun admin pertamanya. Tenant baru berstatus DEPOSIT_REQUIRED.</p></div>
          {tenantMessage && <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{tenantMessage}</div>}
          {tenantError && <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{tenantError}</div>}
          <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={async e=>{
            e.preventDefault(); setTenantBusy(true); setTenantError(''); setTenantMessage('');
            try {
              const response=await fetch('/api/owner/data',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'create-tenant',data:{company_name:tenantName,company_email:tenantEmail,full_name:tenantAdminName,admin_email:tenantAdminEmail,password:tenantAdminPassword,phone:tenantPhone}})});
              const data=await response.json().catch(()=>({}));
              if(!response.ok||!data.ok) throw new Error(data.error||'Tenant tidak berhasil dibuat.');
              setTenantMessage('Tenant berhasil dibuat. ID: '+data.company_id+' · Admin pertama: '+tenantAdminEmail);
              setTenantName('');setTenantEmail('');setTenantAdminName('');setTenantAdminEmail('');setTenantAdminPassword('');setTenantPhone('');
              await load();
            } catch(err){setTenantError(err instanceof Error?err.message:'Gagal membuat tenant.');}
            finally{setTenantBusy(false);}
          }}>
            <label className="text-sm text-slate-300">Nama perusahaan *<input required value={tenantName} onChange={e=>setTenantName(e.target.value)} placeholder="PT Contoh Indonesia" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"/></label>
            <label className="text-sm text-slate-300">Email perusahaan *<input required type="email" value={tenantEmail} onChange={e=>setTenantEmail(e.target.value)} placeholder="kontak@perusahaan.co.id" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"/></label>
            <div className="md:col-span-2 border-t border-slate-800 pt-3 mt-1"><h3 className="font-semibold text-white">Admin perusahaan pertama</h3><p className="text-xs text-slate-400">Setiap tenant maksimal memiliki 3 akun admin termasuk akun pertama.</p></div>
            <label className="text-sm text-slate-300">Nama admin *<input required value={tenantAdminName} onChange={e=>setTenantAdminName(e.target.value)} placeholder="Nama lengkap" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"/></label>
            <label className="text-sm text-slate-300">Email login admin *<input required type="email" value={tenantAdminEmail} onChange={e=>setTenantAdminEmail(e.target.value)} placeholder="admin@perusahaan.co.id" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"/></label>
            <label className="text-sm text-slate-300">Kata sandi sementara (min. 10 karakter) *<input required minLength={10} type="password" autoComplete="new-password" value={tenantAdminPassword} onChange={e=>setTenantAdminPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"/></label>
            <label className="text-sm text-slate-300">Telepon admin<input value={tenantPhone} onChange={e=>setTenantPhone(e.target.value)} placeholder="Opsional" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"/></label>
            <div className="md:col-span-2"><button disabled={tenantBusy} className="rounded-xl bg-amber-500 px-5 py-3 font-bold text-slate-950 disabled:opacity-60">{tenantBusy?'Membuat tenant...':'Buat Tenant + Admin Pertama'}</button></div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5 text-cyan-400"/>Tambah Admin ke Tenant yang Sudah Ada</h2>
          <p className="text-sm text-slate-400 mt-1 mb-4">Maksimal 3 akun admin per perusahaan. Batas dihitung di backend, bukan hanya di tampilan.</p>
          {adminMessage && <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{adminMessage}</div>}
          {adminError && <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{adminError}</div>}
          <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={async e=>{
            e.preventDefault();setAdminBusy(true);setAdminError('');setAdminMessage('');
            try{
              const response=await fetch('/api/owner/data',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'create-tenant-admin',data:{company_id:adminCompanyId,full_name:extraAdminName,email:extraAdminEmail,password:extraAdminPassword,phone:extraAdminPhone}})});
              const data=await response.json().catch(()=>({}));
              if(!response.ok||!data.ok) throw new Error(data.error||'Akun admin tidak berhasil dibuat.');
              setAdminMessage(data.message||'Akun admin berhasil dibuat.');setExtraAdminName('');setExtraAdminEmail('');setExtraAdminPassword('');setExtraAdminPhone('');await load();
            }catch(err){setAdminError(err instanceof Error?err.message:'Gagal membuat akun admin.');}
            finally{setAdminBusy(false);}
          }}>
            <label className="text-sm text-slate-300">Pilih tenant *<select required value={adminCompanyId} onChange={e=>setAdminCompanyId(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"><option value="">Pilih perusahaan</option>{companies.map(co=><option key={co.company_id||co.id} value={co.company_id||co.id}>{co.company_name||co.namaPT||co.company_id} ({co.company_id||co.id})</option>)}</select></label>
            <label className="text-sm text-slate-300">Nama admin *<input required value={extraAdminName} onChange={e=>setExtraAdminName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"/></label>
            <label className="text-sm text-slate-300">Email login admin *<input required type="email" value={extraAdminEmail} onChange={e=>setExtraAdminEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"/></label>
            <label className="text-sm text-slate-300">Kata sandi sementara (min. 10 karakter) *<input required minLength={10} type="password" autoComplete="new-password" value={extraAdminPassword} onChange={e=>setExtraAdminPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"/></label>
            <label className="text-sm text-slate-300">Telepon admin<input value={extraAdminPhone} onChange={e=>setExtraAdminPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"/></label>
            <div className="md:col-span-2"><button disabled={adminBusy||!adminCompanyId} className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-60">{adminBusy?'Menyimpan admin...':'Tambah Admin Tenant'}</button></div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 overflow-x-auto">
          <div className="p-4 border-b border-slate-800"><h2 className="font-bold">Semua Tenant</h2><p className="text-xs text-slate-400 mt-1">Setiap tenant memiliki company_id tersendiri yang digunakan backend untuk membatasi akses data.</p></div>
          <table className="w-full text-sm"><thead className="bg-slate-800/70 text-slate-300"><tr>{['Perusahaan / Tenant','Tenant ID','Email','Saldo Tersedia','Terkunci','Status','Dibuat'].map(x=><th key={x} className="text-left p-3 whitespace-nowrap">{x}</th>)}</tr></thead><tbody>{filteredCompanies.map((co,i)=><tr key={co.id||co.company_id||i} className="border-t border-slate-800"><td className="p-3 font-semibold">{co.company_name||co.namaPT||'-'}</td><td className="p-3 font-mono text-xs">{co.company_id||co.id||'-'}</td><td className="p-3">{co.email||co.company_email||'-'}</td><td className="p-3 whitespace-nowrap">{money(co.deposit_balance??co.danaTersedia??co.saldo)}</td><td className="p-3 whitespace-nowrap">{money(co.locked_balance??co.danaTerkunci)}</td><td className="p-3">{co.status||co.statusAkun||'-'}</td><td className="p-3 whitespace-nowrap">{date(co.created_at||co.createdAt)}</td></tr>)}{filteredCompanies.length===0&&<tr><td colSpan={7} className="p-8 text-center text-slate-500">Belum ada tenant.</td></tr>}</tbody></table>
        </section>
      </div>}
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
      {tab==='ai-sales' && <AISalesAgentPanel
        companies={companies}
        reports={reports}
        transactions={transactions}
        aiMessages={aiMessages}
        setAiMessages={setAiMessages}
        aiInput={aiInput}
        setAiInput={setAiInput}
        aiLoading={aiLoading}
        setAiLoading={setAiLoading}
        aiExpanded={aiExpanded}
        setAiExpanded={setAiExpanded}
      />}
      <footer className="text-xs text-slate-500 flex flex-wrap gap-2 items-center"><Users className="w-4 h-4"/> Panel khusus Super Admin. Jangan bagikan akses ini kepada akun tenant.</footer>
    </main>
  </div>;
};

/* ── AI Sales Agent Panel ── */
interface AISalesAgentPanelProps {
  companies: Company[];
  reports: Report[];
  transactions: Transaction[];
  aiMessages: {role:'user'|'assistant';content:string;timestamp:number}[];
  setAiMessages: React.Dispatch<React.SetStateAction<{role:'user'|'assistant';content:string;timestamp:number}[]>>;
  aiInput: string;
  setAiInput: (v:string)=>void;
  aiLoading: boolean;
  setAiLoading: (v:boolean)=>void;
  aiExpanded: boolean;
  setAiExpanded: (v:boolean)=>void;
}

const AISalesAgentPanel: React.FC<AISalesAgentPanelProps> = ({
  companies, reports, transactions, aiMessages, setAiMessages, aiInput, setAiInput, aiLoading, setAiLoading, aiExpanded, setAiExpanded
}) => {
  const [activeInsight, setActiveInsight] = useState<'overview'|'leads'|'conversion'|'revenue'>('overview');

  // Hitung metrik sales dari data D1
  const totalTenants = companies.length;
  const activeTenants = companies.filter(c => ['ACTIVE','active','aktif'].includes(String(c.status||'').toUpperCase())).length;
  const depositRequiredTenants = companies.filter(c => ['DEPOSIT_REQUIRED','deposit_required'].includes(String(c.status||'').toUpperCase())).length;
  const suspendedTenants = companies.filter(c => ['SUSPENDED','suspended'].includes(String(c.status||'').toUpperCase())).length;
  const totalRevenue = transactions.filter(t => ['completed','selesai','success'].includes(String(t.status||'').toLowerCase())).reduce((sum,t)=>sum+Number(t.amount||0),0);
  const pendingRevenue = transactions.filter(t => ['pending','menunggu'].includes(String(t.status||'').toLowerCase())).reduce((sum,t)=>sum+Number(t.amount||0),0);
  const avgDeposit = totalTenants > 0 ? totalRevenue / totalTenants : 0;

  // Generate insight otomatis berdasarkan data D1
  const generateInsights = ():string[] => {
    const insights:string[] = [];
    if (depositRequiredTenants > 0) insights.push(`${depositRequiredTenants} tenant menunggu deposit — peluang follow-up sales.`);
    if (pendingRevenue > 0) insights.push(`Rp ${pendingRevenue.toLocaleString('id-ID')} transaksi pending — perlu verifikasi cepat.`);
    if (activeTenants === 0 && totalTenants > 0) insights.push('Semua tenant belum aktif — perlu onboarding intensif.');
    if (activeTenants > 0) insights.push(`${activeTenants} tenant aktif — potensi upsell laporan/audit tambahan.`);
    if (suspendedTenants > 0) insights.push(`${suspendedTenants} tenant ditangguhkan — evaluasi retensi.`);
    if (avgDeposit > 0) insights.push(`Rata-rata deposit per tenant: Rp ${Math.round(avgDeposit).toLocaleString('id-ID')}.`);
    if (reports.length > 0) {
      const validReports = reports.filter(r => ['valid','terverifikasi','verified'].includes(String(r.status||'').toLowerCase())).length;
      insights.push(`${validReports}/${reports.length} laporan terverifikasi — tingkat kepercayaan sistem tinggi.`);
    }
    if (insights.length === 0) insights.push('Data masih terbatas. Ajukan deposit ke tenant untuk memulai revenue.');
    return insights;
  };

  const insights = useMemo(generateInsights, [companies, transactions, reports, depositRequiredTenants, pendingRevenue, activeTenants, suspendedTenants, avgDeposit]);

  // Handle kirim pesan ke AI
  const handleSend = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, {role:'user',content:userMsg,timestamp:Date.now()}]);
    setAiLoading(true);

    // Simulasi AI response berdasarkan data D1 (nanti bisa diganti dengan API call ke AI service)
    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      let response = '';

      if (lower.includes('tenant') || lower.includes('perusahaan')) {
        response = `Saat ini ada ${totalTenants} tenant: ${activeTenants} aktif, ${depositRequiredTenants} menunggu deposit, ${suspendedTenants} ditangguhkan. Total revenue: Rp ${totalRevenue.toLocaleString('id-ID')}.`;
      } else if (lower.includes('deposit') || lower.includes('saldo') || lower.includes('revenue') || lower.includes('pendapatan')) {
        response = `Total revenue terkonfirmasi: Rp ${totalRevenue.toLocaleString('id-ID')}. Pending: Rp ${pendingRevenue.toLocaleString('id-ID')}. Rata-rata deposit per tenant: Rp ${Math.round(avgDeposit).toLocaleString('id-ID')}.`;
      } else if (lower.includes('laporan') || lower.includes('report')) {
        response = `Total ${reports.length} laporan masuk. ${reports.filter(r => ['valid','terverifikasi','verified'].includes(String(r.status||'').toLowerCase())).length} terverifikasi, ${reports.filter(r => ['pending','menunggu'].includes(String(r.status||'').toLowerCase())).length} menunggu review.`;
      } else if (lower.includes('follow') || lower.includes('tindak') || lower.includes('rekomendasi')) {
        const recs = [];
        if (depositRequiredTenants > 0) recs.push(`Follow-up ${depositRequiredTenants} tenant dengan status DEPOSIT_REQUIRED via email/WhatsApp.`);
        if (pendingRevenue > 0) recs.push(`Prioritaskan verifikasi ${transactions.filter(t => ['pending','menunggu'].includes(String(t.status||'').toLowerCase())).length} transaksi pending.`);
        if (suspendedTenants > 0) recs.push(`Hubungi ${suspendedTenants} tenant yang ditangguhkan untuk evaluasi retensi.`);
        if (recs.length === 0) recs.push('Semua tenant aktif — fokus pada upsell fitur premium dan laporan audit tambahan.');
        response = 'Rekomendasi tindak lanjut:\n' + recs.map((r,i) => `${i+1}. ${r}`).join('\n');
      } else if (lower.includes('konversi') || lower.includes('conversion')) {
        const rate = totalTenants > 0 ? (activeTenants / totalTenants * 100).toFixed(1) : '0';
        response = `Conversion rate: ${rate}% (${activeTenants}/${totalTenants} tenant aktif). ${depositRequiredTenants} tenant di funnel deposit. Tingkatkan dengan follow-up personal dan demo produk.`;
      } else if (lower.includes('analisis') || lower.includes('analisa') || lower.includes('insight')) {
        response = 'Insight dari data D1:\n' + insights.map((ins,i) => `${i+1}. ${ins}`).join('\n');
      } else {
        response = `Saya memahami pertanyaan Anda. Berdasarkan data D1 saat ini:\n- ${totalTenants} tenant terdaftar\n- Rp ${totalRevenue.toLocaleString('id-ID')} revenue\n- ${reports.length} laporan\n\nAda yang spesifik ingin Anda analisis?`;
      }

      setAiMessages(prev => [...prev, {role:'assistant',content:response,timestamp:Date.now()}]);
      setAiLoading(false);
    }, 1200);
  };

  const handleKeyDown = (e:React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return <div className="space-y-6">
    {/* Header AI Sales */}
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-400"><Sparkles className="w-5 h-5"/></div>
        <div>
          <h2 className="font-bold text-lg">AI Sales Agent</h2>
          <p className="text-xs text-slate-400">Analisis data D1 real-time · Rekomendasi sales · Chat interaktif</p>
        </div>
      </div>
    </section>

    {/* Metrik Sales */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[
        [Target,'Total Tenant',totalTenants],
        [TrendingUp,'Tenant Aktif',activeTenants],
        [Wallet,'Revenue Terkonfirmasi',`Rp ${totalRevenue.toLocaleString('id-ID')}`],
        [Lightbulb,'Avg Deposit/Tenant',`Rp ${Math.round(avgDeposit).toLocaleString('id-ID')}`],
      ].map(([Icon,label,value]:any)=><div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex items-center justify-between text-slate-400 text-sm"><span>{label}</span><Icon className="w-5 h-5 text-emerald-400"/></div><div className="mt-3 text-2xl font-extrabold break-words">{value}</div></div>)}
    </div>

    {/* Insight Cards */}
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-4 h-4 text-amber-400"/>
        <h3 className="font-bold">Insight Otomatis dari D1</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight,i)=>(
          <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex gap-3 items-start">
            <div className="rounded-full bg-amber-500/15 text-amber-400 w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">{i+1}</div>
            <p className="text-sm text-slate-300">{insight}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Chat Interface */}
    <section className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
      <button onClick={()=>setAiExpanded(!aiExpanded)} className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5 text-emerald-400"/>
          <h3 className="font-bold">Chat dengan AI Sales Agent</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Live</span>
        </div>
        {aiExpanded ? <ChevronUp className="w-5 h-5 text-slate-400"/> : <ChevronDown className="w-5 h-5 text-slate-400"/>}
      </button>

      {aiExpanded && <>
        {/* Messages */}
        <div className="px-5 py-4 space-y-4 max-h-[400px] overflow-y-auto border-t border-slate-800">
          {aiMessages.map((msg,i)=>{
            const isUser = msg.role === 'user';
            return <div key={i} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div className={`rounded-full w-8 h-8 flex items-center justify-center shrink-0 ${isUser ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                {isUser ? <User className="w-4 h-4"/> : <Bot className="w-4 h-4"/>}
              </div>
              <div className={`rounded-2xl px-4 py-3 text-sm max-w-[80%] whitespace-pre-line ${isUser ? 'bg-amber-500/10 text-slate-200 border border-amber-500/20' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                {msg.content}
              </div>
            </div>;
          })}
          {aiLoading && <div className="flex gap-3">
            <div className="rounded-full w-8 h-8 flex items-center justify-center shrink-0 bg-emerald-500/15 text-emerald-400"><Bot className="w-4 h-4 animate-pulse"/></div>
            <div className="rounded-2xl px-4 py-3 text-sm bg-slate-800 text-slate-400 border border-slate-700">
              <span className="inline-flex gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"/><span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]"/><span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"/></span>
            </div>
          </div>}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                value={aiInput}
                onChange={e=>setAiInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanya tentang tenant, revenue, conversion, rekomendasi follow-up..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 pr-10"
                disabled={aiLoading}
              />
              <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"/>
            </div>
            <button
              onClick={handleSend}
              disabled={!aiInput.trim() || aiLoading}
              className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4"/> Kirim
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">AI Sales Agent menganalisis data D1 real-time. Tekan Enter untuk kirim.</p>
        </div>
      </>}
    </section>

    {/* Quick Actions */}
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h3 className="font-bold mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-amber-400"/>Tindakan Cepat</h3>
      <div className="flex flex-wrap gap-2">
        {[
          {label:'Analisis tenant', prompt:'Berikan analisis lengkap tentang semua tenant'},
          {label:'Revenue hari ini', prompt:'Berapa revenue dan transaksi hari ini?'},
          {label:'Rekomendasi follow-up', prompt:'Apa rekomendasi follow-up untuk tenant?'},
          {label:'Conversion rate', prompt:'Berapa conversion rate tenant saat ini?'},
          {label:'Tenant pending deposit', prompt:'Siapa saja tenant yang menunggu deposit?'},
          {label:'Laporan overview', prompt:'Berikan overview laporan yang masuk'},
        ].map((action)=>(
          <button
            key={action.label}
            onClick={()=>{setAiInput(action.prompt); setAiExpanded(true);}}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
          >
            {action.label}
          </button>
        ))}
      </div>
    </section>
  </div>;
};
