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
    const requestedRole=String(d.role||'company_user').toLowerCase();
    if(!email||password.length<10) return json({error:'Email wajib valid dan kata sandi minimal 10 karakter'},400);
    if(!['company_user','finance','hr','admin_perusahaan','company_admin'].includes(requestedRole)) return json({error:'Role akun tidak diizinkan.'},400);
    if(['admin_perusahaan','company_admin'].includes(requestedRole)){
      const adminCount=await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE company_id=? AND lower(role) IN ('admin_perusahaan','company_admin')").bind(companyId).first<any>();
      if(Number(adminCount?.n||0)>=3) return json({error:'Batas maksimal 3 akun admin untuk tenant ini sudah tercapai.'},409);
    }
    const exists=await env.DB.prepare('SELECT id FROM users WHERE lower(email)=? LIMIT 1').bind(email).first<any>();
    if(exists) return json({error:'Email sudah terdaftar'},409);
    const {salt,hash}=await hashPassword(password);
    const uid=randomId('usr');
    await env.DB.batch([
      env.DB.prepare('INSERT INTO users (id,email,password_hash,password_salt,role,company_id,status,full_name,phone) VALUES (?,?,?,?,?,?,?,?,?)').bind(uid,email,hash,salt,requestedRole,companyId,'ACTIVE',d.full_name||'',d.phone||''),
      env.DB.prepare('INSERT INTO company_users (id,user_id,company_id,role,status,is_primary_company_account) VALUES (?,?,?,?,?,0)').bind(randomId('cu'),uid,companyId,requestedRole,'ACTIVE')
    ]);
    return json({user:{id:uid,email,role:requestedRole,company_id:companyId}});
  }
  if(op==='update-report'){
    const id=String(body.id||''); const d=body.data||{};
    if(!id) return json({error:'ID laporan wajib diisi.'},400);
    const report=await env.DB.prepare('SELECT * FROM reports WHERE id=? AND company_id=? LIMIT 1').bind(id,companyId).first<any>();
    if(!report) return json({error:'Laporan tidak ditemukan pada tenant ini.'},404);
    let current:any={}; try{current=JSON.parse(report.metadata_json||'{}')}catch{}
    const next={...current,...d};
    const nullable=(value:any)=>value===undefined?null:value;
    await env.DB.prepare(`UPDATE reports SET
      title=COALESCE(?,title), category=COALESCE(?,category), violation_type=COALESCE(?,violation_type),
      estimated_loss=COALESCE(?,estimated_loss), description=COALESCE(?,description), incident_date=COALESCE(?,incident_date),
      location=COALESCE(?,location), status=COALESCE(?,status), reward_amount=COALESCE(?,reward_amount),
      reward_min_amount=COALESCE(?,reward_min_amount), reward_claim_status=COALESCE(?,reward_claim_status),
      reward_claimed=COALESCE(?,reward_claimed), evidence_json=COALESCE(?,evidence_json),
      metadata_json=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND company_id=?`)
      .bind(nullable(d.judul??d.title),nullable(d.kategori??d.category),nullable(d.tipePelanggaran??d.violation_type),
        nullable(d.estimasiKerugian??d.estimated_loss),nullable(d.deskripsi??d.description),nullable(d.tanggalKejadian??d.incident_date),
        nullable(d.lokasi??d.location),nullable(d.status),nullable(d.rewardAmount??d.reward_amount),nullable(d.rewardMinAmount??d.reward_min_amount),
        nullable(d.rewardClaimStatus??d.reward_claim_status),d.rewardClaimed===undefined&&d.reward_claimed===undefined?null:((d.rewardClaimed??d.reward_claimed)?1:0),
        d.buktiFiles===undefined&&d.evidence_json===undefined?null:(typeof d.evidence_json==='string'?d.evidence_json:JSON.stringify(d.buktiFiles||[])),
        JSON.stringify(next),id,companyId).run();
    await env.DB.prepare('INSERT INTO audit_logs (id,actor_user_id,actor_email,actor_role,company_id,action,entity_type,entity_id,metadata_json) VALUES (?,?,?,?,?,?,?,?,?)')
      .bind(randomId('audit'),actor.id,actor.email,actor.role,companyId,'REPORT_UPDATED','report',id,JSON.stringify({fields:Object.keys(d)})).run();
    return json({ok:true,id});
  }
  if(op==='update-user'){
    const id=String(body.id||''); const d=body.data||{};
    const target=await env.DB.prepare('SELECT id,role FROM users WHERE id=? AND company_id=?').bind(id,companyId).first<any>();
    if(!target) return json({error:'User tidak ditemukan'},404);
    if(d.role){
      const nextRole=String(d.role).toLowerCase();
      if(!['company_user','finance','hr','admin_perusahaan','company_admin'].includes(nextRole)) return json({error:'Role akun tidak diizinkan.'},400);
      if(['admin_perusahaan','company_admin'].includes(nextRole) && !['admin_perusahaan','company_admin'].includes(String(target.role||'').toLowerCase())){
        const adminCount=await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE company_id=? AND lower(role) IN ('admin_perusahaan','company_admin')").bind(companyId).first<any>();
        if(Number(adminCount?.n||0)>=3) return json({error:'Batas maksimal 3 akun admin untuk tenant ini sudah tercapai.'},409);
      }
    }
    await env.DB.prepare('UPDATE users SET full_name=COALESCE(?,full_name),phone=COALESCE(?,phone),status=COALESCE(?,status),role=COALESCE(?,role),updated_at=CURRENT_TIMESTAMP WHERE id=? AND company_id=?').bind(d.full_name??null,d.phone??null,d.status??null,d.role??null,id,companyId).run();
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
