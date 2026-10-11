import { Env, json, getCookie, randomId, hashPassword } from '../_utils';

type SessionUser = { id:string; email:string; role:string; company_id:string|null; status:string };

async function requireOwner(request:Request, env:Env):Promise<SessionUser>{
  const sid=getCookie(request,'i360_session');
  if(!sid) throw new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{'content-type':'application/json'}});
  const row=await env.DB.prepare(`
    SELECT u.id,u.email,u.role,u.company_id,u.status
    FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.id=? AND s.expires_at>CURRENT_TIMESTAMP AND u.status='ACTIVE'
    LIMIT 1`).bind(sid).first<SessionUser>();
  if(!row || row.role!=='owner') throw new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{'content-type':'application/json'}});
  return row;
}

const now=()=>new Date().toISOString();
function parseJson(v:any){try{return v?JSON.parse(v):{}}catch{return {}}}
function merge(row:any){
  const meta=parseJson(row.metadata_json);
  const out={...meta,...row};
  delete out.metadata_json;
  if(row.created_at) out.createdAt=meta.createdAt||row.created_at;
  if(row.updated_at) out.updatedAt=meta.updatedAt||row.updated_at;
  if(row.company_id) out.companyId=meta.companyId||row.company_id;
  if(row.user_id) out.userId=meta.userId||row.user_id;
  if(row.report_id) out.reportId=meta.reportId||row.report_id;
  if(row.report_code) out.reportCode=meta.reportCode||row.report_code;
  if(row.reporter_code) out.reporterCode=meta.reporterCode||row.reporter_code;
  if(row.company_name) out.companyName=meta.companyName||row.company_name;
  if(row.company_email) out.companyEmail=meta.companyEmail||row.company_email;
  if(row.deposit_balance!=null) out.deposit_balance=row.deposit_balance;
  if(row.locked_balance!=null) out.locked_balance=row.locked_balance;
  return out;
}
function unmeta(data:any){
  const copy={...data};
  for(const k of ['uid','createdAt','updatedAt','companyId','companyName','reportId','reportCode','reporterCode','userId']) delete copy[k];
  return JSON.stringify(copy);
}

async function listCollection(env:Env,collection:string,filter?:{field:string;value:any}){
  let sql=''; const params:any[]=[];
  if(collection==='users'){
    sql='SELECT * FROM users ORDER BY created_at DESC';
    if(filter?.field){sql='SELECT * FROM users WHERE '+filter.field+'=? ORDER BY created_at DESC';params.push(filter.value);}
  }else if(collection==='companies') sql='SELECT * FROM companies ORDER BY created_at DESC';
  else if(collection==='company_users') sql='SELECT * FROM company_users ORDER BY created_at DESC';
  else if(collection==='reports') sql='SELECT * FROM reports ORDER BY created_at DESC';
  else if(collection==='transactions') sql='SELECT * FROM transactions ORDER BY created_at DESC';
  else if(collection==='audit_logs') sql='SELECT * FROM audit_logs ORDER BY created_at DESC';
  else throw new Error('Collection tidak didukung: '+collection);
  const result=await env.DB.prepare(sql).bind(...params).all<any>();
  return (result.results||[]).map(merge);
}

export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
  try{
    await requireOwner(request,env);
    const u=new URL(request.url);
    const collection=u.searchParams.get('collection')||'users';
    const field=u.searchParams.get('whereField');
    const value=u.searchParams.get('whereValue');
    return json({ok:true,items:await listCollection(env,collection,field?{field,value}:undefined)});
  }catch(e:any){
    if(e instanceof Response) return e;
    console.error('OWNER_DATA_GET',e); return json({error:'Gagal mengambil data owner.'},500);
  }
};

