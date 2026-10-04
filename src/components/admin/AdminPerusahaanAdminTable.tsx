import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  MessageCircle,
  ExternalLink,
  Lock,
  Unlock,
  KeyRound,
  Users
} from 'lucide-react';
import { UserProfile, CompanyUser } from '../../types';

interface AdminPerusahaanAdminTableProps {
  adminList: any[];
  perusahaanList: any[];
  onAddAdmin: () => void;
  onEditAdmin: (admin: any) => void;
  onToggleStatus: (admin: any) => void;
  onDeleteAdmin: (admin: any) => void;
  onResetPassword?: (admin: any) => void;
}

export const AdminPerusahaanAdminTable: React.FC<AdminPerusahaanAdminTableProps> = ({
  adminList,
  perusahaanList,
  onAddAdmin,
  onEditAdmin,
  onToggleStatus,
  onDeleteAdmin,
  onResetPassword
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'>('all');

  // Filter logic
  const filteredUsers = adminList.filter((user) => {
    const fullName = user.full_name || user.picName || '';
    const email = user.email || '';
    const phone = user.phone || user.telepon || '';
    const cName = user.company_name || user.namaPT || user.perusahaanName || '';
    const cId = user.company_id || user.perusahaanId || '';
    const uRole = user.role || 'company_admin';
    const rawStatus = (user.status || (user.isLocked || user.statusAkun === 'nonaktif' ? 'SUSPENDED' : 'ACTIVE')).toUpperCase();

    // Search
    const term = searchTerm.toLowerCase();
    const searchMatch =
      !term ||
      fullName.toLowerCase().includes(term) ||
      email.toLowerCase().includes(term) ||
      cName.toLowerCase().includes(term) ||
      cId.toLowerCase().includes(term) ||
      phone.includes(term);

    // Company filter
    const companyMatch =
      companyFilter === 'all' ||
      cId === companyFilter ||
      user.uid === companyFilter ||
      cName === companyFilter;

    // Role filter
    const roleMatch = roleFilter === 'all' || uRole === roleFilter;

    // Status filter
    const statusMatch = statusFilter === 'all' || rawStatus === statusFilter;

    return searchMatch && companyMatch && roleMatch && statusMatch;
  });

  return (
    <div className="space-y-4">
      {/* Top Bar: Search, Filters & Add Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama user, email, PT, telepon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Filter Perusahaan */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Semua Perusahaan ({perusahaanList.length})</option>
              {perusahaanList.map((pt) => {
                const id = pt.company_id || pt.uid;
                const name = pt.company_name || pt.namaPT;
                return (
                  <option key={id} value={id}>
                    {name} ({id})
                  </option>
                );
              })}
            </select>

            {/* Filter Role */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Semua Role</option>
              <option value="company_admin">Company Admin</option>
              <option value="admin_perusahaan">Admin Perusahaan</option>
              <option value="finance">Finance</option>
              <option value="hr">HR</option>
              <option value="company_user">Company User</option>
            </select>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Semua Status</option>
              <option value="ACTIVE">ACTIVE (Aktif)</option>
              <option value="SUSPENDED">SUSPENDED (Ditangguhkan)</option>
              <option value="INACTIVE">INACTIVE (Nonaktif)</option>
            </select>
          </div>
        </div>

        {/* Action Button: Add User */}
        <button
          onClick={onAddAdmin}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Company User</span>
        </button>
      </div>

      {/* Admin Perusahaan Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">All Company Users (Akun Login Perusahaan)</h3>
              <p className="text-[11px] text-slate-400">
                Level 3: Pengguna login (Company Admin, Finance, HR) yang terikat langsung ke tenant perusahaan
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            {filteredUsers.length} Pengguna
          </span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-300">Belum Ada Akun Pengguna Perusahaan</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Setelah mendaftarkan perusahaan di menu Companies, buat akun login pengguna pertama di sini untuk diserahkan ke pihak perusahaan.
            </p>
            <button
              onClick={onAddAdmin}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Akun Company User Sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Nama Lengkap & Email</th>
                  <th className="py-3.5 px-4">Perusahaan (Tenant)</th>
                  <th className="py-3.5 px-4">Role / Peran</th>
                  <th className="py-3.5 px-4">Kontak / Telepon</th>
                  <th className="py-3.5 px-4">Status Akun</th>
                  <th className="py-3.5 px-4 text-right">Kelola & Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredUsers.map((u) => {
                  const fullName = u.full_name || u.picName || 'Company User';
                  const email = u.email || '-';
                  const phone = u.phone || u.telepon || '';
                  const cName = u.company_name || u.namaPT || u.perusahaanName || 'Perusahaan';
                  const cId = u.company_id || u.perusahaanId || '-';
                  const rawStatus = (u.status || (u.isLocked || u.statusAkun === 'nonaktif' ? 'SUSPENDED' : 'ACTIVE')).toUpperCase();
                  const isAktif = rawStatus === 'ACTIVE';

                  return (
                    <tr key={u.id || u.user_id || u.uid} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                            {fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {fullName}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span className="font-mono">{email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Company */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 font-semibold text-xs">
                          <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{cName}</span>
                        </div>
                        <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                          {cId}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-[11px]">
                          {u.role === 'company_admin' || u.role === 'admin_perusahaan'
                            ? 'Company Admin'
                            : u.role === 'finance'
                            ? 'Finance'
                            : u.role === 'hr'
                            ? 'HR'
                            : 'Company User'}
                        </span>
                        {u.jabatan && (
                          <div className="text-[10px] text-slate-500 mt-0.5">{u.jabatan}</div>
                        )}
                      </td>

                      {/* Kontak */}
                      <td className="py-3.5 px-4">
                        {phone ? (
                          <a
                            href={`https://wa.me/${phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono transition-colors"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-400" />
                            <span>{phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-500 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isAktif
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-red-500/10 border-red-500/30 text-red-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isAktif ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                            }`}
                          />
                          {rawStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Reset Password */}
                          {onResetPassword && (
                            <button
                              onClick={() => onResetPassword(u)}
                              title="Reset Kata Sandi Akun"
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors cursor-pointer"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Toggle Status */}
                          <button
                            onClick={() => onToggleStatus(u)}
                            title={isAktif ? 'Suspend / Nonaktifkan Akun' : 'Aktifkan Akun'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isAktif
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {isAktif ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => onEditAdmin(u)}
                            title="Edit Data User & Penugasan"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Admin */}
                          <button
                            onClick={() => onDeleteAdmin(u)}
                            title="Hapus Akun User"
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
    </div>
  );
};
