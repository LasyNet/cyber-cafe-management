import { ChevronDown, LogOut, Wifi } from 'lucide-react';
import type { Company } from '../api/client';
import { nav, type Page } from '../navigation';

type SidebarProps = {
  cafeName: string;
  activePage: Page;
  activeSessionsCount: number;
  onNavigate: (page: Page) => void;
  onNotify: (message: string) => void;
  onLogout: () => void;
  companies: Company[];
  activeCompanyId: string | null;
  onCompanyChange: (id: string) => void;
  isCompanyAdmin: boolean;
  permissions: Record<string, boolean>;
};

export function Sidebar({ cafeName, activePage, activeSessionsCount, onNavigate, onLogout, companies, activeCompanyId, onCompanyChange, isCompanyAdmin, permissions }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-scroll">
        <div className="brand">
          <div className="brand-mark" aria-label="Logo LasyNet"><span>LN</span></div>
          <div>
            <span className="brand-name">LasyNet</span>
            <span className="brand-caption">GESTION CYBERCAFÉ</span>
          </div>
        </div>
        <label className="workspace workspace-select">
          <div className="workspace-icon"><Wifi size={17} /></div>
          <div className="workspace-copy">
            <strong>{cafeName}</strong>
            <select aria-label="Entreprise active" value={activeCompanyId ?? ''} onChange={event => onCompanyChange(event.target.value)}>
              {companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          </div>
          <ChevronDown size={15} className="muted-icon" />
        </label>
        <div className="nav-label">MENU PRINCIPAL</div>
        <nav className="navigation">
          {nav.slice(0, 5).filter(({ label }) => {
            const key: Partial<Record<Page, string>> = { 'Ordinateurs': 'computers.read', 'Sessions': 'sessions.read', 'Clients': 'clients.read', 'Paiements': 'payments.read' };
            return !key[label] || permissions[key[label] as string] !== false;
          }).map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activePage === label ? 'active' : ''}`} onClick={() => onNavigate(label)}>
              <Icon size={18} strokeWidth={1.9} />
              <span>{label}</span>
              {label === 'Sessions' && activeSessionsCount > 0 && <span className="nav-count">{activeSessionsCount}</span>}
            </button>
          ))}
        </nav>
        <div className="nav-label management-label">GESTION</div>
        <nav className="navigation">
          {nav.slice(5).filter(({ label }) => {
            if (label === 'Personnel') return isCompanyAdmin || permissions['personnel.manage'] === true;
            const key: Partial<Record<Page, string>> = { 'Facturation': 'payments.read', 'Rapports': 'payments.read', 'Paramètres': 'settings.read' };
            return !key[label] || permissions[key[label] as string] !== false;
          }).map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activePage === label ? 'active' : ''}`} onClick={() => onNavigate(label)}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="sidebar-bottom">
        <div className="profile">
          <div className="avatar">AD</div>
          <div className="profile-info">
            <strong>Administrateur</strong>
          </div>
        </div>
        <button type="button" className="sidebar-logout" onClick={onLogout}>
          <LogOut size={17} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
