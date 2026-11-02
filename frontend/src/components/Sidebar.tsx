import { ChevronDown, LogOut, Wifi } from 'lucide-react';
import { nav, type Page } from '../navigation';

type SidebarProps = {
  cafeName: string;
  activePage: Page;
  activeSessionsCount: number;
  onNavigate: (page: Page) => void;
  onNotify: (message: string) => void;
  onLogout: () => void;
};

export function Sidebar({ cafeName, activePage, activeSessionsCount, onNavigate, onLogout }: SidebarProps) {
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
        <div className="workspace">
          <div className="workspace-icon"><Wifi size={17} /></div>
          <div className="workspace-copy">
            <strong>{cafeName}</strong>
            <span>Connecté · Données serveur</span>
          </div>
          <ChevronDown size={15} className="muted-icon" />
        </div>
        <div className="nav-label">MENU PRINCIPAL</div>
        <nav className="navigation">
          {nav.slice(0, 5).map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activePage === label ? 'active' : ''}`} onClick={() => onNavigate(label)}>
              <Icon size={18} strokeWidth={1.9} />
              <span>{label}</span>
              {label === 'Sessions' && activeSessionsCount > 0 && <span className="nav-count">{activeSessionsCount}</span>}
            </button>
          ))}
        </nav>
        <div className="nav-label management-label">GESTION</div>
        <nav className="navigation">
          {nav.slice(5).map(({ label, icon: Icon }) => (
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
