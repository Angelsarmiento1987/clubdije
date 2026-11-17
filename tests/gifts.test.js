import test from 'node:test';
import assert from 'node:assert/strict';
import {models,newGiftCode,shortCode,displayCode,newCode,hashCode,validCode,normalizeCode,validateGift,wrapLines,expiryDate,DAY_MS} from '../src/gift-utils.js';

test('códigos independientes, normalización y hash estable',async()=>{
 const a=newCode(),b=newCode();assert.notEqual(a,b);assert.equal(a.length,32);assert.ok(validCode(a));
 const spaced=a.slice(0,16)+'- '+a.slice(16);assert.equal(normalizeCode(spaced),a);
 assert.equal(await hashCode(spaced.toLowerCase()),await hashCode(a));
 assert.equal((await hashCode(a)).length,64);assert.ok(!validCode('1234'));
 await assert.rejects(hashCode('1234'));
});
test('validación de campos y modelos',()=>{
 const valid={to:'Sofi',from:'Ángel',message:'Te quiero\nMucho ♡',model:'amor'};
 assert.equal(validateGift(valid),'');
 assert.ok(validateGift({...valid,message:' '.repeat(50)}));
 assert.ok(validateGift({...valid,message:'a'.repeat(1201)}));
 assert.ok(validateGift({...valid,model:'inventado'}));
});
test('vencimiento a los 30 días exactos',()=>{
 const start=Date.parse('2026-11-03T15:00:00Z');assert.equal(expiryDate({toMillis:()=>start}).getTime(),start+30*DAY_MS);
});
test('exportación conserva párrafos y corta palabras largas',()=>{
 const lines=wrapLines('Hola Sofi\n\nabcdefghijk',t=>t.length,6);
 assert.deepEqual(lines,['Hola','Sofi','','abcdef','ghijk']);
 const long=wrapLines('a'.repeat(1200),t=>t.length,20);assert.equal(long.join(''),'a'.repeat(1200));assert.ok(long.every(x=>x.length<=20));
});

test('veintiún diseños por temática; códigos cortos sin caracteres ambiguos',async()=>{
 assert.equal(models.length,21);assert.equal(new Set(models.map(m=>m.id)).size,21);assert.equal(models.filter(m=>m.group==='quince').length,2);assert.equal(models.filter(m=>m.group==='futbol').length,3);
 const codes=Array.from({length:100},newGiftCode);assert.equal(new Set(codes).size,100);
 for(const code of codes){assert.equal(code.length,10);assert.ok(shortCode(code));assert.ok(!/[01IO]/.test(code));assert.ok(validCode(displayCode(code)));assert.equal(await hashCode(code),await hashCode(displayCode(code).toLowerCase()));}
 for(const model of models)assert.equal(validateGift({to:'Sofi',from:'Ángel',message:'Feliz día',model:model.id}),'');
});
