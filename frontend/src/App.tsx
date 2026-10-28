import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, ChevronRight,
  CircleHelp, Clock3, CreditCard, Download, LayoutDashboard, LifeBuoy, Monitor, MoreHorizontal,
  Plus, Search, Settings2, ShieldCheck, Trash2, Users, Wifi, X, Zap, RotateCcw, Pencil, Play, Square,
} from 'lucide-react';
import { newId, readStore, resetStore, writeStore, type AppSettings, type Client, type Computer, type ComputerStatus, type Payment, type Session, type Store } from './data/mockStore';

type Page = 'Vue d’ensemble' | 'Ordinateurs' | 'Sessions' | 'Clients' | 'Paiements' | 'Rapports' | 'Paramètres';
const nav = [
  { label: 'Vue d’ensemble' as Page, icon: LayoutDashboard }, { label: 'Ordinateurs' as Page, icon: Monitor },
  { label: 'Sessions' as Page, icon: Clock3 }, { label: 'Clients' as Page, icon: Users },
  { label: 'Paiements' as Page, icon: CreditCard }, { label: 'Rapports' as Page, icon: Activity },
  { label: 'Paramètres' as Page, icon: Settings2 },
];
const money = (n: number, currency = 'Ar') => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' ' + currency;
const dateTime = (value: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
const elapsed = (startedAt: string) => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000));
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')} h ${String(minutes % 60).padStart(2, '0')}`;
};

