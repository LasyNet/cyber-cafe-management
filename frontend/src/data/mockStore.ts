import { useEffect, useMemo, useState } from 'react';

export type ComputerStatus = 'Disponible' | 'En cours' | 'Maintenance';
export type ComputerType = 'Interne' | 'Externe';
export type Computer = { id: string; name: string; type: ComputerType; macAddress: string; status: ComputerStatus };
export type Client = { id: string; name: string; phone: string; email: string; createdAt: string };
export type SessionStatus = 'En cours' | 'Terminée';
export type Session = { id: string; computerId: string; clientId: string; startedAt: string; endedAt?: string; plannedHours: number | null; status: SessionStatus; amount: number };
export type Payment = { id: string; sessionId: string; clientId: string; amount: number; method: 'Espèces' | 'Mobile Money' | 'Carte'; paidAt: string; status: 'Payé' | 'En attente' };
export type AppSettings = { cafeName: string; hourlyRate: number; currency: string };
export type Store = { computers: Computer[]; clients: Client[]; sessions: Session[]; payments: Payment[]; settings: AppSettings };

const KEY = 'lasynet-cybercafe-store-v1';
const now = new Date();
const ago = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();
const seed: Store = {
  computers: [
    { id: 'PC-01', name: 'Station 01', type: 'Interne', macAddress: '02:4C:4E:00:00:01', status: 'En cours' }, { id: 'PC-02', name: 'Station 02', type: 'Interne', macAddress: '02:4C:4E:00:00:02', status: 'Disponible' },
    { id: 'PC-03', name: 'Station 03', type: 'Interne', macAddress: '02:4C:4E:00:00:03', status: 'En cours' }, { id: 'PC-04', name: 'Station 04', type: 'Interne', macAddress: '02:4C:4E:00:00:04', status: 'En cours' },
    { id: 'PC-05', name: 'Station 05', type: 'Interne', macAddress: '02:4C:4E:00:00:05', status: 'Maintenance' }, { id: 'PC-06', name: 'Station 06', type: 'Interne', macAddress: '02:4C:4E:00:00:06', status: 'Disponible' },
    { id: 'PC-07', name: 'Station 07', type: 'Interne', macAddress: '02:4C:4E:00:00:07', status: 'Disponible' }, { id: 'PC-08', name: 'Station 08', type: 'Interne', macAddress: '02:4C:4E:00:00:08', status: 'Disponible' },
    { id: 'PC-09', name: 'Station 09', type: 'Interne', macAddress: '02:4C:4E:00:00:09', status: 'Disponible' }, { id: 'PC-10', name: 'Station 10', type: 'Interne', macAddress: '02:4C:4E:00:00:0A', status: 'Disponible' },
    { id: 'PC-11', name: 'Station 11', type: 'Interne', macAddress: '02:4C:4E:00:00:0B', status: 'Disponible' }, { id: 'PC-12', name: 'Station 12', type: 'Interne', macAddress: '02:4C:4E:00:00:0C', status: 'Disponible' },
  ],
  clients: [
    { id: 'CL-001', name: 'Andry Rakoto', phone: '034 12 345 67', email: 'andry@example.com', createdAt: ago(72) },
    { id: 'CL-002', name: 'Miora Randria', phone: '032 22 111 45', email: 'miora@example.com', createdAt: ago(48) },
    { id: 'CL-003', name: 'Hery Nomenjanahary', phone: '033 44 567 89', email: 'hery@example.com', createdAt: ago(24) },
    { id: 'CL-004', name: 'Fara Rakotomalala', phone: '034 55 123 45', email: 'fara@example.com', createdAt: ago(12) },
    { id: 'CL-005', name: 'Toky Andrianina', phone: '038 77 345 21', email: 'toky@example.com', createdAt: ago(4) },
  ],
  sessions: [
    { id: 'SES-1001', computerId: 'PC-01', clientId: 'CL-001', startedAt: ago(1.4), plannedHours: 2, status: 'En cours', amount: 2400 },
    { id: 'SES-1002', computerId: 'PC-03', clientId: 'CL-002', startedAt: ago(.75), plannedHours: 1, status: 'En cours', amount: 1200 },
    { id: 'SES-1003', computerId: 'PC-04', clientId: 'CL-003', startedAt: ago(2.1), plannedHours: 3, status: 'En cours', amount: 3500 },
    { id: 'SES-0998', computerId: 'PC-02', clientId: 'CL-004', startedAt: ago(27), endedAt: ago(25.5), plannedHours: 2, status: 'Terminée', amount: 1800 },
    { id: 'SES-0999', computerId: 'PC-06', clientId: 'CL-005', startedAt: ago(5), endedAt: ago(3), plannedHours: 2, status: 'Terminée', amount: 2400 },
  ],
  payments: [
    { id: 'PAY-2001', sessionId: 'SES-0998', clientId: 'CL-004', amount: 1800, method: 'Espèces', paidAt: ago(25.5), status: 'Payé' },
    { id: 'PAY-2002', sessionId: 'SES-0999', clientId: 'CL-005', amount: 2400, method: 'Mobile Money', paidAt: ago(3), status: 'Payé' },
  ],
  settings: { cafeName: 'Cyber Café Central', hourlyRate: 1200, currency: 'Ar' },
};

export function readStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Store>;
      return { ...seed, ...parsed, computers: (parsed.computers ?? seed.computers).map(c => ({ ...c, type: c.type ?? 'Interne', macAddress: c.macAddress ?? '' })), settings: { ...seed.settings, ...parsed.settings } };
    }
  } catch (error) {
    console.warn('Impossible de lire les données locales LasyNet.', error);
  }
  return seed;
}

export function writeStore(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
    return true;
  } catch (error) {
    console.error('Impossible d’enregistrer les données locales LasyNet.', error);
    return false;
  }
}

export function resetStore() {
  localStorage.removeItem(KEY);
  return seed;
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}
