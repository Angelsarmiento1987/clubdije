import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas,loadImage,GlobalFonts,Image} from '@napi-rs/canvas';
import {downloadCard,models} from '../src/gift-utils.js';
import {renderStorySvg,storyLayout,canvasMeasurer,STORY_WIDTH,STORY_HEIGHT} from '../src/story-card.js';
import {clubCrests} from '../src/club-crests.js';
for(const [file,name] of [['Anton.ttf','DijeHeadline'],['BarlowCondensed-ExtraBoldItalic.ttf','DijeItalic'],['DMSans.ttf','DijeBody']])GlobalFonts.registerFromPath('public/fonts/'+file,name);
test('las veintiuna tarjetas se descargan completas en 1080 × 1920',async()=>{
 const originalDocument=globalThis.document,originalTimer=globalThis.setTimeout,originalImage=globalThis.Image;
 try{
  globalThis.Image=Image;
  globalThis.setTimeout=(fn,ms)=>{const handle=originalTimer(fn,ms);handle.unref();return handle;};
  for(const model of models.map(m=>m.id)){
   let output,clicked=false;
   const canvas=createCanvas(1080,1920),ctx=canvas.getContext('2d');
   canvas.toBlob=async callback=>{output=await canvas.encode('png');callback(new Blob([output],{type:'image/png'}));};
   globalThis.document={createElement:tag=>tag==='canvas'?canvas:{click(){clicked=true;}}};
   const message=('Te quiero mucho. ♡ '.repeat(80)).slice(0,1200),card={to:'Sofi',from:'Ángel',message,model};
   const layout=storyLayout(card,canvasMeasurer(ctx));
   assert.equal(layout.messageLayout.lines.join('').replace(/\s/g,''),message.replace(/\s/g,''));
   assert.ok(layout.messageTop+layout.messageLayout.lines.length*layout.messageLayout.lineHeight<=layout.messageBottom+1);
   const svg=renderStorySvg(card,{measure:canvasMeasurer(ctx),embedAssets:true});
   assert.ok(svg.includes('@elclubdeldije'));
   if(clubCrests[model])assert.ok(svg.includes(clubCrests[model].src));
   await downloadCard(card);
   assert.ok(clicked);assert.ok(output.length>1000);
   const image=await loadImage(output);assert.equal(image.width,STORY_WIDTH);assert.equal(image.height,STORY_HEIGHT);
  }
 }finally{globalThis.document=originalDocument;globalThis.setTimeout=originalTimer;globalThis.Image=originalImage;}
});
test('no recorta nombres largos ni 24 renglones y escapa texto SVG',()=>{
 const measure=canvasMeasurer(createCanvas(1,1).getContext('2d'));
 const message=('W\n'.repeat(23)+'W'.repeat(1154)).slice(0,1200);
 const card={model:'boca',to:'W'.repeat(60),from:'W'.repeat(60),message};
 const layout=storyLayout(card,measure);
 assert.equal(layout.messageLayout.lines.join('').replace(/\s/g,''),message.replace(/\s/g,''));
 assert.ok(layout.messageTop+layout.messageLayout.lines.length*layout.messageLayout.lineHeight<=layout.messageBottom+1);
 const svg=renderStorySvg({...card,message:'<script>alert("hola")</script> & <img onerror="x">'});
 assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('&lt;script&gt;'));assert.ok(svg.includes('&amp;'));
});
