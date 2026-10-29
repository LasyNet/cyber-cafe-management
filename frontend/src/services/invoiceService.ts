import { jsPDF } from 'jspdf';
import type { Payment } from '../types/domain';

type InvoiceClient = { id: string; name: string; phone?: string; email?: string } | undefined;
function buildInvoicePdf(payment: Payment, cafeName: string, client: InvoiceClient) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const right = pageWidth - margin;
  const invoiceRef = `FAC-${payment.id}`;
  const date = new Date(payment.paidAt);
  const formattedDate = Number.isNaN(date.getTime()) ? String(payment.paidAt) : date.toLocaleString('fr-FR');
  const formattedAmount = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(payment.amount).replace(/[\u00a0\u202f]/g, ' ');
  const amount = `${formattedAmount} Ar`;
  doc.setFillColor(220, 38, 38);
  doc.roundedRect(margin, 17, 15, 15, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('LN', margin + 7.5, 26.5, { align: 'center' });
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(19);
  doc.text(cafeName || 'Cybercafé', margin, 43);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('FACTURE DE PRESTATION INFORMATIQUE', margin, 50);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.setFontSize(12);
  doc.text(invoiceRef, right, 25, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Date : ${formattedDate}`, right, 32, { align: 'right' });
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 58, right, 58);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('FACTURÉ À', margin, 70);
  doc.text('RÉFÉRENCE DE SESSION', 112, 70);
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(doc.splitTextToSize(client?.name || 'Client supprimé', 75), margin, 78);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  let clientY = 85;
  if (client?.id) { doc.text(`Référence client : ${client.id}`, margin, clientY); clientY += 5; }
  if (client?.phone) { doc.text(`Téléphone : ${client.phone}`, margin, clientY); clientY += 5; }
  if (client?.email) doc.text(`E-mail : ${client.email}`, margin, clientY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(String(payment.sessionId), 112, 78);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Paiement : ${payment.id}`, 112, 85);
  doc.text(`Mode de paiement : ${payment.method}`, 112, 90);
  const tableY = 111;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, tableY, pageWidth - margin * 2, 12, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('DESCRIPTION', margin + 4, tableY + 7.5);
  doc.text('QTÉ', right - 38, tableY + 7.5, { align: 'center' });
  doc.text('MONTANT', right - 4, tableY + 7.5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(doc.splitTextToSize(`Prestation de cybercafé — session ${payment.sessionId}`, 105), margin + 4, tableY + 23);
  doc.text('1', right - 38, tableY + 23, { align: 'center' });
  doc.text(amount, right - 4, tableY + 23, { align: 'right' });
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, tableY + 33, right, tableY + 33);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, tableY + 42, pageWidth - margin * 2, 20, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(payment.status === 'Payé' ? 'TOTAL RÉGLÉ' : 'TOTAL À RÉGLER', margin + 5, tableY + 54);
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text(amount, right - 5, tableY + 55, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(payment.status === 'Payé' ? 22 : 180, payment.status === 'Payé' ? 163 : 83, payment.status === 'Payé' ? 74 : 9);
  doc.text(`Statut : ${payment.status}`, margin, tableY + 76);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(payment.status === 'Payé' ? 'Merci pour votre confiance !' : 'Cette facture est en attente de règlement.', margin, tableY + 83);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 270, right, 270);
  doc.setFontSize(8);
  doc.text('Document généré par LasyNet · Conservez cette facture pour vos archives.', margin, 277);
  return doc;
}

export function downloadInvoicePdf(payment: Payment, cafeName: string, client: InvoiceClient) {
  buildInvoicePdf(payment, cafeName, client).save(`FAC-${payment.id}.pdf`);
}

export function printInvoicePdf(payment: Payment, cafeName: string, client: InvoiceClient) {
  const doc = buildInvoicePdf(payment, cafeName, client);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank', 'noopener,noreferrer');
}