function App() {
  const [store, setStore] = useState<Store>(() => readStore());
  const [activePage, setActivePage] = useState<Page>('Vue d’ensemble');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | ComputerStatus>('Tous');
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState<'computer' | 'client' | 'session' | 'settings' | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMacAddress, setFormMacAddress] = useState('');
  const [formComputer, setFormComputer] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formHours, setFormHours] = useState('1');
  const [formStatus, setFormStatus] = useState<ComputerStatus>('Disponible');
  const [formRate, setFormRate] = useState('1200');
  const [formCafe, setFormCafe] = useState('Cyber Café Central');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { if (!writeStore(store)) setToast('Stockage local indisponible : vérifie les paramètres du navigateur.'); }, [store]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 3200); return () => window.clearTimeout(timer); }, [toast]);

  const activeSessions = store.sessions.filter(s => s.status === 'En cours');
  const today = new Date().toDateString();
  const revenueToday = store.payments.filter(p => p.status === 'Payé' && new Date(p.paidAt).toDateString() === today).reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = store.payments.filter(p => p.status === 'Payé').reduce((sum, p) => sum + p.amount, 0);
  const availableCount = store.computers.filter(c => c.status === 'Disponible').length;
  const clientsToday = new Set(store.sessions.filter(s => new Date(s.startedAt).toDateString() === today).map(s => s.clientId)).size;
  const filteredComputers = useMemo(() => store.computers.filter(c => (statusFilter === 'Tous' || c.status === statusFilter) && (c.name + c.id + c.macAddress + c.status).toLowerCase().includes(query.toLowerCase())), [store.computers, statusFilter, query]);
  const getClient = (id: string) => store.clients.find(c => c.id === id);
  const getComputer = (id: string) => store.computers.find(c => c.id === id);
  const notify = (message: string) => setToast(message);
  const openModal = (kind: typeof modal) => {
    setEditingId(null); setFormName(''); setFormPhone(''); setFormEmail(''); setFormMacAddress(''); setFormStatus('Disponible');
    setFormCafe(store.settings.cafeName); setFormRate(String(store.settings.hourlyRate));
    setFormComputer(store.computers.find(c => c.status === 'Disponible')?.id ?? '');
    setFormClient(store.clients[0]?.id ?? ''); setFormHours('1'); setModal(kind);
  };
  const addComputer = () => {
    if (!formName.trim()) return notify('Le nom de l’ordinateur est obligatoire.');
    const normalizedMac = formMacAddress.trim().toUpperCase().replace(/-/g, ':');
    if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(normalizedMac)) return notify('Saisis une adresse MAC valide (ex. 00:1A:2B:3C:4D:5E).');
    if (store.computers.some(c => c.id !== editingId && c.macAddress && c.macAddress.toUpperCase() === normalizedMac)) return notify('Cette adresse MAC est déjà attribuée à un autre ordinateur.');
    if (editingId) {
      setStore(s => ({ ...s, computers: s.computers.map(c => c.id === editingId ? { ...c, name: formName.trim(), macAddress: normalizedMac, status: formStatus } : c) }));
      notify('Ordinateur modifié.');
    } else {
      const computer: Computer = { id: newId('PC'), name: formName.trim(), macAddress: normalizedMac, status: formStatus };
      setStore(s => ({ ...s, computers: [...s.computers, computer] })); notify('Ordinateur ajouté.');
    }
    setModal(null);
  };
  const editComputer = (computer: Computer) => {
    setEditingId(computer.id); setFormName(computer.name); setFormMacAddress(computer.macAddress ?? ''); setFormStatus(computer.status); setModal('computer');
  };
  const deleteComputer = (computer: Computer) => {
    if (store.sessions.some(s => s.computerId === computer.id && s.status === 'En cours')) return notify('Termine la session avant de supprimer ce poste.');
    if (window.confirm(`Supprimer ${computer.name} ?`)) {
      setStore(s => ({ ...s, computers: s.computers.filter(c => c.id !== computer.id) })); notify('Ordinateur supprimé.');
    }
  };
  const saveClient = () => {
    if (!formName.trim()) return notify('Le nom du client est obligatoire.');
    if (editingId) {
      setStore(s => ({ ...s, clients: s.clients.map(c => c.id === editingId ? { ...c, name: formName.trim(), phone: formPhone.trim(), email: formEmail.trim() } : c) }));
      notify('Fiche client mise à jour.');
    } else {
      const client: Client = { id: newId('CL'), name: formName.trim(), phone: formPhone.trim(), email: formEmail.trim(), createdAt: new Date().toISOString() };
      setStore(s => ({ ...s, clients: [client, ...s.clients] })); notify('Client ajouté.');
    }
    setModal(null);
  };
  const editClient = (client: Client) => { setEditingId(client.id); setFormName(client.name); setFormPhone(client.phone); setFormEmail(client.email); setModal('client'); };
  const deleteClient = (client: Client) => {
    if (store.sessions.some(s => s.clientId === client.id && s.status === 'En cours')) return notify('Ce client possède une session active.');
    if (window.confirm(`Supprimer le client ${client.name} ?`)) {
      setStore(s => ({ ...s, clients: s.clients.filter(c => c.id !== client.id) })); notify('Client supprimé.');
    }
  };
  const startSession = () => {
    if (!formComputer || !formClient) return notify('Ajoute un client et un ordinateur disponible avant de démarrer.');
    const computer = getComputer(formComputer);
    if (!computer || computer.status !== 'Disponible') return notify('Cet ordinateur n’est plus disponible.');
    const hours = formHours === 'libre' ? null : Number(formHours);
    const session: Session = { id: newId('SES'), computerId: computer.id, clientId: formClient, startedAt: new Date().toISOString(), plannedHours: hours, status: 'En cours', amount: 0 };
    setStore(s => ({ ...s, sessions: [session, ...s.sessions], computers: s.computers.map(c => c.id === computer.id ? { ...c, status: 'En cours' } : c) }));
    setModal(null); setActivePage('Sessions'); notify('Session démarrée et enregistrée localement.');
  };
  const endSession = (session: Session) => {
    const hours = Math.max(1, Math.ceil((Date.now() - new Date(session.startedAt).getTime()) / 3600000));
    const amount = hours * store.settings.hourlyRate;
    const ended = new Date().toISOString();
    const payment: Payment = { id: newId('PAY'), sessionId: session.id, clientId: session.clientId, amount, method: 'Espèces', paidAt: ended, status: 'En attente' };
    setStore(s => ({ ...s, sessions: s.sessions.map(item => item.id === session.id ? { ...item, status: 'Terminée', endedAt: ended, amount } : item), computers: s.computers.map(c => c.id === session.computerId ? { ...c, status: 'Disponible' } : c), payments: [payment, ...s.payments] }));
    setActivePage('Paiements'); notify('Session terminée. Un paiement en attente a été créé.');
  };
  const markPaid = (payment: Payment, method: Payment['method']) => {
    setStore(s => ({ ...s, payments: s.payments.map(p => p.id === payment.id ? { ...p, status: 'Payé', method, paidAt: new Date().toISOString() } : p) }));
    notify('Paiement enregistré.');
  };
  const saveSettings = () => {
    const rate = Number(formRate);
    if (!formCafe.trim() || !Number.isFinite(rate) || rate <= 0) return notify('Renseigne un nom et un tarif horaire valide.');
    setStore(s => ({ ...s, settings: { ...s.settings, cafeName: formCafe.trim(), hourlyRate: rate } as AppSettings }));
    setModal(null); notify('Paramètres enregistrés.');
  };
  const exportData = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'lasynet-donnees-locales.json'; link.click(); URL.revokeObjectURL(url);
    notify('Export des données préparé.');
  };
  const restoreDemo = () => {
    if (!window.confirm('Restaurer les données initiales ? Toutes les modifications locales seront perdues.')) return;
    const fresh = resetStore(); setStore(fresh); notify('Données de démonstration restaurées.');
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark" aria-label="Logo LasyNet"><span>LN</span></div><div><span className="brand-name">LasyNet</span><span className="brand-caption">GESTION CYBERCAFÉ</span></div></div>
      <div className="workspace"><div className="workspace-icon"><Wifi size={17} /></div><div className="workspace-copy"><strong>{store.settings.cafeName}</strong><span>Gestion locale · Démo</span></div><ChevronDown size={15} className="muted-icon" /></div>
      <div className="nav-label">MENU PRINCIPAL</div>
      <nav className="navigation">{nav.slice(0, 5).map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${activePage === label ? 'active' : ''}`} onClick={() => setActivePage(label)}><Icon size={18} strokeWidth={1.9} /><span>{label}</span>{label === 'Sessions' && activeSessions.length > 0 && <span className="nav-count">{activeSessions.length}</span>}</button>)}</nav>
      <div className="nav-label management-label">GESTION</div>
      <nav className="navigation">{nav.slice(5).map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${activePage === label ? 'active' : ''}`} onClick={() => setActivePage(label)}><Icon size={18} /><span>{label}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><LifeBuoy size={18} /></div><strong>Mode hors ligne</strong><p>Les données sont enregistrées sur ce navigateur.</p><button onClick={() => notify('Les données locales restent sur cet appareil.')}>À propos <ChevronRight size={14} /></button></div><div className="profile"><div className="avatar">AD</div><div className="profile-info"><strong>Administrateur</strong><span>Mode démonstration</span></div><button className="icon-button profile-menu" aria-label="Aide" onClick={() => notify('Application frontend autonome.')}><CircleHelp size={19} /></button></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="breadcrumb"><span>LasyNet</span><ChevronRight size={15} /><strong>{activePage}</strong></div><div className="topbar-actions"><label className="search-box"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher dans le module..." /><kbd>⌘ K</kbd></label><button className="icon-button notification-button" aria-label="État du stockage" onClick={() => notify('Stockage local actif sur ce navigateur.')}><Bell size={19} /><span className="notification-dot" /></button><div className="topbar-divider" /><button className="date-chip" onClick={exportData}><Download size={16} /> Exporter <ChevronDown size={14} /></button></div></header>
      <div className="page-content">
        {activePage === 'Vue d’ensemble' && <>
          <section className="welcome-row"><div><div className="eyebrow"><span className="live-dot" /> MODE DÉMONSTRATION · DONNÉES LOCALES</div><h1>Bonjour, Administrateur <span className="wave">✦</span></h1><p className="page-subtitle">Pilotez votre cybercafé depuis un tableau de bord interactif.</p></div><button className="primary-button" onClick={() => openModal('session')}><Plus size={18} /> Nouvelle session</button></section>
          <section className="stats-grid" aria-label="Indicateurs clés">
            <article className="stat-card"><div className="stat-top"><span className="stat-label">Revenus encaissés</span><span className="stat-icon revenue"><CreditCard size={19} /></span></div><div className="stat-value">{money(revenueToday).replace(' Ar','')} <small>Ar</small></div><div className="stat-footer"><span className="stat-neutral"><span className="tiny-dot green" /> Aujourd’hui</span></div></article>
            <article className="stat-card"><div className="stat-top"><span className="stat-label">Sessions actives</span><span className="stat-icon sessions"><Clock3 size={19} /></span></div><div className="stat-value">{activeSessions.length}<small> sessions</small></div><div className="stat-footer"><span className="stat-neutral"><span className="tiny-dot green" /> En cours maintenant</span></div><div className="mini-progress"><span style={{ width: `${store.computers.length ? activeSessions.length / store.computers.length * 100 : 0}%` }} /></div></article>
            <article className="stat-card"><div className="stat-top"><span className="stat-label">Ordinateurs disponibles</span><span className="stat-icon computers"><Monitor size={19} /></span></div><div className="stat-value">{availableCount}<small> / {store.computers.length}</small></div><div className="stat-footer"><span className="stat-neutral"><span className="tiny-dot green" /> Prêts à l’utilisation</span></div><div className="mini-progress blue"><span style={{ width: `${store.computers.length ? availableCount / store.computers.length * 100 : 0}%` }} /></div></article>
            <article className="stat-card"><div className="stat-top"><span className="stat-label">Clients aujourd’hui</span><span className="stat-icon customers"><Users size={19} /></span></div><div className="stat-value">{clientsToday}<small> clients</small></div><div className="stat-footer"><span className="stat-neutral">{store.clients.length} clients enregistrés</span></div></article>
          </section>
          <section className="content-grid"><article className="panel revenue-panel"><div className="panel-header"><div><h2>Activité des paiements</h2><p>Vue d’ensemble des revenus enregistrés</p></div><button className="select-chip" onClick={() => setActivePage('Rapports')}>Voir les rapports <ChevronRight size={14} /></button></div><div className="revenue-summary"><strong>{money(totalPaid)}</strong><span className="revenue-change"><ArrowUpRight size={15} /> Total encaissé</span></div><div className="chart" role="img" aria-label="Répartition des paiements par jour"><div className="chart-grid"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0</span></div><div className="chart-bars">{['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((day, i) => { const amount = store.payments.filter(p => p.status === 'Payé' && new Date(p.paidAt).getDay() === (i + 1) % 7).reduce((n,p) => n+p.amount,0); const max = Math.max(1,...store.payments.map(p => p.amount)); return <div className="bar-column" key={day}><div className={`bar-track ${i === new Date().getDay()-1 ? 'highlight' : ''}`}><span style={{height:`${Math.max(amount ? 8 : 3, amount/max*100)}%`}} /></div><span className="bar-label">{day}</span></div>; })}</div></div><div className="chart-foot"><span><i className="legend-dot" /> Paiements encaissés</span><span>Stockage local</span></div></article>
            <article className="panel occupancy-panel"><div className="panel-header"><div><h2>Occupation du parc</h2><p>Statut actuel des postes</p></div><button className="icon-button subtle" aria-label="Gérer les postes" onClick={() => setActivePage('Ordinateurs')}><MoreHorizontal size={20} /></button></div><div className="occupancy-main"><div className="donut" style={{background:`conic-gradient(#dc2626 0 ${store.computers.length ? activeSessions.length/store.computers.length*100 : 0}%, #334155 ${store.computers.length ? activeSessions.length/store.computers.length*100 : 0}% 100%)`}}><div><strong>{store.computers.length ? Math.round(activeSessions.length/store.computers.length*100) : 0}<small>%</small></strong><span>occupés</span></div></div><div className="occupancy-legend"><div><span className="legend-square purple" /><span>En cours</span><strong>{activeSessions.length}</strong></div><div><span className="legend-square pale" /><span>Disponibles</span><strong>{availableCount}</strong></div><div><span className="legend-square amber" /><span>Maintenance</span><strong>{store.computers.filter(c=>c.status==='Maintenance').length}</strong></div></div></div><div className="occupancy-note"><ShieldCheck size={16} /><span><strong>Tout est sous contrôle.</strong> Les changements sont conservés localement.</span></div></article></section>
          <section className="panel computers-panel"><div className="panel-header computers-header"><div><h2>Sessions en cours</h2><p>Suivez les clients actuellement connectés</p></div><button className="text-button" onClick={() => setActivePage('Sessions')}>Toutes les sessions <ChevronRight size={15} /></button></div><div className="table-scroll"><table><thead><tr><th>ORDINATEUR</th><th>CLIENT</th><th>DÉBUT</th><th>DURÉE</th><th>COÛT ESTIMÉ</th><th /></tr></thead><tbody>{activeSessions.slice(0,5).map(s=><tr key={s.id}><td><div className="computer-name"><span className="pc-icon pc-active"><Monitor size={17}/></span><span><strong>{getComputer(s.computerId)?.name ?? s.computerId}</strong><small>{s.id}</small></span></div></td><td>{getClient(s.clientId)?.name ?? 'Client supprimé'}</td><td>{dateTime(s.startedAt)}</td><td>{elapsed(s.startedAt)}</td><td>{money(Math.max(1,Math.ceil((Date.now()-new Date(s.startedAt).getTime())/3600000))*store.settings.hourlyRate)}</td><td><button className="small-action" onClick={()=>endSession(s)}>Terminer</button></td></tr>)}{activeSessions.length===0&&<tr><td colSpan={6} className="empty-state">Aucune session active. Démarre une nouvelle session pour commencer.</td></tr>}</tbody></table></div></section>
        </>}
        {activePage === 'Ordinateurs' && <ModuleHeader title="Ordinateurs" subtitle="Gérez les postes, leur disponibilité et la maintenance." action="Ajouter un ordinateur" onAction={()=>openModal('computer')}><div className="filter-tabs">{(['Tous','En cours','Disponible','Maintenance'] as const).map(s=><button key={s} className={statusFilter===s?'selected':''} onClick={()=>setStatusFilter(s)}>{s}</button>)}</div><div className="table-scroll"><table><thead><tr><th>POSTE</th><th>ADRESSE MAC</th><th>STATUT</th><th>CLIENT ACTUEL</th><th>SESSION</th><th>ACTIONS</th></tr></thead><tbody>{filteredComputers.map(c=>{const session=activeSessions.find(s=>s.computerId===c.id);return <tr key={c.id}><td><div className="computer-name"><span className={`pc-icon ${c.status==='En cours'?'pc-active':c.status==='Maintenance'?'pc-maintenance':''}`}><Monitor size={17}/></span><span><strong>{c.name}</strong><small>{c.id}</small></span></div></td><td><code className="mac-address">{c.macAddress || 'À renseigner'}</code></td><td><span className={`status-pill ${c.status==='En cours'?'status-running':c.status==='Disponible'?'status-available':'status-maintenance'}`}><i/>{c.status}</span></td><td>{session?getClient(session.clientId)?.name:'—'}</td><td>{session?elapsed(session.startedAt):'—'}</td><td><div className="row-actions">{c.status==='Disponible'&&<button className="small-action" onClick={()=>{setFormComputer(c.id);openModal('session');setFormComputer(c.id)}}>Démarrer</button>}<button className="row-icon" aria-label="Modifier" onClick={()=>editComputer(c)}><Pencil size={15}/></button><button className="row-icon" aria-label="Supprimer" onClick={()=>deleteComputer(c)}><Trash2 size={15}/></button></div></td></tr>})}{filteredComputers.length===0&&<tr><td colSpan={6} className="empty-state">Aucun ordinateur trouvé.</td></tr>}</tbody></table></div><div className="table-footer"><span>{filteredComputers.length} ordinateur(s) affiché(s)</span><span>Les modifications sont enregistrées automatiquement</span></div></ModuleHeader>}
        {activePage === 'Sessions' && <ModuleHeader title="Sessions" subtitle="Démarrez, suivez et terminez les sessions clients." action="Nouvelle session" onAction={()=>openModal('session')}><div className="table-scroll"><table><thead><tr><th>RÉFÉRENCE</th><th>CLIENT</th><th>ORDINATEUR</th><th>DÉBUT</th><th>DURÉE</th><th>STATUT</th><th>ACTIONS</th></tr></thead><tbody>{store.sessions.filter(s=>(s.id+(getClient(s.clientId)?.name??'')+(getComputer(s.computerId)?.name??'')+s.status).toLowerCase().includes(query.toLowerCase())).map(s=><tr key={s.id}><td><strong>{s.id}</strong></td><td>{getClient(s.clientId)?.name??'Client supprimé'}</td><td>{getComputer(s.computerId)?.name??s.computerId}</td><td>{dateTime(s.startedAt)}</td><td>{s.status==='En cours'?elapsed(s.startedAt):s.endedAt?elapsed(s.startedAt):'—'}</td><td><span className={`status-pill ${s.status==='En cours'?'status-running':'status-available'}`}><i/>{s.status}</span></td><td>{s.status==='En cours'?<button className="small-action" onClick={()=>endSession(s)}>Terminer</button>:<span>{money(s.amount)}</span>}</td></tr>)}{store.sessions.length===0&&<tr><td colSpan={7} className="empty-state">Aucune session enregistrée.</td></tr>}</tbody></table></div></ModuleHeader>}
        {activePage === 'Clients' && <ModuleHeader title="Clients" subtitle="Centralisez les coordonnées et l’historique de vos clients." action="Ajouter un client" onAction={()=>openModal('client')}><div className="table-scroll"><table><thead><tr><th>CLIENT</th><th>TÉLÉPHONE</th><th>E-MAIL</th><th>INSCRIPTION</th><th>SESSIONS</th><th>ACTIONS</th></tr></thead><tbody>{store.clients.filter(c=>(c.name+c.phone+c.email+c.id).toLowerCase().includes(query.toLowerCase())).map(c=><tr key={c.id}><td><div className="computer-name"><span className="avatar">{c.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}</span><span><strong>{c.name}</strong><small>{c.id}</small></span></div></td><td>{c.phone||'—'}</td><td>{c.email||'—'}</td><td>{dateTime(c.createdAt)}</td><td>{store.sessions.filter(s=>s.clientId===c.id).length}</td><td><div className="row-actions"><button className="row-icon" aria-label="Modifier" onClick={()=>editClient(c)}><Pencil size={15}/></button><button className="row-icon" aria-label="Supprimer" onClick={()=>deleteClient(c)}><Trash2 size={15}/></button></div></td></tr>)}{store.clients.length===0&&<tr><td colSpan={6} className="empty-state">Aucun client enregistré.</td></tr>}</tbody></table></div></ModuleHeader>}
        {activePage === 'Paiements' && <ModuleHeader title="Paiements" subtitle="Consultez les encaissements et finalisez les paiements en attente." action="Exporter les données" onAction={exportData}><div className="stats-grid compact-stats"><article className="stat-card"><span className="stat-label">Total encaissé</span><div className="stat-value">{money(totalPaid)}</div></article><article className="stat-card"><span className="stat-label">En attente</span><div className="stat-value">{money(store.payments.filter(p=>p.status==='En attente').reduce((n,p)=>n+p.amount,0))}</div></article><article className="stat-card"><span className="stat-label">Transactions</span><div className="stat-value">{store.payments.length}</div></article></div><div className="table-scroll"><table><thead><tr><th>RÉFÉRENCE</th><th>CLIENT</th><th>SESSION</th><th>MONTANT</th><th>MODE</th><th>DATE</th><th>STATUT / ACTION</th></tr></thead><tbody>{store.payments.filter(p=>(p.id+p.sessionId+(getClient(p.clientId)?.name??'')+p.status).toLowerCase().includes(query.toLowerCase())).map(p=><tr key={p.id}><td><strong>{p.id}</strong></td><td>{getClient(p.clientId)?.name??'Client supprimé'}</td><td>{p.sessionId}</td><td><strong>{money(p.amount)}</strong></td><td>{p.method}</td><td>{dateTime(p.paidAt)}</td><td>{p.status==='Payé'?<span className="status-pill status-available"><i/>Payé</span>:<div className="row-actions"><span className="status-pill status-maintenance"><i/>En attente</span><button className="small-action" onClick={()=>markPaid(p,'Espèces')}>Encaisser</button></div>}</td></tr>)}{store.payments.length===0&&<tr><td colSpan={7} className="empty-state">Aucun paiement enregistré.</td></tr>}</tbody></table></div></ModuleHeader>}
        {activePage === 'Rapports' && <ModuleHeader title="Rapports" subtitle="Consultez les chiffres calculés à partir de vos données locales." action="Exporter le rapport" onAction={exportData}><div className="stats-grid"><article className="stat-card"><span className="stat-label">Chiffre encaissé</span><div className="stat-value">{money(totalPaid)}</div><div className="stat-footer">Paiements au statut « Payé »</div></article><article className="stat-card"><span className="stat-label">Sessions terminées</span><div className="stat-value">{store.sessions.filter(s=>s.status==='Terminée').length}</div></article><article className="stat-card"><span className="stat-label">Sessions actives</span><div className="stat-value">{activeSessions.length}</div></article><article className="stat-card"><span className="stat-label">Panier moyen encaissé</span><div className="stat-value">{money(store.payments.filter(p=>p.status==='Payé').length?Math.round(totalPaid/store.payments.filter(p=>p.status==='Payé').length):0)}</div></article></div><div className="panel module-placeholder"><div className="module-illustration"><Activity size={28}/></div><h2>Résumé de l’activité</h2><p>{store.computers.length} ordinateurs · {store.clients.length} clients · {store.sessions.length} sessions historiques · {store.payments.length} transactions. Les indicateurs sont recalculés à partir du stockage local.</p><button className="secondary-button" onClick={()=>setActivePage('Paiements')}><CreditCard size={16}/> Voir les paiements</button></div></ModuleHeader>}
        {activePage === 'Paramètres' && <ModuleHeader title="Paramètres" subtitle="Personnalisez votre établissement et les règles de facturation." action="Modifier les paramètres" onAction={()=>openModal('settings')}><div className="settings-grid"><div className="panel settings-card"><div className="stat-icon revenue"><Settings2 size={20}/></div><h2>Établissement</h2><p>Nom affiché dans l’espace de travail.</p><strong>{store.settings.cafeName}</strong></div><div className="panel settings-card"><div className="stat-icon sessions"><CreditCard size={20}/></div><h2>Tarification</h2><p>Tarif appliqué par heure commencée.</p><strong>{money(store.settings.hourlyRate)} / heure</strong></div><div className="panel settings-card"><div className="stat-icon computers"><ShieldCheck size={20}/></div><h2>Stockage</h2><p>Les informations sont conservées sur cet appareil.</p><strong>localStorage · actif</strong><button className="secondary-button" onClick={exportData}><Download size={15}/> Exporter une sauvegarde</button></div><div className="panel settings-card"><div className="stat-icon customers"><RotateCcw size={20}/></div><h2>Données de démonstration</h2><p>Restaurer les exemples et annuler les changements.</p><button className="secondary-button" onClick={restoreDemo}><RotateCcw size={15}/> Réinitialiser les données</button></div></div></ModuleHeader>}
        <footer className="page-footer"><span>© 2026 LasyNet</span><span><span className="tiny-dot green"/> Stockage local actif</span><span>Frontend · Démo interactive</span></footer>
      </div>
    </main>

    {modal && <div className="modal-backdrop" onClick={()=>setModal(null)}><section className="session-modal" role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}><div className="modal-header"><div><span className="modal-kicker">GESTION LOCALE</span><h2>{modal==='computer'?(editingId?'Modifier un ordinateur':'Ajouter un ordinateur'):modal==='client'?(editingId?'Modifier un client':'Ajouter un client'):modal==='session'?'Démarrer une session':'Paramètres de l’établissement'}</h2><p>Les changements seront enregistrés sur ce navigateur.</p></div><button className="icon-button" aria-label="Fermer" onClick={()=>setModal(null)}><X size={19}/></button></div>
      {modal==='computer'&&<><label className="field-label">Nom de l’ordinateur<input autoFocus value={formName} onChange={e=>setFormName(e.target.value)} placeholder="Ex. Station 13"/></label><label className="field-label">Adresse MAC <span className="field-help">Obligatoire · identifiant réseau du poste</span><input value={formMacAddress} onChange={e=>setFormMacAddress(e.target.value)} placeholder="00:1A:2B:3C:4D:5E" autoCorrect="off" spellCheck={false}/></label><p className="modal-hint"><ShieldCheck size={16}/><span>L’adresse MAC servira à identifier le poste pour un futur mécanisme de verrouillage automatique.</span></p><label className="field-label">Statut<select value={formStatus} onChange={e=>setFormStatus(e.target.value as ComputerStatus)}><option>Disponible</option><option>En cours</option><option>Maintenance</option></select></label></>}
      {modal==='client'&&<><label className="field-label">Nom complet<input autoFocus value={formName} onChange={e=>setFormName(e.target.value)} placeholder="Ex. Rakoto Jean"/></label><label className="field-label">Téléphone<input value={formPhone} onChange={e=>setFormPhone(e.target.value)} placeholder="034 00 000 00"/></label><label className="field-label">E-mail<input type="email" value={formEmail} onChange={e=>setFormEmail(e.target.value)} placeholder="client@example.com"/></label></>}
      {modal==='session'&&<>{store.clients.length===0&&<p className="modal-hint">Ajoute d’abord un client dans le module Clients.</p>}<label className="field-label">Client<select value={formClient} onChange={e=>setFormClient(e.target.value)}>{store.clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="field-label">Ordinateur disponible<select value={formComputer} onChange={e=>setFormComputer(e.target.value)}>{store.computers.filter(c=>c.status==='Disponible').map(c=><option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}</select></label><label className="field-label">Durée prévue<select value={formHours} onChange={e=>setFormHours(e.target.value)}><option value="1">1 heure</option><option value="2">2 heures</option><option value="3">3 heures</option><option value="4">4 heures</option><option value="libre">Sans limite</option></select></label><div className="modal-hint"><ShieldCheck size={17}/><span>Tarif actuel : {money(store.settings.hourlyRate)} par heure commencée.</span></div></>}
      {modal==='settings'&&<><label className="field-label">Nom du cybercafé<input autoFocus value={formCafe} onChange={e=>setFormCafe(e.target.value)} /></label><label className="field-label">Tarif horaire ({store.settings.currency})<input type="number" min="1" value={formRate} onChange={e=>setFormRate(e.target.value)}/></label></>}
      <div className="modal-actions"><button className="secondary-button" onClick={()=>setModal(null)}>Annuler</button><button className="primary-button" onClick={()=>modal==='computer'?addComputer():modal==='client'?saveClient():modal==='session'?startSession():saveSettings()}>{modal==='session'?<Play size={16}/>:<Check size={16}/>} {modal==='session'?'Démarrer la session':'Enregistrer'}</button></div>
    </section></div>}
    {toast&&<div className="toast"><Check size={17}/>{toast}<button aria-label="Fermer le message" onClick={()=>setToast('')}><X size={15}/></button></div>}
  </div>;
}

function ModuleHeader({ title, subtitle, action, onAction, children }: { title: string; subtitle: string; action: string; onAction: () => void; children: React.ReactNode }) {
  return <><section className="welcome-row"><div><div className="eyebrow"><span className="live-dot"/> LasyNet · GESTION</div><h1>{title}</h1><p className="page-subtitle">{subtitle}</p></div><button className="primary-button" onClick={onAction}><Plus size={18}/>{action}</button></section><section className="panel computers-panel module-panel">{children}</section></>;
}

export default App;
