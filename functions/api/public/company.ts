import type { PagesFunction } from '@cloudflare/workers-types';

type Env = { DB: D1Database };
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const requestedId = String(url.searchParams.get('companyId') || '').trim();
    if (!requestedId) return json({ error: 'ID perusahaan wajib diisi.' }, 400);

    // The QR may contain canonical company_id or an older company row/user ID.
    let row = await env.DB.prepare(`
      SELECT c.id, c.company_id, c.company_name, c.deposit_balance, c.locked_balance,
             c.status, c.metadata_json, c.profile_json
      FROM companies c
      WHERE c.company_id = ? OR c.id = ?
      LIMIT 1
    `).bind(requestedId, requestedId).first<any>();

    if (!row) {
      row = await env.DB.prepare(`
        SELECT c.id, c.company_id, c.company_name, c.deposit_balance, c.locked_balance,
               c.status, c.metadata_json, c.profile_json
        FROM users u
        JOIN companies c ON c.company_id = u.company_id
        WHERE u.id = ? OR u.company_id = ?
        LIMIT 1
      `).bind(requestedId, requestedId).first<any>();
    }

    if (!row || !row.company_id) {
      return json({ error: 'Company name not registered' }, 404);
    }

    let metadata: any = {};
    let profile: any = {};
    try { metadata = row.metadata_json ? JSON.parse(row.metadata_json) : {}; } catch {}
    try { profile = row.profile_json ? JSON.parse(row.profile_json) : {}; } catch {}
    const companyName = String(row.company_name || profile.namaPT || profile.company_name || metadata.namaPT || metadata.company_name || '').trim();
    if (!companyName) return json({ error: 'Nama perusahaan belum terdaftar di database.' }, 404);

    // Expose only fields intended to appear on the public company QR/report page.
    return json({
      ok: true,
      company: {
        company_id: row.company_id,
        company_name: companyName,
        deposit_balance: Number(row.deposit_balance || 0),
        sector: String(profile.sektor || profile.sector || metadata.sektor || metadata.sector || 'Kepatuhan & Integritas'),
        status: String(row.status || 'ACTIVE')
      }
    });
  } catch (error) {
    console.error('PUBLIC_COMPANY_LOOKUP', error);
    return json({ error: 'Gagal memuat data perusahaan dari database.' }, 500);
  }
};
