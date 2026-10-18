import {site} from '../site-data';

type Kind='request'|'confirmed'|'cancelled';
type Details={name?:string;service?:string;date?:string;time?:string;url?:string};
const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
export function patientMail(kind:Kind,detail:Details){
 const style=site.reservations.emailStyle;
 const template=site.reservations.emailTemplates[kind];
 const primary=/^#[\da-fA-F]{6}$/.test(style.primaryColor)?style.primaryColor:'#00aeb0';
 const logoUrl=style.logoImage?.startsWith('/uploads/') ? `${process.env.SITE_URL||'https://dientes.sk'}${style.logoImage}` : style.logoImage;
 const logo=logoUrl?.startsWith('https://') ? `<img src="${esc(logoUrl)}" width="110" alt="Dientes"/>` : '';
 const btn=detail.url && template.button ? `<p style="padding:12px 0"><a href="${esc(detail.url)}" style="display:inline-block;background:${primary};color:white;text-decoration:none;padding:14px 23px;border-radius:999px;font-weight:bold">${esc(template.button)}</a></p>`:'';
 const summary=detail.service?`<p><strong>Služba:</strong> ${esc(detail.service)}<br><strong>Dátum:</strong> ${esc(detail.date)}<br><strong>Čas:</strong> ${esc(detail.time)}</p>`:'';
 return {subject:template.subject||'Dientes dentálna hygiena',html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;line-height:1.65;color:#174A4A"><div style="text-align:center;padding:20px;border-bottom:2px solid ${primary}">${logo}<h2>${esc(style.header)}</h2></div><div style="padding:22px"><h2>${esc(template.title)}</h2><p>Dobrý deň ${esc(detail.name)},</p><p style="white-space:pre-line">${esc(template.introduction)}</p>${summary}${kind==='request'?'<p>Termín pre Vás držíme <strong>10 minút</strong>.</p>':''}${btn}<p>${esc(template.closing)}</p><p>${esc(style.signature)}</p></div><div style="background:#effbfb;text-align:center;padding:14px;font-size:12px">${esc(style.footer)} · ${esc(site.contact.address)}</div></div>`};
}
