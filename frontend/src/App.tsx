import { useEffect, useMemo, useState } from 'react';
import { money, dateTime, elapsed } from './utils/formatters';
import { clearToken, currentUser, getToken, loadStore, login, createComputer as apiCreateComputer, updateComputer as apiUpdateComputer, deleteComputer as apiDeleteComputer, createClient as apiCreateClient, updateClient as apiUpdateClient, deleteClient as apiDeleteClient, createSession as apiCreateSession, updateSession as apiUpdateSession, createPayment as apiCreatePayment, updatePayment as apiUpdatePayment, updateSettings as apiUpdateSettings } from './api/client';
import { pageFromHash, pageSlugs, type Page } from './navigation';
import { ModuleHeader } from './components/ModuleHeader';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { InvoiceModal } from './components/InvoiceModal';
import { type AppSettings, type Client, type Computer, type ComputerStatus, type ComputerType, type Payment, type Session, type Store } from './data/mockStore';
import {
  Activity, ArrowUpRight, ArrowRight, Bell, Check, ChevronDown, ChevronRight, Clock3, CreditCard, Download, FileText, Monitor, MoreHorizontal, Plus, Search, Settings2, ShieldCheck, Trash2, Users, X, Pencil, Play
} from 'lucide-react';

function App() {
  const [store, setStore] = useState<Store>({ computers: [], clients: [], sessions: [], payments: [], settings: { cafeName: 'LasyNet', hourlyRate: 0, currency: 'Ar' } });
  const [activePage, setActivePage] = useState<Page>(() => pageFromHash());
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | ComputerStatus>('Tous');
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState<'computer' | 'client' | 'session' | 'settings' | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMacAddress, setFormMacAddress] = useState('');
  const [formComputerType, setFormComputerType] = useState<ComputerType>('Interne');
  const [formComputer, setFormComputer] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formHours, setFormHours] = useState('1');
  const [formStatus, setFormStatus] = useState<ComputerStatus>('Disponible');
  const [formRate, setFormRate] = useState('1200');
  const [formCafe, setFormCafe] = useState('Cyber Café Central');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInlineClientRegistration, setShowInlineClientRegistration] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<'Tous' | Payment['status']>('Tous');
  const [paymentMethods, setPaymentMethods] = useState<Record<string, Payment['method']>>({});
  const [selectedInvoice, setSelectedInvoice] = useState<Payment | null>(null);
  const [screen, setScreen] = useState<'landing' | 'login' | 'signup' | 'app'>(() => getToken() ? 'app' : 'landing');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authNotice, setAuthNotice] = useState('');

  const refreshStore = async () => { const fresh = await loadStore(); setStore(fresh); };
  useEffect(() => {
    if (screen !== 'app') return;
    let cancelled = false;
    const unauthorized = () => { if (!cancelled) { setScreen('login'); setAuthNotice('Votre session a expiré. Connectez-vous à nouveau.'); } };
    window.addEventListener('lasynet:unauthorized', unauthorized);
    (async () => {
      try {
        const user = await currentUser();
        if (!user.is_active) throw new Error('Ce compte est désactivé.');
        if (cancelled) return;
        setAuthName(user.full_name);
        const fresh = await loadStore();
        if (!cancelled) setStore(fresh);
      } catch (error) {
        if (!cancelled) {
          clearToken();
          setScreen('login');
          setAuthNotice(error instanceof Error ? error.message : 'Impossible de charger votre session.');
        }
      }
    })();
    return () => { cancelled = true; window.removeEventListener('lasynet:unauthorized', unauthorized); };
  }, [screen]);
  useEffect(() => {
    if (screen !== 'app') return;
    const slug = pageSlugs[activePage];
    if (window.location.hash.slice(1) !== slug) window.history.pushState(null, '', `#${slug}`);
  }, [activePage, screen]);
  useEffect(() => {
    const syncPageWithHistory = () => setActivePage(pageFromHash());
    window.addEventListener('popstate', syncPageWithHistory);
    window.addEventListener('hashchange', syncPageWithHistory);
    return () => {
      window.removeEventListener('popstate', syncPageWithHistory);
      window.removeEventListener('hashchange', syncPageWithHistory);
    };
  }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 3200); return () => window.clearTimeout(timer); }, [toast]);

  const activeSessions = store.sessions.filter(s => s.status === 'En cours');
  const today = new Date().toDateString();
  const revenueToday = store.payments.filter(p => p.status === 'Payé' && new Date(p.paidAt).toDateString() === today).reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = store.payments.filter(p => p.status === 'Payé').reduce((sum, p) => sum + p.amount, 0);
  const availableCount = store.computers.filter(c => c.status === 'Disponible').length;
  const clientsToday = new Set(store.sessions.filter(s => new Date(s.startedAt).toDateString() === today).map(s => s.clientId)).size;
  const filteredComputers = useMemo(() => store.computers.filter(c => (statusFilter === 'Tous' || c.status === statusFilter) && (c.name + c.id + c.type + c.macAddress + c.status).toLowerCase().includes(query.toLowerCase())), [store.computers, statusFilter, query]);
  const getClient = (id: string) => store.clients.find(c => c.id === id);
  const getComputer = (id: string) => store.computers.find(c => c.id === id);
  const notify = (message: string) => setToast(message);
  const openModal = (kind: typeof modal) => {
    setEditingId(null); setFormName(''); setFormPhone(''); setFormEmail(''); setFormMacAddress(''); setFormComputerType('Interne'); setFormStatus('Disponible'); setShowInlineClientRegistration(false);
    setFormCafe(store.settings.cafeName); setFormRate(String(store.settings.hourlyRate));
    setFormComputer(store.computers.find(c => c.status === 'Disponible')?.id ?? '');
    setFormClient(store.clients[0]?.id ?? ''); setFormHours('1'); setModal(kind);
  };
  const addComputer = async () => {
    if (!formName.trim()) return notify('Le nom de l’ordinateur est obligatoire.');
    const normalizedMac = formComputerType === 'Interne' ? formMacAddress.trim().toUpperCase().replace(/-/g, ':') : '';
    if (formComputerType === 'Interne' && !/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(normalizedMac)) return notify('Pour un poste interne, saisis une adresse MAC valide (ex. 00:1A:2B:3C:4D:5E).');
    if (formComputerType === 'Interne' && store.computers.some(c => c.id !== editingId && c.type === 'Interne' && c.macAddress && c.macAddress.toUpperCase() === normalizedMac)) return notify('Cette adresse MAC est déjà attribuée à un autre poste interne.');
    try {
      const data = { name: formName.trim(), type: formComputerType, macAddress: normalizedMac, status: formStatus };
      if (editingId) await apiUpdateComputer(editingId, data); else await apiCreateComputer(data);
      await refreshStore(); setModal(null); notify(editingId ? 'Ordinateur modifié.' : 'Ordinateur ajouté.');
    } catch (error) { notify(error instanceof Error ? error.message : 'Échec de l’enregistrement.'); }
  };
  const editComputer = (computer: Computer) => {
    setEditingId(computer.id); setFormName(computer.name); setFormComputerType(computer.type ?? 'Interne'); setFormMacAddress(computer.macAddress ?? ''); setFormStatus(computer.status); setModal('computer');
  };
  const deleteComputer = async (computer: Computer) => {
    if (store.sessions.some(s => s.computerId === computer.id && s.status === 'En cours')) return notify('Termine la session avant de supprimer ce poste.');
    if (!window.confirm('Supprimer ' + computer.name + ' ?')) return;
    try { await apiDeleteComputer(computer.id); await refreshStore(); notify('Ordinateur supprimé.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Suppression impossible.'); }
  };
  const saveClient = async () => {
    if (!formName.trim()) return notify('Le nom du client est obligatoire.');
    try {
      const payload = { name: formName.trim(), phone: formPhone.trim(), email: formEmail.trim() };
      if (modal === 'session' && showInlineClientRegistration) {
        const created = await apiCreateClient(payload);
        await refreshStore(); setFormClient(created.id); setFormName(''); setFormPhone(''); setFormEmail(''); setShowInlineClientRegistration(false);
        notify(created.name + ' ajouté et sélectionné pour cette session.'); return;
      }
      if (editingId) await apiUpdateClient(editingId, payload); else await apiCreateClient(payload);
      await refreshStore(); setModal(null); notify(editingId ? 'Fiche client mise à jour.' : 'Client ajouté.');
    } catch (error) { notify(error instanceof Error ? error.message : 'Échec de l’enregistrement du client.'); }
  };
  const editClient = (client: Client) => { setEditingId(client.id); setFormName(client.name); setFormPhone(client.phone); setFormEmail(client.email); setModal('client'); };
  const deleteClient = async (client: Client) => {
    if (store.sessions.some(s => s.clientId === client.id && s.status === 'En cours')) return notify('Ce client possède une session active.');
    if (!window.confirm('Supprimer le client ' + client.name + ' ?')) return;
    try { await apiDeleteClient(client.id); await refreshStore(); notify('Client supprimé.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Suppression impossible.'); }
  };
  const startSession = async () => {
    if (!formComputer || !formClient) return notify('Ajoute un client et un ordinateur disponible avant de démarrer.');
    const computer = getComputer(formComputer);
    if (!computer || computer.status !== 'Disponible') return notify('Cet ordinateur n’est plus disponible.');
    if (computer.type === 'Interne' && !computer.macAddress) return notify('Renseigne l’adresse MAC de ce poste interne avant de démarrer une session.');
    try {
      await apiCreateSession({ computerId: computer.id, clientId: formClient, plannedHours: formHours === 'libre' ? null : Number(formHours), amount: 0 });
      await refreshStore(); setModal(null); setActivePage('Sessions'); notify('Session démarrée et enregistrée en base de données.');
    } catch (error) { notify(error instanceof Error ? error.message : 'Impossible de démarrer la session.'); }
  };
  const endSession = async (session: Session) => {
    const hours = Math.max(1, Math.ceil((Date.now() - new Date(session.startedAt).getTime()) / 3600000));
    const amount = hours * store.settings.hourlyRate;
    const ended = new Date().toISOString();
    try {
      await apiUpdateSession(session.id, { status: 'Terminée', ended_at: ended, amount });
      await apiCreatePayment({ sessionId: session.id, clientId: session.clientId, amount, method: 'Espèces', paidAt: ended, status: 'En attente' });
      await refreshStore(); setActivePage('Paiements'); notify('Session terminée. Le paiement en attente a été créé en base.');
    } catch (error) { await refreshStore().catch(() => undefined); notify(error instanceof Error ? error.message : 'Impossible de terminer la session. Vérifie son état avant de réessayer.'); }
  };
  const markPaid = async (payment: Payment, method: Payment['method']) => {
    try { await apiUpdatePayment(payment.id, { status: 'Payé', method, paidAt: new Date().toISOString() }); await refreshStore(); notify('Paiement enregistré en base de données.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Échec de l’enregistrement du paiement.'); }
  };
  const saveSettings = async () => {
    const rate = Number(formRate);
    if (!formCafe.trim() || !Number.isFinite(rate) || rate <= 0) return notify('Renseigne un nom et un tarif horaire valide.');
    try {
      await apiUpdateSettings({ ...store.settings, cafeName: formCafe.trim(), hourlyRate: rate });
      await refreshStore(); setModal(null); notify('Paramètres enregistrés en base de données.');
    } catch (error) { notify(error instanceof Error ? error.message : 'Échec de l’enregistrement des paramètres.'); }
  };
  const exportData = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'lasynet-export.json'; link.click(); URL.revokeObjectURL(url);
    notify('Export des données du serveur préparé.');
  };
  const returnToLanding = () => {
    clearToken();
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    setScreen('landing');
    setAuthNotice('');
  };
  const submitDemoAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (screen === 'signup') { setAuthNotice('La création de compte public est désactivée. Demandez à un administrateur de créer votre compte.'); return; }
    if (!authEmail.trim() || !authPassword.trim()) { setAuthNotice('Saisis ton adresse e-mail et ton mot de passe.'); return; }
    setAuthNotice('');
    try {
      await login(authEmail.trim(), authPassword);
      setScreen('app');
      setActivePage('Vue d’ensemble');
    } catch (error) {
      setAuthNotice(error instanceof Error ? error.message : 'Connexion impossible. Vérifie l’API et tes identifiants.');
    }
  };
  if (screen !== 'app') return <LandingPage screen={screen} onNavigate={setScreen} onSubmit={submitDemoAuth} name={authName} setName={setAuthName} email={authEmail} setEmail={setAuthEmail} password={authPassword} setPassword={setAuthPassword} notice={authNotice} />;

  return <div className="app-shell">
    <Sidebar cafeName={store.settings.cafeName} activePage={activePage} activeSessionsCount={activeSessions.length} onNavigate={setActivePage} onNotify={notify} />
    <main className="main-content">
      <header className="topbar"><div className="topbar-leading"><button className="landing-return-button" onClick={returnToLanding} title="Retour à la page d’accueil"><ArrowRight size={15} /> Accueil</button><div className="breadcrumb"><span>LasyNet</span><ChevronRight size={15} /><strong>{activePage}</strong></div></div><div className="topbar-actions"><label className="search-box"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher dans le module..." /><kbd>⌘ K</kbd></label><button className="icon-button notification-button" aria-label="État du stockage" onClick={() => notify('Données synchronisées avec le serveur.')}><Bell size={19} /><span className="notification-dot" /></button><div className="topbar-divider" /><button className="date-chip" onClick={exportData}><Download size={16} /> Exporter <ChevronDown size={14} /></button></div></header>
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
        {activePage === 'Ordinateurs' && <ModuleHeader title="Ordinateurs" subtitle="Gérez les postes, leur disponibilité et la maintenance." action="Ajouter un ordinateur" onAction={()=>openModal('computer')}><div className="filter-tabs">{(['Tous','En cours','Disponible','Maintenance'] as const).map(s=><button key={s} className={statusFilter===s?'selected':''} onClick={()=>setStatusFilter(s)}>{s}</button>)}</div><div className="table-scroll"><table><thead><tr><th>POSTE</th><th>TYPE</th><th>ADRESSE MAC</th><th>STATUT</th><th>CLIENT ACTUEL</th><th>SESSION</th><th>ACTIONS</th></tr></thead><tbody>{filteredComputers.map(c=>{const session=activeSessions.find(s=>s.computerId===c.id);return <tr key={c.id}><td><div className="computer-name"><span className={`pc-icon ${c.status==='En cours'?'pc-active':c.status==='Maintenance'?'pc-maintenance':''}`}><Monitor size={17}/></span><span><strong>{c.name}</strong><small>{c.id}</small></span></div></td><td><span className={`status-pill ${c.type==='Interne'?'status-running':'status-available'}`}>{c.type ?? 'Interne'}</span></td><td>{c.type==='Interne'?<code className="mac-address">{c.macAddress || 'À renseigner'}</code>:<span className="muted-text">Non requise</span>}</td><td><span className={`status-pill ${c.status==='En cours'?'status-running':c.status==='Disponible'?'status-available':'status-maintenance'}`}><i/>{c.status}</span></td><td>{session?getClient(session.clientId)?.name:'—'}</td><td>{session?elapsed(session.startedAt):'—'}</td><td><div className="row-actions">{c.status==='Disponible'&&<button className="small-action" onClick={()=>{setFormComputer(c.id);openModal('session');setFormComputer(c.id)}}>Démarrer</button>}<button className="row-icon" aria-label="Modifier" onClick={()=>editComputer(c)}><Pencil size={15}/></button><button className="row-icon" aria-label="Supprimer" onClick={()=>deleteComputer(c)}><Trash2 size={15}/></button></div></td></tr>})}{filteredComputers.length===0&&<tr><td colSpan={7} className="empty-state">Aucun ordinateur trouvé.</td></tr>}</tbody></table></div><div className="table-footer"><span>{filteredComputers.length} ordinateur(s) affiché(s)</span><span>Les modifications sont enregistrées automatiquement</span></div></ModuleHeader>}
        {activePage === 'Sessions' && <ModuleHeader title="Sessions" subtitle="Démarrez, suivez et terminez les sessions clients." action="Nouvelle session" onAction={()=>openModal('session')}><div className="table-scroll"><table><thead><tr><th>RÉFÉRENCE</th><th>CLIENT</th><th>ORDINATEUR</th><th>DÉBUT</th><th>DURÉE</th><th>STATUT</th><th>ACTIONS</th></tr></thead><tbody>{store.sessions.filter(s=>(s.id+(getClient(s.clientId)?.name??'')+(getComputer(s.computerId)?.name??'')+s.status).toLowerCase().includes(query.toLowerCase())).map(s=><tr key={s.id}><td><strong>{s.id}</strong></td><td>{getClient(s.clientId)?.name??'Client supprimé'}</td><td>{getComputer(s.computerId)?.name??s.computerId}</td><td>{dateTime(s.startedAt)}</td><td>{s.status==='En cours'?elapsed(s.startedAt):s.endedAt?elapsed(s.startedAt):'—'}</td><td><span className={`status-pill ${s.status==='En cours'?'status-running':'status-available'}`}><i/>{s.status}</span></td><td>{s.status==='En cours'?<button className="small-action" onClick={()=>endSession(s)}>Terminer</button>:<span>{money(s.amount)}</span>}</td></tr>)}{store.sessions.length===0&&<tr><td colSpan={7} className="empty-state">Aucune session enregistrée.</td></tr>}</tbody></table></div></ModuleHeader>}
        {activePage === 'Clients' && <ModuleHeader title="Clients" subtitle="Centralisez les coordonnées et l’historique de vos clients." action="Ajouter un client" onAction={()=>openModal('client')}><div className="table-scroll"><table><thead><tr><th>CLIENT</th><th>TÉLÉPHONE</th><th>E-MAIL</th><th>INSCRIPTION</th><th>SESSIONS</th><th>ACTIONS</th></tr></thead><tbody>{store.clients.filter(c=>(c.name+c.phone+c.email+c.id).toLowerCase().includes(query.toLowerCase())).map(c=><tr key={c.id}><td><div className="computer-name"><span className="avatar">{c.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}</span><span><strong>{c.name}</strong><small>{c.id}</small></span></div></td><td>{c.phone||'—'}</td><td>{c.email||'—'}</td><td>{dateTime(c.createdAt)}</td><td>{store.sessions.filter(s=>s.clientId===c.id).length}</td><td><div className="row-actions"><button className="row-icon" aria-label="Modifier" onClick={()=>editClient(c)}><Pencil size={15}/></button><button className="row-icon" aria-label="Supprimer" onClick={()=>deleteClient(c)}><Trash2 size={15}/></button></div></td></tr>)}{store.clients.length===0&&<tr><td colSpan={6} className="empty-state">Aucun client enregistré.</td></tr>}</tbody></table></div></ModuleHeader>}
        {activePage === 'Paiements' && <ModuleHeader title="Paiements" subtitle="Suivez les encaissements, filtrez les transactions et choisissez le mode de règlement." action="Exporter les données" onAction={exportData}><div className="stats-grid compact-stats"><article className="stat-card"><div className="stat-top"><span className="stat-label">Total encaissé</span><span className="stat-icon revenue"><CreditCard size={18}/></span></div><div className="stat-value">{money(totalPaid)}</div><div className="stat-footer">Somme des paiements confirmés</div></article><article className="stat-card"><div className="stat-top"><span className="stat-label">En attente</span><span className="stat-icon customers"><Clock3 size={18}/></span></div><div className="stat-value">{money(store.payments.filter(p=>p.status==='En attente').reduce((n,p)=>n+p.amount,0))}</div><div className="stat-footer">{store.payments.filter(p=>p.status==='En attente').length} règlement(s) à encaisser</div></article><article className="stat-card"><div className="stat-top"><span className="stat-label">Transactions</span><span className="stat-icon computers"><Activity size={18}/></span></div><div className="stat-value">{store.payments.length}</div><div className="stat-footer">{store.payments.filter(p=>p.status==='Payé').length} confirmé(s)</div></article></div><div className="payment-toolbar"><div className="filter-tabs" role="group" aria-label="Filtrer les paiements">{(['Tous','En attente','Payé'] as const).map(status=><button key={status} className={paymentFilter===status?'selected':''} onClick={()=>setPaymentFilter(status)}>{status}{status==='En attente'&&<span className="payment-tab-count">{store.payments.filter(p=>p.status==='En attente').length}</span>}</button>)}</div><span className="payment-results">{store.payments.filter(p=>(paymentFilter==='Tous'||p.status===paymentFilter)&&(p.id+p.sessionId+(getClient(p.clientId)?.name??'')+p.status+p.method).toLowerCase().includes(query.toLowerCase())).length} transaction(s)</span></div><div className="table-scroll"><table><thead><tr><th>RÉFÉRENCE</th><th>CLIENT</th><th>SESSION</th><th>MONTANT</th><th>MODE DE PAIEMENT</th><th>DATE</th><th>STATUT / ACTION</th></tr></thead><tbody>{store.payments.filter(p=>(paymentFilter==='Tous'||p.status===paymentFilter)&&(p.id+p.sessionId+(getClient(p.clientId)?.name??'')+p.status+p.method).toLowerCase().includes(query.toLowerCase())).map(p=><tr key={p.id}><td><strong>{p.id}</strong></td><td><div className="payment-client"><strong>{getClient(p.clientId)?.name??'Client supprimé'}</strong><small>{p.clientId}</small></div></td><td><span className="payment-session-ref">{p.sessionId}</span></td><td><strong className="payment-amount">{money(p.amount)}</strong></td><td>{p.status==='Payé'?<span className="payment-method"><CreditCard size={14}/>{p.method}</span>:<select className="payment-method-select" aria-label={'Mode de paiement pour '+p.id} value={paymentMethods[p.id]??p.method} onChange={e=>setPaymentMethods(current=>({...current,[p.id]:e.target.value as Payment['method']}))}><option value="Espèces">Espèces</option><option value="Mobile Money">Mobile Money</option><option value="Carte">Carte</option></select>}</td><td>{dateTime(p.paidAt)}</td><td><div className="row-actions payment-actions">{p.status==='Payé'?<span className="status-pill status-available"><i/>Payé</span>:<><span className="status-pill status-maintenance"><i/>En attente</span><button className="small-action" onClick={()=>markPaid(p,paymentMethods[p.id]??p.method)}>Encaisser</button></>}<button className="row-icon invoice-action" title="Consulter la facture" aria-label={'Consulter la facture '+p.id} onClick={()=>setSelectedInvoice(p)}><FileText size={15}/></button></div></td></tr>)}{store.payments.filter(p=>(paymentFilter==='Tous'||p.status===paymentFilter)&&(p.id+p.sessionId+(getClient(p.clientId)?.name??'')+p.status+p.method).toLowerCase().includes(query.toLowerCase())).length===0&&<tr><td colSpan={7} className="empty-state">{store.payments.length===0?'Aucun paiement enregistré pour le moment.':'Aucun paiement ne correspond à ce filtre.'}</td></tr>}</tbody></table></div><div className="table-footer"><span>Les paiements sont conservés dans le stockage local.</span><span><strong>{money(totalPaid)}</strong> encaissés au total</span></div></ModuleHeader>}
        {activePage === 'Facturation' && <ModuleHeader title="Facturation" subtitle="Retrouvez et imprimez les factures associées à tous les paiements, encaissés ou en attente." action="Exporter les données" onAction={exportData}><div className="stats-grid compact-stats"><article className="stat-card"><div className="stat-top"><span className="stat-label">Factures générées</span><span className="stat-icon computers"><FileText size={18}/></span></div><div className="stat-value">{store.payments.length}</div><div className="stat-footer">Une facture par paiement</div></article><article className="stat-card"><div className="stat-top"><span className="stat-label">Factures réglées</span><span className="stat-icon revenue"><Check size={18}/></span></div><div className="stat-value">{store.payments.filter(p=>p.status==='Payé').length}</div><div className="stat-footer">Paiements confirmés</div></article><article className="stat-card"><div className="stat-top"><span className="stat-label">À régler</span><span className="stat-icon customers"><Clock3 size={18}/></span></div><div className="stat-value">{money(store.payments.filter(p=>p.status==='En attente').reduce((n,p)=>n+p.amount,0))}</div><div className="stat-footer">{store.payments.filter(p=>p.status==='En attente').length} facture(s) en attente</div></article></div><div className="payment-toolbar"><span className="payment-results">{store.payments.filter(p=>(p.id+p.sessionId+(getClient(p.clientId)?.name??'')+p.status+p.method).toLowerCase().includes(query.toLowerCase())).length} facture(s)</span><span className="payment-results">Référence facture : FAC- suivi de la référence paiement</span></div><div className="table-scroll"><table><thead><tr><th>FACTURE</th><th>CLIENT</th><th>SESSION</th><th>MONTANT</th><th>MODE DE PAIEMENT</th><th>DATE</th><th>STATUT</th><th>ACTION</th></tr></thead><tbody>{store.payments.filter(p=>(p.id+p.sessionId+(getClient(p.clientId)?.name??'')+p.status+p.method).toLowerCase().includes(query.toLowerCase())).map(p=><tr key={p.id}><td><strong>FAC-{p.id}</strong></td><td><div className="payment-client"><strong>{getClient(p.clientId)?.name??'Client supprimé'}</strong><small>{p.clientId}</small></div></td><td><span className="payment-session-ref">{p.sessionId}</span></td><td><strong className="payment-amount">{money(p.amount)}</strong></td><td><span className="payment-method"><CreditCard size={14}/>{p.method}</span></td><td>{dateTime(p.paidAt)}</td><td><span className={`status-pill ${p.status==='Payé'?'status-available':'status-maintenance'}`}><i/>{p.status}</span></td><td><button className="small-action invoice-open" onClick={()=>setSelectedInvoice(p)}><FileText size={14}/> Voir / Imprimer</button></td></tr>)}{store.payments.filter(p=>(p.id+p.sessionId+(getClient(p.clientId)?.name??'')+p.status+p.method).toLowerCase().includes(query.toLowerCase())).length===0&&<tr><td colSpan={8} className="empty-state">Aucune facture ne correspond à la recherche.</td></tr>}</tbody></table></div><div className="table-footer"><span>Les factures sont générées à partir de tous les paiements enregistrés.</span><span><strong>{store.payments.length}</strong> facture(s)</span></div></ModuleHeader>}
        {activePage === 'Rapports' && <ModuleHeader title="Rapports" subtitle="Consultez les chiffres calculés à partir de vos données locales." action="Exporter le rapport" onAction={exportData}><div className="stats-grid"><article className="stat-card"><span className="stat-label">Chiffre encaissé</span><div className="stat-value">{money(totalPaid)}</div><div className="stat-footer">Paiements au statut « Payé »</div></article><article className="stat-card"><span className="stat-label">Sessions terminées</span><div className="stat-value">{store.sessions.filter(s=>s.status==='Terminée').length}</div></article><article className="stat-card"><span className="stat-label">Sessions actives</span><div className="stat-value">{activeSessions.length}</div></article><article className="stat-card"><span className="stat-label">Panier moyen encaissé</span><div className="stat-value">{money(store.payments.filter(p=>p.status==='Payé').length?Math.round(totalPaid/store.payments.filter(p=>p.status==='Payé').length):0)}</div></article></div><div className="panel module-placeholder"><div className="module-illustration"><Activity size={28}/></div><h2>Résumé de l’activité</h2><p>{store.computers.length} ordinateurs · {store.clients.length} clients · {store.sessions.length} sessions historiques · {store.payments.length} transactions. Les indicateurs sont recalculés à partir du stockage local.</p><button className="secondary-button" onClick={()=>setActivePage('Paiements')}><CreditCard size={16}/> Voir les paiements</button></div></ModuleHeader>}
        {activePage === 'Paramètres' && <ModuleHeader title="Paramètres" subtitle="Personnalisez votre établissement et les règles de facturation." action="Modifier les paramètres" onAction={()=>openModal('settings')}><div className="settings-grid"><div className="panel settings-card"><div className="stat-icon revenue"><Settings2 size={20}/></div><h2>Établissement</h2><p>Nom affiché dans l’espace de travail.</p><strong>{store.settings.cafeName}</strong></div><div className="panel settings-card"><div className="stat-icon sessions"><CreditCard size={20}/></div><h2>Tarification</h2><p>Tarif appliqué par heure commencée.</p><strong>{money(store.settings.hourlyRate)} / heure</strong></div><div className="panel settings-card"><div className="stat-icon computers"><ShieldCheck size={20}/></div><h2>Stockage sécurisé</h2><p>Les informations sont chargées depuis l’API et conservées dans la base de données.</p><strong>API · connectée</strong><button className="secondary-button" onClick={exportData}><Download size={15}/> Exporter une sauvegarde</button></div></div></ModuleHeader>}
        <footer className="page-footer"><span>© 2026 LasyNet</span><span><span className="tiny-dot green"/> Stockage local actif</span><span>Frontend · Démo interactive</span></footer>
      </div>
    </main>

    {modal && <div className="modal-backdrop" onClick={()=>{setModal(null);setShowInlineClientRegistration(false)}}><section className={"session-modal " + (modal==="session" && showInlineClientRegistration ? "session-modal-wide" : "")} role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}><div className="modal-header"><div><span className="modal-kicker">GESTION LOCALE</span><h2>{modal==='computer'?(editingId?'Modifier un ordinateur':'Ajouter un ordinateur'):modal==='client'?(editingId?'Modifier un client':'Ajouter un client'):modal==='session'?'Démarrer une session':'Paramètres de l’établissement'}</h2><p>Les changements seront enregistrés sur ce navigateur.</p></div><button className="icon-button" aria-label="Fermer" onClick={()=>setModal(null)}><X size={19}/></button></div>
      {modal==='computer'&&<><label className="field-label">Nom de l’ordinateur<input autoFocus value={formName} onChange={e=>setFormName(e.target.value)} placeholder="Ex. Station 13"/></label><label className="field-label">Type de poste<select value={formComputerType} onChange={e=>{setFormComputerType(e.target.value as ComputerType);if(e.target.value==='Externe')setFormMacAddress('')}}><option value="Interne">Interne — appartient au cybercafé</option><option value="Externe">Externe — appareil d’un client ou tiers</option></select></label>{formComputerType==='Interne'&&<><label className="field-label">Adresse MAC <span className="field-help">Obligatoire pour un poste interne</span><input value={formMacAddress} onChange={e=>setFormMacAddress(e.target.value)} placeholder="00:1A:2B:3C:4D:5E" autoCorrect="off" spellCheck={false}/></label><p className="modal-hint"><ShieldCheck size={16}/><span>L’adresse MAC aidera à identifier ce poste interne pour un futur mécanisme de verrouillage automatique.</span></p></>}<label className="field-label">Statut<select value={formStatus} onChange={e=>setFormStatus(e.target.value as ComputerStatus)}><option>Disponible</option><option>En cours</option><option>Maintenance</option></select></label></>}
      {modal==='client'&&<><label className="field-label">Nom complet<input autoFocus value={formName} onChange={e=>setFormName(e.target.value)} placeholder="Ex. Rakoto Jean"/></label><label className="field-label">Téléphone<input value={formPhone} onChange={e=>setFormPhone(e.target.value)} placeholder="034 00 000 00"/></label><label className="field-label">E-mail<input type="email" value={formEmail} onChange={e=>setFormEmail(e.target.value)} placeholder="client@example.com"/></label></>}
      {modal==='session'&&<div className={"session-layout " + (showInlineClientRegistration ? "with-client-form" : "")}><div className="session-fields">{store.clients.length===0&&<p className="modal-hint">Aucun client enregistré pour le moment. Ajoute le client ici sans quitter la session.</p>}<div className="client-select-col"><label htmlFor="session-client" className="field-label">Client</label><div className="client-select-row"><select id="session-client" name="client" value={formClient} onChange={e=>setFormClient(e.target.value)}><option value="">Sélectionner un client</option>{store.clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button type="button" className="secondary-button add-session-client" onClick={()=>{setShowInlineClientRegistration(v=>!v);setFormName('');setFormPhone('');setFormEmail('')}}><Plus size={15}/><span>{showInlineClientRegistration?'Masquer':'Nouveau client'}</span></button></div></div><label className="field-label">Ordinateur disponible<select value={formComputer} onChange={e=>setFormComputer(e.target.value)}>{store.computers.filter(c=>c.status==='Disponible').map(c=><option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}</select></label><label className="field-label">Durée prévue<select value={formHours} onChange={e=>setFormHours(e.target.value)}><option value="1">1 heure</option><option value="2">2 heures</option><option value="3">3 heures</option><option value="4">4 heures</option><option value="libre">Sans limite</option></select></label><div className="modal-hint"><ShieldCheck size={17}/><span>Tarif actuel : {money(store.settings.hourlyRate)} par heure commencée.</span></div></div>{showInlineClientRegistration&&<aside className="inline-client-panel"><div className="inline-client-heading"><Users size={18}/><div><strong>Enregistrer un client</strong><span>Il sera sélectionné pour ce poste.</span></div></div><label className="field-label">Nom complet<input autoFocus value={formName} onChange={e=>setFormName(e.target.value)} placeholder="Ex. Rakoto Jean"/></label><label className="field-label">Téléphone<input value={formPhone} onChange={e=>setFormPhone(e.target.value)} placeholder="034 00 000 00"/></label><label className="field-label">E-mail<input type="email" value={formEmail} onChange={e=>setFormEmail(e.target.value)} placeholder="client@example.com"/></label><button type="button" className="primary-button inline-save-client" onClick={saveClient}><Check size={16}/> Enregistrer et sélectionner</button></aside>}</div>}
      {modal==='settings'&&<><label className="field-label">Nom du cybercafé<input autoFocus value={formCafe} onChange={e=>setFormCafe(e.target.value)} /></label><label className="field-label">Tarif horaire ({store.settings.currency})<input type="number" min="1" value={formRate} onChange={e=>setFormRate(e.target.value)}/></label></>}
      <div className="modal-actions"><button className="secondary-button" onClick={()=>setModal(null)}>Annuler</button><button className="primary-button" onClick={()=>modal==='computer'?addComputer():modal==='client'?saveClient():modal==='session'?startSession():saveSettings()}>{modal==='session'?<Play size={16}/>:<Check size={16}/>} {modal==='session'?'Démarrer la session':'Enregistrer'}</button></div>
    </section></div>}
    <InvoiceModal payment={selectedInvoice} store={store} getClient={getClient} onClose={() => setSelectedInvoice(null)} />
    {toast&&<div className="toast"><Check size={17}/>{toast}<button aria-label="Fermer le message" onClick={()=>setToast('')}><X size={15}/></button></div>}
  </div>;
}


export default App;
