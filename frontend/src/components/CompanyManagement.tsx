import { useEffect, useState, type FormEvent } from 'react';
import { Building2, Check, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { activatePremium, createCompany, listPlatformSubscriptionRequests, requestPremiumUpgrade, updateCurrentCompany, type Company, type PlatformSubscriptionRequest } from '../api/client';

type Props = {
  companies: Company[];
  activeCompanyId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => Promise<void>;
  notify: (message: string) => void;
  requestConfirmation: (title: string, message: string, label: string, action: () => void | Promise<void>) => void;
  isPlatformAdmin: boolean;
};

export function CompanyManagement({ companies, activeCompanyId, onSelect, onRefresh, notify, requestConfirmation, isPlatformAdmin }: Props) {
  const [name, setName] = useState('');
  const [renameName, setRenameName] = useState('');
  const [saving, setSaving] = useState(false);
  const [subscriptionRequests, setSubscriptionRequests] = useState<PlatformSubscriptionRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const active = companies.find(company => company.id === activeCompanyId) ?? null;

  const refreshSubscriptionRequests = async () => {
    if (!isPlatformAdmin) return;
    setRequestsLoading(true);
    try {
      setSubscriptionRequests(await listPlatformSubscriptionRequests());
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Impossible de charger les demandes Premium.');
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    void refreshSubscriptionRequests();
  }, [isPlatformAdmin]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    requestConfirmation('Créer cette entreprise ?', 'Un nouvel espace isolé sera créé avec ses propres données et ses propres membres.', 'Créer l’entreprise', async () => {
      setSaving(true);
      try {
        const company = await createCompany(name.trim());
        await onRefresh();
        onSelect(company.id);
        setName('');
        notify('Entreprise créée et espace activé.');
      } catch (error) {
        notify(error instanceof Error ? error.message : 'Création de l’entreprise impossible.');
      } finally {
        setSaving(false);
      }
    });
  };

  const rename = async () => {
    if (!active || !renameName.trim()) return;
    requestConfirmation('Renommer cette entreprise ?', 'Le nom affiché dans l’espace de travail et les paramètres sera modifié.', 'Enregistrer le nom', async () => {
      setSaving(true);
      try {
        await updateCurrentCompany(renameName.trim());
        await onRefresh();
        setRenameName('');
        notify('Nom de l’entreprise mis à jour.');
      } catch (error) {
        notify(error instanceof Error ? error.message : 'Modification impossible.');
      } finally {
        setSaving(false);
      }
    });
  };

  return <section className="tenant-page">
    <div className="tenant-page-heading"><div><span className="modal-kicker">ESPACES DE TRAVAIL</span><h1>Mes entreprises</h1><p>Un seul compte pour accéder à plusieurs cybercafés ou établissements.</p></div><span className="tenant-count">{companies.length} espace(s)</span></div>
    <div className="tenant-company-grid">
      {companies.map(company => <article className={company.id === activeCompanyId ? 'tenant-company-card selected' : 'tenant-company-card'} key={company.id}>
        <div className="tenant-company-icon"><Building2 size={21}/></div>
        <div className="tenant-company-copy"><strong>{company.name}</strong><span>{company.role === 'admin' ? 'Administrateur' : 'Employé'} · {company.slug}</span></div>
        {company.id === activeCompanyId ? <span className="tenant-active"><Check size={14}/> Actif</span> : <button className="secondary-button" onClick={() => onSelect(company.id)}>Ouvrir cet espace</button>}
      </article>)}
      {companies.length === 0 && <div className="panel tenant-empty"><Building2 size={26}/><strong>Aucune entreprise associée</strong><span>Crée ton premier espace pour commencer.</span></div>}
    </div>
    <div className="panel tenant-create-panel">
      <div><h2>Créer un nouvel espace</h2><p>Chaque entreprise possède ses propres ordinateurs, clients, sessions, paiements et employés.</p></div>
      <form onSubmit={submit} className="tenant-create-form"><label className="field-label">Nom de l’entreprise<input value={name} onChange={event => setName(event.target.value)} placeholder="Ex. Cyber Café Andavamamba" maxLength={160} required /></label><button className="primary-button" disabled={saving || !name.trim()}><Plus size={16}/> {saving ? 'Création…' : 'Créer une entreprise'}</button></form>
    </div>
    {active && <div className="panel tenant-create-panel">
      <div>
        <span className="modal-kicker">ABONNEMENT</span>
        <h2>Offre actuelle : {active.plan === 'premium' ? 'Premium' : 'Gratuite'}</h2>
        <p>{active.plan === 'premium'
          ? `Votre espace bénéficie de Premium jusqu'au ${active.subscription_expires_at ? new Date(active.subscription_expires_at).toLocaleDateString('fr-FR') : 'sans date d’expiration'}.`
          : '5 ordinateurs, 2 employés et 100 clients. Les sessions et les paiements restent illimités.'}</p>
      </div>
      {active.plan === 'free' && active.role === 'admin' && <button className="primary-button" onClick={() => requestConfirmation(
        'Demander le passage à Premium ?',
        'Votre demande sera transmise à l’équipe LasyNet. Premium sera activé après vérification manuelle du paiement.',
        'Envoyer la demande',
        async () => {
          try {
            await requestPremiumUpgrade();
            notify('Demande Premium envoyée. L’équipe LasyNet vous contactera après vérification.');
          } catch (error) {
            notify(error instanceof Error ? error.message : 'Impossible d’envoyer la demande Premium.');
          }
        },
      )}>Demander Premium</button>}
    </div>}
    {isPlatformAdmin && <div className="panel tenant-create-panel">
      <div>
        <span className="modal-kicker">ADMINISTRATION LASYNET</span>
        <h2>Demandes de passage à Premium</h2>
        <p>Vérifiez le paiement, puis activez manuellement l’abonnement pour 30 jours.</p>
      </div>
      {requestsLoading ? <span className="muted-text">Chargement des demandes…</span> : subscriptionRequests.length === 0
        ? <span className="muted-text">Aucune demande en attente.</span>
        : <div className="tenant-company-grid">
          {subscriptionRequests.map(item => <article className="tenant-company-card" key={item.id}>
            <div className="tenant-company-icon"><ShieldCheck size={21}/></div>
            <div className="tenant-company-copy">
              <strong>{item.company_name}</strong>
              <span>{item.requested_by_name} · {new Date(item.created_at).toLocaleDateString('fr-FR')}</span>
              {item.message && <span>{item.message}</span>}
            </div>
            <button className="primary-button" onClick={() => requestConfirmation(
              'Activer Premium pour cette entreprise ?',
              'Après vérification du paiement, l’entreprise bénéficiera de Premium pendant 30 jours.',
              'Activer Premium',
              async () => {
                try {
                  await activatePremium(item.id, 30);
                  await refreshSubscriptionRequests();
                  await onRefresh();
                  notify('Premium activé pour ' + item.company_name + ' pendant 30 jours.');
                } catch (error) {
                  notify(error instanceof Error ? error.message : 'Activation Premium impossible.');
                }
              },
            )}>Activer Premium</button>
          </article>)}
        </div>}
    </div>}
    {active?.role === 'admin' && <div className="panel tenant-create-panel"><div><h2>Renommer l’espace actif</h2><p>Le nom sera également actualisé dans les paramètres du cybercafé.</p></div><form className="tenant-create-form" onSubmit={event => { event.preventDefault(); void rename(); }}><label className="field-label">Nouveau nom<input value={renameName} onChange={event => setRenameName(event.target.value)} placeholder={active.name} maxLength={160}/></label><button className="secondary-button" disabled={saving || !renameName.trim()}><RefreshCw size={15}/> Enregistrer le nom</button></form></div>}
  </section>;
}
