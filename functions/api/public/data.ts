import type { PagesFunction } from '@cloudflare/workers-types';

type Env = { DB: D1Database };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const id = (prefix: string) => prefix + '_' + crypto.randomUUID();
async function tenantSession(request: Request, db: D1Database) {
  const cookieHeader=request.headers.get('Cookie')||'';
  const sid=cookieHeader.split(';').map(v=>v.trim()).find(v=>v.startsWith('i360_session='))?.slice('i360_session='.length);
  if(!sid) return null;
  return await db.prepare(`SELECT u.id,u.role,u.company_id,u.status FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at>CURRENT_TIMESTAMP AND u.status='ACTIVE' LIMIT 1`).bind(decodeURIComponent(sid)).first<any>();
}
async function canReadTenant(request: Request, db: D1Database, requestedId: string) {
  const actor=await tenantSession(request,db);
  if(!actor || !actor.company_id || actor.company_id!==requestedId) return false;
  return ['perusahaan','admin_perusahaan','company_admin','finance','hr','company_user'].includes(String(actor.role||'').toLowerCase());
}


function metadata(row: any) {
  let m: any = {};
  let companyProfile: any = {};
  let userProfile: any = {};
  try { m = row.metadata_json ? JSON.parse(row.metadata_json) : {}; } catch {}
  try { companyProfile = row.company_profile_json ? JSON.parse(row.company_profile_json) : {}; } catch {}
  try { userProfile = row.user_profile_json ? JSON.parse(row.user_profile_json) : {}; } catch {}
  return { ...userProfile, ...companyProfile, ...m, id: row.id, uid: row.id, email: row.email, role: row.role, company_id: row.company_id, status: row.status };
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
    reportCode: row.report_code,
    buktiFiles: (() => { try { return JSON.parse(row.evidence_json || '[]'); } catch { return []; } })(),
    createdAt: row.created_at,
  };
}

async function resolveCompanyId(db: D1Database, raw: string) {
  const value = String(raw || '').trim();
  if (!value) return '';
  const company = await db.prepare('SELECT company_id FROM companies WHERE company_id = ? OR id = ? LIMIT 1').bind(value, value).first<any>();
  if (company?.company_id) return company.company_id;
  const user = await db.prepare('SELECT company_id FROM users WHERE id = ? LIMIT 1').bind(value).first<any>();
  return user?.company_id || value;
}

