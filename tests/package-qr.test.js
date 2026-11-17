import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import jsQR from 'jsqr';
import {normalizePublicWebUrl,publicGiftUrl,qrCanvas,packageCardCanvas,canvasBlob,copyQr} from '../src/package-qr.js';
const code='ABCDEFG234',url=publicGiftUrl('https://example.com/mi-tienda/',code);
function mockCanvas(){
 const original=globalThis.document;let last,draws=[];
 globalThis.document={createElement(tag){assert.equal(tag,'canvas');last=createCanvas(100,100);const ctx=last.getContext('2d'),text=ctx.fillText.bind(ctx);ctx.fillText=(value,x,y)=>{draws.push({value,x,y});text(value,x,y);};last.getContext=()=>ctx;last.toBlob=async cb=>cb(new Blob([await last.encode('png')],{type:'image/png'}));return last;}};
 return {restore:()=>{globalThis.document=original;},get draws(){return draws;}};
}
test('enlace del QR conserva subcarpetas y el código único; rechaza localhost',()=>{
 assert.equal(url,'https://example.com/mi-tienda/#tarjeta=ABCDEFG234');
 assert.equal(normalizePublicWebUrl('https://example.com/mi-tienda/superadmin?x=1'),'https://example.com/mi-tienda/');
 for(const bad of ['http://example.com','https://localhost:3000','https://127.0.0.1','https://192.168.1.4','https://name:pass@example.com'])assert.throws(()=>publicGiftUrl(bad,code));
 assert.throws(()=>publicGiftUrl('https://example.com/','bad'));
});
test('QR descargable se puede decodificar y lleva al regalo correcto',async()=>{
 const mock=mockCanvas();try{const canvas=qrCanvas(url),ctx=canvas.getContext('2d'),pixels=ctx.getImageData(0,0,1000,1000);const decoded=jsQR(pixels.data,1000,1000);assert.equal(decoded.data,url);const blob=await canvasBlob(canvas);assert.equal(blob.type,'image/png');const png=await loadImage(Buffer.from(await blob.arrayBuffer()));assert.equal(png.width,1000);}finally{mock.restore();}
});
test('tarjeta del paquete incluye QR legible, código e Instagram',async()=>{
 const mock=mockCanvas();try{const canvas=packageCardCanvas(url,code);assert.equal(canvas.width,1600);assert.equal(canvas.height,1000);const pixels=canvas.getContext('2d').getImageData(1020,145,510,510);assert.equal(jsQR(pixels.data,510,510).data,url);assert.ok(mock.draws.some(d=>d.value==='@elclubdeldije'));assert.ok(mock.draws.some(d=>d.value==='ABCDE-FG234'));}finally{mock.restore();}
});
test('copiar QR entrega una imagen PNG y explica la alternativa sin soporte',async()=>{
 const mock=mockCanvas(),oldNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator'),oldItem=globalThis.ClipboardItem;let received;
 try{
  globalThis.ClipboardItem=class{constructor(data){this.data=data;}};
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{write:async items=>{received=await items[0].data['image/png'];}}}});
  await copyQr(url);assert.equal(received.type,'image/png');assert.ok(received.size>500);
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{}});await assert.rejects(copyQr(url),/Descargá el QR/);
 }finally{if(oldNavigator)Object.defineProperty(globalThis,'navigator',oldNavigator);else delete globalThis.navigator;globalThis.ClipboardItem=oldItem;mock.restore();}
});
