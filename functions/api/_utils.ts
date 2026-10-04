export interface Env { DB: D1Database; SESSION_TTL_SECONDS?: string; BOOTSTRAP_TOKEN?: string; }
export function json(data: unknown, status=200, headers: Record<string,string>={}) { return new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8',...headers}}); }
export function cookie(name:string,value:string,maxAge:number,secure=true) { return name+'='+encodeURIComponent(value)+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+maxAge+(secure?'; Secure':''); }
export function getCookie(request:Request,name:string) { const raw=request.headers.get('Cookie')||''; const item=raw.split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'=')); return item?decodeURIComponent(item.slice(name.length+1)):null; }
export function randomId(prefix='id') { return prefix+'_'+crypto.randomUUID(); }

const PASSWORD_ITERATIONS = 10000;

export async function hashPassword(password:string,salt=crypto.randomUUID()) {
  const enc=new TextEncoder();
  const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits(
    {name:'PBKDF2',salt:enc.encode(salt),iterations:PASSWORD_ITERATIONS,hash:'SHA-256'},
    key,
    256
  );
  const bytes=new Uint8Array(bits);
  return {salt,hash:Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')};
}

export async function verifyPassword(password:string,salt:string,expected:string) {
  try {
    if (!password || !salt || !expected) return false;
    const result = await hashPassword(password,salt);
    return result.hash === expected;
  } catch (error) {
    console.error('AUTH_PASSWORD_VERIFY_ERROR', error);
    return false;
  }
}