export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
  try{
    const owner=await requireOwner(request,env);
    const body:any=await request.json();
    const op=body.operation;
    const collection=body.collection;
    const id=body.id||randomId(collection||'item');
    const data=body.data||{};
    if(op==='create-tenant' || op==='create-tenant-admin'){
      const companyName=String(data.company_name||'').trim();
      const companyEmail=String(data.company_email||data.email||'').trim().toLowerCase();
      const fullName=String(data.full_name||'').trim();
      const email=String(data.admin_email||data.email||'').trim().toLowerCase();
      const password=String(data.password||'');
      const isCreateTenant=op==='create-tenant';
      let companyId=String(data.company_id||'').trim();

      if(isCreateTenant && (!companyName || !companyEmail)) return json({error:'Nama perusahaan dan email perusahaan wajib diisi.'},400);
      if(!email || password.length<10 || !fullName) return json({error:'Nama admin, email admin, dan kata sandi minimal 10 karakter wajib diisi.'},400);

      if(isCreateTenant){
        companyId=randomId('CMP');
        const companyExists=await env.DB.prepare('SELECT id FROM companies WHERE lower(email)=? LIMIT 1').bind(companyEmail).first();
        if(companyExists) return json({error:'Email perusahaan sudah terdaftar.'},409);
      }else{
        if(!companyId) return json({error:'Tenant perusahaan wajib dipilih.'},400);
        const company=await env.DB.prepare('SELECT company_id,status FROM companies WHERE company_id=? LIMIT 1').bind(companyId).first<any>();
        if(!company) return json({error:'Tenant perusahaan tidak ditemukan.'},404);
      }

      const count=await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE company_id=? AND lower(role) IN ('admin_perusahaan','company_admin')").bind(companyId).first<any>();
      if(Number(count?.n||0)>=3) return json({error:'Batas maksimal 3 akun admin untuk setiap perusahaan sudah tercapai.'},409);

      const exists=await env.DB.prepare('SELECT id FROM users WHERE lower(email)=? LIMIT 1').bind(email).first();
      if(exists) return json({error:'Email admin sudah terdaftar di sistem.'},409);

      const hp=await hashPassword(password);
      const uid=randomId('usr');
      const companyUserId=randomId('cu');
      const statements:any[]=[];
      if(isCreateTenant){
        statements.push(env.DB.prepare('INSERT INTO companies(id,company_id,company_name,email,status,deposit_balance,locked_balance,metadata_json) VALUES(?,?,?,?,?,0,0,?)')
          .bind(companyId,companyId,companyName,companyEmail,'DEPOSIT_REQUIRED',JSON.stringify({createdBy:owner.id,tenantPlan:'saas'})));
      }
      statements.push(env.DB.prepare('INSERT INTO users(id,email,password_hash,password_salt,role,company_id,status,full_name,phone,metadata_json) VALUES(?,?,?,?,?,?,?,?,?,?)')
        .bind(uid,email,hp.hash,hp.salt,'admin_perusahaan',companyId,'ACTIVE',fullName,String(data.phone||''),JSON.stringify({createdBy:owner.id,tenantAdmin:true})));
      statements.push(env.DB.prepare('INSERT INTO company_users(id,user_id,company_id,role,is_primary_company_account,status,metadata_json) VALUES(?,?,?,?,?,?,?)')
        .bind(companyUserId,uid,companyId,'company_admin',1,'ACTIVE',JSON.stringify({createdBy:owner.id})));
      statements.push(env.DB.prepare('INSERT INTO audit_logs(id,actor_user_id,actor_email,actor_role,company_id,action,entity_type,entity_id,metadata_json) VALUES(?,?,?,?,?,?,?,?,?)')
        .bind(randomId('log'),owner.id,owner.email,'owner',companyId,isCreateTenant?'TENANT_CREATED':'TENANT_ADMIN_CREATED',isCreateTenant?'company':'user',isCreateTenant?companyId:uid,JSON.stringify({companyName:companyName||null,adminEmail:email})));
      await env.DB.batch(statements);
      return json({ok:true,company_id:companyId,user_id:uid,message:isCreateTenant?'Tenant dan admin pertama berhasil dibuat.':'Akun admin tenant berhasil dibuat.'});
    }
    if(op==='create-user'){
      const email=String(data.email||'').trim().toLowerCase(), password=String(data.password||'');
      if(!email||password.length<10) return json({error:'Email wajib valid dan kata sandi minimal 10 karakter.'},400);
      const role=String(data.role||'admin_perusahaan').toLowerCase();
      if(!['admin_perusahaan','company_admin','company_user','finance','hr','perusahaan','auditor'].includes(role)) return json({error:'Role akun tidak diizinkan.'},400);
      const companyId=String(data.company_id||data.companyId||'').trim();
      if(companyId && ['admin_perusahaan','company_admin'].includes(role)){
        const count=await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE company_id=? AND lower(role) IN ('admin_perusahaan','company_admin')").bind(companyId).first<any>();
        if(Number(count?.n||0)>=3) return json({error:'Batas maksimal 3 akun admin untuk setiap perusahaan sudah tercapai.'},409);
      }
      const exists=await env.DB.prepare('SELECT id FROM users WHERE lower(email)=? LIMIT 1').bind(email).first();
      if(exists) return json({error:`Email "${email}" sudah terdaftar di sistem.`},409);
      const hp=await hashPassword(password);
      const uid=randomId('usr');
      const safeData={...data}; delete safeData.password;
      await env.DB.prepare('INSERT INTO users(id,email,password_hash,password_salt,role,company_id,status,full_name,phone,metadata_json) VALUES(?,?,?,?,?,?,?,?,?,?)')
        .bind(uid,email,hp.hash,hp.salt,role,companyId||null,data.status||'ACTIVE',data.full_name||null,data.phone||null,JSON.stringify(safeData)).run();
      if(companyId){
        await env.DB.prepare('INSERT OR REPLACE INTO company_users(id,user_id,company_id,role,is_primary_company_account,status,metadata_json) VALUES(?,?,?,?,?,?,?)')
          .bind(randomId('cu'),uid,companyId,data.company_user_role||'company_admin',data.is_primary_company_account?1:0,data.status||'ACTIVE',JSON.stringify(data)).run();
      }
      return json({ok:true,id:uid});
    }
    if(op==='password-reset'){
      return json({ok:true,mode:'manual-reset-required',message:'Password reset email belum dikonfigurasi pada Cloudflare Auth.'});
    }
    if(op==='generate-company-id'){
      const r=await env.DB.prepare("SELECT COUNT(*) as n FROM companies WHERE company_id LIKE 'CMP-%'").first<any>();
      return json({ok:true,id:'CMP-'+String(Number(r?.n||0)+1).padStart(6,'0')});
    }
    if(op==='audit'){
      await env.DB.prepare('INSERT INTO audit_logs(id,actor_user_id,actor_email,actor_role,company_id,action,entity_type,entity_id,metadata_json) VALUES(?,?,?,?,?,?,?,?,?)')
        .bind(randomId('log'),owner.id,owner.email,owner.role,data.company_id||null,data.action||'OWNER_ACTION',data.entity_type||null,data.entity_id||null,JSON.stringify(data.metadata||{})).run();
      return json({ok:true});
    }
    if(op==='delete'){
      if(collection==='users') await env.DB.prepare('DELETE FROM users WHERE id=?').bind(id).run();
      else if(collection==='reports') await env.DB.prepare('DELETE FROM reports WHERE id=?').bind(id).run();
      else if(collection==='transactions') await env.DB.prepare('DELETE FROM transactions WHERE id=?').bind(id).run();
      else if(collection==='company_users') await env.DB.prepare('DELETE FROM company_users WHERE id=?').bind(id).run();
      return json({ok:true});
    }
    if(op==='create'||op==='set'||op==='update'){
      if(collection==='users'){
        const targetCompany=String(data.company_id??data.companyId??'').trim();
        const targetRole=String(data.role||'').toLowerCase();
        if(targetCompany && ['admin_perusahaan','company_admin'].includes(targetRole)){
          const count=await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE company_id=? AND lower(role) IN ('admin_perusahaan','company_admin') AND id<>?").bind(targetCompany,op==='create'?'':id).first<any>();
          if(Number(count?.n||0)>=3) return json({error:'Batas maksimal 3 akun admin untuk setiap perusahaan sudah tercapai.'},409);
        }
      }
      if(collection==='companies'){
        const existing=await env.DB.prepare('SELECT id FROM companies WHERE company_id=?').bind(id).first();
        if(op==='create'||!existing){
          await env.DB.prepare('INSERT INTO companies(id,company_id,company_name,email,status,deposit_balance,locked_balance,metadata_json) VALUES(?,?,?,?,?,?,?,?)')
            .bind(id,id,data.company_name||data.namaPT||'PT Baru',data.email||data.company_email||'',data.status||'ACTIVE',Number(data.deposit_balance??data.danaTersedia??0),Number(data.locked_balance??data.danaTerkunci??0),unmeta(data)).run();
        }else await env.DB.prepare('UPDATE companies SET company_name=?,email=?,status=?,deposit_balance=?,locked_balance=?,metadata_json=?,updated_at=CURRENT_TIMESTAMP WHERE company_id=?')
          .bind(data.company_name||data.namaPT||'',data.email||data.company_email||'',data.status||'ACTIVE',Number(data.deposit_balance??data.danaTersedia??0),Number(data.locked_balance??data.danaTerkunci??0),unmeta(data),id).run();
      }else if(collection==='users'){
        const existing=await env.DB.prepare('SELECT id FROM users WHERE id=?').bind(id).first();
        if(op==='create'||!existing){
          const email=data.email||''; const hp= data.password?await hashPassword(String(data.password)):null;
          await env.DB.prepare('INSERT INTO users(id,email,password_hash,password_salt,role,company_id,status,full_name,phone,metadata_json) VALUES(?,?,?,?,?,?,?,?,?,?)')
            .bind(id,email,hp?.hash||'',hp?.salt||'',data.role||'perusahaan',data.company_id||data.companyId||null,data.status||'ACTIVE',data.full_name||data.picName||null,data.phone||data.telepon||null,unmeta(data)).run();
        }else{
          const fields:any[]=[]; const vals:any[]=[];
          if(data.email!==undefined){fields.push('email=?');vals.push(data.email)}
          if(data.role!==undefined){fields.push('role=?');vals.push(data.role)}
          if(data.company_id!==undefined||data.companyId!==undefined){fields.push('company_id=?');vals.push(data.company_id??data.companyId)}
          if(data.status!==undefined){fields.push('status=?');vals.push(data.status)}
          if(data.full_name!==undefined){fields.push('full_name=?');vals.push(data.full_name)}
          if(data.phone!==undefined){fields.push('phone=?');vals.push(data.phone)}
          if(data.danaTersedia!==undefined) data.deposit_balance=data.danaTersedia;
          if(data.danaTerkunci!==undefined) data.locked_balance=data.danaTerkunci;
          fields.push('metadata_json=?');vals.push(unmeta(data),id);
          await env.DB.prepare('UPDATE users SET '+fields.join(',')+',updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(...vals).run();
        }
      }else if(collection==='company_users'){
        await env.DB.prepare('INSERT OR REPLACE INTO company_users(id,user_id,company_id,role,is_primary_company_account,status,metadata_json) VALUES(?,?,?,?,?,?,?)')
          .bind(id,data.user_id||data.userId||id,data.company_id||data.companyId||'',data.role||'company_admin',data.is_primary_company_account?1:0,data.status||'ACTIVE',unmeta(data)).run();
      }else if(collection==='reports'){
        const exists=await env.DB.prepare('SELECT id FROM reports WHERE id=?').bind(id).first();
        if(!exists) await env.DB.prepare('INSERT INTO reports(id,company_id,report_code,reporter_code,title,category,violation_type,estimated_loss,description,incident_date,location,status,reward_amount,reward_min_amount,reward_claim_status,reward_claimed,payout_wallet,evidence_json,metadata_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
          .bind(id,data.company_id||data.companyId||'',data.report_code||data.reportCode||null,data.reporter_code||data.reporterCode||null,data.title||data.judul||'',data.category||data.kategori||'',data.violation_type||data.tipePelanggaran||'',Number(data.estimated_loss??data.estimasiKerugian??0),data.description||data.deskripsi||'',data.incident_date||data.tanggalKejadian||'',data.location||data.lokasi||'',data.status||'baru',Number(data.reward_amount??data.rewardAmount??0),Number(data.reward_min_amount??data.rewardMinAmount??0),data.reward_claim_status||data.rewardClaimStatus||'none',data.reward_claimed?1:0,data.payout_wallet||null,data.evidence_json||JSON.stringify(data.buktiFiles||[]),unmeta(data)).run();
        else await env.DB.prepare('UPDATE reports SET status=?,reward_amount=?,reward_min_amount=?,reward_claim_status=?,reward_claimed=?,metadata_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
          .bind(data.status||'baru',Number(data.reward_amount??data.rewardAmount??0),Number(data.reward_min_amount??data.rewardMinAmount??0),data.reward_claim_status||data.rewardClaimStatus||'none',data.reward_claimed?1:0,unmeta(data),id).run();
      }else if(collection==='transactions'){
        const meta=unmeta(data);
        const existing=await env.DB.prepare('SELECT id,type,status,amount,company_id,user_id FROM transactions WHERE id=?').bind(id).first<any>();
        const nextStatus=String(data.status||'pending').toLowerCase();
        const finalStatuses=['selesai','approved','completed','berhasil'];
        const isFinal=finalStatuses.includes(nextStatus);
        const oldFinal=finalStatuses.includes(String(existing?.status||'').toLowerCase());
        const txType=String(data.type||existing?.type||'deposit').toLowerCase();
        let companyId=data.company_id||data.companyId||existing?.company_id||null;
        const transactionUserId=data.user_id||data.userId||existing?.user_id||null;
        if(!companyId && transactionUserId){ const linked=await env.DB.prepare('SELECT company_id FROM users WHERE id=? LIMIT 1').bind(transactionUserId).first<any>(); companyId=linked?.company_id||null; }
        const amount=Number(data.amount??existing?.amount??0);
        if(!Number.isFinite(amount)||amount<0) return json({error:'Nominal transaksi tidak valid.'},400);
        if(existing){
          // Finalized transactions are immutable for balance purposes: only the first transition credits a deposit.
          const update=await env.DB.prepare("UPDATE transactions SET status=?,amount=?,metadata_json=?,processed_at=CASE WHEN ? IN ('selesai','ditolak','approved','completed','berhasil') THEN CURRENT_TIMESTAMP ELSE processed_at END WHERE id=? AND lower(COALESCE(status,'pending')) NOT IN ('selesai','approved','completed','berhasil')")
            .bind(nextStatus,amount,meta,nextStatus,id).run();
          const changed=Number((update as any)?.meta?.changes ?? (update as any)?.changes ?? 0)>0;
          if(changed && isFinal && txType==='deposit' && companyId){
            await env.DB.prepare('UPDATE companies SET deposit_balance=deposit_balance+?,updated_at=CURRENT_TIMESTAMP WHERE company_id=?').bind(amount,companyId).run();
          }
        }else{
          await env.DB.prepare('INSERT INTO transactions(id,user_id,company_id,type,amount,status,method,tx_hash,report_id,metadata_json) VALUES(?,?,?,?,?,?,?,?,?,?)')
            .bind(id,data.user_id||data.userId||null,companyId,txType,amount,nextStatus,data.method||data.metode||null,data.tx_hash||data.txHash||null,data.report_id||data.reportId||null,meta).run();
          if(isFinal && txType==='deposit' && companyId){
            await env.DB.prepare('UPDATE companies SET deposit_balance=deposit_balance+?,updated_at=CURRENT_TIMESTAMP WHERE company_id=?').bind(amount,companyId).run();
          }
        }
      }else if(collection==='audit_logs'){
        await env.DB.prepare('INSERT INTO audit_logs(id,actor_user_id,actor_email,actor_role,company_id,action,entity_type,entity_id,metadata_json) VALUES(?,?,?,?,?,?,?,?,?)')
          .bind(id,owner.id,owner.email,owner.role,data.company_id||data.companyId||null,data.action||'OWNER_ACTION',data.entity_type||null,data.entity_id||id,unmeta(data)).run();
      }
      return json({ok:true,id});
    }
    return json({error:'Operasi tidak didukung.'},400);
  }catch(e:any){
    if(e instanceof Response) return e;
    console.error('OWNER_DATA_POST',e); return json({error:e?.message||'Gagal memproses operasi owner.'},500);
  }
};