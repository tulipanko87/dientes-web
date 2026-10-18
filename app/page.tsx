import fs from 'node:fs';
import path from 'node:path';
import StitchInteractions from './stitch-interactions';
import { site } from '../site-data';

export const dynamic = 'force-dynamic';

// The supplied Stitch markup is the visual source of truth, not a reimagined JSX layout.
// Rendered server-side for SEO and fidelity; behavior is attached by StitchInteractions.
export default function Page() {
  const template = fs.readFileSync(path.join(process.cwd(), 'stitch-body.html'), 'utf8');
  // CMS image URLs are installed before first paint, never show Stitch AI stock images.
  const cms: any = site;
  const heroImages = (cms.intro?.images || []).filter((i: any) => typeof i?.image === 'string' && i.image.trim());
  const heroSrc = heroImages[0]?.image || cms.intro?.images?.[0]?.image || '';
  const photos = (cms.gallery?.items || []).filter((i: any) => typeof i?.image === 'string' && i.image.trim());
  const sources = [heroSrc, cms.clinic?.photo || '', ...Array.from({length: 6}, (_, i) => photos[i]?.image || '')];
  let imageIndex = 0;
  const dateParts = new Intl.DateTimeFormat('en-GB', {timeZone: 'Europe/Bratislava', year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(new Date());
  const dateValue = (kind: string) => dateParts.find(part => part.type === kind)?.value ?? '';
  const currentDate = `${dateValue('year')}-${dateValue('month')}-${dateValue('day')}`;
  let html = template.replace('__DIENTES_TODAY__', currentDate).replace(/src="\/images\/photo-placeholder\.svg"/g, () => {
    const source = sources[imageIndex++] || '/images/photo-placeholder.svg';
    return `src="${String(source).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`;
  });
  const geo = site.contact;
  const mapLocation = `${Number(geo.latitude)},${Number(geo.longitude)}`;
  html = html.replace('https://www.google.com/maps?q=48.717390%2C21.258040&amp;z=18&amp;output=embed',
     `https://www.google.com/maps?q=${encodeURIComponent(mapLocation)}&amp;z=18&amp;output=embed`);
  if (geo.mapLink?.startsWith('https://maps.google.') || geo.mapLink?.startsWith('https://www.google.com/maps') || geo.mapLink?.startsWith('https://maps.app.goo.gl/')) {
    html = html.replace('https://maps.app.goo.gl/od571mFhhauJigdz7',geo.mapLink.replace(/&/g,'&amp;').replace(/"/g,'&quot;'));
  }
  // Business data deliberately reused from the same source as the visible site and booking API.
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const openingHoursSpecification = (site.contact.weeklySchedule || [])
    .filter((day: any) => day.enabled && /^([01]\d|2[0-3]):[0-5]\d$/.test(day.startTime || '') && /^([01]\d|2[0-3]):[0-5]\d$/.test(day.endTime || ''))
    .map((day: any) => ({'@type':'OpeningHoursSpecification',dayOfWeek:days[day.day],opens:day.startTime,closes:day.endTime}));
  const structuredData: any={
    '@context':'https://schema.org', '@type':'LocalBusiness',
    '@id':'https://dientes.sk/#business',
    name: site.seo?.businessName || 'Dientes – dentálna hygiena',
    description: site.seo?.businessDescription || site.seo?.description,
    url:'https://dientes.sk/', telephone: geo.phone, email:geo.email,
    address:{'@type':'PostalAddress',streetAddress:geo.address,addressLocality:'Košice',addressCountry:'SK'},
    geo:{'@type':'GeoCoordinates',latitude:geo.latitude,longitude:geo.longitude},
    ...(openingHoursSpecification.length ? {openingHoursSpecification} : {}),
    ...(site.seo?.socialImage ? {image:new URL(site.seo.socialImage, 'https://dientes.sk').toString()} : {}),
    hasOfferCatalog:{'@type':'OfferCatalog',name:'Služby dentálnej hygieny',itemListElement:(site.services?.items || [])
      .filter((service: any)=>service.enabled !== false && service.name)
      .map((service: any)=>({'@type':'OfferCatalog',name:service.name,
        itemListElement:[{'@type':'Offer',price:service.price,priceCurrency:'EUR',itemOffered:{'@type':'Service',name:service.name,description:service.description}}]}))}
  };
  const faq = site.faq;
  const faqItems = faq?.enabled ? (faq.items || []).filter((item: any)=>item.enabled !== false && item.question?.trim() && item.answer?.trim()) : [];
  if (faqItems.length) {
    // FAQ structured data is emitted only for questions that are visibly present on the page.
    const safe = (value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    // Match the price-list visual language: narrow panel, soft mint background,
    // interactive rows, and gently animated details without extra dependencies.
    const faqHtml = `<section id="faq" class="w-full py-space-xl bg-surface-container-lowest" aria-labelledby="faq-heading"><div class="max-w-[1000px] mx-auto px-margin"><div class="text-center max-w-xl mx-auto mb-space-lg"><span class="font-label-eyebrow text-label-eyebrow text-primary uppercase tracking-wider">${safe(faq.eyebrow || 'NAJČASTEJŠIE OTÁZKY')}</span><h2 id="faq-heading" class="font-headline-lg text-headline-lg text-on-surface mt-1">${safe(faq.title || 'Často kladené otázky')}</h2></div><div class="dientes-faq-panel bg-surface-mint-subtle rounded-2xl shadow-sm border border-border-soft-teal/60 p-space-sm sm:p-space-md">${faqItems.map((item:any)=>`<details class="dientes-faq-item group rounded-xl"><summary class="dientes-faq-question flex items-center justify-between gap-3 px-space-sm py-4 cursor-pointer"><span class="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">${safe(item.question)}</span><span class="dientes-faq-chevron material-symbols-outlined text-primary shrink-0" aria-hidden="true">expand_more</span></summary><div class="dientes-faq-answer px-space-sm pb-4"><p class="font-body-md text-body-md text-on-surface-variant">${safe(item.answer)}</p></div></details>`).join('')}</div></div></section>`;
    // Display FAQ immediately after the price list, before Contact.
    html = html.replace('<!-- KONTAKT & MAPA -->',faqHtml+'<!-- KONTAKT & MAPA -->');
    // Footer: accessible short link to FAQ, present only if FAQ is published.
    const faqFooterLink = '<a class="hover:text-primary transition-all duration-200 hover:translate-x-1" data-path="faq" href="#faq">Často kladené otázky (FAQ)</a>';
    html = html.replace(/(<a[^>]*data-path="galeria"[^>]*>.*?<\/a>)/, '$1' + faqFooterLink);
    // Header: compact label so we don't crowd the existing navigation. Keep
    // original links, CTA and phone unchanged. Hide FAQ at narrower breakpoints.
    const faqHeaderLink = '<a class="dientes-faq-nav-link font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-all duration-200 hover:-translate-y-0.5 hidden xl:inline-flex" data-path="faq" href="#faq" aria-label="Často kladené otázky">FAQ</a>';
    html = html.replace('</a></nav><div class="flex items-center gap-space-md">', '</a>'+faqHeaderLink+'</nav><div class="flex items-center gap-space-md">');

  }
  // On smaller screens the original Stitch desktop nav is hidden. Restore access
  // to every section through a dedicated mobile navigation, without changing desktop.
  const mobileButton = `<button type="button" class="dientes-mobile-toggle" aria-controls="dientes-mobile-menu" aria-expanded="false" aria-label="Otvoriť navigačné menu"><span class="material-symbols-outlined" aria-hidden="true">menu</span></button>`;
  const mobileNavItems = [
    ['Úvod', '#'], ['Služby', '#sluzby'], ['Priebeh ošetrenia', '#priebeh'],
    ['O ambulancii', '#o-ambulancii'], ['Galéria', '#galeria'],
    ['Cenník', '#cennik'], ...(faqItems.length ? [['FAQ', '#faq']] : []),
    ['Kontakt', '#kontakt'], ['Rezervovať termín', '#rezervacia']
  ];
  const mobilePanel = `<nav id="dientes-mobile-menu" class="dientes-mobile-panel" aria-label="Mobilná navigácia" hidden>${mobileNavItems.map(([label,href])=>`<a href="${href}">${label}</a>`).join('')}</nav>`;
  html = html.replace('</div></div></header>', `${mobileButton}</div></div>${mobilePanel}</header>`);
  const faqSchema = faqItems.length ? {'@context':'https://schema.org','@type':'FAQPage',mainEntity:faqItems.map((item:any)=>({'@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:item.answer}}))} : null;
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,'\\u003c')}}/>
    {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqSchema).replace(/</g,'\\u003c')}}/>}
    <div className="stitch-page bg-surface font-body-md text-body-md text-on-surface antialiased" dangerouslySetInnerHTML={{__html:html}}/>
    <StitchInteractions/>
  </>;
}
