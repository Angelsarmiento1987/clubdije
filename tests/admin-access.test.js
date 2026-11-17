import test from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {useAdminAccess,adminAccessMessage} from '../src/use-admin-access.js';

globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
async function setup(check,timeoutMs=1000){
 const dom=new JSDOM('<div id="app"></div>',{url:'http://localhost:3000/superadmin'});
 globalThis.window=dom.window;globalThis.document=dom.window.document;
 let onIdentity,current=null,latest;
 const dependencies={subscribe(next){onIdentity=next;return()=>{};},check,current:()=>current,timeoutMs};
 function Probe(){latest=useAdminAccess(dependencies);return React.createElement('p',null,latest.phase);}
 const root=createRoot(document.getElementById('app'));
 await act(async()=>root.render(React.createElement(Probe)));
 return {get value(){return latest;},async identity(user){current=user;await act(async()=>onIdentity(user));},async retry(){await act(async()=>latest.retry());},async close(){await act(async()=>root.unmount());dom.window.close();delete globalThis.window;delete globalThis.document;}};
}
const identity={uid:'google-uid-1',email:'angel@example.com'};
test('Google sin habilitación conserva UID y no concede acceso',async()=>{
 const app=await setup(async()=>false);
 try{await app.identity(identity);assert.equal(app.value.phase,'pending');assert.equal(app.value.identity.uid,identity.uid);assert.equal(app.value.user,null);}finally{await app.close();}
});
test('al habilitar el UID permite comprobar de nuevo sin otro login',async()=>{
 let allowed=false;const app=await setup(async()=>allowed);
 try{await app.identity(identity);allowed=true;await app.retry();assert.equal(app.value.phase,'authorized');assert.equal(app.value.user.uid,identity.uid);}finally{await app.close();}
});
test('Firestore lento termina con un error visible y sin permisos',async()=>{
 const wait=deferred();const app=await setup(()=>wait.promise,30);
 try{await app.identity(identity);assert.equal(app.value.phase,'checking');await act(async()=>new Promise(resolve=>setTimeout(resolve,60)));assert.equal(app.value.phase,'error');assert.equal(app.value.error.code,'admin/timeout');assert.equal(app.value.user,null);assert.match(adminAccessMessage(app.value.error),/Firestore no respondió/);}finally{await app.close();}
});
test('una respuesta tardía no restaura una cuenta que ya cerró sesión',async()=>{
 const wait=deferred();const app=await setup(()=>wait.promise);
 try{await app.identity(identity);await app.identity(null);await act(async()=>wait.resolve(true));assert.equal(app.value.phase,'signedOut');assert.equal(app.value.user,null);assert.equal(app.value.identity,null);}finally{await app.close();}
});
test('cambiar de cuenta elimina el permiso anterior mientras verifica',async()=>{
 const wait=deferred();const app=await setup(user=>user.uid===identity.uid?Promise.resolve(true):wait.promise);
 try{await app.identity(identity);assert.equal(app.value.phase,'authorized');await app.identity({uid:'otra-cuenta',email:'otra@example.com'});assert.equal(app.value.phase,'checking');assert.equal(app.value.user,null);await act(async()=>wait.resolve(false));assert.equal(app.value.phase,'pending');assert.equal(app.value.user,null);}finally{await app.close();}
});
test('reglas que rechazan acceso se distinguen de una cuenta sin habilitar',async()=>{
 const error=Object.assign(new Error('denied'),{code:'permission-denied'});const app=await setup(async()=>{throw error;});
 try{await app.identity(identity);assert.equal(app.value.phase,'error');assert.equal(app.value.error.code,'permission-denied');assert.match(adminAccessMessage(error),/firestore.rules/);assert.equal(app.value.user,null);}finally{await app.close();}
});
