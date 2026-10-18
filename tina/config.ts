import { defineConfig } from 'tinacms';
import IconPicker from './icon-picker';

const branch = process.env.NEXT_PUBLIC_TINA_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || process.env.HEAD || 'main';
const str = (name: string, label: string, multiline=false) => ({ type:'string' as const, name, label, ...(multiline ? {ui:{component:'textarea'}} : {}) });
const img = (name: string, label: string) => ({type:'image' as const,name,label});
const bool = (name: string,label: string) => ({type:'boolean' as const,name,label});
const num = (name: string,label: string) => ({type:'number' as const,name,label});
const namedList = (name: string,label: string,fields: any[], key='title') => ({type:'object' as const,name,label,list:true,ui:{itemProps:(item:any)=>({label: String(item?.[key]??'Nová položka')})},fields});
const iconField={type:'string' as const,name:'icon',label:'Ikona',ui:{component:IconPicker}};
const serviceFields=[str('id','Jedinečné ID služby (nemeníť po vytvorení)'),bool('enabled','Zobrazovať službu'),bool('bookable','Povoliť online rezerváciu'),iconField,str('name','Názov služby'),str('description','Podrobný popis na karte',true),str('shortDescription','Krátky popis v cenníku',true),num('price','Cena v €'),num('durationMinutes','Trvanie v minútach'),img('image','Voliteľná fotografia')];
const scheduleFields=[{type:'number' as const,name:'day',label:'Deň (0=Ne, 1=Po, 2=Ut, 3=St, 4=Št, 5=Pi, 6=So)'},bool('enabled','Ordinujeme'),str('startTime','Od (HH:MM)'),str('endTime','Do (HH:MM)')];
const emailFields=[str('subject','Predmet e-mailu'),str('title','Nadpis'),str('introduction','Text správy',true),str('button','Text tlačidla'),str('closing','Záverečný text',true)];

