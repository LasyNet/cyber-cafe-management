import { useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown,
  ChevronLeft, ChevronRight, CircleHelp, Clock3, CreditCard, Download,
  LayoutDashboard, LifeBuoy, LogOut, Monitor, MoreHorizontal, Plus, Search,
  Settings2, ShieldCheck, Sparkles, Users, Wifi, X, Zap,
} from 'lucide-react';

type ComputerStatus = 'En cours' | 'Disponible' | 'Maintenance';
type Computer = { id: string; name: string; status: ComputerStatus; user: string; duration: string; amount: string };

const initialComputers: Computer[] = [
  { id: 'PC-01', name: 'Station 01', status: 'En cours', user: 'Andry R.', duration: '01 h 24', amount: '2 400 Ar' },
  { id: 'PC-02', name: 'Station 02', status: 'Disponible', user: '—', duration: '—', amount: '—' },
  { id: 'PC-03', name: 'Station 03', status: 'En cours', user: 'Miora T.', duration: '00 h 46', amount: '1 200 Ar' },
  { id: 'PC-04', name: 'Station 04', status: 'En cours', user: 'Hery N.', duration: '02 h 05', amount: '3 500 Ar' },
  { id: 'PC-05', name: 'Station 05', status: 'Maintenance', user: '—', duration: '—', amount: '—' },
  { id: 'PC-06', name: 'Station 06', status: 'Disponible', user: '—', duration: '—', amount: '—' },
];

const navigation = [
  { label: 'Vue d’ensemble', icon: LayoutDashboard },
  { label: 'Ordinateurs', icon: Monitor, count: '12' },
  { label: 'Sessions', icon: Clock3 },
  { label: 'Clients', icon: Users },
  { label: 'Paiements', icon: CreditCard },
];

const chartData = [
  { day: 'Lun', value: 42 }, { day: 'Mar', value: 68 }, { day: 'Mer', value: 54 },
  { day: 'Jeu', value: 82 }, { day: 'Ven', value: 61 }, { day: 'Sam', value: 94 },
  { day: 'Dim', value: 72 },
];

