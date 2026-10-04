import { Env,json,getCookie,cookie } from '../_utils';
export const onRequestPost: PagesFunction<Env> = async ({request,env}) => { const sid=getCookie(request,'i360_session'); if(sid)await env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(sid).run(); return json({ok:true},200,{'Set-Cookie':cookie('i360_session','',0)}); };
