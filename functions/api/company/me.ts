import { Env, json, getCookie } from '../_utils';

export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
  try{
    const sid=getCookie(request,'i360_session');
    if(!sid) return json({error:'Unauthorized'},401);
    const user=await env.DB.prepare(`
      SELECT u.id,u.email,u.role,u.company_id,u.status,u.full_name,u.phone,u.metadata_json,
             c.company_id AS cid,c.company_name,c.email AS company_email,c.status AS company_status,
             c.deposit_balance,c.locked_balance,c.metadata_json AS company_metadata
      FROM sessions s JOIN users u ON u.id=s.user_id
      LEFT JOIN companies c ON c.company_id=u.company_id
      WHERE s.id=? AND s.expires_at>CURRENT_TIMESTAMP AND u.status='ACTIVE'
      LIMIT 1`).bind(sid).first<any>();
    if(!user) return json({error:'Unauthorized'},401);
    const profile={...(user.metadata_json?JSON.parse(user.metadata_json):{}),uid:user.id,email:user.email,role:user.role,company_id:user.company_id};
    const company=user.cid?{...(user.company_metadata?JSON.parse(user.company_metadata):{}),company_id:user.cid,company_name:user.company_name,email:user.company_email,status:user.company_status,deposit_balance:user.deposit_balance,locked_balance:user.locked_balance}:null;
    const companyUser=user.company_id?await env.DB.prepare('SELECT * FROM company_users WHERE user_id=? LIMIT 1').bind(user.id).first<any>():null;
    return json({ok:true,profile,company,companyUser});
  }catch(e){console.error('COMPANY_ME',e);return json({error:'Gagal mengambil profil perusahaan.'},500);}
};