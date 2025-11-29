export async function apiFetch(path, opts = {}) {
  const base = process.env.NEXT_PUBLIC_API_BASE || '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = opts.headers || {};
  if (!headers['Content-Type'] && !(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (token && !headers['Authorization']) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(base + path, { ...opts, headers });
  const text = await res.text();
  if (!res.ok) {
    try { const json = text ? JSON.parse(text) : { message: `HTTP ${res.status}` }; throw new Error(json.message || JSON.stringify(json)); }
    catch (e) { throw new Error(text || `HTTP ${res.status}`); }
  }
  return text ? JSON.parse(text) : null;
}

export function apiBase() {
  return process.env.NEXT_PUBLIC_API_BASE || '';
}
