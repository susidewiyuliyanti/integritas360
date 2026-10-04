import { Env, json, getCookie, randomId, hashPassword } from '../_utils';

async function sessionUser(request: Request, env: Env) {
  const sid = getCookie(request, 'i360_session');
  if (!sid) return null;
  const row = await env.DB.prepare(`
    SELECT u.id,u.email,u.role,u.company_id,u.status,u.full_name,u.phone,c.company_name
    FROM sessions s JOIN users u ON u.id=s.user_id
    LEFT JOIN companies c ON c.company_id=u.company_id
    WHERE s.id=? AND s.expires_at > datetime('now') LIMIT 1
  `).bind(sid).first<any>();
  return row || null;
}
const safe=(r:any)=>({...r,id:r.id,user_id:r.user_id||r.id,company_id:r.company_id,company_name:r.company_name,full_name:r.full_name,email:r.email,phone:r.phone,role:r.role,status:r.status,created_at:r.created_at,updated_at:r.updated_at});
export const onRequestGet=async({request,env}:{request:Request,env:Env})=>{
  const u=await sessionUser(request,env);
  if(!u || !['perusahaan','admin_perusahaan','company_admin','finance','hr','company_user'].includes(u.role)) return json({error:'Unauthorized'},401);
  const url=new URL(request.url);
  const companyId=u.company_id || url.searchParams.get('companyId');
  if(!companyId || companyId!==u.company_id) return json({error:'Company tenant required'},403);
  const rows=await env.DB.prepare('SELECT u.*,cu.role as company_user_role,cu.status as company_user_status FROM users u LEFT JOIN company_users cu ON cu.user_id=u.id WHERE u.company_id=? ORDER BY u.created_at DESC').bind(companyId).all<any>();
  return json({items:rows.results.map((r:any)=>safe({...r,role:r.company_user_role||r.role,status:r.company_user_status||r.status}))});
};
export const onRequestPost=async({request,env}:{request:Request,env:Env})=>{
  const actor=await sessionUser(request,env);
  if(!actor || !actor.company_id || !['perusahaan','admin_perusahaan','company_admin','finance','hr'].includes(actor.role)) return json({error:'Unauthorized'},401);
  const body=await request.json<any>(); const op=body.operation; const companyId=actor.company_id;
  if(op==='create-user'){
    const d=body.data||{}; const email=String(d.email||'').trim().toLowerCase(); const password=String(d.password||'');
    if(!email||password.length<6) return json({error:'Email dan password wajib valid'},400);
    const exists=await env.DB.prepare('SELECT id FROM users WHERE lower(email)=? LIMIT 1').bind(email).first<any>();
    if(exists) return json({error:'Email sudah terdaftar'},409);
    const {salt,hash}=await hashPassword(password);
    const uid=randomId('usr');
    await env.DB.batch([
      env.DB.prepare('INSERT INTO users (id,email,password_hash,password_salt,role,company_id,status,full_name,phone) VALUES (?,?,?,?,?,?,?,?,?)').bind(uid,email,hash,salt,d.role||'company_user',companyId,'ACTIVE',d.full_name||'',d.phone||''),
      env.DB.prepare('INSERT INTO company_users (id,user_id,company_id,role,status,is_primary_company_account) VALUES (?,?,?,?,?,0)').bind(randomId('cu'),uid,companyId,d.role||'company_user','ACTIVE')
    ]);
    return json({user:{id:uid,email,role:d.role||'company_user',company_id:companyId}});
  }
  if(op==='update-user'){
    const id=String(body.id||''); const d=body.data||{};
    const target=await env.DB.prepare('SELECT id FROM users WHERE id=? AND company_id=?').bind(id,companyId).first<any>();
    if(!target) return json({error:'User tidak ditemukan'},404);
    await env.DB.prepare('UPDATE users SET full_name=COALESCE(?,full_name),phone=COALESCE(?,phone),status=COALESCE(?,status),updated_at=CURRENT_TIMESTAMP WHERE id=? AND company_id=?').bind(d.full_name??null,d.phone??null,d.status??null,id,companyId).run();
    if(d.role) await env.DB.prepare('UPDATE company_users SET role=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND company_id=?').bind(d.role,id,companyId).run();
    return json({ok:true});
  }
  if(op==='audit'){
    const d=body.data||{};
    await env.DB.prepare('INSERT INTO audit_logs (id,actor_user_id,actor_email,actor_role,company_id,action,entity_type,entity_id,metadata_json) VALUES (?,?,?,?,?,?,?,?,?)').bind(randomId('audit'),actor.id,actor.email,actor.role,companyId,d.action||'ACTIVITY',d.entity_type||'USER',d.entity_id||null,JSON.stringify(d.metadata||{})).run();
    return json({ok:true});
  }
  if(op==='password-reset'){
    return json({ok:false,error:'manual-reset-required',message:'Reset password email belum dikonfigurasi. Gunakan Owner untuk reset credential.'},501);
  }
  return json({error:'Operation tidak didukung'},400);
};
