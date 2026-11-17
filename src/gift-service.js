import {doc,getDoc,getDocFromServer,setDoc,updateDoc,writeBatch,serverTimestamp,collection,query,orderBy,limit,getDocsFromServer,deleteDoc,where,Timestamp,runTransaction} from 'firebase/firestore';
import {GoogleAuthProvider,signInWithPopup,signOut} from 'firebase/auth';
import {db,auth} from './firebase.js';
import {newCode,newGiftCode,shortCode,hashCode,normalizeCode,validateGift,expiryDate} from './gift-utils.js';
export async function adminLogin() {
  const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
  const {user}=await signInWithPopup(auth,provider);
  return user;
}
export async function isAdmin(user) {
  if(!user)return false;
  return (await getDocFromServer(doc(db,'admins',user.uid))).data()?.enabled === true;
}
export async function createInvitation(reference='') {
  for(let attempt=0;attempt<5;attempt++){
    const code=newGiftCode(),id=await hashCode(code);
    const created=await runTransaction(db,async tx=>{
      const token=doc(db,'giftTokens',id),metadata=doc(db,'giftTokenAdmin',id);
      if((await tx.get(token)).exists())return false;
      if((await tx.get(metadata)).exists())return false;
      tx.set(token,{state:'unused',createdAt:serverTimestamp()});
      tx.set(metadata,{code,reference:reference.trim().slice(0,80),state:'unused',createdAt:serverTimestamp()});
      return true;
    });
    if(created)return {code,invitationId:id,singleCode:true};
  }
  throw new Error('No se pudo generar un código único. Volvé a intentarlo.');
}
export async function resolveGiftCode(code){
  if(!shortCode(code)){
    try{return {kind:'read',card:await loadCard(code)};}catch(error){if(!['permission-denied',undefined].includes(error.code))throw error;}
    return {kind:'edit',invitation:await loadInvitation(code)};
  }
  const id=await hashCode(code),snap=await getDocFromServer(doc(db,'giftTokens',id));
  if(!snap.exists())throw new Error('No encontramos ese código. Revisalo y volvé a intentarlo.');
  const data=snap.data();
  if(data.state==='confirmed'){
    if(expiryDate(data.confirmedAt).getTime()<=Date.now())throw new Error('Esta tarjeta cumplió sus 30 días y ya no está disponible.');
    return {kind:'read',card:{...data,createdAt:data.confirmedAt}};
  }
  return {kind:'edit',invitation:{...data,id,code:normalizeCode(code),singleCode:true}};
}
export async function loadInvitation(code) {
  if(shortCode(code)){const result=await resolveGiftCode(code);if(result.kind!=='edit')throw new Error('Esta tarjeta ya tiene una dedicatoria confirmada. Ingresá el mismo código para verla.');return result.invitation;}
  const id=await hashCode(code),snap=await getDocFromServer(doc(db,'giftInvitations',id));
  if(!snap.exists())throw new Error('No pudimos abrir esa tarjeta. Revisá el código; puede estar confirmado, vencido o cancelado.');
  const data=snap.data();
  if(data.finalized || expiryDate(data.createdAt).getTime() <= Date.now())throw new Error('Este código ya fue utilizado o venció.');
  return {id,...data};
}
export async function confirmGift(invitation,values) {
  const normalized={to:values.to.trim(),from:values.from.trim(),message:values.message.trim(),model:values.model};
  const error=validateGift(normalized);if(error)throw new Error(error);
  const batch=writeBatch(db);
  if(invitation.singleCode){
    batch.update(doc(db,'giftTokens',invitation.id),{...normalized,state:'confirmed',confirmedAt:serverTimestamp()});
    batch.update(doc(db,'giftTokenAdmin',invitation.id),{state:'confirmed',confirmedAt:serverTimestamp()});
    await batch.commit();return invitation.code;
  }
  batch.set(doc(db,'giftCards',invitation.readHash),{...normalized,invitationId:invitation.id,createdAt:serverTimestamp()});
  batch.update(doc(db,'giftInvitations',invitation.id),{finalized:true,finalizedAt:serverTimestamp()});
  await batch.commit();
  return invitation.readCode;
}
export async function loadCard(code) {
  if(shortCode(code)){const result=await resolveGiftCode(code);if(result.kind!=='read')throw new Error('Esta tarjeta todavía no tiene una dedicatoria. Ingresá el código desde la landing para escribirla.');return result.card;}
  const snap=await getDocFromServer(doc(db,'giftCards',await hashCode(code)));
  if(!snap.exists())throw new Error('No pudimos abrir esa tarjeta. Revisá el código; puede no estar confirmada, haber vencido o estar cancelada.');
  const data=snap.data();
  if(expiryDate(data.createdAt).getTime() <= Date.now())throw new Error('La tarjeta cumplió sus 30 días y ya no está disponible.');
  return data;
}
export async function adminInvitations(expiredOnly=false) {
  const base=collection(db,'giftInvitations'),modern=collection(db,'giftTokenAdmin');
  const cutoff=Timestamp.fromMillis(Date.now()-30*86400000);
  const modernQuery=expiredOnly?query(modern,where('state','==','confirmed'),where('confirmedAt','<=',cutoff),limit(100)):query(modern,orderBy('createdAt','desc'),limit(100));
  const oldQueries=expiredOnly?[
    query(base,where('finalized','==',true),where('finalizedAt','<=',cutoff),limit(100)),
    query(base,where('finalized','==',false),where('createdAt','<=',cutoff),limit(100))
  ]:[query(base,orderBy('createdAt','desc'),limit(100))];
  const [modernResult,...oldResults]=await Promise.all([getDocsFromServer(modernQuery),...oldQueries.map(q=>getDocsFromServer(q))]);
  const items=[...modernResult.docs.map(d=>{const value=d.data();return {id:d.id,...value,singleCode:true,readCode:value.code,finalized:value.state==='confirmed',finalizedAt:value.confirmedAt};}),...oldResults.flatMap(s=>s.docs.map(d=>({id:d.id,...d.data()})))];
  return items.sort((a,b)=>expiredOnly?(a.finalizedAt||a.createdAt).toMillis()-(b.finalizedAt||b.createdAt).toMillis():b.createdAt.toMillis()-a.createdAt.toMillis()).slice(0,expiredOnly?300:100);
}
function deleteInvitation(batch,item){
  if(item.singleCode){batch.delete(doc(db,'giftTokens',item.id));batch.delete(doc(db,'giftTokenAdmin',item.id));}
  else{batch.delete(doc(db,'giftCards',item.readHash));batch.delete(doc(db,'giftInvitations',item.id));}
}
export async function removeExpiredInvitations(items) {
  if(items.some(item=>(item.singleCode&&!item.finalized)||expiryDate(item.finalizedAt||item.createdAt).getTime()>Date.now()))throw new Error('La selección incluye tarjetas que todavía no vencieron.');
  for(let i=0;i<items.length;i+=200){
    const batch=writeBatch(db);
    items.slice(i,i+200).forEach(item=>deleteInvitation(batch,item));
    await batch.commit();
  }
}
export async function revokeInvitation(invitation) {
  const batch=writeBatch(db);
  deleteInvitation(batch,invitation);
  await batch.commit();
}
export {signOut,auth};
