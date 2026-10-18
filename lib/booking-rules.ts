import {site,bookableServices} from '../site-data';
const digits=(time:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(time);
const toMin=(time:string)=>{const [h,m]=time.split(':').map(Number);return h*60+m;};
const dateOnly=(value?:string)=>String(value||'').slice(0,10);
export function hoursForDay(day:string){
 const {contact,reservations}=site;
 if((reservations.closedDateRanges||[]).some(r=>day>=dateOnly(r.startDate)&&day<=dateOnly(r.endDate||r.startDate)))return null;
 const extraOpenDates: ReadonlyArray<{date:string;startTime:string;endTime:string}> = reservations.extraOpenDates || [];
 const extra=extraOpenDates.find(r=>dateOnly(r.date)===day);
 if(extra)return {startTime:extra.startTime,endTime:extra.endTime};
 const weekday=new Date(`${day}T12:00:00Z`).getUTCDay();
 const regular=contact.weeklySchedule.find(r=>Number(r.day)===weekday);
 return regular?.enabled?regular:null;
}
export function bookingCheck(service:string,date:string,time:string){
 const cfg=site.reservations;
 if(!cfg.enabled)return {error:'Online rezervácie sú dočasne pozastavené.'};
 const selected=bookableServices().find(s=>s.name===service);
 if(!selected)return {error:'Vybraná služba nie je dostupná.'};
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!digits(time))return {error:'Neplatný dátum alebo čas.'};
 const day=new Date(`${date}T12:00:00Z`);
 if(Number.isNaN(day.getTime())||day.toISOString().slice(0,10)!==date)return {error:'Neplatný dátum.'};
 const hours=hoursForDay(date);
 if(!hours||!digits(hours.startTime)||!digits(hours.endTime))return {error:'V daný deň neordinujeme.'};
 const stride=Number(cfg.slotMinutes)||45,duration=Number(selected.durationMinutes)||45;
 const start=toMin(hours.startTime),end=toMin(hours.endTime),timeMinutes=toMin(time);
 if(timeMinutes<start || timeMinutes+duration>end ||(timeMinutes-start)%stride!==0)return {error:'Termín je mimo ordinačných hodín.'};
 // Noon gives the correct civil-time offset on ordinary appointment hours even during DST-change weekends.
 const tzName=new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Bratislava',timeZoneName:'shortOffset'}).formatToParts(day).find(p=>p.type==='timeZoneName')?.value||'GMT+1';
 const hourOffset=Number(tzName.match(/GMT([+-]\d+)/)?.[1]||1);
 const offset=`${hourOffset<0?'-':'+'}${String(Math.abs(hourOffset)).padStart(2,'0')}:00`;
 const startAt=new Date(`${date}T${time}:00${offset}`);
 const earliest=Date.now()+Math.max(0,Number(cfg.minimumNoticeHours)||0)*3600000;
 if(startAt.getTime()<earliest)return {error:'Termín je príliš blízko alebo už uplynul.'};
 if(startAt.getTime()>Date.now()+(Math.max(1,Number(cfg.daysAhead)||90)+1)*86400000)return {error:'Termín je príliš ďaleko.'};
 return {selected,startAt,duration};
}
