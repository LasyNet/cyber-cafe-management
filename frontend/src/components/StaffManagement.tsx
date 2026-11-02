import { useEffect, useState } from 'react';
import { Check, Copy, LoaderCircle, MailPlus, Shield, UserCog, X } from 'lucide-react';
import {
  createCompanyInvitation, listCompanyInvitations, listCompanyMembers,
  getPermissionCatalog, revokeCompanyInvitation, updateCompanyMember,
  type CompanyInvitation, type CompanyMember, type PermissionCatalog,
} from '../api/client';

type Props = { notify: (message: string) => void };
const labels: Record<string, string> = {
  'computers.read': 'Consulter les ordinateurs', 'computers.create': 'Ajouter un ordinateur',
  'computers.update': 'Modifier un ordinateur', 'computers.delete': 'Supprimer un ordinateur',
  'sessions.read': 'Consulter les sessions', 'sessions.create': 'Démarrer une session',
  'sessions.update': 'Modifier / terminer une session', 'clients.read': 'Consulter les clients',
  'clients.create': 'Ajouter un client', 'clients.update': 'Modifier un client',
  'clients.delete': 'Supprimer un client', 'payments.read': 'Consulter les paiements',
  'payments.create': 'Créer un paiement', 'payments.update': 'Encaisser / modifier un paiement',
  'settings.read': 'Consulter les paramètres', 'settings.update': 'Modifier les paramètres',
  'personnel.manage': 'Gérer le personnel', 'companies.manage': 'Gérer les entreprises',
};
const groupLabels: Record<string, string> = {
  computers: 'Ordinateurs', sessions: 'Sessions', clients: 'Clients',
  payments: 'Paiements', settings: 'Paramètres', personnel: 'Personnel', companies: 'Entreprises',
};