async function companyExists(db: D1Database, companyId: string) {
  const row = await db.prepare('SELECT id FROM companies WHERE company_id = ? OR id = ? LIMIT 1').bind(companyId, companyId).first<any>();
  if (row) return true;
  const user = await db.prepare('SELECT id FROM users WHERE company_id = ? OR id = ? LIMIT 1').bind(companyId, companyId).first<any>();
  return Boolean(user);
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const collection = url.searchParams.get('collection');
    const whereField = url.searchParams.get('whereField');
    const whereValue = url.searchParams.get('whereValue');
    const idValue = url.searchParams.get('idValue');
    const companyIdParam = url.searchParams.get('companyId');

    if (collection === 'users') {
      if (idValue) {
        const actor=await tenantSession(request,env.DB);
        const row = actor?.company_id
          ? await env.DB.prepare('SELECT users.*, users.profile_json AS user_profile_json, companies.profile_json AS company_profile_json FROM users LEFT JOIN companies ON companies.company_id=users.company_id WHERE users.id = ? AND users.company_id = ? LIMIT 1').bind(idValue,actor.company_id).first<any>()
          : null;
        return json({ items: row ? [metadata(row)] : [] });
      }
      if (whereField === 'company_id' && whereValue) {
        if (!(await canReadTenant(request, env.DB, whereValue))) return json({ error: 'Akses tenant ditolak' }, 403);
        const rows = await env.DB.prepare('SELECT users.*, users.profile_json AS user_profile_json, companies.profile_json AS company_profile_json FROM users LEFT JOIN companies ON companies.company_id=users.company_id WHERE users.company_id = ? ORDER BY users.created_at DESC').bind(whereValue).all<any>();
        return json({ items: rows.results.map(metadata) });
      }
      if (whereField === 'role' && whereValue) {
        // User discovery by role is not a public operation; Owner uses /api/admin/overview.
        return json({ error: 'Pencarian pengguna berdasarkan role tidak tersedia secara publik.' }, 403);
      }
      return json({ error: 'Tenant scope diperlukan' }, 400);
    }

    if (collection === 'reports') {
      if (whereField === 'tokenAkses' && whereValue) {
        const row = await env.DB.prepare('SELECT * FROM reports WHERE reporter_code = ? LIMIT 1').bind(whereValue).first<any>();
        return json({ items: row ? [mergeReport(row)] : [] });
      }
      if (companyIdParam) {
        const companyId = await resolveCompanyId(env.DB, companyIdParam);
        if (!(await canReadTenant(request, env.DB, companyId))) return json({ error: 'Akses tenant ditolak' }, 403);
        const rows = await env.DB.prepare('SELECT * FROM reports WHERE company_id = ? ORDER BY created_at DESC').bind(companyId).all<any>();
        return json({ items: rows.results.map(mergeReport) });
      }
      return json({ error: 'Tenant scope diperlukan' }, 400);
    }

    if (collection === 'companies') {
      if (idValue) {
        const actor = await tenantSession(request, env.DB);
        const row = await env.DB.prepare('SELECT * FROM companies WHERE id = ? OR company_id = ? LIMIT 1').bind(idValue, idValue).first<any>();
        // A company profile is private to its own authenticated tenant.
        if (row && (!actor?.company_id || actor.company_id !== row.company_id)) {
          return json({ error: 'Akses tenant ditolak' }, 403);
        }
        let meta: any = {};
        try { meta = row?.metadata_json ? JSON.parse(row.metadata_json) : {}; } catch {}
        return json({
          items: row ? [{
            ...meta,
            ...row,
            uid: row.company_id || row.id,
            id: row.company_id || row.id,
            namaPT: row.company_name || meta.namaPT || meta.company_name || '',
            company_name: row.company_name || meta.company_name || meta.namaPT || '',
            companyId: row.company_id || row.id,
            company_id: row.company_id || row.id,
            // D1 canonical balance fields are the source of truth.
            deposit_balance: Number(row.deposit_balance || 0),
            locked_balance: Number(row.locked_balance || 0),
            danaTersedia: Number(row.deposit_balance || 0),
            danaTerkunci: Number(row.locked_balance || 0),
            saldo: Number(row.deposit_balance || 0),
            rewardBalance: Number(row.deposit_balance || 0),
            saldoReward: Number(row.deposit_balance || 0),
          }] : []
        });
      }
      return json({ error: 'Tenant scope diperlukan' }, 400);
    }

    if (collection === 'transactions') {
      if (companyIdParam) {
        const companyId = await resolveCompanyId(env.DB, companyIdParam);
        if (!(await canReadTenant(request, env.DB, companyId))) return json({ error: 'Akses tenant ditolak' }, 403);
        const rows = await env.DB.prepare('SELECT * FROM transactions WHERE company_id = ? ORDER BY created_at DESC').bind(companyId).all<any>();
        return json({ items: rows.results.map((r:any) => { let meta:any={}; try { meta=JSON.parse(r.metadata_json||'{}'); } catch {} return {...meta,...r,id:r.id}; }) });
      }
      return json({ error: 'Tenant scope diperlukan' }, 400);
    }

    if (collection === 'audit_logs') {
      if (companyIdParam) {
        const companyId = await resolveCompanyId(env.DB, companyIdParam);
        if (!(await canReadTenant(request, env.DB, companyId))) return json({ error: 'Akses tenant ditolak' }, 403);
        const rows = await env.DB.prepare('SELECT * FROM audit_logs WHERE company_id = ? ORDER BY created_at DESC LIMIT 150').bind(companyId).all<any>();
        return json({ items: rows.results.map((r:any) => ({...r, id:r.id, timestamp:r.created_at, metadata: (() => { try { return JSON.parse(r.metadata_json || '{}'); } catch { return {}; } })()})) });
      }
      return json({ error: 'Tenant scope diperlukan' }, 400);
    }

    return json({ items: [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Request gagal';
    if (/UNIQUE constraint failed:\s*transactions\.report_id/i.test(message)) {
      return json({ error: 'Klaim reward untuk ID laporan ini sudah pernah tercatat.' }, 409);
    }
    return json({ error: message }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json<any>();
    const op = body.operation;
    const data = body.data || {};

    if (op === 'create-report') {
      const requestedCompany = String(data.companyId || '').trim();
      if (!requestedCompany) return json({ error: 'ID tenant/perusahaan wajib diisi' }, 400);

      const companyId = await resolveCompanyId(env.DB, requestedCompany);
      if (!(await companyExists(env.DB, companyId))) {
        return json({ error: 'Tenant perusahaan tidak ditemukan' }, 404);
      }

      const reportId = id('rpt');
      const reportCode = 'RPT-' + crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
      const reporterCode = String(data.tokenAkses || ('WB-' + crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()));
      const evidence = JSON.stringify(data.buktiFiles || []);
      const meta = { ...data, companyId, tokenAkses: reporterCode, reportCode, report_code: reportCode };
      delete meta.buktiFiles;

      await env.DB.prepare(`INSERT INTO reports
        (id, company_id, report_code, reporter_code, title, category, violation_type, estimated_loss, description, incident_date, location, status, reward_amount, reward_min_amount, reward_claim_status, reward_claimed, evidence_json, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`)
        .bind(
          reportId, companyId, reportCode, reporterCode, data.judul || '', data.kategori || '', data.tipePelanggaran || 'finansial',
          Number(data.estimasiKerugian || 0), data.deskripsi || '', data.tanggalKejadian || null, data.lokasi || null, data.status || 'baru',
          Number(data.rewardAmount || 0), Number(data.rewardMinAmount || 0), 'none', evidence, JSON.stringify(meta)
        ).run();

      return json({ id: reportId, tokenAkses: reporterCode, reportCode, companyId });
    }

    if (op === 'update') {
      // Tenant user/report updates must go through /api/company/data, which
      // derives company_id from the authenticated session and enforces tenant scope.
      return json({ error: 'Pembaruan harus melalui endpoint tenant terautentikasi.' }, 403);
    }

    if (op === 'create-claim') {
      const reportId = String(data.reportId || '');
      const claimToken = String(data.claimReportToken || '');
      const report = await env.DB.prepare('SELECT * FROM reports WHERE id = ? OR reporter_code = ? LIMIT 1')
        .bind(reportId, claimToken).first<any>();
      if (!report) return json({ error: 'Laporan tidak ditemukan' }, 404);

      let reportMeta:any = {};
      try { reportMeta = JSON.parse(report.metadata_json || '{}'); } catch {}
      if (String(report.status || '').toLowerCase() !== 'selesai' || !(reportMeta.rewardReleased === true || reportMeta.rewardReleased === 1)) {
        return json({ error: 'Reward belum dirilis. Klaim tersedia setelah laporan VALID dan reward dirilis.' }, 409);
      }
      if (Number(report.reward_claimed || 0) === 1 || ['pending','selesai','diproses'].includes(String(report.reward_claim_status || '').toLowerCase())) {
        return json({ error: 'Klaim reward untuk laporan ini sudah diajukan.' }, 409);
      }
      const rewardAmount = Number(report.reward_amount || reportMeta.rewardAmount || 0);
      if (!Number.isFinite(rewardAmount) || rewardAmount <= 0) return json({ error: 'Nominal reward belum tersedia.' }, 409);
      const txId = id('tx');
      const companyId = report.company_id;
      const claimMeta = JSON.stringify({ ...data, amount: rewardAmount, reportId: report.id, rewardReleased: true });
      const results = await env.DB.batch([
        env.DB.prepare(`INSERT INTO transactions (id, user_id, company_id, type, amount, status, report_id, metadata_json)
          SELECT ?, ?, ?, 'claim_reward', ?, 'pending', ?, ?
          WHERE EXISTS (SELECT 1 FROM reports WHERE id=? AND company_id=? AND lower(status)='selesai'
            AND COALESCE(reward_claimed,0)=0 AND lower(COALESCE(reward_claim_status,'none')) NOT IN ('pending','selesai','diproses')
            AND json_extract(metadata_json,'$.rewardReleased') IN (1,'true')
            AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.report_id=reports.id AND t.type='claim_reward'))`)
          .bind(txId, companyId, companyId, rewardAmount, report.id, claimMeta, report.id, companyId),
        env.DB.prepare(`UPDATE reports SET reward_claim_status='pending', reward_claimed=1, payout_wallet=?, updated_at=CURRENT_TIMESTAMP
          WHERE id=? AND company_id=? AND lower(status)='selesai' AND COALESCE(reward_claimed,0)=0
          AND lower(COALESCE(reward_claim_status,'none')) NOT IN ('pending','selesai','diproses')
          AND json_extract(metadata_json,'$.rewardReleased') IN (1,'true')
          AND EXISTS (SELECT 1 FROM transactions t WHERE t.report_id=reports.id AND t.type='claim_reward'))`)
          .bind(data.bankDetails?.accountNumber || '', report.id, companyId)
      ]);
      const inserted = Number((results?.[0] as any)?.meta?.changes ?? (results?.[0] as any)?.changes ?? 0);
      if (!inserted) return json({ error: 'Klaim sudah diajukan atau reward belum tersedia.' }, 409);
      return json({ id: txId, amount: rewardAmount, status: 'pending' });
    }

    return json({ error: 'Operasi tidak didukung' }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Request gagal' }, 500);
  }
};
