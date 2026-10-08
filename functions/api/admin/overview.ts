import type { PagesFunction } from '@cloudflare/workers-types';
import { json, getCookie, Env } from '../_utils';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const sid = getCookie(request, 'i360_session');
    if (!sid) return json({ error: 'Unauthorized' }, 401);

    const user = await env.DB.prepare(`
      SELECT u.id, u.email, u.role, u.status
      FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP LIMIT 1
    `).bind(sid).first<any>();

    if (!user) return json({ error: 'Unauthorized' }, 401);
    if (String(user.role || '').toLowerCase() !== 'owner') return json({ error: 'Forbidden' }, 403);

    const [companies, reports, transactions, auditLogs] = await Promise.all([
      env.DB.prepare('SELECT * FROM companies ORDER BY created_at DESC LIMIT 1000').all<any>(),
      env.DB.prepare('SELECT * FROM reports ORDER BY created_at DESC LIMIT 2000').all<any>(),
      env.DB.prepare('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 3000').all<any>(),
      env.DB.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1000').all<any>(),
    ]);

    const companyRows = (companies.results || []).map((c:any) => {
      let meta:any = {};
      try { meta = JSON.parse(c.metadata_json || '{}'); } catch {}
      return { ...meta, ...c, id: c.id, company_id: c.company_id || c.id, company_name: c.company_name || meta.namaPT || meta.company_name, deposit_balance: c.deposit_balance ?? meta.danaTersedia ?? meta.saldo ?? 0, locked_balance: c.locked_balance ?? meta.danaTerkunci ?? 0 };
    });
    const reportRows = (reports.results || []).map((r:any) => {
      let meta:any = {};
      try { meta = JSON.parse(r.metadata_json || '{}'); } catch {}
      return { ...meta, ...r, company_id: r.company_id, report_code: r.report_code, title: r.title || meta.judul, category: r.category || meta.kategori, estimated_loss: r.estimated_loss ?? meta.estimasiKerugian ?? 0 };
    });
    const txRows = (transactions.results || []).map((t:any) => {
      let meta:any = {};
      try { meta = JSON.parse(t.metadata_json || '{}'); } catch {}
      return { ...meta, ...t, company_id: t.company_id, type: t.type, amount: t.amount, status: t.status };
    });
    const auditRows = (auditLogs.results || []).map((a:any) => {
      let meta:any = {};
      try { meta = JSON.parse(a.metadata_json || '{}'); } catch {}
      return { ...meta, ...a, metadata: meta };
    });

    return json({ ok: true, viewer: { id: user.id, email: user.email, role: user.role }, companies: companyRows, reports: reportRows, transactions: txRows, auditLogs: auditRows });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Gagal memuat ringkasan admin' }, 500);
  }
};
