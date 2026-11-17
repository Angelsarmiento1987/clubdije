import {test,before,after,beforeEach} from 'node:test';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,updateDoc,writeBatch,serverTimestamp,Timestamp,deleteDoc} from 'firebase/firestore';
let env,publicDb,adminDb;
const invite='a'.repeat(64),card='b'.repeat(64);
const invitation=(age=0)=>({createdAt:Timestamp.fromMillis(Date.now()-age*86400000),readHash:card,readCode:'A'.repeat(32),reference:'Venta de prueba',finalized:false});
const gift=(overrides={})=>({to:'Sofi',from:'Ángel',message:'Te quiero\nMucho ♡',model:'amor',invitationId:invite,createdAt:serverTimestamp(),...overrides});
async function seedInvite(age=0){await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),'giftInvitations',invite),invitation(age)));}
function finalize(db,overrides={}){const batch=writeBatch(db);batch.set(doc(db,'giftCards',card),gift(overrides));batch.update(doc(db,'giftInvitations',invite),{finalized:true,finalizedAt:serverTimestamp()});return batch.commit();}
before(async()=>{
 env=await initializeTestEnvironment({projectId:'demo-club-dije',firestore:{host:'127.0.0.1',port:8080,rules:await readFile('firestore.rules','utf8')}});
 publicDb=env.unauthenticatedContext().firestore();adminDb=env.authenticatedContext('admin-user').firestore();
});
beforeEach(async()=>{await env.clearFirestore();await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),'admins','admin-user'),{enabled:true}));});
after(async()=>{await env?.cleanup();});
test('solo admin puede emitir, ni otro usuario puede darse de alta',async()=>{
 const data={...invitation(),createdAt:serverTimestamp()};
 await assertFails(setDoc(doc(publicDb,'giftInvitations',invite),data));
 const stranger=env.authenticatedContext('stranger').firestore();await assertFails(setDoc(doc(stranger,'giftInvitations',invite),data));
 await assertFails(setDoc(doc(stranger,'admins','stranger'),{enabled:true}));
 await assertSucceeds(setDoc(doc(adminDb,'giftInvitations',invite),data));
});
test('el código abre solo su invitación y no permite listar',async()=>{
 await seedInvite();await assertSucceeds(getDoc(doc(publicDb,'giftInvitations',invite)));
 await assertFails(getDocs(collection(publicDb,'giftInvitations')));await assertFails(getDocs(collection(publicDb,'giftCards')));
 await assertFails(updateDoc(doc(publicDb,'giftInvitations',invite),{readHash:'c'.repeat(64)}));
});
test('confirmación atómica, lectura entre dispositivos e inmutabilidad',async()=>{
 await seedInvite();await assertSucceeds(finalize(publicDb));
 const recipient=env.unauthenticatedContext().firestore();await assertSucceeds(getDoc(doc(recipient,'giftCards',card)));
 await assertFails(getDoc(doc(recipient,'giftInvitations',invite)));
 await assertFails(updateDoc(doc(recipient,'giftCards',card),{message:'Cambiado'}));
 await assertFails(finalize(publicDb));await assertFails(deleteDoc(doc(recipient,'giftCards',card)));
});
test('no se puede crear tarjeta ni consumir invitación por separado',async()=>{
 await seedInvite();await assertFails(setDoc(doc(publicDb,'giftCards',card),gift()));
 await assertFails(updateDoc(doc(publicDb,'giftInvitations',invite),{finalized:true,finalizedAt:serverTimestamp()}));
});
test('rechaza contenido excesivo, modelos y fechas falsos',async()=>{
 await seedInvite();await assertFails(finalize(publicDb,{message:'a'.repeat(1201)}));
 await assertFails(finalize(publicDb,{message:'\n   \n'}));
 await assertFails(finalize(publicDb,{model:'otro'}));
 await assertFails(finalize(publicDb,{createdAt:Timestamp.fromMillis(Date.now()+86400000)}));
 await assertFails(finalize(publicDb,{extra:'dato no autorizado'}));
 await assertSucceeds(finalize(publicDb));
});
test('tarjetas e invitaciones vencidas inaccesibles aunque no haya limpieza',async()=>{
 await seedInvite(31);await assertFails(getDoc(doc(publicDb,'giftInvitations',invite)));await assertFails(finalize(publicDb));
 await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),'giftCards',card),gift({createdAt:Timestamp.fromMillis(Date.now()-31*86400000)})));
 await assertFails(getDoc(doc(publicDb,'giftCards',card)));await assertSucceeds(getDoc(doc(adminDb,'giftCards',card)));
 await assertSucceeds(deleteDoc(doc(adminDb,'giftCards',card)));
});
test('las invitaciones no pueden alterar sus datos con la confirmación',async()=>{
 await seedInvite();const batch=writeBatch(publicDb);
 batch.set(doc(publicDb,'giftCards',card),gift());
 batch.update(doc(publicDb,'giftInvitations',invite),{finalized:true,finalizedAt:serverTimestamp(),reference:'Manipulada'});
 await assertFails(batch.commit());
});

