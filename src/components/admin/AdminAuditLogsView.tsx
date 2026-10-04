import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../lib/publicApi';
import { AuditLog } from '../../types';
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  UserCheck,
  CreditCard,
  Settings,
  Clock,
  Calendar,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface AdminAuditLogsViewProps {
  companyIdFilter?: string;
}

export const AdminAuditLogsView: React.FC<AdminAuditLogsViewProps> = ({ companyIdFilter }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');

  useEffect(() => {
    setLoading(true);
    let q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(150));

    if (companyIdFilter) {
      q = query(
        collection(db, 'audit_logs'),
        where('company_id', '==', companyIdFilter),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: AuditLog[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            audit_log_id: d.audit_log_id || docSnap.id,
            actor_user_id: d.actor_user_id || 'System',
            actor_email: d.actor_email || '-',
            actor_role: d.actor_role || 'system',
            company_id: d.company_id,
            company_name: d.company_name,
            action: d.action || 'ACTIVITY',
            entity_type: d.entity_type || 'SYSTEM',
            entity_id: d.entity_id || '-',
            timestamp: d.timestamp,
            metadata: d.metadata || {}
          });
        });
        setLogs(list);
        setLoading(false);
      },
      (error) => {
        console.warn('Audit logs listener note:', error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [companyIdFilter]);

  const filteredLogs = logs.filter((log) => {
    if (entityFilter !== 'ALL' && log.entity_type !== entityFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      (log.actor_email || '').toLowerCase().includes(term) ||
      (log.company_name || '').toLowerCase().includes(term) ||
      (log.company_id || '').toLowerCase().includes(term) ||
      (log.audit_log_id || '').toLowerCase().includes(term)
    );
  });

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'COMPANY':
        return <Building2 className="w-3.5 h-3.5 text-blue-400" />;
      case 'COMPANY_USER':
        return <UserCheck className="w-3.5 h-3.5 text-cyan-400" />;
      case 'REPORT':
        return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case 'FINANCE':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Settings className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (action.includes('SUSPEND') || action.includes('DELETE') || action.includes('LOCK')) return 'bg-red-500/10 text-red-400 border-red-500/30';
    if (action.includes('UPDATE') || action.includes('RESET')) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return 'Baru saja';
    if (ts.toDate) {
      return ts.toDate().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return new Date(ts).toLocaleString('id-ID');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Audit Logs & Rekam Jejak Sistem
              <span className="text-xs font-mono font-normal text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full">
                {logs.length} Aktivitas Tercatat
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Audit trail aktivitas pembuatan entitas, kredensial pengguna, otorisasi, dan mutasi data platform.
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari aktivitas / aktor / PT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Semua Entitas</option>
            <option value="COMPANY">Company</option>
            <option value="COMPANY_USER">Company User</option>
            <option value="REPORT">Report</option>
            <option value="FINANCE">Finance</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>
      </div>

      {/* Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5 font-bold">Waktu & Log ID</th>
              <th className="px-5 py-3.5 font-bold">Aktivitas (Action)</th>
              <th className="px-5 py-3.5 font-bold">Aktor (Pengguna)</th>
              <th className="px-5 py-3.5 font-bold">Entitas / Tenant</th>
              <th className="px-5 py-3.5 font-bold">Detail Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Memuat catatan audit...</span>
                  </div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  Belum ada catatan aktivitas yang sesuai filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id || log.audit_log_id} className="hover:bg-slate-800/40 transition-colors">
                  {/* Timestamp & ID */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-white font-medium text-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 block mt-0.5">
                      {log.audit_log_id}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border ${getActionBadgeColor(
                        log.action
                      )}`}
                    >
                      {getEntityIcon(log.entity_type)}
                      {log.action}
                    </span>
                  </td>

                  {/* Actor */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="font-semibold text-white">{log.actor_email || log.actor_user_id}</div>
                    <span className="text-[10px] text-slate-400 font-mono capitalize">
                      Peran: {log.actor_role}
                    </span>
                  </td>

                  {/* Entity / Tenant */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {log.company_name || log.company_id ? (
                      <div>
                        <div className="font-bold text-amber-300">{log.company_name || 'PT'}</div>
                        {log.company_id && (
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            {log.company_id}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 font-mono text-xs">-</span>
                    )}
                  </td>

                  {/* Metadata */}
                  <td className="px-5 py-3.5">
                    <div className="text-[11px] text-slate-300 max-w-xs truncate font-mono">
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        JSON.stringify(log.metadata)
                      ) : (
                        <span className="text-slate-500">ID: {log.entity_id}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
