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
  if(!actor || !actor.company_id || !['perusahaan','admin_perusahaan','company_admin','finance','hr','auditor'].includes(String(actor.role||'').toLowerCase())) return json({error:'Unauthorized'},401);
  const body=await request.json<any>(); const op=body.operation; const companyId=actor.company_id;
  if(op==='save-company-profile'){
    const actorRole=String(actor.role||'').toLowerCase();
    const d=body.data||{};
    const allowed=['namaPT','alamat','deskripsi','telepon','npwp','picName','rekeningBank','sektor','photoURL','dokumenUrl','dokumenNama','statusVerifikasiDokumen','catatanVerifikasi','nomorLisensi','gelarProfesi','spesialisasiAudit','biayaJasaPerKasus','kebijakanReward'];
    const profile:any={};
    for(const key of allowed) if(d[key]!==undefined) profile[key]=d[key];
    if(actorRole==='auditor'){
      const userRow=await env.DB.prepare('SELECT profile_json FROM users WHERE id=? AND company_id=? LIMIT 1').bind(actor.id,actor.company_id).first<any>();
      let currentUserProfile:any={}; try{currentUserProfile=JSON.parse(userRow?.profile_json||'{}')}catch{}
      const nextUserProfile={...currentUserProfile,...profile};
      await env.DB.prepare('UPDATE users SET profile_json=?,full_name=COALESCE(?,full_name),phone=COALESCE(?,phone),updated_at=CURRENT_TIMESTAMP WHERE id=? AND company_id=?')
        .bind(JSON.stringify(nextUserProfile),profile.picName??null,profile.telepon??null,actor.id,actor.company_id).run();
      return json({ok:true,profile:nextUserProfile});
    }
    if(!['perusahaan','admin_perusahaan','company_admin','finance','hr'].includes(actorRole)) return json({error:'Akses profil perusahaan ditolak.'},403);
    if(profile.namaPT!==undefined && !String(profile.namaPT).trim()) return json({error:'Nama perusahaan wajib diisi.'},400);
    const row=await env.DB.prepare('SELECT profile_json,company_name FROM companies WHERE company_id=? LIMIT 1').bind(companyId).first<any>();
    if(!row) return json({error:'Data perusahaan tidak ditemukan.'},404);
    let current:any={}; try{current=JSON.parse(row.profile_json||'{}')}catch{}
    const next={...current,...profile};
    const name=String(next.namaPT||row.company_name||'').trim();
    await env.DB.prepare('UPDATE companies SET company_name=?,profile_json=?,updated_at=CURRENT_TIMESTAMP WHERE company_id=?')
      .bind(name,JSON.stringify(next),companyId).run();
    await env.DB.prepare('UPDATE users SET full_name=COALESCE(?,full_name),phone=COALESCE(?,phone),updated_at=CURRENT_TIMESTAMP WHERE id=? AND company_id=?')
      .bind(profile.picName??null,profile.telepon??null,actor.id,companyId).run();
    await env.DB.prepare('INSERT INTO audit_logs(id,actor_user_id,actor_email,actor_role,company_id,action,entity_type,entity_id,metadata_json) VALUES(?,?,?,?,?,?,?,?,?)')
      .bind(randomId('audit'),actor.id,actor.email,actor.role,companyId,'COMPANY_PROFILE_UPDATED','company',companyId,JSON.stringify({fields:Object.keys(profile)})).run();
    return json({ok:true,profile:next});
  }
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
  if(op==='create-transaction'){
    const d=body.data||{};
    const type=String(d.type||'').toLowerCase();
    const amount=Number(d.amount||0);
    if(!['deposit','withdrawal'].includes(type)) return json({error:'Jenis transaksi tidak didukung.'},400);
    if(!Number.isFinite(amount)||amount<=0) return json({error:'Nominal transaksi harus lebih besar dari nol.'},400);
    const method=String(d.method||d.metode||'').trim();
    if(type==='deposit' && !/qris|nowpayments/i.test(method)) return json({error:'Deposit hanya tersedia melalui QRIS atau NOWPayments.'},400);
    const txId=randomId('tx');
    const metadata={...d,userId:actor.id,companyId,createdAt:d.createdAt||new Date().toISOString()};
    await env.DB.prepare(`INSERT INTO transactions(id,user_id,company_id,type,amount,status,method,tx_hash,metadata_json)
      VALUES(?,?,?,?,?,'pending',?,?,?)`)
      .bind(txId,actor.id,companyId,type,amount,method||null,d.txHash||d.tx_hash||null,JSON.stringify(metadata)).run();
    await env.DB.prepare('INSERT INTO audit_logs(id,actor_user_id,actor_email,actor_role,company_id,action,entity_type,entity_id,metadata_json) VALUES(?,?,?,?,?,?,?,?,?)')
      .bind(randomId('audit'),actor.id,actor.email,actor.role,companyId,'TRANSACTION_CREATED','transaction',txId,JSON.stringify({type,amount,method})).run();
    return json({ok:true,id:txId,status:'pending'});
  }
  if(op==='release-reward'){
    const id=String(body.id||'');
    const requested=Number(body.rewardAmount||0);
    if(!id) return json({error:'ID laporan wajib diisi.'},400);
    if(!Number.isFinite(requested)||requested<=0) return json({error:'Nominal reward tidak valid.'},400);
    const report=await env.DB.prepare('SELECT * FROM reports WHERE id=? AND company_id=? LIMIT 1').bind(id,companyId).first<any>();
    if(!report) return json({error:'Laporan tidak ditemukan pada tenant ini.'},404);
    let meta:any={}; try{meta=JSON.parse(report.metadata_json||'{}')}catch{}
    if(String(report.status||'').toLowerCase()!=='valid') return json({error:'Reward hanya dapat dirilis setelah laporan berstatus VALID.'},409);
    if(meta.rewardReleased===true || meta.rewardReleased===1) return json({error:'Reward untuk laporan ini sudah diproses.'},409);
    const category=String(meta.tipePelanggaran||report.violation_type||'').toLowerCase();
    const minimum=category==='finansial' ? Math.round(Number(report.estimated_loss||0)*0.02) : 100000;
    if(requested<minimum) return json({error:'Nominal reward di bawah ketentuan minimum.',minimum},400);
    const company=await env.DB.prepare('SELECT deposit_balance FROM companies WHERE company_id=? LIMIT 1').bind(companyId).first<any>();
    if(!company) return json({error:'Data perusahaan tidak ditemukan.'},404);
    if(Number(company.deposit_balance||0)<requested) return json({error:'Saldo perusahaan tidak mencukupi untuk reward ini.',balance:Number(company.deposit_balance||0),required:requested},409);
    const operationId=randomId('reward');
    const releasedAt=new Date().toISOString();
    const claimStatus=meta.rewardClaimBank?'pending':'siap_diklaim';
    const nextMeta={...meta,rewardReleased:true,rewardReleasedAt:releasedAt,rewardReleaseType:'auto_valid',rewardReleaseOperationId:operationId,rewardAmount:requested,rewardStatusPerusahaan:'disetujui',rewardClaimStatus:claimStatus,companyCaseStatus:'selesai'};
    await env.DB.batch([
      env.DB.prepare(`UPDATE reports SET status='selesai',reward_amount=?,reward_claim_status=?,metadata_json=?,updated_at=CURRENT_TIMESTAMP
        WHERE id=? AND company_id=? AND lower(status)='valid'
        AND COALESCE(json_extract(metadata_json,'$.rewardReleased'),0) NOT IN (1,'true')
        AND EXISTS (SELECT 1 FROM companies WHERE company_id=? AND deposit_balance>=?)`)
        .bind(requested,claimStatus,JSON.stringify(nextMeta),id,companyId,companyId,requested),
      env.DB.prepare(`UPDATE companies SET deposit_balance=deposit_balance-?,updated_at=CURRENT_TIMESTAMP
        WHERE company_id=? AND EXISTS (SELECT 1 FROM reports WHERE id=? AND company_id=? AND json_extract(metadata_json,'$.rewardReleaseOperationId')=? AND json_extract(metadata_json,'$.rewardReleased')=1)`)
        .bind(requested,companyId,id,companyId,operationId),
      env.DB.prepare(`INSERT INTO transactions(id,user_id,company_id,type,amount,status,report_id,metadata_json)
        SELECT ?,?,?, 'reward_release', ?, 'selesai', ?, ?
        WHERE EXISTS (SELECT 1 FROM reports WHERE id=? AND company_id=? AND json_extract(metadata_json,'$.rewardReleaseOperationId')=? AND json_extract(metadata_json,'$.rewardReleased')=1)`)
        .bind(operationId,actor.id,companyId,requested,id,JSON.stringify({description:'Reward pelapor otomatis dirilis setelah laporan dinyatakan valid',operationId}),id,companyId,operationId)
    ]);
    const finalReport=await env.DB.prepare('SELECT metadata_json FROM reports WHERE id=? AND company_id=?').bind(id,companyId).first<any>();
    let finalMeta:any={}; try{finalMeta=JSON.parse(finalReport?.metadata_json||'{}')}catch{}
    if(finalMeta.rewardReleaseOperationId!==operationId) return json({error:'Reward tidak diproses. Laporan mungkin sudah dirilis atau saldo tidak mencukupi.'},409);
    return json({ok:true,id,rewardAmount:requested,remainingBalance:Number((await env.DB.prepare('SELECT deposit_balance FROM companies WHERE company_id=?').bind(companyId).first<any>())?.deposit_balance||0)});
  }
  if(op==='take-case'){
    const id=String(body.id||'');
    if(!id) return json({error:'ID laporan wajib diisi.'},400);
    const report=await env.DB.prepare('SELECT * FROM reports WHERE id=? AND company_id=? LIMIT 1').bind(id,companyId).first<any>();
    if(!report) return json({error:'Laporan tidak ditemukan pada tenant ini.'},404);
    if(String(report.status||'').toLowerCase()!=='valid') return json({error:'Kasus hanya dapat diambil setelah laporan dinyatakan VALID.'},409);
    let current:any={}; try{current=JSON.parse(report.metadata_json||'{}')}catch{}
    if(current.companyCaseStatus==='kasus_diambil' || current.companyCaseStatus==='selesai') return json({error:'Kasus ini sudah diambil atau diselesaikan.'},409);
    const deadline=new Date(Date.now()+24*60*60*1000).toISOString();
    const next={...current,companyCaseStatus:'kasus_diambil',takenAt:new Date().toISOString(),autoReleaseDeadline:deadline};
    await env.DB.prepare('UPDATE reports SET metadata_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND company_id=?')
      .bind(JSON.stringify(next),id,companyId).run();
    await env.DB.prepare('INSERT INTO audit_logs(id,actor_user_id,actor_email,actor_role,company_id,action,entity_type,entity_id,metadata_json) VALUES(?,?,?,?,?,?,?,?,?)')
      .bind(randomId('audit'),actor.id,actor.email,actor.role,companyId,'REPORT_CASE_TAKEN','report',id,JSON.stringify({autoReleaseDeadline:deadline})).run();
    return json({ok:true,id,companyCaseStatus:'kasus_diambil',autoReleaseDeadline:deadline});
  }
  if(op==='set-report-reward'){
    const id=String(body.id||'');
    const amount=Number(body.rewardAmount);
    if(!id) return json({error:'ID laporan wajib diisi.'},400);
    if(!Number.isFinite(amount)||amount<=0) return json({error:'Nominal reward tidak valid.'},400);
    const report=await env.DB.prepare('SELECT * FROM reports WHERE id=? AND company_id=? LIMIT 1').bind(id,companyId).first<any>();
    if(!report) return json({error:'Laporan tidak ditemukan pada tenant ini.'},404);
    if(String(report.status||'').toLowerCase()!=='valid') return json({error:'Reward hanya dapat diatur setelah laporan berstatus VALID.'},409);
    const isFinancial=String(report.violation_type||'').toLowerCase().includes('finansial') || Number(report.estimated_loss||0)>0;
    const minimum=isFinancial?Math.ceil(Number(report.estimated_loss||0)*0.02):100000;
    if(amount<minimum) return json({error:isFinancial?'Reward kasus finansial minimal 2% dari estimasi kerugian.':'Reward kasus etik minimal Rp 100.000.'},400);
    let current:any={}; try{current=JSON.parse(report.metadata_json||'{}')}catch{}
    const next={...current,rewardAmount:amount,rewardStatusPerusahaan:'disetujui'};
    await env.DB.prepare('UPDATE reports SET reward_amount=?,metadata_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND company_id=?')
      .bind(amount,JSON.stringify(next),id,companyId).run();
    await env.DB.prepare('INSERT INTO audit_logs(id,actor_user_id,actor_email,actor_role,company_id,action,entity_type,entity_id,metadata_json) VALUES(?,?,?,?,?,?,?,?,?)')
      .bind(randomId('audit'),actor.id,actor.email,actor.role,companyId,'REPORT_REWARD_UPDATED','report',id,JSON.stringify({rewardAmount:amount,minimum})).run();
    return json({ok:true,id,rewardAmount:amount,rewardStatusPerusahaan:'disetujui'});
  }
  if(op==='update-report'){
    const id=String(body.id||''); const d=body.data||{};
    if(!id) return json({error:'ID laporan wajib diisi.'},400);
    const report=await env.DB.prepare('SELECT * FROM reports WHERE id=? AND company_id=? LIMIT 1').bind(id,companyId).first<any>();
    if(!report) return json({error:'Laporan tidak ditemukan pada tenant ini.'},404);
    let current:any={}; try{current=JSON.parse(report.metadata_json||'{}')}catch{}
    // Reward release and claim state are database-controlled, never tenant-editable.
    const safeData={...d};
    for (const key of ['rewardReleased','rewardReleasedAt','rewardReleaseType','rewardReleaseOperationId','rewardAmount','rewardStatusPerusahaan','rewardClaimStatus','rewardClaimBank','rewardClaimed','reward_claimed','reward_claim_status','reward_amount','rewardMinAmount','reward_min_amount','companyCaseStatus']) delete safeData[key];
    const next={...current,...safeData};
    const nullable=(value:any)=>value===undefined?null:value;
    await env.DB.prepare(`UPDATE reports SET
      title=COALESCE(?,title), category=COALESCE(?,category), violation_type=COALESCE(?,violation_type),
      estimated_loss=COALESCE(?,estimated_loss), description=COALESCE(?,description), incident_date=COALESCE(?,incident_date),
      location=COALESCE(?,location), status=COALESCE(?,status), reward_amount=COALESCE(?,reward_amount),
      reward_min_amount=COALESCE(?,reward_min_amount), reward_claim_status=COALESCE(?,reward_claim_status),
      reward_claimed=COALESCE(?,reward_claimed), evidence_json=COALESCE(?,evidence_json),
      metadata_json=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND company_id=?`)
      .bind(nullable(safeData.judul??safeData.title),nullable(safeData.kategori??safeData.category),nullable(safeData.tipePelanggaran??safeData.violation_type),
        nullable(safeData.estimasiKerugian??safeData.estimated_loss),nullable(safeData.deskripsi??safeData.description),nullable(safeData.tanggalKejadian??safeData.incident_date),
        nullable(safeData.lokasi??safeData.location),nullable(safeData.status),null,null,
        null,null,
        safeData.buktiFiles===undefined&&safeData.evidence_json===undefined?null:(typeof safeData.evidence_json==='string'?safeData.evidence_json:JSON.stringify(safeData.buktiFiles||[])),
        JSON.stringify(next),id,companyId).run();
    await env.DB.prepare('INSERT INTO audit_logs (id,actor_user_id,actor_email,actor_role,company_id,action,entity_type,entity_id,metadata_json) VALUES (?,?,?,?,?,?,?,?,?)')
      .bind(randomId('audit'),actor.id,actor.email,actor.role,companyId,'REPORT_UPDATED','report',id,JSON.stringify({fields:Object.keys(d)})).run();
    return json({ok:true,id});
  }
  if(op==='update-user'){
    const id=String(body.id||''); const d=body.data||{};
    const target=await env.DB.prepare('SELECT id,role,profile_json FROM users WHERE id=? AND company_id=?').bind(id,companyId).first<any>();
    if(!target) return json({error:'User tidak ditemukan'},404);
    if(d.role){
      const nextRole=String(d.role).toLowerCase();
      if(!['company_user','finance','hr','admin_perusahaan','company_admin'].includes(nextRole)) return json({error:'Role akun tidak diizinkan.'},400);
      if(['admin_perusahaan','company_admin'].includes(nextRole) && !['admin_perusahaan','company_admin'].includes(String(target.role||'').toLowerCase())){
        const adminCount=await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE company_id=? AND lower(role) IN ('admin_perusahaan','company_admin')").bind(companyId).first<any>();
        if(Number(adminCount?.n||0)>=3) return json({error:'Batas maksimal 3 akun admin untuk tenant ini sudah tercapai.'},409);
      }
    }
    const profileKeys=['namaPT','alamat','deskripsi','telepon','npwp','picName','rekeningBank','sektor','photoURL','dokumenUrl','dokumenNama','statusVerifikasiDokumen','catatanVerifikasi','nomorLisensi','gelarProfesi','spesialisasiAudit','biayaJasaPerKasus','kebijakanReward'];
    const profilePatch:any={};
    for(const key of profileKeys) if(d[key]!==undefined) profilePatch[key]=d[key];
    if(Object.keys(profilePatch).length){
      const targetRole=String(target.role||'').toLowerCase();
      if(targetRole==='auditor'){
        let currentProfile:any={}; try{currentProfile=JSON.parse(target.profile_json||'{}')}catch{}
        await env.DB.prepare('UPDATE users SET profile_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND company_id=?')
          .bind(JSON.stringify({...currentProfile,...profilePatch}),id,companyId).run();
      }else if(['perusahaan','admin_perusahaan','company_admin','finance','hr'].includes(targetRole)){
        const company=await env.DB.prepare('SELECT profile_json,company_name FROM companies WHERE company_id=? LIMIT 1').bind(companyId).first<any>();
        if(!company) return json({error:'Data perusahaan tidak ditemukan.'},404);
        let currentProfile:any={}; try{currentProfile=JSON.parse(company.profile_json||'{}')}catch{}
        const nextProfile={...currentProfile,...profilePatch};
        const companyName=String(nextProfile.namaPT||company.company_name||'').trim();
        await env.DB.prepare('UPDATE companies SET company_name=?,profile_json=?,updated_at=CURRENT_TIMESTAMP WHERE company_id=?')
          .bind(companyName,JSON.stringify(nextProfile),companyId).run();
      }else{
        return json({error:'Akses pembaruan profil ditolak.'},403);
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