test('catálogo público solo lo publica admin; visitas no exponen navegación',async()=>{
 const catalog={products:[{id:'MLA1',title:'Dije'}],updatedAt:'2026-11-03'};
 await assertFails(setDoc(doc(publicDb,'site','catalog'),catalog));
 await assertSucceeds(setDoc(doc(adminDb,'site','catalog'),catalog));
 await assertSucceeds(getDoc(doc(publicDb,'site','catalog')));
 await assertFails(getDocs(collection(publicDb,'site')));
 const visit=doc(publicDb,'visits','D'.repeat(32));
 await assertSucceeds(setDoc(visit,{createdAt:serverTimestamp()}));
 await assertFails(setDoc(visit,{createdAt:serverTimestamp()}));
 await assertFails(getDoc(visit));await assertFails(getDocs(collection(publicDb,'visits')));
 await assertFails(setDoc(doc(publicDb,'visits','E'.repeat(32)),{createdAt:serverTimestamp(),email:'x@example.com'}));
 await assertSucceeds(getDocs(collection(adminDb,'visits')));
});
test('dedicatorias de hasta 24 renglones y sin campos extra',async()=>{
 await seedInvite();await assertFails(finalize(publicDb,{message:Array(25).fill('Hola').join('\n')}));
 await assertSucceeds(finalize(publicDb,{message:Array(24).fill('Te quiero').join('\n')}));
});