export default defineConfig({
 branch,
 clientId:process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
 token:process.env.TINA_TOKEN,
 build:{outputFolder:'admin',publicFolder:'public'},
 media:{tina:{mediaRoot:'uploads',publicFolder:'public'}},
 schema:{collections:[{
  name:'home',label:'Dientes – správa webu',path:'content',format:'json',match:{include:'home'},
  fields:[
   {type:'object',name:'intro',label:'1. Úvod',fields:[
    str('badge','Malý nadpis'),str('description','Hlavný úvodný popis',true),{type:'string' as const,name:'comfortIcon',label:'Ikona prémiového komfortu',ui:{component:IconPicker}},str('comfortTitle','Nadpis prémiového komfortu'),str('comfortDescription','Popis prémiového komfortu',true),str('locationBadge','Text na obrázku'),num('sliderIntervalSeconds','Interval výmeny fotografií (sekundy)'),namedList('images','Úvodné fotografie',[img('image','Fotografia'),str('alt','ALT popis')],'alt'),namedList('stats','Štyri informačné karty',[str('title','Nadpis'),str('subtitle','Text')])
   ]},
   {type:'object',name:'services',label:'2. Služby – centrálna správa',fields:[
    str('eyebrow','Malý nadpis'),str('title','Nadpis sekcie'),str('description','Úvodný text',true),namedList('items','Služby (cena spoločná pre celý web)',serviceFields,'name')
   ]},
   {type:'object',name:'process',label:'3. Priebeh ošetrenia',fields:[
    str('eyebrow','Malý nadpis'),str('title','Nadpis'),str('description','Úvodný popis',true),namedList('steps','Kroky ošetrenia',[str('title','Názov'),str('description','Popis',true),str('caption','Spodný text'),iconField])
   ]},
   {type:'object',name:'clinic',label:'4. O ambulancii',fields:[
    img('photo','Fotografia hygieničky'),str('photoAlt','ALT fotografie'),str('personName','Meno hygieničky'),str('personSubtitle','Text pod menom'),str('eyebrow','Malý nadpis'),str('title','Hlavný nadpis'),str('description','Popis ambulancie',true),
    {type:'object',name:'insurance',label:'Union – rámček pri hygieničke',fields:[bool('enabled','Zobrazovať rámček'),iconField,str('title','Nadpis'),str('badge','Odznak'),str('description','Text',true),str('disclaimer','Poznámka',true),str('footerNote','Spodný text')]}
   ]},
   {type:'object',name:'prices',label:'5. Cenník – iba texty',fields:[bool('enabled','Zobrazovať cenník'),str('eyebrow','Malý nadpis'),str('title','Hlavný nadpis'),str('description','Úvodný popis',true)]},
   {type:'object',name:'contact',label:'6. Kontakt a pätička',fields:[
    str('description','Popis pod nadpisom Kontakt',true),str('address','Adresa prevádzky'),str('phone','Telefón'),str('email','E-mail'),str('ico','IČO prevádzkovateľa'),num('latitude','Zemepisná šírka mapy'),num('longitude','Zemepisná dĺžka mapy'),str('mapLink','Odkaz na Google Maps'),
    namedList('weeklySchedule','Ordinačné hodiny (7 dní)',scheduleFields,'day'),str('footerTitle','Názov v pätičke'),str('footerDescription','Popis v pätičke',true),str('footerAccess','Text o dostupnosti'),str('footerHoursNote','Poznámka pod ordinačnými hodinami'),
    {type:'object',name:'footerInsurance',label:'Union – rámček v pätičke',fields:[bool('enabled','Zobrazovať rámček'),iconField,str('title','Nadpis'),str('description','Text',true)]}
   ]},
   {type:'object',name:'reservations',label:'7. Rezervácie a e-maily',fields:[
    bool('enabled','Povoliť online rezervácie'),num('daysAhead','Počet dní dopredu'),num('slotMinutes','Interval ponúkaných termínov v minútach'),num('minimumNoticeHours','Minimálny predstih v hodinách'),
    namedList('extraOpenDates','Mimoriadne otvorené dni',[{type:'datetime',name:'date',label:'Dátum',ui:{dateFormat:'DD.MM.YYYY'}},str('startTime','Od'),str('endTime','Do')],'date'),
    namedList('closedDateRanges','Dovolenky a zatvorené obdobia',[{type:'datetime',name:'startDate',label:'Od',ui:{dateFormat:'DD.MM.YYYY'}},{type:'datetime',name:'endDate',label:'Do',ui:{dateFormat:'DD.MM.YYYY'}},str('type','Typ výnimky (vacation/closed)'),str('note','Interná poznámka'),str('publicMessage','Správa pre pacientov'),bool('showNotice','Zobraziť oznámenie')],'startDate'),
    {type:'object',name:'legal',label:'GDPR a storno podmienky',fields:[str('privacyTitle','Nadpis GDPR'),str('privacyText','Obsah GDPR',true),str('cancellationTitle','Nadpis storno'),str('cancellationText','Storno podmienky',true)]},
    {type:'object',name:'emailStyle',label:'Spoločný vzhľad e-mailov',fields:[img('logoImage','Logo'),str('primaryColor','Farba tlačidla (#RRGGBB)'),str('header','Hlavička'),str('footer','Pätička'),str('signature','Podpis')]},
    {type:'object',name:'emailTemplates',label:'Texty e-mailov',fields:[{type:'object',name:'request',label:'Žiadosť o potvrdenie',fields:emailFields},{type:'object',name:'confirmed',label:'Potvrdená rezervácia',fields:emailFields},{type:'object',name:'cancelled',label:'Zrušená rezervácia',fields:emailFields}]}
   ]},
   {type:'object',name:'gallery',label:'8. Galéria fotografií',fields:[bool('enabled','Zobrazovať celú galériu'),str('label','Malý nadpis'),str('title','Hlavný nadpis'),str('description','Popis galérie',true),namedList('items','Fotografie – pridávať, odobrať, meniť poradie',[img('image','Fotografia'),str('alt','ALT popis fotografie'),str('caption','Popis fotografie'),bool('enabled','Zobrazovať túto fotografiu')],'alt')]},
   {type:'object',name:'seo',label:'9. SEO a Google',fields:[
     str('title','Titulok pre Google (ideálne do približne 60 znakov)'),
     str('description','Meta popis (ideálne okolo 150–160 znakov)',true),
     str('socialTitle','Nadpis pri zdieľaní'),
     str('socialDescription','Popis pri zdieľaní',true),
     img('socialImage','Obrázok pre sociálne siete (ideálne 1200 × 630)'),
     str('businessName','Názov prevádzky pre vyhľadávače'),
     str('businessDescription','Popis prevádzky pre Google',true)
   ]},
   {type:'object',name:'faq',label:'10. Často kladené otázky',fields:[
     bool('enabled','Zobraziť FAQ na stránke'),
     str('eyebrow','Malý nadpis nad otázkami'),
     str('title','Hlavný nadpis sekcie'),
     namedList('items','Otázky – klikni na názov pre úpravu',[str('question','Otázka (názov položky)'),str('answer','Odpoveď',true),bool('enabled','Zobrazovať otázku')],'question')
   ]}
  ]
 }]}
});
