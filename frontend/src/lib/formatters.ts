export const money = (amount: number, currency = 'Ar'): string =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} ${currency}`;

export const dateTime = (value: string): string =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

export const elapsed = (startedAt: string): string => {
  const startedAtMs = new Date(startedAt).getTime();
  if (!Number.isFinite(startedAtMs)) return '00 h 00';

  const minutes = Math.max(0, Math.floor((Date.now() - startedAtMs) / 60000));
  const hoursPart = String(Math.floor(minutes / 60)).padStart(2, '0');
  const minutesPart = String(minutes % 60).padStart(2, '0');
  return `${hoursPart} h ${minutesPart}`;
};
