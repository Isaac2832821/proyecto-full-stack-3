const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function api(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  
  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    // If not JSON, ignore
  }

  if (!res.ok) {
    console.error(`[API ERROR] ${options.method || 'GET'} ${endpoint} → ${res.status}`, data);
    throw { status: res.status, data };
  }

  return data;
}
