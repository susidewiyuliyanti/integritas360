import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { ShieldCheck, ArrowLeft, UploadCloud, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

export const RegisterPage: React.FC = () => {
  const { navigate } = useNavigation();
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [picName,setPicName] = useState('');
  const [file,setFile] = useState<File|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [success,setSuccess] = useState(false);
  const submit = async (e:React.FormEvent) => {
    e.preventDefault(); setError('');
    if(!file){setError('Upload Company Profile wajib dipilih.');return;}
    const body = new FormData(); body.append('email',email.trim().toLowerCase()); body.append('password',password); body.append('picName',picName.trim()); body.append('companyProfile',file);
    setBusy(true);
    try {
      const response=await fetch('/api/auth/register',{method:'POST',body});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok) throw new Error(data.error||'Pendaftaran gagal diproses.');
      setSuccess(true);
    } catch(err) { setError(err instanceof Error?err.message:'Terjadi kesalahan saat pendaftaran.'); }
    finally { setBusy(false); }
  };
  return <div className="min-h-screen w-full bg-slate-950 py-8 px-4 sm:py-12 sm:px-6 lg:px-8 flex flex-col justify-center overflow-x-hidden">
    <div className="w-full max-w-md mx-auto space-y-5 sm:space-y-6">
      <div className="text-center space-y-2.5 sm:space-y-3"><div className="flex justify-center"><BrandLogo size="lg"/></div><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-400"><ShieldCheck className="w-4 h-4"/>Pendaftaran Tenant Perusahaan</div><h1 className="text-2xl sm:text-3xl font-extrabold text-white">Daftarkan Perusahaan</h1><p className="mx-auto max-w-sm text-xs sm:text-sm leading-relaxed text-slate-400">Lengkapi data berikut. Akun aktif setelah diverifikasi admin.</p></div>
      {success ? <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-3"><CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto"/><h2 className="font-bold text-white">Pendaftaran berhasil dikirim</h2><p className="text-sm text-emerald-200">Status: Menunggu Verifikasi Super Admin. Anda dapat login setelah pendaftaran disetujui.</p><button onClick={()=>navigate('/login')} className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950">Kembali ke Login</button></div> : <form onSubmit={submit} className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-8 space-y-4 sm:space-y-5 shadow-2xl">
        {error&&<div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}
        <label className="block text-xs font-semibold text-slate-300">Email Perusahaan *<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@perusahaan.co.id" className="mt-1.5 block w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"/></label>
        <label className="block text-xs font-semibold text-slate-300">Kata Sandi *<input required minLength={10} maxLength={128} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimal 10 karakter" className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white"/></label>
        <label className="block text-xs font-semibold text-slate-300">Nama PIC *<input required minLength={2} maxLength={120} value={picName} onChange={e=>setPicName(e.target.value)} placeholder="Nama penanggung jawab" className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white"/></label>
        <label className="block text-xs font-semibold text-slate-300">Upload Company Profile *<span className="mt-1.5 flex items-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-950 px-3.5 py-4 text-sm text-slate-300"><UploadCloud className="w-5 h-5 text-amber-400"/><span className="min-w-0 flex-1 truncate">{file?file.name:'Pilih PDF, JPG, atau PNG (maks. 5 MB)'}</span><input required type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={e=>setFile(e.target.files?.[0]||null)} className="w-full min-w-0 max-w-[125px] text-[10px] file:mr-1 file:rounded-lg file:border-0 file:bg-slate-800 file:px-2 file:py-1.5 file:text-[10px] file:font-semibold file:text-slate-200"/></span></label>
        <button disabled={busy} className="w-full min-h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-60 py-3 px-4 text-sm font-bold text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all">{busy?<><Loader2 className="w-4 h-4 animate-spin"/>Mengirim pendaftaran...</>:'Kirim Pendaftaran'}</button>
        <p className="text-[11px] text-slate-500 flex gap-2"><FileText className="w-4 h-4 shrink-0"/>Dokumen disimpan secara privat dan hanya untuk proses verifikasi.</p>
      </form>}
      <button onClick={()=>navigate('/login')} className="mx-auto flex min-h-11 items-center justify-center gap-2 px-4 text-xs text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4"/>Kembali ke Login</button>
    </div>
  </div>;
};
