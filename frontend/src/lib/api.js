const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function buildUrl(path) {
  if (!BASE_URL) throw new Error('VITE_API_BASE_URL nije postavljen u .env fajlu');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${p}`;
}

export async function api(path, { method = 'GET', headers = {}, body, token } = {}) {
  const isJSON = body && typeof body === 'object' && !(body instanceof FormData);
  const finalHeaders = {
    ...(isJSON ? { 'Content-Type': 'application/json' } : {}),
    ...headers,
  };
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

  const res = await fetch(buildUrl(path), {
    method,
    headers: finalHeaders,
    body: isJSON ? JSON.stringify(body) : body,
    credentials: 'include',
    mode: 'cors',
  });

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err = new Error(data?.error?.message || data?.message || res.statusText);
    err.status = res.status;
    err.code = data?.error?.code;
    err.data = data;
    throw err;
  }
  return data;
}

export function setToken(token) {
  localStorage.setItem('auth_token', token);
  window.dispatchEvent(new CustomEvent('authStateChanged'));
}

export function getToken() {
  return localStorage.getItem('auth_token');
}

export function removeToken() {
  localStorage.removeItem('auth_token');
  window.dispatchEvent(new CustomEvent('authStateChanged'));
}
