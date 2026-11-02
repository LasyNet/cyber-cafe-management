import { useState } from 'react';
import { Building2, Check, Plus, RefreshCw } from 'lucide-react';
import { createCompany, updateCurrentCompany, type Company } from '../api/client';

type Props = {
  companies: Company[];
  activeCompanyId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => Promise<void>;
  notify: (message: string) => void;
};

export function CompanyManagement({ companies, activeCompanyId, onSelect, onRefresh, notify }: Props) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const active = companies.find(company => company.id === activeCompanyId) ?? null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
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
  };

  const rename = async () => {
    if (!active || !name.trim()) return;
    setSaving(true);
    try {
      await updateCurrentCompany(name.trim());
      await onRefresh();
      setName('');
      notify('Nom de l’entreprise mis à jour.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Modification impossible.');
    } finally {
      setSaving(false);
    }
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
    {active?.role === 'admin' && <div className="panel tenant-create-panel"><div><h2>Renommer l’espace actif</h2><p>Le nom sera également actualisé dans les paramètres du cybercafé.</p></div><form className="tenant-create-form" onSubmit={event => { event.preventDefault(); void rename(); }}><label className="field-label">Nouveau nom<input value={name} onChange={event => setName(event.target.value)} placeholder={active.name} maxLength={160}/></label><button className="secondary-button" disabled={saving || !name.trim()}><RefreshCw size={15}/> Enregistrer le nom</button></form></div>}
  </section>;
}
