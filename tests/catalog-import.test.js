import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {importProductFiles} from '../src/catalog-service.js';
import {giftLink} from '../src/gift-utils.js';
import {adminLink,homeLink} from '../src/site-links.js';
const dom=new JSDOM('');globalThis.DOMParser=dom.window.DOMParser;
const product={id:'MLA456',title:'Dije corazón',category:'Dijes y collares',image:'https://http2.mlstatic.com/foto.webp',url:'https://www.mercadolibre.com.ar/dije/up/MLAU123#wid=MLA456'};
const file=(name,body)=>({name,text:async()=>body});
test('HTML de ML importado en el panel sin precios',async()=>{
 const html=`<span>1 resultado</span><li class="ui-search-layout__item"><a class="poly-component__title" href="${product.url}">${product.title}</a><img data-src="${product.image}"><span>$12345</span></li>`;
 const result=await importProductFiles([file('pagina1.html',html)],{products:[]});assert.equal(result.added.length,1);assert.equal(result.products[0].id,'MLA456');assert.ok(!('price' in result.products[0]));
});
test('rechaza páginas incompletas y conserva datos de entrada',async()=>{
 const current={products:[product]},copy=JSON.stringify(current);
 await assert.rejects(importProductFiles([file('vacia.html','<h1>Acceso denegado</h1>')],current));
 const html=`<span>143 resultados</span><li class="poly-card"><a class="poly-component__title" href="${product.url}">Dije</a><img src="${product.image}"></li>`;
 await assert.rejects(importProductFiles([file('falta.html',html)],current),/Faltan páginas/);assert.equal(JSON.stringify(current),copy);
});
test('JSON conserva categorías y descarta precios; rechaza URLs ajenas',async()=>{
 const current={products:[{...product,category:'Personalizados'}]};
 const result=await importProductFiles([file('productos.json',JSON.stringify({products:[{...product,title:'Nuevo nombre',price:5000}]}))],current);
 assert.equal(result.products[0].title,'Nuevo nombre');assert.equal(result.products[0].category,'Personalizados');assert.ok(!('price' in result.products[0]));
 await assert.rejects(importProductFiles([file('mal.json',JSON.stringify({products:[{...product,url:'javascript:alert(1)'}]}))],current));
});
test('enlaces desde /repo/superadmin regresan al catálogo para abrir tarjetas',()=>{
 const old=globalThis.window;globalThis.window={location:{href:'https://example.com/mi-tienda/superadmin/'}};
 try{assert.equal(adminLink(),'https://example.com/mi-tienda/superadmin');assert.equal(homeLink(),'https://example.com/mi-tienda/#tarjetas');assert.equal(giftLink('regalo','A'.repeat(32)),'https://example.com/mi-tienda/#regalo='+'A'.repeat(32));}finally{globalThis.window=old;}
});
