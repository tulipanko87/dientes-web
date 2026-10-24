import {beforeEach, describe, expect, it, vi} from 'vitest';
import {actionPage, escapeHtml, privateHeaders, rateLimit, readJson, reservationInput, sameOrigin, validToken} from '../lib/security';
import {patientMail} from '../lib/email-template';
const fake = vi.hoisted(() => ({list: vi.fn(), insert: vi.fn(), patch: vi.fn(), delete: vi.fn(), freebusy: vi.fn(), sendMail: vi.fn()}));
vi.mock('googleapis', () => ({google: {auth: {JWT: class {}}, calendar: () => ({events: {list: fake.list, insert: fake.insert, patch: fake.patch, delete: fake.delete}, freebusy: {query: fake.freebusy}})}}));
vi.mock('../lib/booking-rules', () => ({bookingCheck: () => ({startAt: new Date(Date.now()+86400000),duration:45})}));
vi.mock('nodemailer', () => ({default: {createTransport: () => ({sendMail: fake.sendMail})}}));
import {GET as confirmGet, POST as confirmPost} from '../app/api/confirm-reservation/route';
import {GET as cancelGet, POST as cancelPost} from '../app/api/cancel-reservation/route';
import {POST as reserve} from '../app/api/reservation/route';
import {GET as availability} from '../app/api/availability/route';
const token = 'a'.repeat(64);
const valid = {service: 'Dentálna hygiena',name:'Klient',email:'client@example.test',phone:'+421900123456',date:'2026-12-01',time:'09:00',note:'',consent:true,website:''};
const req = (path: string, method='GET', body?: unknown) => new Request(`https://dientes.sk/api/${path}`, {method, headers: {'Content-Type':'application/json', Origin:'https://dientes.sk','x-forwarded-for':'192.0.2.1'}, ...(body === undefined ? {} : {body: JSON.stringify(body)})});
beforeEach(() => {vi.clearAllMocks();process.env.SITE_URL='https://dientes.sk';process.env.GOOGLE_CALENDAR_ID='test-calendar';fake.sendMail.mockResolvedValue({});fake.patch.mockResolvedValue({});fake.delete.mockResolvedValue({});});
describe('input and HTML boundaries', () => {
 it('validates types, lengths, mail recipient, consent and honeypot', () => {
  expect(reservationInput(valid)).toBeTruthy();
  for (const delta of [{name:[]},{name:'x'.repeat(101)},{email:'a@example.test,b@example.test'},{phone:'123'},{consent:false},{website:'bot'},{name:'\r\nEmail: attacker@example.test'}]) expect(reservationInput({...valid,...delta})).toBeNull();
 });
 it('escapes HTML and mail details', () => {
  const attack='<img src=x onerror="alert(1)">';
  expect(escapeHtml(attack)).not.toContain('<img');
  expect(patientMail('confirmed',{name:attack,service:attack}).html).not.toContain(attack);
  expect(actionPage('confirm-reservation',token,attack)).not.toContain(attack);
 });
 it('bounds request bodies and rejects non-object JSON', async () => {
  await expect(readJson(req('reservation','POST',null))).rejects.toThrow();
  await expect(readJson(req('reservation','POST',{note:'x'.repeat(9000)}))).rejects.toThrow();
 });
 it('checks token formats and cross-origin requests', () => {
  expect(validToken(token)).toBe(true);expect(validToken('123')).toBe(false);expect(validToken('a'.repeat(10000))).toBe(false);
  expect(sameOrigin(new Request('https://dientes.sk/api/reservation',{headers:{Origin:'https://evil.test'}}))).toBe(false);
  expect(sameOrigin(new Request('http://localhost:3000/api/reservation',{headers:{Host:'preview.example.test',Origin:'https://preview.example.test'}}))).toBe(true);
  expect(sameOrigin(new Request('http://localhost:3000/api/reservation',{headers:{Host:'preview.example.test',Origin:'https://evil.test'}}))).toBe(false);
 });
 it('enforces rate limits', () => {
  expect(rateLimit(req('reservation'),'test',1)).toBe(true);expect(rateLimit(req('reservation'),'test',1)).toBe(false);
 });
});
describe('API routes with calendar and SMTP replaced', () => {
 it('GET links never mutate or query the calendar or send mail', async () => {
  for (const handler of [confirmGet,cancelGet]) {
   const response=await handler(req(`confirm-reservation?token=${token}`));expect(response.status).toBe(200);const html=await response.text();expect(html).toContain('method="post"');expect(html).not.toContain('action="/api/confirm-reservation?token=');expect(response.headers.get('Referrer-Policy')).toBe(privateHeaders['Referrer-Policy']);
  }
  expect(fake.list).not.toHaveBeenCalled();expect(fake.sendMail).not.toHaveBeenCalled();
 });
 it('rejects malformed tokens and cross-origin mutations before calendar access', async () => {
  for (const handler of [confirmPost,cancelPost]) {
   expect((await handler(req('confirm-reservation?token=bad','POST'))).status).toBe(400);
   expect((await handler(new Request(`https://dientes.sk/api/confirm-reservation?token=${token}`,{method:'POST',headers:{Origin:'https://evil.test'}}))).status).toBe(403);
  }
  expect(fake.list).not.toHaveBeenCalled();
 });
 it('rejects malformed reservation body before calendar access', async () => {
  expect((await reserve(req('reservation','POST',{...valid,name:{html:'x'}}))).status).toBe(400);expect(fake.freebusy).not.toHaveBeenCalled();
 });
 it('confirms using conditional update and escapes stored patient data', async () => {
  fake.list.mockResolvedValue({data:{items:[{id:'event',etag:'version-1',start:{dateTime:'2026-12-01T09:00:00+01:00'},extendedProperties:{private:{status:'pending',expiresAt:new Date(Date.now()+60000).toISOString(),customerName:'<img src=x onerror=alert(1)>',customerEmail:'client@example.test',service:'Hygiena',confirmationToken:token}}}]}});
  const response=await confirmPost(req(`confirm-reservation?token=${token}`,'POST'));expect(response.status).toBe(200);expect(await response.text()).not.toContain('<img');
  expect(fake.patch.mock.calls[0][1]).toEqual({headers:{'If-Match':'version-1'}});expect(fake.patch.mock.calls[0][0].requestBody.extendedProperties.private).toMatchObject({confirmationToken:'',status:'confirmed'});
  expect(fake.sendMail.mock.calls[1][0].html).not.toContain('<img');
 });
 it('accepts a browser form token without putting it in the POST URL', async () => {
  fake.list.mockResolvedValue({data:{items:[]}});
  const request=new Request('https://dientes.sk/api/confirm-reservation',{method:'POST',headers:{Origin:'https://dientes.sk','Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token})});
  expect((await confirmPost(request)).status).toBe(404);expect(fake.list).toHaveBeenCalled();
 });
 it('does not notify when a concurrent confirmation wins the ETag race', async () => {
  fake.list.mockResolvedValue({data:{items:[{id:'event',etag:'old',extendedProperties:{private:{status:'pending',expiresAt:new Date(Date.now()+60000).toISOString(),customerEmail:'client@example.test'}}}]}});
  fake.patch.mockRejectedValueOnce(new Error('412 Precondition Failed'));
  expect((await confirmPost(req(`confirm-reservation?token=${token}`,'POST'))).status).toBe(500);expect(fake.sendMail).not.toHaveBeenCalled();
 });
 it('does not confirm an invalid or expired deadline', async () => {
  fake.list.mockResolvedValue({data:{items:[{id:'event',etag:'v1',extendedProperties:{private:{status:'pending',expiresAt:'invalid'}}}]}});
  expect((await confirmPost(req(`confirm-reservation?token=${token}`,'POST'))).status).toBe(410);expect(fake.patch).not.toHaveBeenCalled();
 });
 it('cancels conditionally using structured recipient metadata', async () => {
  fake.list.mockResolvedValue({data:{items:[{id:'event',etag:'v2',description:'Email: attacker@example.test',extendedProperties:{private:{status:'confirmed',customerEmail:'client@example.test',customerName:'<script>bad</script>'}}}]}});
  expect((await cancelPost(req(`cancel-reservation?token=${token}`,'POST'))).status).toBe(200);expect(fake.delete.mock.calls[0][1]).toEqual({headers:{'If-Match':'v2'}});expect(fake.sendMail.mock.calls[0][0].to).toBe('client@example.test');expect(fake.sendMail.mock.calls[1][0].html).not.toContain('<script>');
 });
 it('reserves using server duration and rolls back when mail fails', async () => {
  fake.freebusy.mockResolvedValue({data:{calendars:{'test-calendar':{busy:[]}}}});fake.insert.mockResolvedValue({data:{id:'pending'}});
  expect((await reserve(req('reservation','POST',{...valid,durationMinutes:1}))).status).toBe(200);
  const event=fake.insert.mock.calls[0][0].requestBody;
  expect(Date.parse(event.end.dateTime)-Date.parse(event.start.dateTime)).toBe(45*60000);
  fake.sendMail.mockRejectedValueOnce(new Error('simulated mail failure'));
  expect((await reserve(req('reservation','POST',valid))).status).toBe(500);expect(fake.delete).toHaveBeenCalledWith({calendarId:'test-calendar',eventId:'pending'});
 });
 it('returns error rather than empty availability on provider errors', async () => {
  process.env.GOOGLE_CLIENT_EMAIL='test@example.test';process.env.GOOGLE_PRIVATE_KEY='fake-not-a-key';
  fake.list.mockResolvedValue({data:{items:[]}});fake.freebusy.mockResolvedValue({data:{calendars:{'test-calendar':{errors:[{reason:'notFound'}]}}}});
  expect((await availability(req('availability?daysAhead=2'))).status).toBe(500);
 });
});
