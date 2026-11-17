import {models} from './card-models.js';
import {drawStoryCard,STORY_WIDTH,STORY_HEIGHT} from './story-card.js';
export {wrapLines} from './text-layout.js';
export const DAYS = 30;
export const DAY_MS = 86400000;
export {models} from './card-models.js';
const GIFT_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newGiftCode(){return Array.from(crypto.getRandomValues(new Uint8Array(10)),byte=>GIFT_ALPHABET[byte&31]).join('');}
export function shortCode(code){return /^[A-HJ-NP-Z2-9]{10}$/.test(normalizeCode(code));}
export function displayCode(code){const value=normalizeCode(code);return shortCode(value)?value.slice(0,5)+'-'+value.slice(5):value;}
export const normalizeCode = code => String(code || '').replace(/[\s-]/g,'').toUpperCase();
export function validCode(code) {return shortCode(code)||/^[A-F0-9]{32}$/.test(normalizeCode(code));}
export function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
}
export async function hashCode(code) {
  const normalized = normalizeCode(code);
  if (!validCode(normalized)) throw new Error('Copiá el código completo de tu tarjeta. Revisá las letras y los números.');
  const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
}
export function giftLink(kind, code) {
  const url = new URL(window.location.href);
  url.pathname=url.pathname.replace(/\/superadmin\/?$/,'/');
  url.search=''; url.hash = `${kind}=${normalizeCode(code)}`;
  return url.href;
}
export function expiryDate(createdAt) {
  const millis = createdAt?.toMillis?.() ?? Number(createdAt);
  return new Date(millis + DAYS*DAY_MS);
}
export function formatExpiry(createdAt) {
  return new Intl.DateTimeFormat('es-AR',{dateStyle:'long',timeStyle:'short',timeZone:'America/Argentina/Buenos_Aires'}).format(expiryDate(createdAt));
}
export function validateGift(values) {
  for (const [field,label,max] of [['to','Para',60],['from','De',60],['message','Mensaje',1200]]) {
    if (typeof values[field] !== 'string' || !values[field].trim() || values[field].length > max) return `${label}: completá entre 1 y ${max} caracteres.`;
  }
  if (values.message.split('\n').length>24) return 'La dedicatoria admite hasta 24 renglones para poder descargarla completa.';
  if (!models.some(m=>m.id===values.model)) return 'Elegí un modelo de tarjeta.';
  return '';
}
export async function downloadCard(card) {
 const canvas=document.createElement('canvas');canvas.width=STORY_WIDTH;canvas.height=STORY_HEIGHT;
 await drawStoryCard(canvas,card);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
 if(!blob)throw new Error('No se pudo crear la imagen. Volvé a intentarlo.');
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='tarjeta-el-club-del-dije-1080x1920.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
