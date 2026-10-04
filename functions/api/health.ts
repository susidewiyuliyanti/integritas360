import { Env,json } from './_utils';
export const onRequestGet: PagesFunction<Env> = async ({env}) => { try { const r=await env.DB.prepare('SELECT 1 AS ok').first<any>(); return json({ok:r?.ok===1,service:'integritas360-api',backend:'cloudflare-d1'}); } catch { return json({ok:false,service:'integritas360-api',error:'D1 belum terhubung'},503); } };
