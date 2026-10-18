"use client";

import { useEffect } from "react";
import {site, bookableServices, activeServices, bookingSettings, money} from "../site-data";

type Slot = {start?: string; end?: string};
const dayOfWeek = (value: string) => new Date(`${value}T12:00:00`).getDay();
const minutes = (value: string) => {const [h,m] = value.split(":").map(Number);return h*60+m;};
const clock = (m: number) => `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
const datePart = (value?: string) => (value || "").slice(0,10);
const fmtDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("sk-SK", {day:"numeric",month:"long"});
function getHours(date: string, settings: any) {
  const closed = (settings.closedDateRanges || []).some((x:any)=> date >= datePart(x.startDate) && date <= datePart(x.endDate || x.startDate));
  if(closed) return null;
  const extra = (settings.extraOpenDates || []).find((x:any)=>datePart(typeof x === "string"? x:x.date)===date);
  if(extra) return {start:extra.startTime || "08:00",end:extra.endTime || "16:00"};
  const day = (settings.weeklySchedule || []).find((x:any)=>Number(x.day)===dayOfWeek(date));
  return day?.enabled && day.startTime && day.endTime ? {start:day.startTime,end:day.endTime}:null;
}
function busy(date:string,time:string,duration:number,events:Slot[]) {
  const a = new Date(`${date}T${time}:00`).getTime(); const b=a+duration*60000;
  return events.some(e=>e.start && e.end && a < Date.parse(e.end) && b > Date.parse(e.start));
}
function getDuration(service: any, fallback=45) {return Number(String(service?.duration||"").match(/\d+/)?.[0] || fallback);}

export default function StitchInteractions() {
  useEffect(() => {
    const data:any = site;
    const settings:any = bookingSettings();
    const services:any[] = bookableServices().map(s=>({...s,duration:`${s.durationMinutes} min`,price:money(s.price)}));
    const root = document.querySelector('.stitch-page');
    if (!root) return;
    const $ = <T extends Element = HTMLElement>(selector:string)=> root.querySelector<T>(selector);
    const $$ = <T extends Element = HTMLElement>(selector:string)=> Array.from(root.querySelectorAll<T>(selector));
    // Mobile navigation: close after link selection, on Escape, and on outside click.
    const mobileToggle = $<HTMLButtonElement>('.dientes-mobile-toggle');
    const mobilePanel = $<HTMLElement>('#dientes-mobile-menu');
    if (mobileToggle && mobilePanel) {
      const closeMobile = () => {mobilePanel.hidden = true;mobileToggle.setAttribute('aria-expanded','false');mobileToggle.setAttribute('aria-label','Otvoriť navigačné menu');mobileToggle.querySelector('.material-symbols-outlined')!.textContent = 'menu';};
      mobileToggle.addEventListener('click', () => {
        const opening = !mobilePanel.hidden;
        if (opening) closeMobile();
        else {mobilePanel.hidden=false;mobileToggle.setAttribute('aria-expanded','true');mobileToggle.setAttribute('aria-label','Zavrieť navigačné menu');mobileToggle.querySelector('.material-symbols-outlined')!.textContent='close';}
      });
      mobilePanel.addEventListener('click',event=>{if((event.target as HTMLElement).closest('a'))closeMobile();});
      document.addEventListener('click',event=>{if(!mobilePanel.hidden&&!mobilePanel.contains(event.target as Node)&&!mobileToggle.contains(event.target as Node))closeMobile();});
      document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!mobilePanel.hidden){closeMobile();mobileToggle.focus();}});
      window.addEventListener('resize',()=>{if(window.innerWidth>=1024)closeMobile();});
    }
    // Image content is supplied by Tina; preserve original Stitch cards, hover styles and animation classes.
    const heroImage = root.querySelector<HTMLImageElement>('main > div > section:first-child img');
    const configuredHero = (data.intro?.images || []).filter((item:any) => typeof item?.image === 'string' && item.image.trim());
    const heroSlides = configuredHero.length ? configuredHero : (data.intro?.images?.[0]?.image ? [{image:data.intro.images?.[0]?.image,alt:data.intro.images?.[0]?.alt}] : []);
    let sliderTimer: ReturnType<typeof setInterval> | undefined;
    if (heroImage && heroSlides.length) {
      let index = 0;
      const showSlide = () => {
        const slide = heroSlides[index];
        heroImage.src = slide.image;
        heroImage.alt = slide.alt || data.intro?.imageAlt || 'Dientes – dentálna hygiena';
      };
      showSlide();
      if (heroSlides.length > 1) {
        const intervalMs = Math.max(1, Number(data.intro?.sliderIntervalSeconds) || 5) * 1000;
        sliderTimer = setInterval(() => {index = (index + 1) % heroSlides.length; showSlide();}, intervalMs);
      }
    }
    const hygienistImage = root.querySelector<HTMLImageElement>('#o-ambulancii img');
    if (hygienistImage && data.clinic?.photo) {
      hygienistImage.src = data.clinic.photo;
      hygienistImage.alt = data.clinic.photoAlt || 'Dentálna hygienička Dientes';
    }
    const gallery = root.querySelector<HTMLElement>('#galeria');
    if (gallery) {
      const g = data.gallery || {};
      const update = (selector: string, value?: string) => {const el=gallery.querySelector(selector); if (el && typeof value === 'string') el.textContent=value;};
      update('.font-label-eyebrow',g.label); update('h2',g.title); update('p',g.description);
    }
    const galleryGrid = gallery?.querySelector('div.grid');
    if(data.gallery?.enabled===false)gallery?.remove();
    if (galleryGrid && data.gallery?.enabled!==false && Array.isArray(data.gallery?.items)) {
      const photoItems = data.gallery.items.filter((item:any) => typeof item?.image === 'string' && item.image.trim() && item.enabled !== false);
      const templates = Array.from(galleryGrid.children).filter((item): item is HTMLElement => item instanceof HTMLElement);
      if (templates.length) {
        const fragment = document.createDocumentFragment();
        photoItems.forEach((item:any, i:number) => {
          const template = templates[i % templates.length].cloneNode(true) as HTMLElement;
          const img = template.querySelector('img');
          if (!img) return;
          img.src = item.image;
          img.alt = item.alt || item.caption || 'Fotografia ambulancie Dientes';
          // Retain Stitch's bento composition, zoom animation and borders.
          fragment.append(template);
        });
        galleryGrid.replaceChildren(fragment);
      }
    }
    // Seven editor groups share one canonical JSON source.
    const setText=(selector:string,value?:string)=>{const el=$(selector);if(el && value!==undefined)el.textContent=value;};
    const setIcon=(selector:string,value?:string)=>{const el=$(selector);if(el && value && /^[a-z_]+$/.test(value))el.textContent=value;};
    const intro=data.intro||{};
    setText('main > div > section:first-child .inline-flex > span',intro.badge);
    setText('main > div > section:first-child .font-body-lg',intro.description);
    setText('main > div > section:first-child .animate-pulse-subtle .font-label-eyebrow',intro.comfortTitle);
    setText('main > div > section:first-child .animate-pulse-subtle p',intro.comfortDescription);
    setIcon('main > div > section:first-child .animate-pulse-subtle .material-symbols-outlined',intro.comfortIcon);
    setText('main > div > section:first-child .hero-stable-card .absolute.bottom-3 span:last-child',intro.locationBadge);
    const stats=$$('main > div > section:first-child .hero-stable-card .grid.grid-cols-2 > div');
    (intro.stats||[]).forEach((item:any,i:number)=>{if(!stats[i])return;const spans=stats[i].querySelectorAll('span');if(spans[0])spans[0].textContent=item.title||'';if(spans[1])spans[1].textContent=item.subtitle||'';});
    const sv=data.services||{};
    setText('#sluzby .font-label-eyebrow',sv.eyebrow);
    setText('#sluzby h2',sv.title);
    setText('#sluzby .mb-space-lg > p',sv.description);
    const serviceGrid=$('#sluzby .grid.grid-cols-1');
    if(serviceGrid){
      const templates=Array.from(serviceGrid.children).filter((el):el is HTMLElement=>el instanceof HTMLElement);
      if(templates.length){
        const fragment=document.createDocumentFragment();
        activeServices().forEach((svc:any,i:number)=>{
          const card=templates[i%templates.length].cloneNode(true) as HTMLElement;
          const t=card.querySelector('h3'),d=card.querySelector('p'),icon=card.querySelector('.material-symbols-outlined');
          if(t)t.textContent=svc.name||'';if(d)d.textContent=svc.description||'';
          if(icon && /^[a-z_]+$/.test(svc.icon||''))icon.textContent=svc.icon;
          const price=card.querySelector('.pt-space-sm span:last-child');if(price)price.textContent=money(svc.price);
          const duration=card.querySelector('.pt-space-sm span:first-child');if(duration)duration.textContent=`${svc.durationMinutes||45} min`;
          fragment.append(card);
        });serviceGrid.replaceChildren(fragment);
      }
    }
    const process=data.process||{};
    setText('#priebeh .font-label-eyebrow',process.eyebrow);
    setText('#priebeh h2',process.title);
    setText('#priebeh .mb-space-lg > p',process.description);
    const stepsGrid=$('#priebeh .grid.grid-cols-1');
    if(stepsGrid){const templates=Array.from(stepsGrid.children).filter((el):el is HTMLElement=>el instanceof HTMLElement);
      if(templates.length){const fragment=document.createDocumentFragment();
        (process.steps||[]).forEach((step:any,i:number)=>{
          const card=templates[i%templates.length].cloneNode(true) as HTMLElement;
          const title=card.querySelector('h3'),desc=card.querySelector('p'),num=card.querySelector('.rounded-full');
          if(title)title.textContent=step.title||'';if(desc)desc.textContent=step.description||'';if(num)num.textContent=String(i+1);
          const note=card.querySelector('.font-label-md:last-child');if(note && step.caption)note.textContent=step.caption;
          const icon=card.querySelector('.material-symbols-outlined');if(icon && /^[a-z_]+$/.test(step.icon||''))icon.textContent=step.icon;
          fragment.append(card);
        });stepsGrid.replaceChildren(fragment);
      }
    }
    const clinic=data.clinic||{};
    setText('#o-ambulancii .font-label-eyebrow',clinic.eyebrow);
    setText('#o-ambulancii h2',clinic.title);
    if(clinic.description)setText('#o-ambulancii p.font-body-lg',clinic.description);
    setText('#o-ambulancii .absolute.inset-0 .font-headline-sm',clinic.personName);
    setText('#o-ambulancii .absolute.inset-0 p',clinic.personSubtitle);
    const insuranceBox=$<HTMLElement>('#o-ambulancii h3')?.closest<HTMLElement>('.card-hover-lift');
    if(insuranceBox){
      const box=insuranceBox;
      if(clinic.insurance?.enabled===false)box.remove();
      else {const ins=clinic.insurance||{};const title=box.querySelector('h3');if(title)title.textContent=ins.title||'';
        const badge=box.querySelector('.rounded-full');if(badge)badge.textContent=ins.badge||'';
        const paragraphs=box.querySelectorAll('p');if(paragraphs[0])paragraphs[0].textContent=ins.description||'';
        const spans=box.querySelectorAll('.border-t span');if(spans[0])spans[0].textContent=ins.disclaimer||'';if(spans[1])spans[1].textContent=ins.footerNote||'';
        setIcon('#o-ambulancii .animate-pulse.material-symbols-outlined',ins.icon);
      }
    }
    if(data.prices?.enabled===false)$('#cennik')?.remove();
    setText('#cennik .font-label-eyebrow',data.prices?.eyebrow);
    setText('#cennik h2',data.prices?.title);
    setText('#cennik .mt-space-xs',data.prices?.description);
    const priceList=$('#cennik .divide-y');
    if(priceList){const templates=Array.from(priceList.children).filter((el):el is HTMLElement=>el instanceof HTMLElement);
      if(templates.length){const fragment=document.createDocumentFragment();
        activeServices().forEach((svc:any,i:number)=>{const row=templates[i%templates.length].cloneNode(true) as HTMLElement;
          const title=row.querySelector('.flex-col span:first-child'),desc=row.querySelector('.flex-col span:nth-child(2)'),price=row.querySelector(':scope > span:last-child');
          if(title)title.textContent=svc.name||'';if(desc)desc.textContent=svc.shortDescription||svc.description||'';if(price)price.textContent=money(svc.price);
          fragment.append(row);
        });priceList.replaceChildren(fragment);
      }
    }
    const contact=data.contact||{};
    setText('#kontakt .font-body-md.text-slate-muted',contact.description);
    const contactCard=$('#kontakt .space-y-space-sm');
    if(contactCard){const rows=contactCard.querySelectorAll('.flex.items-start');
      const address=rows[0]?.querySelector('p');if(address)address.textContent=contact.address||'';
      const phone=rows[1]?.querySelector('a');if(phone){phone.setAttribute('href','tel:'+(contact.phone||'').replace(/[^+0-9]/g,''));phone.childNodes.forEach(n=>{if(n.nodeType===Node.TEXT_NODE)n.textContent=contact.phone+' ';});}
      const email=rows[2]?.querySelector('a');if(email){email.setAttribute('href','mailto:'+contact.email);email.textContent=contact.email||'';}
    }
    // Footer pulls the same contact values and opening hours used by the booking engine.
    const foot=root.querySelector('footer');
    if(foot){const cols=foot.querySelectorAll(':scope > div:first-child > div');
      if(cols[0]){const title=cols[0].querySelector('.font-headline-sm');if(title)title.textContent=contact.footerTitle||'';
        const desc=cols[0].querySelector('p');if(desc)desc.textContent=contact.footerDescription||'';
        const ins=cols[0].querySelector('.bg-surface-mint-subtle');if(ins){if(contact.footerInsurance?.enabled===false)ins.remove();else{
          const heading=ins.querySelector('.font-label-eyebrow');if(heading)heading.textContent=contact.footerInsurance?.title||'';
          const d=ins.querySelector('p.font-body-sm');if(d)d.textContent=contact.footerInsurance?.description||'';
        }}
      }
      if(cols[1]){const lines=cols[1].querySelectorAll('.flex.items-center');
        const addr=lines[0]?.querySelector('span:last-child');if(addr)addr.textContent=contact.address||'';
        const ph=lines[1]?.querySelector('a');if(ph){ph.textContent=contact.phone||'';ph.setAttribute('href','tel:'+(contact.phone||'').replace(/[^+0-9]/g,''));}
        const mail=lines[2]?.querySelector('a');if(mail){mail.textContent=contact.email||'';mail.setAttribute('href','mailto:'+contact.email);}
        const walk=lines[3]?.querySelector('span:last-child');if(walk)walk.textContent=contact.footerAccess||'';
      }
      if(cols[2]){const container=cols[2].querySelector('.flex.flex-col.gap-space-xs');if(container){
        container.replaceChildren();
        ([{day:1,name:'Pondelok'},{day:2,name:'Utorok'},{day:3,name:'Streda'},{day:4,name:'Štvrtok'},{day:5,name:'Piatok'},{day:6,name:'Sobota'},{day:0,name:'Nedeľa'}]).forEach(({day:dayNumber,name})=>{
          const line=document.createElement('div');line.className='flex justify-between py-1';const day=contact.weeklySchedule?.find((x:any)=>Number(x.day)===dayNumber);
          const left=document.createElement('span');left.className='text-on-surface font-semibold';left.textContent=name;
          const right=document.createElement('span');right.textContent=day?.enabled?`${day.startTime} – ${day.endTime}`:'Zatvorené';line.append(left,right);container.append(line);
        });const note=document.createElement('p');note.className='font-label-md text-label-md text-slate-muted mt-space-xs';note.textContent=contact.footerHoursNote||'';container.append(note);
      }}
    }
    const opening=$('#kontakt .space-y-space-sm .flex.items-start:last-child p');
   if (opening) {
  const dayNames: Record<number, string> = {
    0: 'Ne',
    1: 'Po',
    2: 'Ut',
    3: 'St',
    4: 'Št',
    5: 'Pi',
    6: 'So',
  };

  opening.textContent = (contact.weeklySchedule || [])
    .filter((d: any) => d.enabled)
    .map((d: any) =>
      `${dayNames[Number(d.day)] || 'Deň'} ${d.startTime}–${d.endTime}`
    )
    .join(' · ') || 'Na objednávku';
}
    const mapLabel=$('#kontakt .dientes-real-map .text-slate-muted');if(mapLabel)mapLabel.textContent=contact.address||'';
    // Company identification is managed in TinaCMS, and gallery link follows gallery visibility.
    const footerIco = foot?.querySelector<HTMLElement>('#dientes-footer-ico');
    if (footerIco) footerIco.textContent = contact.ico || '';
    const footerGalleryLink = foot?.querySelector<HTMLAnchorElement>('a[data-path="galeria"]');
    if (footerGalleryLink) footerGalleryLink.hidden = data.gallery?.enabled === false;
    const footerAddress=foot?.querySelector(':scope > div:last-child a[href="#kontakt"]');if(footerAddress)footerAddress.textContent=contact.address||'';
    const headerPhone=root.querySelector('header a[href^="tel:"]');
    if(headerPhone){headerPhone.setAttribute('href','tel:'+(contact.phone||'').replace(/[^+0-9]/g,''));const label=headerPhone.querySelector('span:last-child');if(label)label.textContent=contact.phone||'';}
    const form = $<HTMLFormElement>('#reservation-form');
    const date = $<HTMLInputElement>('#booking-date');
    const times = $('#time-slots');
    const serviceChoices=$('#service-options');
    if(serviceChoices){const templates=Array.from(serviceChoices.children).filter((el):el is HTMLElement=>el instanceof HTMLElement);
      if(templates.length){const fragment=document.createDocumentFragment();services.forEach((svc:any,i:number)=>{
        const card=templates[i%templates.length].cloneNode(true) as HTMLElement;
        const radio=card.querySelector<HTMLInputElement>('input[type="radio"]');if(radio){radio.checked=i===0;radio.value=svc.name;}
        fragment.append(card);
      });serviceChoices.replaceChildren(fragment);}
    }
    const choices = $$('#service-options .service-card');
    const summaryService = $('#summary-service');const summaryDuration=$('#summary-duration');
    const summaryPrice=$('#summary-price');const summaryTime=$('#summary-time');
    if(!form || !date || !times || !summaryService || !summaryDuration || !summaryPrice || !summaryTime) return;
    form.removeAttribute('onsubmit'); // The Stitch alert is only a mock; real API is below.
    const inputs = form.querySelectorAll<HTMLInputElement>('input:not([type="checkbox"])');
    const nameInput = inputs[0], phoneInput = inputs[1], emailInput = inputs[2], noteInput = inputs[3];
    const checkbox=form.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if(!nameInput||!phoneInput||!emailInput||!checkbox) return;
    // Typing and pasting accept digits and an optional leading + (international dialling prefix).
    phoneInput.setAttribute('inputmode','tel');
    phoneInput.setAttribute('autocomplete','tel');
    phoneInput.setAttribute('pattern',String.raw`\+?[0-9]{9,15}`);
    phoneInput.setAttribute('title','Zadajte 9 až 15 číslic; na začiatku môžete použiť +.');
    const sanitizePhone=(value:string)=>{
      const hasPlus=value.trimStart().startsWith('+');
      const digits=value.replace(/\D/g,'').slice(0,15);
      return (hasPlus?'+':'')+digits;
    };
    phoneInput.addEventListener('input',()=>{
      const sanitized=sanitizePhone(phoneInput.value);
      if(phoneInput.value!==sanitized)phoneInput.value=sanitized;
    });
    phoneInput.addEventListener('paste',(event:ClipboardEvent)=>{
      event.preventDefault();
      const pasted=event.clipboardData?.getData('text')||'';
      const start=phoneInput.selectionStart ?? phoneInput.value.length;
      const end=phoneInput.selectionEnd ?? start;
      const merged=phoneInput.value.slice(0,start)+pasted+phoneInput.value.slice(end);
      phoneInput.value=sanitizePhone(merged);
      phoneInput.dispatchEvent(new Event('input',{bubbles:true}));
    });
    const submit=form.querySelector<HTMLButtonElement>('button[type="submit"]');
    let selectedService=0, selectedTime="", busySlots:Slot[]=[], loading=true, availabilityError=false, sending=false;
    const feedback=document.createElement('div');feedback.setAttribute('role','status');feedback.className='mt-4 text-sm font-semibold';form.append(feedback);

    // Preserve Stitch's card markup, while replacing its sample data with the live CMS data.
    choices.forEach((card,index)=> {
      const svc=services[index];if(!svc)return;
      const radio=card.querySelector<HTMLInputElement>('input[type="radio"]');
      if(radio){radio.value=svc.name;radio.dataset.duration=svc.duration||'';radio.dataset.price=svc.price||'';}
      const title=card.querySelector('.font-headline-sm');if(title)title.textContent=svc.name;
      const desc=card.querySelector('.font-body-sm');if(desc)desc.textContent=svc.description||'';
      const footer=card.querySelectorAll('.mt-space-sm span');
      if(footer[0]) footer[0].textContent=svc.duration||'Individuálne';
      if(footer[1]) footer[1].textContent=svc.price||'';
      card.addEventListener('click',()=>{selectedService=index;choices.forEach((c,i)=>{
        c.classList.toggle('border-primary',index===i);c.classList.toggle('bg-surface-mint-subtle',index===i);
        c.classList.toggle('border-transparent',index!==i);c.classList.toggle('bg-surface-container-lowest',index!==i);
      });render();});
    });
    const updateSummary=()=>{
      const svc=services[selectedService]||services[0];
      summaryService.textContent=svc?.name||'Dentálna hygiena';
      summaryDuration.textContent=svc?.duration||'Individuálne';
      summaryPrice.textContent=svc?.price||'';
      summaryTime.textContent=date.value?`${fmtDate(date.value)} o ${selectedTime||'—'}`:'Vyberte dátum';
    };
    const findNearestAvailable = () => {
      if (loading || availabilityError) return '';
      const svc=services[selectedService]||services[0];
      const duration=getDuration(svc,Number(settings.slotMinutes)||45);
      const stride=Number(settings.slotMinutes)||45;
      const current=new Date();
      const today=current.toLocaleDateString('sv-SE');
      const from=date.value>today?date.value:today;
      const base=new Date(`${from}T12:00:00`);
      for(let offset=0;offset<=daysAhead;offset++){
        const d=new Date(base);d.setDate(base.getDate()+offset);
        const candidate=d.toLocaleDateString('sv-SE');
        if(candidate>date.max)break;
        const hours=getHours(candidate,settings);
        if(!hours)continue;
        for(let t=minutes(hours.start);t+stride<=minutes(hours.end);t+=stride){
          if(t+duration>minutes(hours.end))continue;
          if(candidate===today && t<=current.getHours()*60+current.getMinutes())continue;
          if(!busy(candidate,clock(t),duration,busySlots))return candidate;
        }
      }
      return '';
    };
    const showUnavailable = (message: string) => {
      times.className='mt-2 rounded-2xl border border-red-400 bg-red-50 p-4 text-sm text-red-700';
      const paragraph=document.createElement('p');paragraph.className='font-semibold';paragraph.textContent=message;times.append(paragraph);
      if(loading || availabilityError)return;
      const nearest=findNearestAvailable();
      if(!nearest || nearest===date.value)return;
      const button=document.createElement('button');
      button.type='button';button.className='mt-3 btn-tactile shimmer-btn inline-flex items-center justify-center px-space-xl py-space-sm rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg hover:bg-primary shadow-md hover:shadow-lg transition-all animate-glow-breath';button.style.background='linear-gradient(135deg, rgb(0, 180, 182) 0%, rgb(13, 148, 136) 100%)';button.style.boxShadow='rgba(0, 180, 182, 0.48) 0px 4px 22px';
      button.textContent='Prejsť na najbližší voľný termín';
      button.addEventListener('click',()=>{date.value=nearest;selectedTime='';render();});
      times.append(button);
    };
    const render=()=>{
      const svc=services[selectedService]||services[0];
      const hours=getHours(date.value,settings);
      times.replaceChildren();
      times.className='grid grid-cols-3 sm:grid-cols-4 gap-2';
      if(!hours){selectedTime='';const closed=(settings.closedDateRanges||[]).find((x:any)=>date.value>=datePart(x.startDate)&&date.value<=datePart(x.endDate||x.startDate));const message=closed?.showNotice===false?'V tento deň neprijímame rezervácie.':(closed?.publicMessage||'V tento deň neprijímame rezervácie. Vyberte, prosím, iný termín.');showUnavailable(message);updateSummary();return;}
      const duration=getDuration(svc,Number(settings.slotMinutes)||45);
      const stride=Number(settings.slotMinutes)||45;
      const start=minutes(hours.start),end=minutes(hours.end);
      // Preserve the original booking grid: show *all* configured time slots,
      // including occupied slots, instead of hiding them.
      const slots:string[]=[];
      for(let t=start;t+stride<=end;t+=stride) slots.push(clock(t));
      const today=new Date().toLocaleDateString('sv-SE');
      const available=slots.filter(at=>{
        const t=minutes(at);
        return t+duration<=end && !busy(date.value,at,duration,busySlots)
          && (date.value!==today || t>new Date().getHours()*60+new Date().getMinutes()+Number(data.reservations.minimumNoticeHours||0)*60);
      });
      if(loading || availabilityError || !available.includes(selectedTime)) selectedTime='';
      if(!loading && !availabilityError && !selectedTime) selectedTime=available[0]||'';
      slots.forEach(at=>{
        const button=document.createElement('button');button.type='button';button.textContent=at;
        const unavailable=loading || availabilityError || !available.includes(at);
        button.disabled=unavailable;
        button.setAttribute('aria-label',`${at} – ${unavailable ? 'nedostupný' : 'voľný'} termín`);
        button.className='time-slot py-2 px-3 rounded-lg text-center font-label-md text-label-md transition-colors duration-200 '+(
          unavailable ? 'cursor-not-allowed bg-surface-container text-outline line-through opacity-70' :
          at===selectedTime?'bg-primary text-on-primary shadow-sm':'bg-surface-container text-on-surface hover:bg-surface-container-high');
        if(!unavailable) button.addEventListener('click',()=>{selectedTime=at;render();});
        times.append(button);
      });
      if(loading) times.textContent='Načítavam dostupné termíny z Google Kalendára...';
      else if(availabilityError) times.textContent='Dostupnosť termínov sa nepodarilo načítať. Obnovte stránku.';
      else if(!available.length) {
        // Keep occupied times visible; show the alert below the original slot grid.
        const alert=document.createElement('div');alert.className='col-span-full';
        const originalTimes=times;
        // The same warning used for closed days, but without replacing crossed-out slots.
        const nearest=findNearestAvailable();
        alert.innerHTML='<p class="font-semibold">Na tento deň už nie sú voľné termíny.</p>';
        alert.classList.add('mt-3','rounded-2xl','border','border-red-400','bg-red-50','p-4','text-sm','text-red-700');
        if(nearest && nearest!==date.value){
          const button=document.createElement('button');button.type='button';button.className='mt-3 btn-tactile shimmer-btn inline-flex items-center justify-center px-space-xl py-space-sm rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg hover:bg-primary shadow-md hover:shadow-lg transition-all animate-glow-breath';button.style.background='linear-gradient(135deg, rgb(0, 180, 182) 0%, rgb(13, 148, 136) 100%)';button.style.boxShadow='rgba(0, 180, 182, 0.48) 0px 4px 22px';
          button.textContent='Prejsť na najbližší voľný termín';
          button.addEventListener('click',()=>{date.value=nearest;selectedTime='';render();});alert.append(button);
        }
        originalTimes.append(alert);
      }
      updateSummary();
    };
    const initial=new Date();const daysAhead=Number(settings.daysAhead)||90;
    date.min=initial.toLocaleDateString('sv-SE');const upper=new Date(initial);upper.setDate(upper.getDate()+daysAhead);date.max=upper.toLocaleDateString('sv-SE');
    let first=date.min;
    for(let i=0;i<=daysAhead;i++){const d=new Date(initial);d.setDate(d.getDate()+i);const v=d.toLocaleDateString('sv-SE');if(getHours(v,settings)){first=v;break;}}
    date.value=first;
    const onDate=()=>render();date.addEventListener('change',onDate);
    const refresh=async()=>{loading=true;availabilityError=false;render();try{const response=await fetch(`/api/availability?daysAhead=${daysAhead}`,{cache:'no-store'});if(!response.ok)throw Error('Kalendár nie je dostupný');const payload=await response.json();if(!Array.isArray(payload.busy))throw Error('Neplatná odpoveď kalendára');busySlots=payload.busy;}catch{availabilityError=true;busySlots=[];feedback.textContent='Nepodarilo sa načítať dostupnosť. Skúste stránku obnoviť.';}finally{loading=false;render();}};
    void refresh();
    const onSubmit=async(ev:Event)=>{
      ev.preventDefault();if(sending)return;
      feedback.textContent='';feedback.className='mt-4 text-sm font-semibold text-red-700';
      if(!nameInput.value.trim()||!phoneInput.value.trim()||!emailInput.value.trim()||!checkbox.checked){feedback.textContent='Vyplňte všetky povinné údaje a potvrďte oboznámenie s podmienkami.';return;}
      if(!/^\+?[0-9]{9,15}$/.test(phoneInput.value.replace(/\s+/g,''))){feedback.textContent='Zadajte platné telefónne číslo.';return;}
      if(!emailInput.validity.valid){feedback.textContent='Zadajte platnú e-mailovú adresu.';return;}
      if(data.reservations?.enabled===false){feedback.textContent='Online rezervácie sú dočasne pozastavené.';return;}
      if(loading || availabilityError || !selectedTime){feedback.textContent='Vyberte dostupný čas po načítaní kalendára.';return;}
      const svc=services[selectedService]||services[0];
      sending=true;if(submit)submit.disabled=true;
      try{
        const resp=await fetch('/api/reservation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({service:svc?.name||'Dentálna hygiena',name:nameInput.value.trim(),phone:phoneInput.value.replace(/\s+/g,''),email:emailInput.value.trim(),note:noteInput?.value.trim()||'',date:date.value,time:selectedTime,durationMinutes:getDuration(svc,Number(settings.slotMinutes)||45)})});
        const res=await resp.json();if(!resp.ok)throw Error(res.error||'Rezerváciu sa nepodarilo vytvoriť.');
        feedback.className='mt-4 rounded-xl border-2 border-red-400 bg-red-50 p-4 text-base font-bold text-red-800';feedback.textContent='Ešte jeden krok: skontrolujte e-mail a kliknite na odkaz na potvrdenie rezervácie do 10 minút.';
        checkbox.checked=false;void refresh();
      }catch(e){feedback.textContent=e instanceof Error?e.message:'Rezervácia sa nepodarila.';}
      finally{sending=false;if(submit)submit.disabled=false;}
    };
    form.addEventListener('submit',onSubmit);

    // Legal texts come from Tina CMS, displayed without leaving the booking.
    const legal:any=data.reservations?.legal||{};
    const original=checkbox.parentElement?.querySelector('span');
    if(original){original.innerHTML='Oboznámil/a som sa s <button type="button" data-legal="privacy" class="text-primary underline font-semibold">informáciami o spracovaní osobných údajov</button> a beriem na vedomie <button type="button" data-legal="cancellation" class="text-primary underline font-semibold">storno podmienky</button>.';}
    const overlay=document.createElement('div');overlay.className='fixed inset-0 z-[200] hidden items-center justify-center bg-[#071f1f]/50 p-4';
    overlay.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="legal-heading" class="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div class="flex items-center justify-between gap-4"><h2 id="legal-heading" class="font-headline-md text-headline-md"></h2><button type="button" data-close-legal aria-label="Zavrieť" class="text-3xl">×</button></div><div id="legal-body" class="mt-5 whitespace-pre-line text-body-md leading-relaxed"></div><button type="button" data-close-legal class="mt-7 rounded-full bg-primary px-6 py-3 text-white">Zavrieť</button></section>';
    document.body.append(overlay);
    const close=()=>{overlay.classList.add('hidden');overlay.classList.remove('flex');};
    const open=(which:'privacy'|'cancellation')=>{
      (overlay.querySelector('#legal-heading') as HTMLElement).textContent=which==='privacy'?(legal.privacyTitle||'Spracovanie osobných údajov'):(legal.cancellationTitle||'Storno podmienky');
      (overlay.querySelector('#legal-body') as HTMLElement).textContent=which==='privacy'?(legal.privacyText||'Informácie zatiaľ nie sú zverejnené.'):(legal.cancellationText||'Podmienky zatiaľ nie sú zverejnené.');
      overlay.classList.remove('hidden');overlay.classList.add('flex');(overlay.querySelector('[data-close-legal]') as HTMLElement).focus();
    };
    const onLegal=(e:Event)=>{const element=(e.target as HTMLElement).closest('[data-legal]');if(element){e.preventDefault();open((element.getAttribute('data-legal')==='privacy'?'privacy':'cancellation'));}};
    const footer=root.querySelector('footer > div:last-child');
    const legalFooter=document.createElement('div');legalFooter.className='max-w-[1200px] mx-auto px-margin pb-4 flex flex-wrap gap-5 text-body-sm text-primary';
    legalFooter.innerHTML='<button type="button" data-legal="privacy" class="underline">Ochrana osobných údajov</button><button type="button" data-legal="cancellation" class="underline">Storno podmienky</button>';
    footer?.parentElement?.append(legalFooter);
    root.addEventListener('click',onLegal);
    const onOverlay=(e:MouseEvent)=>{if(e.target===overlay||(e.target as HTMLElement).closest('[data-close-legal]'))close();};overlay.addEventListener('click',onOverlay);
    const onEscape=(e:KeyboardEvent)=>{if(e.key==='Escape')close();};window.addEventListener('keydown',onEscape);
    return()=>{if(sliderTimer)clearInterval(sliderTimer);date.removeEventListener('change',onDate);form.removeEventListener('submit',onSubmit);root.removeEventListener('click',onLegal);window.removeEventListener('keydown',onEscape);overlay.remove();legalFooter.remove();};
  },[]);
  return null;
}
