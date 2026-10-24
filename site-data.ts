import source from './content/home.json';

export const site = source;
export const activeServices = () => site.services.items.filter(s => s.enabled !== false);
export const bookableServices = () => activeServices().filter(s => s.bookable !== false);
export const bookingSettings = () => ({
  daysAhead:site.reservations.daysAhead,
  slotMinutes:site.reservations.slotMinutes,
  weeklySchedule:site.contact.weeklySchedule,
  extraOpenDates:site.reservations.extraOpenDates,
  closedDateRanges:site.reservations.closedDateRanges,
});
export const money = (amount:number) => `${Number(amount || 0).toLocaleString('sk-SK')} €`;

export type PublicSite = Omit<typeof site, 'reservations'> & {
  reservations: Omit<typeof site.reservations, 'closedDateRanges' | 'extraOpenDates'> & {
    extraOpenDates: Array<{date: string; startTime: string; endTime: string}>;
    closedDateRanges: Array<Omit<typeof site.reservations.closedDateRanges[number], 'note'>>;
  };
};
export function publicSite(): PublicSite {
  return {...site, reservations: {...site.reservations, closedDateRanges: site.reservations.closedDateRanges.map(range => {
    return {startDate: range.startDate, endDate: range.endDate, type: range.type, publicMessage: range.publicMessage, showNotice: range.showNotice};
  })}};
}
