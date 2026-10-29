import type { AppSettings, Client, Computer, Payment, Session, Store } from '../types/domain';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_PREFIX = '/api/v1';
const TOKEN_KEY = 'lasynet-access-token';

export type AuthUser = { id: string; full_name: string; email: string; role: string; is_active: boolean };
type ApiComputer = { id: string; name: string; computer_type: Computer['type']; mac_address: string | null; status: Computer['status'] };
type ApiClient = { id: string; name: string; phone: string | null; email: string | null; created_at: string };
type ApiSession = { id: string; computer_id: string; client_id: string; started_at: string; ended_at: string | null; planned_hours: number | null; status: Session['status']; amount: number | string };
type ApiPayment = { id: string; session_id: string; client_id: string; amount: number | string; method: Payment['method']; paid_at: string | null; status: Payment['status']; created_at: string };
type ApiSettings = { id: number; cafe_name: string; hourly_rate: number | string; currency: string };

export const getToken = () => window.localStorage.getItem(TOKEN_KEY);
export const clearToken = () => window.localStorage.removeItem(TOKEN_KEY);

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (response.status === 401) {
    clearToken();
    window.dispatchEvent(new Event('lasynet:unauthorized'));
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null;
    throw new Error(body?.detail || `Erreur API (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

export async function login(email: string, password: string): Promise<AuthUser> {
  clearToken();
  try {
    const token = await request<{ access_token: string }>('/auth/login', json('POST', { email, password }));
    if (!token.access_token) throw new Error('Le serveur n’a pas retourné de jeton de connexion.');
    window.localStorage.setItem(TOKEN_KEY, token.access_token);
    const user = await request<AuthUser>('/auth/me');
    if (!user.is_active) throw new Error('Ce compte est désactivé.');
    return user;
  } catch (error) {
    clearToken();
    throw error;
  }
}
export const currentUser = () => request<AuthUser>('/auth/me');

export async function loadStore(): Promise<Store> {
  const [computers, clients, sessions, payments, settings] = await Promise.all([
    request<ApiComputer[]>('/computers'),
    request<ApiClient[]>('/clients'),
    request<ApiSession[]>('/sessions'),
    request<ApiPayment[]>('/payments'),
    request<ApiSettings>('/settings'),
  ]);
  return {
    computers: computers.map(c => ({ id: c.id, name: c.name, type: c.computer_type, macAddress: c.mac_address ?? '', status: c.status })),
    clients: clients.map(c => ({ id: c.id, name: c.name, phone: c.phone ?? '', email: c.email ?? '', createdAt: c.created_at })),
    sessions: sessions.map(s => ({ id: s.id, computerId: s.computer_id, clientId: s.client_id, startedAt: s.started_at, ...(s.ended_at ? { endedAt: s.ended_at } : {}), plannedHours: s.planned_hours, status: s.status, amount: Number(s.amount) })),
    payments: payments.map(p => ({ id: p.id, sessionId: p.session_id, clientId: p.client_id, amount: Number(p.amount), method: p.method, paidAt: p.paid_at ?? p.created_at, status: p.status })),
    settings: { cafeName: settings.cafe_name, hourlyRate: Number(settings.hourly_rate), currency: settings.currency },
  };
}
export const createComputer = (computer: Omit<Computer, 'id'>) => request<ApiComputer>('/computers', json('POST', { name: computer.name, computer_type: computer.type, mac_address: computer.macAddress || null, status: computer.status }));
export const updateComputer = (id: string, computer: Omit<Computer, 'id'>) => request<ApiComputer>(`/computers/${encodeURIComponent(id)}`, json('PATCH', { name: computer.name, computer_type: computer.type, mac_address: computer.macAddress || null, status: computer.status }));
export const deleteComputer = (id: string) => request<void>(`/computers/${encodeURIComponent(id)}`, json('DELETE'));
export const createClient = (client: Pick<Client, 'name' | 'phone' | 'email'>) => request<ApiClient>('/clients', json('POST', { name: client.name, phone: client.phone || null, email: client.email || null }));
export const updateClient = (id: string, client: Pick<Client, 'name' | 'phone' | 'email'>) => request<ApiClient>(`/clients/${encodeURIComponent(id)}`, json('PATCH', { name: client.name, phone: client.phone || null, email: client.email || null }));
export const deleteClient = (id: string) => request<void>(`/clients/${encodeURIComponent(id)}`, json('DELETE'));
export const createSession = (session: Pick<Session, 'computerId' | 'clientId' | 'plannedHours' | 'amount'>) => request<ApiSession>('/sessions', json('POST', { computer_id: session.computerId, client_id: session.clientId, planned_hours: session.plannedHours, amount: session.amount }));
export const updateSession = (id: string, patch: { status?: Session['status']; ended_at?: string; amount?: number }) => request<ApiSession>(`/sessions/${encodeURIComponent(id)}`, json('PATCH', patch));
export const createPayment = (payment: Pick<Payment, 'sessionId' | 'clientId' | 'amount' | 'method' | 'status' | 'paidAt'>) => request<ApiPayment>('/payments', json('POST', { session_id: payment.sessionId, client_id: payment.clientId, amount: payment.amount, method: payment.method, status: payment.status, paid_at: payment.paidAt }));
export const updatePayment = (id: string, payment: Pick<Payment, 'status' | 'method' | 'paidAt'>) => request<ApiPayment>(`/payments/${encodeURIComponent(id)}`, json('PATCH', { status: payment.status, method: payment.method, paid_at: payment.paidAt }));
export const updateSettings = (settings: AppSettings) => request<ApiSettings>('/settings', json('PATCH', { cafe_name: settings.cafeName, hourly_rate: settings.hourlyRate, currency: settings.currency }));
