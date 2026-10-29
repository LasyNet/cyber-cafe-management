import { Download, Printer, X } from 'lucide-react';
import type { Client, Payment, Store } from '../types/domain';
import { dateTime, money } from '../utils/formatters';
import { downloadInvoicePdf, printInvoicePdf } from '../services/invoiceService';

type InvoiceModalProps = {
  payment: Payment | null;
  store: Store;
  getClient: (id: string) => Client | undefined;
  onClose: () => void;
};

export function InvoiceModal({ payment, store, getClient, onClose }: InvoiceModalProps) {
  if (!payment) return null;
  return (
    <div className="modal-backdrop invoice-backdrop" onClick={()=>onClose()}><section className="invoice-paper" role="dialog" aria-modal="true" aria-labelledby="invoice-title" onClick={e=>e.stopPropagation()}><div className="invoice-actions no-print"><button className="secondary-button" onClick={()=>onClose()}><X size={15}/> Fermer</button><button className="secondary-button" onClick={()=>printInvoicePdf(payment,store.settings.cafeName,getClient(payment.clientId))}><Printer size={16}/> Imprimer</button><button className="primary-button" onClick={()=>downloadInvoicePdf(payment,store.settings.cafeName,getClient(payment.clientId))}><Download size={16}/> Télécharger PDF</button></div><header className="invoice-heading"><div><div className="invoice-brand-mark">LN</div><h2 id="invoice-title">{store.settings.cafeName}</h2><p>Facture de prestation informatique</p></div><div className="invoice-number"><span>FACTURE</span><strong>FAC-{payment.id}</strong><span>{dateTime(payment.paidAt)}</span></div></header><div className="invoice-rule"/><div className="invoice-parties"><div><span>FACTURÉ À</span><strong>{getClient(payment.clientId)?.name??'Client supprimé'}</strong><small>Référence client : {payment.clientId}</small>{getClient(payment.clientId)?.phone&&<small>{getClient(payment.clientId)?.phone}</small>}{getClient(payment.clientId)?.email&&<small>{getClient(payment.clientId)?.email}</small>}</div><div><span>RÉFÉRENCE DE SESSION</span><strong>{payment.sessionId}</strong><small>Paiement : {payment.id}</small><small>Mode : {payment.method}</small></div></div><table className="invoice-lines"><thead><tr><th>DESCRIPTION</th><th>QTÉ</th><th>MONTANT</th></tr></thead><tbody><tr><td>Prestation de cybercafé — session {payment.sessionId}</td><td>1</td><td>{money(payment.amount)}</td></tr></tbody></table><div className="invoice-total"><span>Total {payment.status==='Payé'?'réglé':'à régler'}</span><strong>{money(payment.amount)}</strong></div><div className="invoice-status"><span className={`status-pill ${payment.status==='Payé'?'status-available':'status-maintenance'}`}><i/>{payment.status}</span><p>{payment.status==='Payé'?'Merci pour votre confiance !':'Cette facture est en attente de règlement.'}</p></div><footer className="invoice-footer">Document généré par LasyNet · Conservez cette facture pour vos archives.</footer></section></div>
  );
}
