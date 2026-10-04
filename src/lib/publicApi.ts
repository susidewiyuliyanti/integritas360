type Ref = { collection: string; id?: string; where?: { field: string; value: any } };

async function api(path: string, options: RequestInit = {}) {
  const response = await fetch(path, { credentials: 'include', cache: 'no-store', ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `Request gagal (${response.status})`);
  return data;
}

export const db = { __cloudflareD1: true } as any;
export const collection = (_db: any, name: string): Ref => ({ collection: name });
export const query = (ref: Ref, ...constraints: any[]): Ref => ({ ...ref, where: constraints.find(c => c?.__where) });
export const where = (field: string, _op: '==' | '!=', value: any) => ({ __where: true, field, value });
export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => ({ __orderBy: true, field, direction });
export const limit = (value: number) => ({ __limit: true, value });
export const doc = (_db: any, collectionName: string, id: string): Ref => ({ collection: collectionName, id });
export const serverTimestamp = () => new Date().toISOString();
export const increment = (value: number) => ({ __op: 'increment', value });

const snapshot = (items: any[]) => ({
  empty: items.length === 0,
  docs: items.map(item => ({ id: item.id || item.uid, data: () => item })),
  forEach: (cb: (d: any) => void) => items.forEach(item => cb({ id: item.id || item.uid, data: () => item }))
});

export function onSnapshot(ref: Ref, next: (snapshot: any) => void, error?: (error: any) => void) {
  let stopped = false;
  const run = async () => { try { if (!stopped) next(await getDocs(ref)); } catch (e) { if (!stopped) error?.(e); } };
  void run();
  const timer = window.setInterval(run, 15000);
  return () => { stopped = true; window.clearInterval(timer); };
}

export async function getDocs(ref: Ref) {
  const p = new URLSearchParams({ collection: ref.collection });
  if (ref.where) { p.set('whereField', ref.where.field); p.set('whereValue', String(ref.where.value)); }
  const data = await api('/api/public/data?' + p.toString());
  return snapshot(data.items || []);
}

export async function getDoc(ref: Ref) {
  const data = await getDocs({ collection: ref.collection, where: ref.id ? { field: 'id', value: ref.id } : undefined });
  const item = data.docs.find((d: any) => d.id === ref.id);
  return { exists: () => Boolean(item), id: ref.id, data: () => item?.data() || {} };
}

export async function addDoc(ref: Ref, data: any) {
  if (ref.collection === 'reports') {
    return api('/api/public/data', { method: 'POST', body: JSON.stringify({ operation: 'create-report', data }) });
  }
  if (ref.collection === 'transactions') {
    return api('/api/public/data', { method: 'POST', body: JSON.stringify({ operation: 'create-claim', data }) });
  }
  throw new Error(`Collection tidak didukung: ${ref.collection}`);
}

export async function updateDoc(ref: Ref, data: any) {
  return api('/api/public/data', { method: 'POST', body: JSON.stringify({ operation: 'update', collection: ref.collection, id: ref.id, data }) });
}
