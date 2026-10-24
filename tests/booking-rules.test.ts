import {afterEach, expect, it, vi} from 'vitest';
import {bookingCheck, hoursForDay} from '../lib/booking-rules';
import {bookableServices, publicSite, site} from '../site-data';
afterEach(() => vi.useRealTimers());
it('enforces real CMS service, schedule, calendar dates and notice period', () => {
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-24T08:00:00Z'));
 const service=bookableServices()[0];expect(service).toBeTruthy();
 let validDay='';let opening='';
 for(let day=1;day<=30;day++){
  const date=new Date(Date.now()+day*86400000).toISOString().slice(0,10);const hours=hoursForDay(date);
  if(hours && bookingCheck(service.name,date,hours.startTime).startAt){validDay=date;opening=hours.startTime;break;}
 }
 expect(validDay).not.toBe('');
 expect(bookingCheck(service.name,validDay,opening).duration).toBe(service.durationMinutes);
 for(const [name,date,time] of [['unknown',validDay,opening],[service.name,'2026-02-30',opening],[service.name,validDay,'25:00'],[service.name,validDay,'00:00'],[service.name,'2020-01-01',opening],[service.name,'2030-01-01',opening]]) expect(bookingCheck(name,date,time).error).toBeTruthy();
});
it('does not serialize closed-date notes to the public client', () => {
 expect(publicSite().reservations.closedDateRanges.every(range => !Object.hasOwn(range,'note'))).toBe(true);
 expect(publicSite().seo).toEqual(site.seo);
});