export function StaffManagement({ notify }: Props) {
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [invitations, setInvitations] = useState<CompanyInvitation[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalog | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Record<string, boolean>>>({});
  const [roles, setRoles] = useState<Record<string, 'admin' | 'employee'>>({});
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'employee'>('employee');
  const [expiry, setExpiry] = useState('7');
  const [createdInvite, setCreatedInvite] = useState<CompanyInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = async () => {
    const [people, invites, permissions] = await Promise.all([
      listCompanyMembers(), listCompanyInvitations(), getPermissionCatalog(),
    ]);
    setMembers(people);
    setInvitations(invites);
    setCatalog(permissions);
    setOverrides(Object.fromEntries(people.map(person => [person.user_id, { ...(permissions.default_employee_permissions), ...(person.permissions ?? {}) }])));
    setRoles(Object.fromEntries(people.map(person => [person.user_id, person.role])));
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([listCompanyMembers(), listCompanyInvitations(), getPermissionCatalog()])
      .then(([people, invites, permissions]) => {
        if (!mounted) return;
        setMembers(people);
        setInvitations(invites);
        setCatalog(permissions);
        setOverrides(Object.fromEntries(people.map(person => [person.user_id, { ...permissions.default_employee_permissions, ...(person.permissions ?? {}) }])));
        setRoles(Object.fromEntries(people.map(person => [person.user_id, person.role])));
      })
      .catch(error => notify(error instanceof Error ? error.message : 'Impossible de charger le personnel.'))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const invite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy('invite');
    try {
      const created = await createCompanyInvitation({ ...(email.trim() ? { email: email.trim() } : {}), role: inviteRole, expires_in_days: Number(expiry) });
      setCreatedInvite(created);
      setEmail('');
      await refresh();
      notify('Invitation créée. Copie le lien et transmets-le à la personne concernée.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Création de l’invitation impossible.');
    } finally {
      setBusy(null);
    }
  };

  const saveMember = async (member: CompanyMember) => {
    setBusy(member.user_id);
    try {
      await updateCompanyMember(member.user_id, {
        role: roles[member.user_id] ?? member.role,
        permissions: (roles[member.user_id] ?? member.role) === 'admin' ? {} : overrides[member.user_id] ?? {},
      });
      await refresh();
      notify('Rôle et permissions mis à jour.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Modification des droits impossible.');
    } finally {
      setBusy(null);
    }
  };

  const toggleActive = async (member: CompanyMember) => {
    setBusy(member.user_id);
    try {
      await updateCompanyMember(member.user_id, { is_active: !member.is_active });
      await refresh();
      notify(member.is_active ? 'Accès de ce membre désactivé.' : 'Accès de ce membre réactivé.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Modification du membre impossible.');
    } finally {
      setBusy(null);
    }
  };

  const revoke = async (invitation: CompanyInvitation) => {
    setBusy(invitation.id);
    try {
      await revokeCompanyInvitation(invitation.id);
      await refresh();
      notify('Invitation révoquée.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Révocation impossible.');
    } finally {
      setBusy(null);
    }
  };

  const copyInvite = async () => {
    if (!createdInvite?.invite_token) return;
    const link = window.location.origin + '/register?invite=' + encodeURIComponent(createdInvite.invite_token);
    try {
      await navigator.clipboard.writeText(link);
      notify('Lien d’invitation copié.');
    } catch {
      notify(link);
    }
  };

  if (loading) return <div className="panel tenant-loading"><LoaderCircle className="button-spinner" size={22}/> Chargement du personnel…</div>;

  return <section className="tenant-page">
    <div className="tenant-page-heading"><div><span className="modal-kicker">ADMINISTRATION</span><h1>Personnel & permissions</h1><p>Attribue un rôle prédéfini, puis ajuste les droits de chaque membre.</p></div><span className="tenant-count">{members.length} membre(s)</span></div>
    <div className="panel staff-invite-panel">
      <div className="staff-panel-heading"><div className="tenant-company-icon"><MailPlus size={20}/></div><div><h2>Inviter un membre</h2><p>Le lien est utilisable une seule fois et expire automatiquement.</p></div></div>
      <form className="staff-invite-form" onSubmit={invite}>
        <label className="field-label">Adresse e-mail <span className="auth-optional">(facultatif)</span><input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="collaborateur@exemple.com"/></label>
        <label className="field-label">Rôle<select value={inviteRole} onChange={event => setInviteRole(event.target.value as 'admin' | 'employee')}><option value="employee">Employé</option><option value="admin">Administrateur</option></select></label>
        <label className="field-label">Validité<select value={expiry} onChange={event => setExpiry(event.target.value)}><option value="1">24 heures</option><option value="7">7 jours</option><option value="14">14 jours</option><option value="30">30 jours</option></select></label>
        <button className="primary-button" disabled={busy === 'invite'}>{busy === 'invite' ? <LoaderCircle className="button-spinner" size={16}/> : <MailPlus size={16}/>} Créer l’invitation</button>
      </form>
      {createdInvite?.invite_token && <div className="staff-invite-result"><div><strong>Lien prêt à partager</strong><span>Le jeton ne sera plus affiché après avoir quitté cette page.</span><code>{window.location.origin}/register?invite={createdInvite.invite_token}</code></div><button className="secondary-button" onClick={() => void copyInvite()}><Copy size={15}/> Copier le lien</button></div>}
    </div>
    <div className="staff-members-list">
      {members.map(member => <article className="panel staff-member-card" key={member.user_id}>
        <div className="staff-member-top"><div className="staff-member-avatar"><UserCog size={19}/></div><div className="staff-member-info"><strong>{member.full_name}</strong><span>{member.email}</span></div><span className={member.is_active ? 'tenant-active' : 'tenant-disabled'}>{member.is_active ? 'Actif' : 'Désactivé'}</span></div>
        <div className="staff-role-row"><label className="field-label">Rôle<select value={roles[member.user_id] ?? member.role} onChange={event => setRoles(current => ({ ...current, [member.user_id]: event.target.value as 'admin' | 'employee' }))}><option value="employee">Employé</option><option value="admin">Administrateur</option></select></label><div className="staff-member-actions"><button className="secondary-button" disabled={busy === member.user_id} onClick={() => void toggleActive(member)}>{member.is_active ? 'Désactiver' : 'Réactiver'}</button><button className="primary-button" disabled={busy === member.user_id} onClick={() => void saveMember(member)}>{busy === member.user_id ? <LoaderCircle className="button-spinner" size={15}/> : <Check size={15}/>} Enregistrer</button></div></div>
        {(roles[member.user_id] ?? member.role) === 'employee' && catalog && <div className="staff-permissions"><div className="staff-permissions-heading"><Shield size={16}/> Permissions personnalisées</div><div className="staff-permission-groups">{Object.entries(catalog.groups).map(([group, actions]) => <div className="staff-permission-group" key={group}><strong>{groupLabels[group] ?? group}</strong><div>{actions.map(action => { const key = group + '.' + action; return <label key={key}><input type="checkbox" checked={overrides[member.user_id]?.[key] ?? false} onChange={event => setOverrides(current => ({ ...current, [member.user_id]: { ...(current[member.user_id] ?? {}), [key]: event.target.checked } }))}/><span>{labels[key] ?? key}</span></label>; })}</div></div>)}</div></div>}
      </article>)}
    </div>
    <div className="panel staff-invitations-panel"><h2>Invitations envoyées</h2>{invitations.length === 0 ? <p className="tenant-muted">Aucune invitation pour le moment.</p> : invitations.map(invitation => {
      const state = invitation.revoked_at ? 'Révoquée' : invitation.accepted_at ? 'Acceptée' : new Date(invitation.expires_at).getTime() < Date.now() ? 'Expirée' : 'En attente';
      return <div className="staff-invitation-row" key={invitation.id}><div><strong>{invitation.email || 'Adresse non spécifiée'}</strong><span>{invitation.role === 'admin' ? 'Administrateur' : 'Employé'} · Expire le {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}</span></div><span className="tenant-count">{state}</span>{!invitation.accepted_at && !invitation.revoked_at && state !== 'Expirée' && <button className="icon-button" aria-label="Révoquer l’invitation" disabled={busy === invitation.id} onClick={() => void revoke(invitation)}><X size={16}/></button>}</div>;
    })}</div>
  </section>;
}
