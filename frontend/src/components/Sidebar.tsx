import { ChevronDown, ChevronRight, CircleHelp, LifeBuoy, Wifi } from 'lucide-react';
import { nav, type Page } from '../navigation';

type SidebarProps = {
  cafeName: string;
  activePage: Page;
  activeSessionsCount: number;
  onNavigate: (page: Page) => void;
  onNotify: (message: string) => void;
};

export function Sidebar({ cafeName, activePage, activeSessionsCount, onNavigate, onNotify }: SidebarProps) {
  return (
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark" aria-label="Logo LasyNet"><span>LN</span></div><div><span className="brand-name">LasyNet</span><span className="brand-caption">GESTION CYBERCAFÉ</span></div></div>
        <div className="workspace"><div className="workspace-icon"><Wifi size={17} /></div><div className="workspace-copy"><strong>{cafeName}</strong><span>Gestion locale · Démo</span></div><ChevronDown size={15} className="muted-icon" /></div>
        <div className="nav-label">MENU PRINCIPAL</div>
        <nav className="navigation">{nav.slice(0, 5).map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${activePage === label ? 'active' : ''}`} onClick={() => onNavigate(label)}><Icon size={18} strokeWidth={1.9} /><span>{label}</span>{label === 'Sessions' && activeSessions.length > 0 && <span className="nav-count">{activeSessionsCount}</span>}</button>)}</nav>
        <div className="nav-label management-label">GESTION</div>
        <nav className="navigation">{nav.slice(5).map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${activePage === label ? 'active' : ''}`} onClick={() => onNavigate(label)}><Icon size={18} /><span>{label}</span></button>)}</nav>
        <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><LifeBuoy size={18} /></div><strong>Mode hors ligne</strong><p>Les données sont enregistrées sur ce navigateur.</p><button onClick={() => onNotify('Les données locales restent sur cet appareil.')}>À propos <ChevronRight size={14} /></button></div><div className="profile"><div className="avatar">AD</div><div className="profile-info"><strong>Administrateur</strong><span>Mode démonstration</span></div><button className="icon-button profile-menu" aria-label="Aide" onClick={() => onNotify('Application frontend autonome.')}><CircleHelp size={19} /></button></div></div>
      </aside>
  );
}
