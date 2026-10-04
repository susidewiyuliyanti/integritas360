import type { PagesFunction } from '@cloudflare/workers-types';

type Env = { DB: D1Database };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const id = (prefix: string) => prefix + '_' + crypto.randomUUID();

function metadata(row: any) {
  let m: any = {};
  try { m = row.metadata_json ? JSON.parse(row.metadata_json) : {}; } catch {}
  return { ...m, id: row.id, uid: row.id, email: row.email, role: row.role, company_id: row.company_id, status: row.status };
}

function mergeReport(row: any) {
  let m: any = {};
  try { m = row.metadata_json ? JSON.parse(row.metadata_json) : {}; } catch {}
  return {
    ...m,
    id: row.id,
    companyId: row.company_id,
    judul: row.title,
    kategori: row.category,
    tipePelanggaran: row.violation_type,
    estimasiKerugian: row.estimated_loss,
    deskripsi: row.description,
    tanggalKejadian: row.incident_date,
    lokasi: row.location,
    status: row.status,
    rewardAmount: row.reward_amount,
    rewardMinAmount: row.reward_min_amount,
    rewardClaimStatus: row.reward_claim_status,
    rewardClaimed: Boolean(row.reward_claimed),
    tokenAkses: row.reporter_code,
    buktiFiles: (() => { try { return JSON.parse(row.evidence_json || '[]'); } catch { return []; } })(),
    createdAt: row.created_at,
  };
}

async function resolveCompanyId(db: D1Database, raw: string) {
  const company = await db.prepare('SELECT company_id FROM companies WHERE company_id = ? OR id = ? LIMIT 1').bind(raw, raw).first<any>();
  if (company?.company_id) return company.company_id;
  const user = await db.prepare('SELECT company_id FROM users WHERE id = ? LIMIT 1').bind(raw).first<any>();
  return user?.company_id || raw;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const collection = url.searchParams.get('collection');
    if (collection === 'users') {
      const role = url.searchParams.get('whereValue');
      const rows = role
        ? await env.DB.prepare('SELECT * FROM users WHERE role = ? ORDER BY created_at DESC').bind(role).all<any>()
        : await env.DB.prepare('SELECT * FROM users ORDER BY created_at DESC').all<any>();
      return json({ items: rows.results.map(metadata) });
    }
    if (collection === 'reports') {
      const token = url.searchParams.get('whereValue');
      if (token) {
        const row = await env.DB.prepare('SELECT * FROM reports WHERE reporter_code = ? LIMIT 1').bind(token).first<any>();
        return json({ items: row ? [mergeReport(row)] : [] });
      }
      const rows = await env.DB.prepare('SELECT * FROM reports ORDER BY created_at DESC').all<any>();
      return json({ items: rows.results.map(mergeReport) });
    }
    if (collection === 'companies') {
      const rows = await env.DB.prepare('SELECT * FROM companies ORDER BY created_at DESC').all<any>();
      return json({ items: rows.results.map((r:any) => ({...r, uid:r.id, id:r.id, namaPT:r.company_name, companyId:r.company_id, danaTersedia:r.deposit_balance, saldo:r.deposit_balance})) });
    }
    if (collection === 'transactions') {
      const rows = await env.DB.prepare('SELECT * FROM transactions ORDER BY created_at DESC').all<any>();
      return json({ items: rows.results.map((r:any) => ({...r, id:r.id})) });
    }
    if (collection === 'audit_logs') {
      const rows = await env.DB.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 150').all<any>();
      return json({ items: rows.results.map((r:any) => ({...r, id:r.id, timestamp:r.created_at, metadata: (() => { try { return JSON.parse(r.metadata_json || '{}'); } catch { return {}; } })()})) });
    }
    if (collection === 'users') {
      const idValue = url.searchParams.get('idValue');
      const rows = idValue
        ? await env.DB.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind(idValue).all<any>()
        : await env.DB.prepare('SELECT * FROM users ORDER BY created_at DESC').all<any>();
      return json({ items: rows.results.map(metadata) });
    }
    return json({ items: [] });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Request gagal' }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json<any>();
    const op = body.operation;
    const data = body.data || {};
    if (op === 'create-report') {
      const companyId = await resolveCompanyId(env.DB, String(data.companyId || ''));
      const reportId = id('rpt');
      const reportCode = 'RPT-' + crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
      const reporterCode = String(data.tokenAkses || ('WB-' + crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()));
      const evidence = JSON.stringify(data.buktiFiles || []);
      const meta = { ...data, tokenAkses: reporterCode, reportCode, report_code: reportCode };
      delete meta.buktiFiles;
      await env.DB.prepare(`INSERT INTO reports
        (id, company_id, report_code, reporter_code, title, category, violation_type, estimated_loss, description, incident_date, location, status, reward_amount, reward_min_amount, reward_claim_status, reward_claimed, evidence_json, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`)
        .bind(reportId, companyId, reportCode, reporterCode, data.judul || '', data.kategori || '', data.tipePelanggaran || 'finansial',
          Number(data.estimasiKerugian || 0), data.deskripsi || '', data.tanggalKejadian || null, data.lokasi || null, data.status || 'baru',
          Number(data.rewardAmount || 0), Number(data.rewardMinAmount || 0), 'none', evidence, JSON.stringify(meta)).run();
      return json({ id: reportId, tokenAkses: reporterCode, reportCode });
    }
    if (op === 'update') {
      if (body.collection !== 'users') return json({ error: 'Pembaruan tidak didukung' }, 400);
      const row = await env.DB.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind(String(body.id || '')).first<any>();
      if (!row) return json({ error: 'User tidak ditemukan' }, 404);
      let current: any = {};
      try { current = row.metadata_json ? JSON.parse(row.metadata_json) : {}; } catch {}
      const next = { ...current, ...data };
      await env.DB.prepare('UPDATE users SET metadata_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(JSON.stringify(next), row.id).run();
      return json({ ok: true });
    }
    if (op === 'create-claim') {
      const report = await env.DB.prepare('SELECT * FROM reports WHERE id = ? OR reporter_code = ? LIMIT 1').bind(String(data.reportId || ''), String(data.claimReportToken || '')).first<any>();
      if (!report) return json({ error: 'Laporan tidak ditemukan' }, 404);
      const txId = id('tx');
      const companyId = report.company_id;
      await env.DB.prepare(`INSERT INTO transactions (id, user_id, company_id, type, amount, status, report_id, metadata_json)
        VALUES (?, ?, ?, 'claim_reward', ?, ?, ?, ?)`)
        .bind(txId, companyId, companyId, Number(data.amount || report.reward_amount || 0), data.status || 'pending', report.id, JSON.stringify(data)).run();
      await env.DB.prepare('UPDATE reports SET reward_claim_status = ?, reward_claimed = 1, payout_wallet = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(data.status || 'pending', data.bankDetails?.accountNumber || '', report.id).run();
      return json({ id: txId });
    }
    return json({ error: 'Operasi tidak didukung' }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Request gagal' }, 500);
  }
};
