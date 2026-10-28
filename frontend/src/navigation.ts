import { Activity, Clock3, CreditCard, FileText, LayoutDashboard, Monitor, Settings2, Users } from 'lucide-react';

type Page = 'Vue d’ensemble' | 'Ordinateurs' | 'Sessions' | 'Clients' | 'Paiements' | 'Facturation' | 'Rapports' | 'Paramètres';
const nav = [
  { label: 'Vue d’ensemble' as Page, icon: LayoutDashboard }, { label: 'Ordinateurs' as Page, icon: Monitor },
  { label: 'Sessions' as Page, icon: Clock3 }, { label: 'Clients' as Page, icon: Users },
  { label: 'Paiements' as Page, icon: CreditCard }, { label: 'Facturation' as Page, icon: FileText }, { label: 'Rapports' as Page, icon: Activity },
  { label: 'Paramètres' as Page, icon: Settings2 },
];
const pageSlugs: Record<Page, string> = {
  'Vue d’ensemble': 'dashboard',
  Ordinateurs: 'ordinateurs',
  Sessions: 'sessions',
  Clients: 'clients',
  Paiements: 'paiements',
  Facturation: 'facturation',
  Rapports: 'rapports',
  Paramètres: 'parametres',
};
const pageFromHash = (): Page => {
  const slug = window.location.hash.slice(1);
  return (Object.entries(pageSlugs).find(([, value]) => value === slug)?.[0] as Page | undefined) ?? 'Vue d’ensemble';
};
