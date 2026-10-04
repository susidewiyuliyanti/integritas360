import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, createFirebaseAuthUser, logAuditEvent, sendPasswordReset } from '../../lib/firebase';
import { CompanyUser } from '../../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Mail,
  Phone,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Unlock,
  Building2,
  Briefcase
} from 'lucide-react';

interface CompanyUsersViewProps {
  companyId: string;
  companyName: string;
  currentUserEmail?: string;
  currentUserId?: string;
}

export const CompanyUsersView: React.FC<CompanyUsersViewProps> = ({
  companyId,
  companyName,
  currentUserEmail,
  currentUserId
}) => {
  const [userList, setUserList] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add User Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'company_admin' | 'finance' | 'hr' | 'company_user'>('company_user');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Realtime subscription to users of this specific company
  useEffect(() => {
    if (!companyId) return;

    setLoading(true);
    // Listen to company_users where company_id matches
    const qCompanyUsers = query(
      collection(db, 'company_users'),
      where('company_id', '==', companyId)
    );

    const unsubscribe = onSnapshot(
      qCompanyUsers,
      (snapshot) => {
        const list: CompanyUser[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            user_id: d.user_id || docSnap.id,
            company_id: d.company_id || companyId,
            company_name: d.company_name || companyName,
            full_name: d.full_name || 'Anggota Tim',
            email: d.email || '',
            phone: d.phone || '',
            role: d.role || 'company_user',
            status: d.status || 'ACTIVE',
            created_at: d.created_at,
            updated_at: d.updated_at
          });
        });

        // Also check if existing users collection has legacy admins for this company
        const qLegacy = query(collection(db, 'users'), where('company_id', '==', companyId));
        const unsubLegacy = onSnapshot(qLegacy, (legacySnap) => {
          const combined = [...list];
          legacySnap.forEach((uDoc) => {
            const ud = uDoc.data();
            if (ud.role !== 'perusahaan' && !combined.some((c) => c.user_id === uDoc.id || c.email === ud.email)) {
              combined.push({
                id: uDoc.id,
                user_id: uDoc.id,
                company_id: ud.company_id || ud.perusahaanId || companyId,
                company_name: ud.company_name || ud.namaPT || companyName,
                full_name: ud.picName || ud.nama || ud.email,
                email: ud.email || '',
                phone: ud.telepon || '',
                role: (ud.role === 'admin_perusahaan' ? 'company_admin' : ud.role) || 'company_user',
                status: (ud.statusAkun === 'aktif' && !ud.isLocked ? 'ACTIVE' : 'SUSPENDED') as any,
                created_at: ud.created_at || ud.createdAt || new Date().toISOString()
              });
            }
          });
          setUserList(combined);
          setLoading(false);
        });

        return () => unsubLegacy();
      },
      (err) => {
        console.warn('Company users subscription warning:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [companyId, companyName]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanName || !cleanEmail) {
      setFormError('Nama lengkap dan email wajib diisi.');
      return;
    }

    if (!password || password.length < 6) {
      setFormError('Kata sandi wajib minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Create real authentication credential via secondary app
      const authUid = await createFirebaseAuthUser(cleanEmail, password);

      // 2. Save in company_users collection (entity Level 3)
      // Automatically and strictly locked to companyId
      await setDoc(doc(db, 'company_users', authUid), {
        user_id: authUid,
        company_id: companyId,
        company_name: companyName,
        full_name: cleanName,
        email: cleanEmail,
        phone: phone.trim(),
        role,
        status: 'ACTIVE',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      // 3. Save / sync in users collection
      await setDoc(doc(db, 'users', authUid), {
        uid: authUid,
        email: cleanEmail,
        role: role === 'company_admin' ? 'admin_perusahaan' : role,
        company_id: companyId,
        company_name: companyName,
        namaPT: companyName,
        picName: cleanName,
        perusahaanId: companyId,
        perusahaanName: companyName,
        jabatan: role === 'company_admin' ? 'Company Admin' : role.toUpperCase(),
        departemen: role === 'finance' ? 'Keuangan' : role === 'hr' ? 'HR / Personalia' : 'Kepatuhan Internal',
        telepon: phone.trim(),
        statusAkun: 'aktif',
        isLocked: false,
        sektor: 'Kepatuhan Internal',
        alamat: 'Indonesia',
        deskripsi: `User internal tim ${companyName}`,
        danaTersedia: 0,
        saldo: 0,
        createdAt: serverTimestamp()
      });

      // 4. Log Audit Trail
      logAuditEvent({
        actor_user_id: currentUserId || 'company_admin',
        actor_email: currentUserEmail || 'admin',
        actor_role: 'company_admin',
        company_id: companyId,
        company_name: companyName,
        action: 'COMPANY_ADMIN_CREATE_USER',
        entity_type: 'COMPANY_USER',
        entity_id: authUid,
        metadata: {
          new_user_name: cleanName,
          new_user_email: cleanEmail,
          role,
          company_id: companyId
        }
      });

      showToast(`User ${cleanName} (${cleanEmail}) berhasil didaftarkan ke ${companyName}!`);
      setIsAddModalOpen(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      setRole('company_user');
    } catch (err: any) {
      console.error('Error creating company user:', err);
      setFormError(err.message || 'Gagal menambahkan anggota tim.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (targetUser: CompanyUser) => {
    try {
      await sendPasswordReset(targetUser.email);
      showToast(`Link instruksi reset kata sandi telah dikirim ke ${targetUser.email}.`);

      logAuditEvent({
        actor_user_id: currentUserId || 'company_admin',
        actor_email: currentUserEmail || 'admin',
        actor_role: 'company_admin',
        company_id: companyId,
        company_name: companyName,
        action: 'RESET_USER_PASSWORD_REQUEST',
        entity_type: 'COMPANY_USER',
        entity_id: targetUser.user_id,
        metadata: { target_email: targetUser.email }
      });
    } catch (err: any) {
      showToast('Gagal mengirim link reset: ' + err.message, 'error');
    }
  };

  const handleToggleStatus = async (targetUser: CompanyUser) => {
    try {
      const nextStatus = targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      const uRef = doc(db, 'company_users', targetUser.user_id);
      await updateDoc(uRef, {
        status: nextStatus,
        updated_at: serverTimestamp()
      });

      const usersRef = doc(db, 'users', targetUser.user_id);
      await updateDoc(usersRef, {
        statusAkun: nextStatus === 'ACTIVE' ? 'aktif' : 'nonaktif',
        isLocked: nextStatus === 'SUSPENDED'
      });

      showToast(`Status ${targetUser.full_name} diubah menjadi ${nextStatus}.`);
    } catch (err: any) {
      showToast('Gagal mengubah status: ' + err.message, 'error');
    }
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'company_admin':
      case 'admin_perusahaan':
        return (
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold text-[10px]">
            Company Admin
          </span>
        );
      case 'finance':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-[10px]">
            Finance
          </span>
        );
      case 'hr':
        return (
          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold text-[10px]">
            HR
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-[10px]">
            Company User
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
              : 'bg-red-950/90 border-red-500/50 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Manajemen Tim & Pengguna (Users & Access)
                <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Tenant: {companyId}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Pengelolaan akun login internal perusahaan {companyName}. Seluruh akun yang ditambahkan otomatis terikat ke tenant ini.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Tambah Anggota Tim</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Nama & Email</th>
                <th className="px-4 py-3.5">Peran (Role)</th>
                <th className="px-4 py-3.5">Kontak</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Memuat data anggota tim perusahaan...
                  </td>
                </tr>
              ) : userList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 space-y-2">
                    <Users className="w-10 h-10 mx-auto text-slate-700" />
                    <p>Belum ada user tambahan terdaftar untuk perusahaan ini.</p>
                  </td>
                </tr>
              ) : (
                userList.map((u) => {
                  const isActive = u.status === 'ACTIVE';
                  const isCurrent = u.email === currentUserEmail;

                  return (
                    <tr key={u.user_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{u.full_name}</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">
                              (Anda)
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">{getRoleBadge(u.role)}</td>

                      <td className="px-4 py-3.5">
                        {u.phone ? (
                          <span className="font-mono text-slate-300 flex items-center gap-1.5 text-[11px]">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            {u.phone}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleResetPassword(u)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Kirim link reset kata sandi ke email pengguna"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>Reset Password</span>
                          </button>

                          {!isCurrent && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              }`}
                              title={isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                            >
                              {isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD COMPANY USER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Tambah Anggota Tim Perusahaan</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Tenant: {companyId}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nama Lengkap <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Rahmawati"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Email Akun Login <span className="text-amber-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="finance@ptabc.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    No. Telepon / WA
                  </label>
                  <input
                    type="tel"
                    placeholder="08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Role / Peran <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="company_user">Company User</option>
                    <option value="finance">Finance (Keuangan)</option>
                    <option value="hr">HR (Personalia)</option>
                    <option value="company_admin">Company Admin</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Kata Sandi <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="password"
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
                    Konfirmasi Kata Sandi <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Ulangi kata sandi"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Mendaftarkan...' : 'Buat Akun Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
