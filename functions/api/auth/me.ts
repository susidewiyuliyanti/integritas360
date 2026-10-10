import { Env,json,getCookie } from '../_utils';

export const onRequestGet: PagesFunction<Env> = async ({request,env}) => {
  const sid = getCookie(request,'i360_session');
  if (!sid) return json({ok:false,user:null},401);

  try {
    const row = await env.DB
      .prepare('SELECT u.id,u.email,u.role,u.company_id,u.status FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at>CURRENT_TIMESTAMP LIMIT 1')
      .bind(sid)
      .first<any>();

    if (!row) return json({ok:false,user:null},401);
    return json({ok:true,user:row});
  } catch (error) {
    console.error('AUTH_ME_ERROR', error);
    return json({ok:false,user:null,error:'Gagal memverifikasi sesi login.'},500);
  }
};
