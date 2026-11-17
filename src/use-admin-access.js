import {useCallback,useEffect,useRef,useState} from 'react';
import {onAuthStateChanged} from 'firebase/auth';
import {auth,isAdmin} from './gift-service.js';

export function withTimeout(promise,ms=15000,code='admin/timeout'){
 let timer;
 const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{const error=new Error('La verificación tardó demasiado.');error.code=code;reject(error);},ms);});
 return Promise.race([promise,timeout]).finally(()=>clearTimeout(timer));
}
const services={
 subscribe:(next,error)=>onAuthStateChanged(auth,next,error),
 check:isAdmin,
 current:()=>auth.currentUser,
 timeoutMs:15000
};
// La identidad de Google y el permiso de Firestore se resuelven en pasos distintos.
// Nunca conserva permisos de una cuenta anterior ni acepta respuestas atrasadas.
export function useAdminAccess(dependencies=services){
 const [access,setAccess]=useState({phase:'initializing',identity:null,user:null,error:null});
 const generation=useRef(0),mounted=useRef(false);
 const verify=useCallback(async identity=>{
  const request=++generation.current;
  if(!identity){if(mounted.current)setAccess({phase:'signedOut',identity:null,user:null,error:null});return;}
  if(mounted.current)setAccess({phase:'checking',identity,user:null,error:null});
  try{
   const allowed=await withTimeout(dependencies.check(identity),dependencies.timeoutMs);
   if(mounted.current&&generation.current===request)setAccess({phase:allowed===true?'authorized':'pending',identity,user:allowed===true?identity:null,error:null});
  }catch(error){if(mounted.current&&generation.current===request)setAccess({phase:'error',identity,user:null,error});}
 },[dependencies]);
 useEffect(()=>{
  mounted.current=true;let received=false;
  const initialTimer=setTimeout(()=>{if(!received&&mounted.current){++generation.current;const error=new Error('No se pudo preparar la sesión.');error.code='admin/session-timeout';setAccess({phase:'error',identity:null,user:null,error});}},dependencies.timeoutMs);
  const unsubscribe=dependencies.subscribe(identity=>{received=true;clearTimeout(initialTimer);verify(identity);},error=>{received=true;clearTimeout(initialTimer);++generation.current;if(mounted.current)setAccess({phase:'error',identity:null,user:null,error});});
  return()=>{mounted.current=false;++generation.current;clearTimeout(initialTimer);unsubscribe();};
 },[dependencies,verify]);
 return {...access,retry:()=>verify(dependencies.current())};
}
export function adminAccessMessage(error){
 switch(error?.code){
  case 'admin/timeout':return 'Google inició sesión, pero Firestore no respondió en 15 segundos. Revisá la conexión, que exista la base de datos (default) y que las reglas estén publicadas. Podés volver a comprobar sin iniciar sesión otra vez.';
  case 'admin/session-timeout':return 'No pudimos preparar tu sesión. Revisá la conexión y volvé a ingresar con Google.';
  case 'permission-denied':return 'Google inició sesión, pero Firestore rechazó la comprobación de permisos. Publicá el archivo firestore.rules de esta entrega en el proyecto el-club-del-dije y volvé a comprobar.';
  case 'unavailable':return 'No pudimos conectar con Firestore. Comprobá tu conexión y que la base de datos esté creada en el proyecto el-club-del-dije.';
  case 'not-found':return 'No encontramos la base de datos. Creá Firestore Database (default) en el proyecto el-club-del-dije y publicá sus reglas.';
  default:return error?.message||'No pudimos verificar los permisos de tu cuenta.';
 }
}