const tokenId='d'.repeat(64);
function issueToken(db){const batch=writeBatch(db);batch.set(doc(db,'giftTokens',tokenId),{state:'unused',createdAt:serverTimestamp()});batch.set(doc(db,'giftTokenAdmin',tokenId),{state:'unused',createdAt:serverTimestamp(),reference:'Pedido privado',code:'ABCDEFG234'});return batch.commit();}
function confirmToken(db,model='amor',extra={}){const batch=writeBatch(db);batch.update(doc(db,'giftTokens',tokenId),{state:'confirmed',confirmedAt:serverTimestamp(),to:'Sofi',from:'Ángel',message:'Con mucho cariño\n♡',model,...extra});batch.update(doc(db,'giftTokenAdmin',tokenId),{state:'confirmed',confirmedAt:serverTimestamp()});return batch.commit();}
test('código único: emisión admin, estado público, referencia de venta privada',async()=>{
 await assertFails(issueToken(publicDb));await assertSucceeds(issueToken(adminDb));
 const unused=await assertSucceeds(getDoc(doc(publicDb,'giftTokens',tokenId)));if(unused.data().state!=='unused')throw new Error('El código debe empezar sin usar');
 await assertFails(getDoc(doc(publicDb,'giftTokenAdmin',tokenId)));await assertFails(getDocs(collection(publicDb,'giftTokens')));
 await assertFails(getDocs(collection(publicDb,'giftTokenAdmin')));await assertSucceeds(getDocs(collection(adminDb,'giftTokenAdmin')));
 await assertFails(issueToken(adminDb));
});
test('código único: confirma una vez, otro dispositivo lo ve y no puede editarlo',async()=>{
 await issueToken(adminDb);await assertSucceeds(confirmToken(publicDb,'quince-rosa'));
 const receiver=env.unauthenticatedContext().firestore();const saved=await assertSucceeds(getDoc(doc(receiver,'giftTokens',tokenId)));
 if(saved.data().state!=='confirmed')throw new Error('Debe abrir como tarjeta terminada');
 await assertFails(confirmToken(receiver));await assertFails(updateDoc(doc(receiver,'giftTokens',tokenId),{message:'Cambiado'}));
 await assertFails(deleteDoc(doc(receiver,'giftTokens',tokenId)));await assertFails(getDoc(doc(receiver,'giftTokenAdmin',tokenId)));
});
test('código único: dos confirmaciones simultáneas no se pisan',async()=>{
 await issueToken(adminDb);const other=env.unauthenticatedContext().firestore();
 const results=await Promise.allSettled([confirmToken(publicDb,'magia'),confirmToken(other,'aurora')]);
 if(results.filter(r=>r.status==='fulfilled').length!==1)throw new Error('Debe ganar una sola confirmación');
});
test('código único: no puede consumirse sin dedicatoria ni falsificar fechas o referencias',async()=>{
 await issueToken(adminDb);await assertFails(updateDoc(doc(publicDb,'giftTokenAdmin',tokenId),{state:'confirmed',confirmedAt:serverTimestamp()}));
 await assertFails(confirmToken(publicDb,'inventado'));await assertFails(confirmToken(publicDb,'amor',{createdAt:Timestamp.fromMillis(0)}));
 await assertFails(confirmToken(publicDb,'amor',{message:'a'.repeat(1201)}));
 await assertSucceeds(confirmToken(publicDb,'quince-noche'));
});
test('código único: 30 días desde confirmar, no desde generar el código',async()=>{
 const longAgo=Timestamp.fromMillis(Date.now()-90*86400000);
 await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.firestore();await setDoc(doc(db,'giftTokens',tokenId),{state:'unused',createdAt:longAgo});await setDoc(doc(db,'giftTokenAdmin',tokenId),{state:'unused',createdAt:longAgo,reference:'Antiguo',code:'ABCDEFG234'});});
 await assertSucceeds(getDoc(doc(publicDb,'giftTokens',tokenId)));await assertSucceeds(confirmToken(publicDb));await assertSucceeds(getDoc(doc(publicDb,'giftTokens',tokenId)));
 await env.withSecurityRulesDisabled(async ctx=>updateDoc(doc(ctx.firestore(),'giftTokens',tokenId),{confirmedAt:Timestamp.fromMillis(Date.now()-31*86400000)}));
 await assertFails(getDoc(doc(publicDb,'giftTokens',tokenId)));await assertSucceeds(getDoc(doc(adminDb,'giftTokens',tokenId)));
 await assertSucceeds(deleteDoc(doc(adminDb,'giftTokens',tokenId)));
});
test('código único: las veintiuna tarjetas verticales se aceptan con las mismas reglas',async()=>{
 for(const model of ['boca','river','futbol','quince-rosa','quince-noche','medicina','cumpleanos','mama','papa','amor','pasion','docente','aurora','logro','aniversario','bebe','musica','mascotas','botanica','magia','club-neon']){
  await issueToken(adminDb);await assertSucceeds(confirmToken(publicDb,model));
  await env.withSecurityRulesDisabled(async ctx=>{await deleteDoc(doc(ctx.firestore(),'giftTokens',tokenId));await deleteDoc(doc(ctx.firestore(),'giftTokenAdmin',tokenId));});
 }
});

test('dirección pública del QR: lectura pública, escritura solo admin',async()=>{
 const ref=doc(publicDb,'site','business');
 await assertFails(setDoc(ref,{publicWebUrl:'https://example.com/'}));
 await assertSucceeds(setDoc(doc(adminDb,'site','business'),{publicWebUrl:'https://example.com/club/'}));
 await assertSucceeds(getDoc(ref));
 await assertFails(setDoc(doc(adminDb,'site','business'),{publicWebUrl:'http://example.com/'}));
 await assertFails(setDoc(doc(adminDb,'site','business'),{publicWebUrl:'https://example.com/',extra:'dato'}));
});
