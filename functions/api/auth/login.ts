import { Env,json,cookie,verifyPassword,randomId } from '../_utils';

export const onRequestPost: PagesFunction<Env> = async ({request,env}) => {
  let stage = 'start';
  try {
    stage = 'parse';
    const body = await request.json<{email?:string;password?:string}>();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) return json({error:'Email dan kata sandi wajib diisi.'},400);

    stage = 'query-user';
    const user = await env.DB
      .prepare('SELECT id,email,password_hash,password_salt,role,company_id,status FROM users WHERE lower(email)=? LIMIT 1')
      .bind(email)
      .first<any>();

    if (!user || user.status !== 'ACTIVE') {
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
    await env.DB
      .prepare('UPDATE users SET last_login_at=CURRENT_TIMESTAMP WHERE id=?')
      .bind(user.id)
      .run();

    return json(
      {user:{id:user.id,email:user.email,role:user.role,company_id:user.company_id}},
      200,
      {'Set-Cookie':cookie('i360_session',sessionId,ttl)}
    );
  } catch (error) {
    console.error('AUTH_LOGIN_ERROR', {stage,error});
    return json({error:'Terjadi kesalahan server saat login.',code:'AUTH_LOGIN_ERROR',stage},500);
  }
};
