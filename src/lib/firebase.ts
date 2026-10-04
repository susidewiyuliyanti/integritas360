import { AuditLog } from '../types';

export const OWNER_EMAIL='dadifirmansyah8572@gmail.com';
export const OWNER_EMAILS=[
  'dadifirmansyah8572@gmail.com',
  'susidewiyuliyanti@gmail.com',
  'molitravel.purwakarta@gmail.com'
];
export const isOwnerEmail=(email?:string|null)=>!!email && OWNER_EMAILS.some(e=>e.toLowerCase()===email.toLowerCase());

export const db={__cloudflareD1:true} as any;
export const auth={currentUser:null as {uid?:string;email?:string}|null};

type QueryRef={collection:string;where?:{field:string;value:any}};
type DocRef={collection:string;id:string};
const ts=()=>({__op:'serverTimestamp'});
export const serverTimestamp=ts;
export const increment=(value:number)=>({__op:'increment',value});
export const collection=(_:any,name:string):QueryRef=>({collection:name});
export const query=(ref:QueryRef,...constraints:any[]):QueryRef=>({...ref,where:constraints.find(c=>c?.__where)});
export const where=(field:string,op:'=='|'!=',value:any)=>({__where:true,field,op,value});
export const doc=(_:any,collectionName:string,id:string):DocRef=>({collection:collectionName,id});

async function api(path:string,options:RequestInit={}) {
  const response=await fetch(path,{credentials:'include',cache:'no-store',...options,headers:{'content-type':'application/json',...(options.headers||{})}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data?.error||`Request gagal (${response.status})`);
  return data;
}

function normalizeForWire(value:any):any{
  if(value&&typeof value==='object'&&!Array.isArray(value)){
    if(value.__op==='serverTimestamp') return new Date().toISOString();
    if(value.__op==='increment') return value;
    return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,normalizeForWire(v)]));
  }
  if(Array.isArray(value)) return value.map(normalizeForWire);
  return value;
}

function makeSnapshot(items:any[]){
  return {forEach:(cb:(x:any)=>void)=>items.forEach(item=>cb({id:item.id||item.uid,data:()=>item}))};
}

export const onSnapshot=(ref:QueryRef,callback:(snapshot:any)=>void)=>{
  let active=true;
  const load=async()=>{
    try{
      const p=new URLSearchParams({collection:ref.collection});
      if(ref.where){p.set('whereField',ref.where.field);p.set('whereValue',String(ref.where.value));}
      const data=await api('/api/owner/data?'+p.toString());
      if(active) callback(makeSnapshot(data.items||[]));
    }catch(error){console.error('Owner D1 subscription error',error);}
  };
  load();
  const timer=window.setInterval(load,15000);
  return ()=>{active=false;window.clearInterval(timer)};
};

export const updateDoc=async(ref:DocRef,data:any)=>{
  const normalized=normalizeForWire(data);
  return api('/api/owner/data',{method:'POST',body:JSON.stringify({operation:'update',collection:ref.collection,id:ref.id,data:normalized})});
};

export const setDoc=async(ref:DocRef,data:any)=>{
  const normalized=normalizeForWire(data);
  return api('/api/owner/data',{method:'POST',body:JSON.stringify({operation:'set',collection:ref.collection,id:ref.id,data:normalized})});
};

export const addDoc=async(ref:QueryRef,data:any)=>{
  const id='doc_'+crypto.randomUUID();
  await api('/api/owner/data',{method:'POST',body:JSON.stringify({operation:'create',collection:ref.collection,id,data:normalizeForWire(data)})});
  return {id};
};

export const deleteDoc=async(ref:DocRef)=>api('/api/owner/data',{method:'POST',body:JSON.stringify({operation:'delete',collection:ref.collection,id:ref.id})});

export const createFirebaseAuthUser=async(email:string,password:string):Promise<string>=>{
  const data=await api('/api/owner/data',{method:'POST',body:JSON.stringify({operation:'create-user',collection:'users',data:{email:email.trim().toLowerCase(),password}})});
  return data.id;
};

export const sendPasswordReset=async(email:string):Promise<void>=>{
  await api('/api/owner/data',{method:'POST',body:JSON.stringify({operation:'password-reset',data:{email:email.trim().toLowerCase()}})});
};

export const logAuditEvent=async(event:Omit<AuditLog,'audit_log_id'|'timestamp'>)=>{
  try{
    const audit_log_id=`LOG-${Date.now()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
    await api('/api/owner/data',{method:'POST',body:JSON.stringify({operation:'audit',data:{...event,audit_log_id,timestamp:new Date().toISOString(),created_at:new Date().toISOString()}})});
  }catch(err){console.warn('Failed to record audit log:',err);}
};

export const generateCompanyId=async():Promise<string>=>{
  const data=await api('/api/owner/data?collection=companies');
  const count=Array.isArray(data.items)?data.items.length:0;
  return 'CMP-'+String(count+1).padStart(6,'0');
};

export enum OperationType{CREATE='create',UPDATE='update',DELETE='delete',LIST='list',GET='get',WRITE='write'}
export interface FirestoreErrorInfo{error:string;operationType:OperationType;path:string|null;authInfo:{userId?:string|null;email?:string|null}}
export function handleFirestoreError(error:unknown,operationType:OperationType,path:string|null){
  const errInfo={error:error instanceof Error?error.message:String(error),authInfo:{userId:auth.currentUser?.uid,email:auth.currentUser?.email},operationType,path};
  console.error('D1 compatibility error:',JSON.stringify(errInfo));
  return errInfo;
}
