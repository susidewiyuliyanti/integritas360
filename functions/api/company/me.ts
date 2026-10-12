import { Env, json, getCookie } from '../_utils';

const parseObject = (value: unknown): Record<string, any> => {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, any>;
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const sid = getCookie(request, 'i360_session');
    if (!sid) return json({ ok: false, error: 'Unauthorized' }, 401);

    const user = await env.DB.prepare(`
      SELECT u.id, u.email, u.role, u.company_id, u.status, u.full_name, u.phone,
             u.metadata_json AS user_metadata_json, u.profile_json AS user_profile_json,
             c.company_id AS cid, c.company_name, c.email AS company_email, c.status AS company_status,
             c.deposit_balance, c.locked_balance,
             c.metadata_json AS company_metadata_json, c.profile_json AS company_profile_json
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN companies c ON c.company_id = u.company_id
      WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.status = 'ACTIVE'
      LIMIT 1
    `).bind(sid).first<any>();

    if (!user) return json({ ok: false, error: 'Unauthorized' }, 401);

    const userMetadata = parseObject(user.user_metadata_json);
    const userProfile = parseObject(user.user_profile_json);
    const companyMetadata = parseObject(user.company_metadata_json);
    const companyProfile = parseObject(user.company_profile_json);
    const isAuditor = String(user.role || '').toLowerCase() === 'auditor';
    const companyId = user.cid ? String(user.cid) : null;
    const canonicalName = String(user.company_name || companyProfile.namaPT || companyMetadata.namaPT || '').trim();

    // D1 companies.profile_json is authoritative for tenant-wide profile fields.
    // An auditor's personal fields remain in users.profile_json and must not be
    // overwritten by the company profile.
    const profile: Record<string, any> = {
      ...userMetadata,
      ...(isAuditor ? companyProfile : userProfile),
      ...(isAuditor ? userProfile : companyMetadata),
      ...(isAuditor ? {} : companyProfile),
      uid: String(user.id),
      id: String(user.id),
      email: String(user.email || ''),
      role: String(user.role || ''),
      company_id: companyId,
      companyId,
      perusahaanId: companyId,
      company_name: canonicalName,
      perusahaanName: canonicalName,
      namaPT: isAuditor ? String(userProfile.namaPT || user.full_name || canonicalName) : canonicalName,
      picName: isAuditor
        ? (userProfile.picName || user.full_name || user.email || '')
        : (companyProfile.picName || companyMetadata.picName || user.full_name || user.email || ''),
      telepon: isAuditor
        ? (userProfile.telepon || user.phone || '')
        : (companyProfile.telepon || companyMetadata.telepon || user.phone || ''),
    };

    const company = companyId ? {
      ...companyMetadata,
      ...companyProfile,
      company_id: companyId,
      companyId,
      company_name: canonicalName,
      namaPT: canonicalName,
      perusahaanName: canonicalName,
      email: String(user.company_email || user.email || ''),
      status: String(user.company_status || ''),
      deposit_balance: Number(user.deposit_balance || 0),
      locked_balance: Number(user.locked_balance || 0),
    } : null;

    const companyUser = companyId
      ? await env.DB.prepare('SELECT * FROM company_users WHERE user_id = ? AND company_id = ? LIMIT 1')
          .bind(user.id, companyId).first<any>()
      : null;

    return json({ ok: true, profile, company, companyUser });
  } catch (e) {
    console.error('COMPANY_ME', e);
    return json({ ok: false, error: 'Gagal mengambil profil perusahaan dari D1.' }, 500);
  }
};
