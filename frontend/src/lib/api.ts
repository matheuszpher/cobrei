export const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
const TOKEN_KEY = 'fiado_token';
const USER_KEY = 'fiado_usuario';

export interface Usuario { id: number | string; nome: string; email: string }

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUsuario: (): Usuario | null => {
    const raw = localStorage.getItem(USER_KEY);
    try { return raw ? (JSON.parse(raw) as Usuario) : null; } catch { return null; }
  },
  salvar: (token: string, usuario: Usuario) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  },
  sair: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor.', 0);
  }
  if (res.status === 401 && !path.startsWith('/auth/')) {
    auth.sair();
    if (window.location.pathname !== '/login') window.location.href = '/login';
    throw new ApiError('Sessão expirada. Entre novamente.', 401);
  }
  const text = await res.text();
  let data: unknown = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  if (!res.ok) {
    const msg = (data && typeof data === 'object' && 'erro' in data) ? String((data as { erro: unknown }).erro) : `Erro ${res.status}`;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

export const api = {
  get: <T>(p: string) => request<T>('GET', p),
  post: <T>(p: string, b?: unknown) => request<T>('POST', p, b ?? {}),
  put: <T>(p: string, b?: unknown) => request<T>('PUT', p, b ?? {}),
  del: <T = unknown>(p: string) => request<T>('DELETE', p),
};

export function qs(params: Record<string, string | number | undefined | null>) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') s.set(k, String(v)); });
  const str = s.toString();
  return str ? `?${str}` : '';
}

export function erroMsg(e: unknown) {
  return e instanceof Error ? e.message : 'Erro inesperado';
}
