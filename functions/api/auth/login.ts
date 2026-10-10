import { Env,json,cookie,verifyPassword,randomId,hashPassword } from '../_utils';

const OWNER_EMAIL = 'support.integritas360@gmail.com';

export const onRequestPost: PagesFunction<Env> = async ({request,env}) => {
  let stage = 'start';
  try {
    stage = 'parse';
    const raw = await request.text();
    let body: {action?:string;email?:string;password?:string;token?:string};
    try { body = JSON.parse(raw || '{}'); }
    catch (parseError) {
      console.error('AUTH_LOGIN_PARSE_ERROR', parseError);
      return json({error:'Format data login tidak valid.',code:'AUTH_LOGIN_PARSE_ERROR'},400);
    }

    // One-time Owner recovery. The token is supplied by the administrator and is never stored in source code.
    if (body.action === 'bootstrap-owner') {
      if (!env.BOOTSTRAP_TOKEN) return json({error:'Bootstrap belum dikonfigurasi di Cloudflare Pages.'},503);
      if (!body.token || body.token !== env.BOOTSTRAP_TOKEN) return json({error:'Bootstrap token tidak valid.'},401);
      const ownerPassword = String(body.password || '');
      if (ownerPassword.length < 12) return json({error:'Kata sandi Owner harus minimal 12 karakter.'},400);

      const existingOwner = await env.DB.prepare(
        "SELECT id FROM users WHERE lower(email) = ? AND role = 'owner' LIMIT 1"
      ).bind(OWNER_EMAIL).first<any>();
      if (existingOwner) return json({error:'Akun Owner sudah tersedia. Bootstrap ditutup.'},409);

      const existingAccount = await env.DB.prepare(
        'SELECT id FROM users WHERE lower(email) = ? LIMIT 1'
      ).bind(OWNER_EMAIL).first<any>();
      const {salt,hash} = await hashPassword(ownerPassword);
      if (existingAccount) {
        await env.DB.prepare(
          "UPDATE users SET password_hash=?, password_salt=?, role='owner', company_id=NULL, status='ACTIVE', updated_at=CURRENT_TIMESTAMP WHERE id=?"
        ).bind(hash,salt,existingAccount.id).run();
      } else {
        await env.DB.prepare(
          "INSERT INTO users (id,email,password_hash,password_salt,role,company_id,status,full_name,created_at,updated_at) VALUES (?,?,?,?,'owner',NULL,'ACTIVE','INTEGRITAS360 Owner',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)"
        ).bind(randomId('usr'),OWNER_EMAIL,hash,salt).run();
      }
      return json({ok:true,message:'Akun Owner berhasil disiapkan. Silakan login.',email:OWNER_EMAIL,role:'owner',status:'ACTIVE'});
    }

    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) return json({error:'Email dan kata sandi wajib diisi.'},400);

    stage = 'query-user';
    const user = await env.DB
      .prepare('SELECT id,email,password_hash,password_salt,role,company_id,status FROM users WHERE lower(email)=? LIMIT 1')
      .bind(email)
      .first<any>();

    if (!user || user.status !== 'ACTIVE') return json({error:'Email atau kata sandi tidak valid.'},401);

    const designatedOwner = await env.DB.prepare(
      "SELECT id FROM users WHERE lower(email) = ? AND role = 'owner' LIMIT 1"
    ).bind(OWNER_EMAIL).first<any>();
    if (designatedOwner && ((user.role === 'owner' && email !== OWNER_EMAIL) || (email === OWNER_EMAIL && user.role !== 'owner'))) {
      return json({error:'Email atau kata sandi tidak valid.'},401);
    }

    stage = 'verify-password';
    const valid = await verifyPassword(password,user.password_salt,user.password_hash);
    if (!valid) return json({error:'Email atau kata sandi tidak valid.'},401);

    stage = 'create-session';
    const sessionId = randomId('sess');
    const ttl = Math.max(3600,Number(env.SESSION_TTL_SECONDS || 604800));
    const expiresAt = new Date(Date.now()+ttl*1000).toISOString();

    await env.DB
      .prepare('INSERT INTO sessions(id,user_id,expires_at,created_at) VALUES(?,?,?,CURRENT_TIMESTAMP)')
      .bind(sessionId,user.id,expiresAt)
      .run();

    stage = 'update-last-login';
    await env.DB.prepare('UPDATE users SET last_login_at=CURRENT_TIMESTAMP WHERE id=?').bind(user.id).run();

    return json(
      {ok:true,user:{id:user.id,email:user.email,role:user.role,company_id:user.company_id}},
      200,
      {'Set-Cookie':cookie('i360_session',sessionId,ttl)}
    );
  } catch (error) {
    console.error('AUTH_LOGIN_ERROR', {stage,error});
    return json({error:'Terjadi kesalahan server saat login.',code:'AUTH_LOGIN_ERROR',stage},500);
  }
};
