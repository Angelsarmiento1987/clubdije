import {createCanvas,GlobalFonts,Image} from '@napi-rs/canvas';
import {writeFile} from 'node:fs/promises';
import {drawStoryCard} from '../src/story-card.js';
import {models} from '../src/card-models.js';
for(const [file,name] of [['Anton.ttf','DijeHeadline'],['BarlowCondensed-ExtraBoldItalic.ttf','DijeItalic'],['DMSans.ttf','DijeBody']])GlobalFonts.registerFromPath('public/fonts/'+file,name);
globalThis.Image=Image;
const sheet=createCanvas(1200,2160),ctx=sheet.getContext('2d');
ctx.fillStyle='#eef0f5';ctx.fillRect(0,0,1200,2160);
for(let i=0;i<models.length;i++){
 const model=models[i],canvas=createCanvas(1080,1920);
 await drawStoryCard(canvas,{model:model.id,to:'Sofía',from:'Ángel',message:'Un pequeño detalle para acompañarte siempre. Que nunca te falten motivos para sonreír. ¡Te quiero mucho!'});
 const x=(i%5)*240+12,y=Math.floor(i/5)*432+12;
 ctx.drawImage(canvas,x,y,216,384);ctx.fillStyle='#17201e';ctx.font='700 15px DijeBody';ctx.fillText(model.name,x,y+406,216);
 if(model.id==='boca')await writeFile('../story-boca-final.png',await canvas.encode('png'));
}
await writeFile('VISTA-DISENOS.png',await sheet.encode('png'));