function App() {
  const [activePage, setActivePage] = useState('Vue d’ensemble');
  const [computers, setComputers] = useState(initialComputers);
  const [filter, setFilter] = useState<'Tous' | ComputerStatus>('Tous');
  const [query, setQuery] = useState('');
  const [showNewSession, setShowNewSession] = useState(false);
  const [selectedPc, setSelectedPc] = useState('PC-02');
  const [customer, setCustomer] = useState('');
  const [duration, setDuration] = useState('1');
  const [toast, setToast] = useState('');

  const filteredComputers = useMemo(() => computers.filter((pc) => {
    const matchesFilter = filter === 'Tous' || pc.status === filter;
    const matchesQuery = (pc.name + pc.id + pc.user).toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  }), [computers, filter, query]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  };

  const startSession = () => {
    if (!customer.trim()) {
      notify('Saisis le nom du client pour continuer.');
      return;
    }
    const target = computers.find((pc) => pc.id === selectedPc);
    if (!target || target.status !== 'Disponible') {
      notify('Choisis un ordinateur disponible.');
      return;
    }
    setComputers((current) => current.map((pc) => pc.id === selectedPc
      ? { ...pc, status: 'En cours', user: customer.trim(), duration: '00 h 00', amount: '0 Ar' }
      : pc));
    setShowNewSession(false);
    setCustomer('');
    notify('Session démarrée avec succès.');
  };

  const endSession = (id: string) => {
    setComputers((current) => current.map((pc) => pc.id === id
      ? { ...pc, status: 'Disponible', user: '—', duration: '—', amount: '—' }
      : pc));
    notify('Session terminée. Pense à enregistrer le paiement.');
  };

  const activeCount = computers.filter((pc) => pc.status === 'En cours').length;
  const availableCount = computers.filter((pc) => pc.status === 'Disponible').length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-label="Logo LasyNet"><span>LN</span></div>
          <div><span className="brand-name">LasyNet</span><span className="brand-caption">GESTION CYBERCAFÉ</span></div>
        </div>
        <div className="workspace"><div className="workspace-icon"><Wifi size={17} /></div><div className="workspace-copy"><strong>Cyber Café Central</strong><span>Antananarivo, MG</span></div><ChevronDown size={15} className="muted-icon" /></div>
        <div className="nav-label">MENU PRINCIPAL</div>
        <nav className="navigation">
          {navigation.map(({ label, icon: Icon, count }) => (
            <button key={label} className={`nav-item ${activePage === label ? 'active' : ''}`} onClick={() => setActivePage(label)}>
              <Icon size={18} strokeWidth={1.9} /><span>{label}</span>{count && <span className="nav-count">{count}</span>}
            </button>
          ))}
        </nav>
        <div className="nav-label management-label">GESTION</div>
        <nav className="navigation">
          <button className={`nav-item ${activePage === 'Rapports' ? 'active' : ''}`} onClick={() => setActivePage('Rapports')}><Activity size={18} /><span>Rapports</span></button>
          <button className={`nav-item ${activePage === 'Paramètres' ? 'active' : ''}`} onClick={() => setActivePage('Paramètres')}><Settings2 size={18} /><span>Paramètres</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon"><LifeBuoy size={18} /></div><strong>Besoin d’aide ?</strong><p>Notre équipe est là pour vous accompagner.</p><button onClick={() => notify('Centre d’aide bientôt disponible.')}>Centre d’aide <ChevronRight size={14} /></button></div>
          <div className="profile"><div className="avatar">MR</div><div className="profile-info"><strong>Mamy R.</strong><span>Administrateur</span></div><button className="icon-button profile-menu" aria-label="Menu du profil" onClick={() => notify('Profil administrateur')}><MoreHorizontal size={19} /></button></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={15} /><strong>{activePage}</strong></div>
          <div className="topbar-actions">
            <label className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher..." /><kbd>⌘ K</kbd></label>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => notify('Aucune nouvelle notification.')}><Bell size={19} /><span className="notification-dot" /></button>
            <div className="topbar-divider" />
            <button className="date-chip" onClick={() => notify('Données affichées pour aujourd’hui.')}><CalendarDays size={16} /> 28 oct. 2026 <ChevronDown size={14} /></button>
          </div>
        </header>

        {activePage === 'Vue d’ensemble' ? (
          <div className="page-content">
            <section className="welcome-row">
              <div><div className="eyebrow"><span className="live-dot" /> MERCREDI 28 OCTOBRE 2026</div><h1>Bonjour, Mamy <span className="wave">✦</span></h1><p className="page-subtitle">Voici ce qui se passe dans votre cyber-café aujourd’hui.</p></div>
              <button className="primary-button" onClick={() => setShowNewSession(true)}><Plus size={18} /> Nouvelle session</button>
            </section>

            <section className="stats-grid" aria-label="Indicateurs clés">
              <article className="stat-card"><div className="stat-top"><span className="stat-label">Chiffre d’affaires</span><span className="stat-icon revenue"><CreditCard size={19} /></span></div><div className="stat-value">186 500 <small>Ar</small></div><div className="stat-footer"><span className="trend positive"><ArrowUpRight size={14} /> 12,8 %</span><span>vs. semaine dernière</span></div><div className="stat-spark spark-one"><i /><i /><i /><i /><i /><i /><i /><i /></div></article>
              <article className="stat-card"><div className="stat-top"><span className="stat-label">Sessions actives</span><span className="stat-icon sessions"><Clock3 size={19} /></span></div><div className="stat-value">{activeCount}<small> sessions</small></div><div className="stat-footer"><span className="stat-neutral"><span className="tiny-dot green" /> En cours maintenant</span></div><div className="mini-progress"><span style={{ width: `${(activeCount / computers.length) * 100}%` }} /></div></article>
              <article className="stat-card"><div className="stat-top"><span className="stat-label">Ordinateurs disponibles</span><span className="stat-icon computers"><Monitor size={19} /></span></div><div className="stat-value">{availableCount}<small> / {computers.length}</small></div><div className="stat-footer"><span className="stat-neutral"><span className="tiny-dot green" /> Prêts à l’utilisation</span></div><div className="mini-progress blue"><span style={{ width: `${(availableCount / computers.length) * 100}%` }} /></div></article>
              <article className="stat-card"><div className="stat-top"><span className="stat-label">Clients aujourd’hui</span><span className="stat-icon customers"><Users size={19} /></span></div><div className="stat-value">42<small> clients</small></div><div className="stat-footer"><span className="trend positive"><ArrowUpRight size={14} /> 8,2 %</span><span>vs. hier</span></div><div className="stat-spark spark-four"><i /><i /><i /><i /><i /><i /><i /><i /></div></article>
            </section>

            <section className="content-grid">
              <article className="panel revenue-panel">
                <div className="panel-header"><div><h2>Vue des revenus</h2><p>Suivez les performances de votre activité</p></div><button className="select-chip" onClick={() => notify('Période affichée : cette semaine.')} >Cette semaine <ChevronDown size={14} /></button></div>
                <div className="revenue-summary"><strong>842 000 <span>Ar</span></strong><span className="revenue-change"><ArrowUpRight size={15} /> 18,4 % <small>cette semaine</small></span></div>
                <div className="chart" role="img" aria-label="Graphique indicatif des revenus de la semaine">
                  <div className="chart-grid"><span>200k</span><span>150k</span><span>100k</span><span>50k</span><span>0</span></div>
                  <div className="chart-bars">{chartData.map((item, i) => <div className="bar-column" key={item.day}><div className={`bar-track ${i === 5 ? 'highlight' : ''}`}><span style={{ height: `${item.value}%` }} /></div><span className="bar-label">{item.day}</span></div>)}</div>
                </div>
                <div className="chart-foot"><span><i className="legend-dot" /> Revenus journaliers</span><span>Données de démonstration</span></div>
              </article>
              <article className="panel occupancy-panel">
                <div className="panel-header"><div><h2>Occupation du parc</h2><p>État des postes en temps réel</p></div><button className="icon-button subtle" aria-label="Plus d’options" onClick={() => notify('Options du parc')}><MoreHorizontal size={20} /></button></div>
                <div className="occupancy-main"><div className="donut" style={{ background: `conic-gradient(#dc2626 0 ${(activeCount / computers.length) * 100}%, #334155 ${(activeCount / computers.length) * 100}% 100%)` }}><div><strong>{Math.round((activeCount / computers.length) * 100)}<small>%</small></strong><span>occupés</span></div></div><div className="occupancy-legend"><div><span className="legend-square purple" /><span>En cours</span><strong>{activeCount}</strong></div><div><span className="legend-square pale" /><span>Disponibles</span><strong>{availableCount}</strong></div><div><span className="legend-square amber" /><span>Maintenance</span><strong>{computers.filter((pc) => pc.status === 'Maintenance').length}</strong></div></div></div>
                <div className="occupancy-note"><Sparkles size={16} /><span><strong>Tout est sous contrôle.</strong> Votre parc est opérationnel.</span></div>
              </article>
            </section>

            <section className="panel computers-panel">
              <div className="panel-header computers-header"><div><h2>État des ordinateurs</h2><p>Surveillez vos postes et vos sessions en cours</p></div><div className="table-actions"><div className="filter-tabs">{(['Tous', 'En cours', 'Disponible', 'Maintenance'] as const).map((item) => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="text-button" onClick={() => { setActivePage('Ordinateurs'); setFilter('Tous'); }}>Voir tout <ChevronRight size={15} /></button></div></div>
              <div className="table-scroll"><table><thead><tr><th>ORDINATEUR</th><th>STATUT</th><th>CLIENT</th><th>DURÉE</th><th>COÛT ACTUEL</th><th /></tr></thead><tbody>
                {filteredComputers.slice(0, 5).map((pc) => <tr key={pc.id}><td><div className="computer-name"><span className={`pc-icon ${pc.status === 'En cours' ? 'pc-active' : pc.status === 'Maintenance' ? 'pc-maintenance' : ''}`}><Monitor size={17} /></span><span><strong>{pc.name}</strong><small>{pc.id}</small></span></div></td><td><span className={`status-pill ${pc.status === 'En cours' ? 'status-running' : pc.status === 'Disponible' ? 'status-available' : 'status-maintenance'}`}><i />{pc.status}</span></td><td className="client-cell">{pc.user}</td><td className="duration-cell">{pc.duration}</td><td className="amount-cell">{pc.amount}</td><td><div className="row-actions">{pc.status === 'Disponible' ? <button className="small-action" onClick={() => { setSelectedPc(pc.id); setShowNewSession(true); }}>Démarrer</button> : pc.status === 'En cours' ? <button className="row-icon" aria-label={`Terminer session ${pc.id}`} onClick={() => endSession(pc.id)}><Check size={16} /></button> : <button className="row-icon" aria-label="Poste en maintenance" onClick={() => notify('Ce poste est en maintenance.')}><MoreHorizontal size={17} /></button>}</div></td></tr>)}
                {filteredComputers.length === 0 && <tr><td colSpan={6} className="empty-state">Aucun ordinateur ne correspond à votre recherche.</td></tr>}
              </tbody></table></div>
              <div className="table-footer"><span>Affichage de <strong>{Math.min(filteredComputers.length, 5)}</strong> sur <strong>{filteredComputers.length}</strong> ordinateurs</span><div className="pagination"><button disabled aria-label="Page précédente"><ChevronLeft size={16} /></button><button className="current-page">1</button><button onClick={() => notify('Toutes les stations sont affichées dans cette démo.')} aria-label="Page suivante"><ChevronRight size={16} /></button></div></div>
            </section>
            <footer className="page-footer"><span>© 2026 LasyNet</span><span><span className="tiny-dot green" /> Système opérationnel</span><span>Version 0.1.0 · Démo</span></footer>
          </div>
        ) : (
          <div className="page-content secondary-page"><div className="welcome-row"><div><div className="eyebrow"><span className="live-dot" /> CYBERDESK</div><h1>{activePage}</h1><p className="page-subtitle">Le module {activePage.toLowerCase()} sera connecté progressivement aux services backend.</p></div><button className="primary-button" onClick={() => setActivePage('Vue d’ensemble')}><LayoutDashboard size={17} /> Retour au tableau de bord</button></div><div className="panel module-placeholder"><div className="module-illustration"><Zap size={28} /></div><h2>Préparons ce module ensemble</h2><p>La structure de navigation est en place. Nous allons construire cette section après validation du tableau de bord et connecter les données à l’API.</p><button className="secondary-button" onClick={() => notify('Module planifié pour la prochaine étape.')}><CircleHelp size={16} /> En savoir plus</button></div></div>
        )}
      </main>

      {showNewSession && <div className="modal-backdrop" onClick={() => setShowNewSession(false)}><section className="session-modal" role="dialog" aria-modal="true" aria-labelledby="session-title" onClick={(e) => e.stopPropagation()}><div className="modal-header"><div><span className="modal-kicker">GESTION DES SESSIONS</span><h2 id="session-title">Démarrer une session</h2><p>Attribuez un poste à un client pour commencer.</p></div><button className="icon-button" aria-label="Fermer" onClick={() => setShowNewSession(false)}><X size={19} /></button></div><label className="field-label">Nom du client<input autoFocus value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Ex. Rakoto Jean" /></label><label className="field-label">Ordinateur<select value={selectedPc} onChange={(e) => setSelectedPc(e.target.value)}>{computers.filter((pc) => pc.status === 'Disponible').map((pc) => <option key={pc.id} value={pc.id}>{pc.name} ({pc.id})</option>)}</select></label><label className="field-label">Durée prévue<select value={duration} onChange={(e) => setDuration(e.target.value)}><option value="1">1 heure</option><option value="2">2 heures</option><option value="3">3 heures</option><option value="4">4 heures</option><option value="libre">Sans limite</option></select></label><div className="modal-hint"><ShieldCheck size={17} /><span>La session sera enregistrée localement dans cette démonstration.</span></div><div className="modal-actions"><button className="secondary-button" onClick={() => setShowNewSession(false)}>Annuler</button><button className="primary-button" onClick={startSession}><Plus size={17} /> Démarrer la session</button></div></section></div>}
      {toast && <div className="toast"><Check size={17} />{toast}<button aria-label="Fermer le message" onClick={() => setToast('')}><X size={15} /></button></div>}
    </div>
  );
}

export default App;
