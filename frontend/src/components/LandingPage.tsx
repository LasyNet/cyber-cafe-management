import type { FormEvent } from 'react';
import { ArrowRight, CheckCircle2, Clock3, CreditCard, Gauge, Monitor, Plus, ShieldCheck, Users } from 'lucide-react';

type LandingScreen = 'landing' | 'login' | 'signup';
export function LandingPage({ screen, onNavigate, onSubmit, name, setName, email, setEmail, password, setPassword, notice }: {
  screen: LandingScreen;
  onNavigate: (screen: 'landing' | 'login' | 'signup' | 'app') => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  name: string; setName: (value: string) => void;
  email: string; setEmail: (value: string) => void;
  password: string; setPassword: (value: string) => void;
  notice: string;
}) {
  if (screen === 'login' || screen === 'signup') return <main className="auth-page">
    <button className="landing-brand auth-back" onClick={() => onNavigate('landing')}><span className="landing-logo">LN</span><span>LasyNet</span></button>
    <section className="auth-card">
      <div className="landing-eyebrow"><span className="landing-live-dot"/> ESPACE DE GESTION</div>
      <h1>{screen === 'login' ? 'Heureux de vous revoir.' : 'Connexion du personnel'}</h1>
      <p>{screen === 'login' ? 'Connectez-vous pour retrouver votre activité.' : 'Connectez-vous avec les identifiants fournis par votre administrateur.'}</p>
      <form onSubmit={onSubmit} className="auth-form">
        {screen === 'signup' && <label>Nom complet<input value={name} onChange={event => setName(event.target.value)} placeholder="Ex. Rakoto Jean" autoComplete="name" required /></label>}
        <label>Adresse e-mail<input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="vous@exemple.com" autoComplete="email" required /></label>
        <label>Mot de passe<input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Au moins 8 caractères" autoComplete={screen === 'login' ? 'current-password' : 'current-password'} minLength={8} required /></label>
        {notice && <div className="auth-notice" role="alert">{notice}</div>}
        <button className="landing-primary auth-submit" type="submit">{screen === 'login' ? 'Se connecter' : 'Se connecter'} <ArrowRight size={17}/></button>
      </form>
      <div className="auth-demo-note"><ShieldCheck size={17}/><span>Connexion protégée par le serveur. Vos identifiants sont vérifiés par l’API.</span></div>
      <div className="auth-switch">{screen === 'login' ? 'Accès réservé au personnel autorisé.' : 'La création de compte est gérée par un administrateur.'} {screen === 'signup' && <button onClick={() => onNavigate('login')}>Se connecter</button>}</div>
    </section>
    <div className="auth-footer">© 2026 LasyNet · Gestion de cybercafé</div>
  </main>;

  return <main className="landing-page">
    <header className="landing-nav">
      <button className="landing-brand" onClick={() => onNavigate('landing')}><span className="landing-logo">LN</span><span>LasyNet</span></button>
      <nav className="landing-links" aria-label="Navigation principale"><a href="#fonctionnalites">Fonctionnalités</a><a href="#avantages">Avantages</a></nav>
      <div className="landing-nav-actions"><button className="landing-login" onClick={() => onNavigate('login')}>Connexion</button><button className="landing-primary landing-small" onClick={() => onNavigate('login')}>Connexion <ArrowRight size={15}/></button></div>
    </header>
    <section className="landing-hero">
      <div className="landing-hero-copy">
        <div className="landing-eyebrow"><span className="landing-live-dot"/> LA GESTION DE VOTRE CYBERCAFÉ, SIMPLIFIÉE</div>
        <h1>Votre cybercafé.<br/><span>Une gestion plus claire.</span></h1>
        <p className="landing-lead">Ordinateurs, sessions, clients et paiements : retrouvez l’essentiel de votre activité dans un espace simple, moderne et intuitif.</p>
        <div className="landing-hero-actions"><button className="landing-primary" onClick={() => onNavigate('signup')}>Commencer maintenant <ArrowRight size={17}/></button></div>
        <div className="landing-trust"><div className="landing-avatars"><span>G</span><span>C</span><span>L</span></div><div><strong>Tout au même endroit</strong><span>Une vue claire sur votre quotidien.</span></div></div>
      </div>
      <div className="landing-visual" aria-label="Aperçu du tableau de bord LasyNet">
        <div className="visual-glow"/>
        <div className="visual-window">
          <div className="visual-top"><div className="visual-dots"><i/><i/><i/></div><span>lasynet · Tableau de bord</span><span className="visual-live"><i/> En direct</span></div>
          <div className="visual-body"><aside className="visual-sidebar"><div className="visual-brand"><span>LN</span><b>LasyNet</b></div><div className="visual-nav active"><Gauge size={14}/> Vue d’ensemble</div><div className="visual-nav"><Monitor size={14}/> Ordinateurs</div><div className="visual-nav"><Clock3 size={14}/> Sessions</div><div className="visual-nav"><Users size={14}/> Clients</div><div className="visual-nav"><CreditCard size={14}/> Paiements</div><div className="visual-mini-card"><ShieldCheck size={15}/><span>Votre activité<br/><b>en un clin d’œil</b></span></div></aside>
            <div className="visual-dashboard"><div className="visual-heading"><div><small>VOTRE ESPACE</small><h3>Bonjour, Administrateur ✦</h3><p>Voici le résumé de votre activité.</p></div><span className="visual-date">Aujourd’hui⌄</span></div>
              <div className="visual-stats"><div><span>Revenus encaissés</span><strong>248 000 <small>Ar</small></strong><em>↗ Aujourd’hui</em></div><div><span>Sessions actives</span><strong>08</strong><em>En cours</em></div><div><span>Postes disponibles</span><strong>12 <small>/ 20</small></strong><em>Prêts à l’utilisation</em></div></div>
              <div className="visual-chart-card"><div><strong>Activité du cybercafé</strong><span>Cette semaine</span></div><div className="visual-chart"><i style={{height:'36%'}}/><i style={{height:'55%'}}/><i style={{height:'42%'}}/><i style={{height:'76%'}}/><i style={{height:'62%'}}/><i style={{height:'91%'}}/><i style={{height:'70%'}}/></div><div className="visual-days"><span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span></div></div>
            </div>
          </div>
        </div>
        <div className="visual-float visual-float-top"><span><CheckCircle2 size={17}/></span><div><strong>Session démarrée</strong><small>Poste PC-08 · à l’instant</small></div></div>
        <div className="visual-float visual-float-bottom"><span className="float-purple"><CreditCard size={17}/></span><div><strong>Paiement enregistré</strong><small>+ 12 000 Ar</small></div></div>
      </div>
    </section>
    <section className="landing-proof"><div><strong>Tout est centralisé</strong><span>Les outils essentiels, réunis dans un seul espace.</span></div><div className="proof-item"><Monitor size={18}/><span>Parc informatique</span></div><div className="proof-item"><Clock3 size={18}/><span>Suivi des sessions</span></div><div className="proof-item"><CreditCard size={18}/><span>Suivi des paiements</span></div><div className="proof-item"><ShieldCheck size={18}/><span>Contrôle simplifié</span></div></section>
    <section className="landing-features" id="fonctionnalites"><div className="landing-section-heading"><div className="landing-eyebrow">LES OUTILS DU QUOTIDIEN</div><h2>Moins de dispersion.<br/><span>Plus de maîtrise.</span></h2><p>Gardez une vision claire des opérations et prenez vos décisions plus facilement.</p></div><div className="landing-feature-grid"><article><span className="feature-icon blue"><Monitor size={21}/></span><h3>Parc informatique</h3><p>Visualisez les postes disponibles, en cours d’utilisation ou en maintenance.</p></article><article><span className="feature-icon violet"><Clock3 size={21}/></span><h3>Sessions & clients</h3><p>Suivez les sessions et retrouvez facilement les informations de vos clients.</p></article><article><span className="feature-icon green"><CreditCard size={21}/></span><h3>Paiements & factures</h3><p>Consultez les paiements et préparez des factures PDF en quelques clics.</p></article></div></section>
    <section className="landing-cta" id="avantages"><div><span className="landing-eyebrow">PRÊT À COMMENCER ?</span><h2>Votre activité mérite<br/>un tableau de bord à sa mesure.</h2><p>Découvrez une expérience pensée pour simplifier la gestion quotidienne.</p></div><div className="landing-cta-actions"><button className="landing-primary" onClick={() => onNavigate('signup')}>Se connecter <ArrowRight size={17}/></button><button className="landing-cta-login" onClick={() => onNavigate('login')}>J’ai déjà un compte</button></div></section>
    <footer className="landing-footer"><button className="landing-brand" onClick={() => onNavigate('landing')}><span className="landing-logo">LN</span><span>LasyNet</span></button><span>© 2026 LasyNet. Une gestion plus simple, chaque jour.</span><button onClick={() => onNavigate('login')}>Connexion <ArrowRight size={14}/></button></footer>
  </main>;
}

