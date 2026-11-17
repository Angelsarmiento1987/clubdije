import {doc,getDocFromServer,setDoc} from 'firebase/firestore';
import {db} from './firebase.js';
import {normalizePublicWebUrl} from './package-qr.js';
export async function getPublicWebUrl(){const snap=await getDocFromServer(doc(db,'site','business'));return snap.exists()?normalizePublicWebUrl(snap.data().publicWebUrl):'';}
export async function savePublicWebUrl(value){const url=normalizePublicWebUrl(value);await setDoc(doc(db,'site','business'),{publicWebUrl:url});return url;}
export function detectedPublicWebUrl(){if(typeof window==='undefined')return '';try{return normalizePublicWebUrl(window.location.href);}catch{return '';}}
