import React, { useMemo, useState } from 'react';

// Google Material Symbols names. Values must match the icons rendered by Stitch.
const ICONS: Array<[string, string]> = [
  ['headphones','Slúchadlá'],['dentistry','Zub'],['health_and_safety','Ochrana zdravia'],
  ['verified','Overené'],['favorite','Srdce'],['favorite_border','Srdce – obrys'],
  ['auto_awesome','Iskry'],['workspace_premium','Prémiové'],['stars','Hviezdičky'],
  ['star','Hviezda'],['child_care','Deti'],['face','Tvár'],['family_restroom','Rodina'],
  ['autorenew','Opakovanie'],['refresh','Obnoviť'],['home','Domov'],
  ['visibility','Vyšetrenie / oko'],['school','Inštruktáž'],['straighten','Meranie'],
  ['air','Prúdenie vzduchu'],['cleaning_services','Čistenie'],['water_drop','Kvapka'],
  ['spa','Relax'],['medical_services','Zdravotná starostlivosť'],['vaccines','Ošetrenie'],
  ['shield','Štít'],['shield_with_heart','Štít so srdcom'],['handshake','Dohoda'],
  ['sentiment_satisfied','Úsmev'],['mood','Spokojnosť'],['self_improvement','Relaxácia'],
  ['light_mode','Slnko'],['sunny','Slnečno'],['schedule','Čas'],['calendar_month','Kalendár'],
  ['event_available','Voľný termín'],['event_busy','Obsadený termín'],
  ['location_on','Poloha'],['call','Telefón'],['mail','E-mail'],['info','Informácia'],
  ['check_circle','Potvrdenie'],['task_alt','Splnené'],['thumb_up','Palec hore'],
  ['support_agent','Podpora'],['volunteer_activism','Starostlivosť'],
  ['diamond','Diamant'],['brush','Kefka'],['flare','Žiara'],['bolt','Energia'],
  ['local_hospital','Ambulancia'],['groups','Ľudia'],['eco','Príroda'],['science','Veda'],
];

const iconStyle: React.CSSProperties = {
  fontFamily: 'Material Symbols Outlined', fontWeight: 'normal', fontStyle: 'normal',
  fontSize: 27, lineHeight: 1, letterSpacing: 'normal', textTransform: 'none',
  display: 'inline-block', whiteSpace: 'nowrap', direction: 'ltr',
  fontFeatureSettings: 'liga', WebkitFontSmoothing: 'antialiased',
};

export default function IconPicker({ field, input }: any) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const value = typeof input?.value === 'string' ? input.value : '';
  const shown = useMemo(() => ICONS.filter(([name,label]) =>
    `${name} ${label}`.toLocaleLowerCase('sk').includes(query.toLocaleLowerCase('sk'))
  ), [query]);
  const setValue = (next: string) => input?.onChange?.(next);
  return (
    <div style={{ marginBottom: 18, fontFamily: 'inherit' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0,0" />
      <label style={{ display:'block', fontWeight:600, fontSize:14, marginBottom:8 }} htmlFor={input?.name}>{field?.label || 'Ikona'}</label>
      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:10}}>
        <span aria-hidden="true" style={{...iconStyle, fontSize:36, color:'#0d9488', minWidth:46, textAlign:'center'}}>{value || 'help'}</span>
        <input id={input?.name} name={input?.name} value={value} onBlur={input?.onBlur}
          onChange={e => setValue(e.target.value.trim().replace(/\s+/g, '_'))}
          placeholder="Napr. headphones alebo dentistry"
          style={{flex:1, minWidth:0, padding:'10px 12px', border:'1px solid #cbd5e1', borderRadius:7, background:'transparent', color:'inherit'}} />
      </div>
      <div style={{display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', marginBottom:10}}>
        <button type="button" onClick={() => setExpanded(!expanded)}
          style={{border:'1px solid #94a3b8', padding:'7px 11px', borderRadius:7, cursor:'pointer', background:'transparent', color:'inherit'}}>
          {expanded ? 'Skryť výber ikon' : 'Vybrať ikonu z galérie'}
        </button>
        <a href="https://fonts.google.com/icons" target="_blank" rel="noopener noreferrer"
          style={{color:'#0d9488', textDecoration:'underline', fontSize:13}}>Katalóg všetkých ikon ↗</a>
      </div>
      {expanded && <div style={{padding:10, border:'1px solid #cbd5e1', borderRadius:9}}>
        <input aria-label="Hľadať ikonu" value={query} onChange={e=>setQuery(e.target.value)}
          placeholder="Hľadať po slovensky alebo podľa názvu…"
          style={{width:'100%', padding:'9px 10px', border:'1px solid #cbd5e1', borderRadius:6, marginBottom:10, boxSizing:'border-box', background:'transparent', color:'inherit'}} />
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px, 1fr))', gap:7, maxHeight:295, overflowY:'auto'}}>
          {shown.map(([name,label])=><button key={name} type="button" onClick={()=>setValue(name)} title={name}
            aria-pressed={value===name}
            style={{display:'flex', alignItems:'center', flexDirection:'column', gap:5, padding:9, borderRadius:8, cursor:'pointer', color:'inherit', background:value===name?'rgba(13,148,136,.13)':'transparent', border:value===name?'2px solid #0d9488':'1px solid #cbd5e1'}}>
              <span aria-hidden="true" style={iconStyle}>{name}</span>
              <span style={{fontSize:11, textAlign:'center'}}>{label}</span>
              <span style={{fontSize:10, color:'#64748b', overflowWrap:'anywhere'}}>{name}</span>
            </button>)}
        </div>
        {shown.length===0 && <p style={{fontSize:13}}>Nenašla sa ikona. Skús iný výraz alebo použi katalóg.</p>}
      </div>}
      <p style={{fontSize:12, color:'#64748b', marginTop:7}}>Ukladajú sa pôvodné názvy Material Symbols. Vyber si z galérie alebo zadaj názov z katalógu.</p>
    </div>
  );
}
