import { Env, json, randomId, hashPassword } from '../_utils';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let objectKey: string | null = null;
  try {
    const form = await request.formData();
    const email = String(form.get('email') || '').trim().toLowerCase();
    const password = String(form.get('password') || '');
    const picName = String(form.get('picName') || '').trim();
    const file = form.get('companyProfile');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({error:'Alamat email tidak valid.'},400);
    if (password.length < 10 || password.length > 128) return json({error:'Kata sandi minimal 10 dan maksimal 128 karakter.'},400);
    if (picName.length < 2 || picName.length > 120) return json({error:'Nama PIC wajib diisi (2–120 karakter).'},400);
    if (!(file instanceof File) || file.size < 1 || file.size > 5 * 1024 * 1024) return json({error:'Upload Company Profile wajib diisi dan maksimal 5 MB.'},400);
    const allowed: Record<string,string> = {'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png'};
    const ext = allowed[file.type];
    if (!ext) return json({error:'Format dokumen harus PDF, JPG, atau PNG.'},400);
    const existing = await env.DB.prepare('SELECT id FROM users WHERE lower(email)=? LIMIT 1').bind(email).first<any>();
    if (existing) return json({error:'Email sudah terdaftar.'},409);

    const companyId = randomId('tenant');
    const userId = randomId('usr');
    const {salt,hash} = await hashPassword(password);
    objectKey = 'registrations/' + companyId + '/company-profile.' + ext;
    await env.COMPANY_PROFILES.put(objectKey, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type, contentDisposition: 'attachment; filename="' + file.name.replace(/[\r\n"\\]/g,'_') + '"' },
      customMetadata: { companyId, submittedBy: email }
    });
    const profile = { picName, registrationStatus:'PENDING', companyProfileObjectKey:objectKey, companyProfileFileName:file.name, companyProfileContentType:file.type, submittedAt:new Date().toISOString() };
    await env.DB.batch([
      env.DB.prepare("INSERT INTO companies (id,company_id,company_name,email,status,metadata_json,profile_json) VALUES (?,?,?,?,'PENDING',?,?)")
        .bind(companyId,companyId,'Pendaftaran ' + picName,email,JSON.stringify({registrationStatus:'PENDING'}),JSON.stringify(profile)),
      env.DB.prepare("INSERT INTO users (id,email,password_hash,password_salt,role,company_id,status,full_name,profile_json) VALUES (?,?,?,?,'perusahaan',?,'PENDING',?,?)")
        .bind(userId,email,hash,salt,companyId,picName,JSON.stringify({picName})),
      env.DB.prepare("INSERT INTO company_users (id,user_id,company_id,role,status,is_primary_company_account) VALUES (?,?,?,'perusahaan','PENDING',1)")
        .bind(randomId('cu'),userId,companyId),
      env.DB.prepare("INSERT INTO audit_logs (id,actor_user_id,actor_email,actor_role,company_id,action,entity_type,entity_id,metadata_json) VALUES (?,?,?,'public','?','TENANT_REGISTRATION_SUBMITTED','tenant_registration',?,?)")
        .bind(randomId('audit'),userId,email,companyId,companyId,JSON.stringify({picName,fileName:file.name,contentType:file.type,objectKey}))
    ]);
    return json({ok:true,message:'Pendaftaran berhasil dikirim dan menunggu verifikasi Super Admin.',status:'PENDING'});
  } catch (error) {
    if (objectKey) { try { await env.COMPANY_PROFILES.delete(objectKey); } catch {} }
    console.error('TENANT_REGISTRATION_ERROR', error);
    return json({error:'Pendaftaran belum dapat diproses. Silakan coba kembali.'},500);
  }
};
