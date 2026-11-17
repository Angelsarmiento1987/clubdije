import {models} from './card-models.js';
import {storyLogo,storyFonts} from './story-assets.js';
import {storyDefs,motifMarkup} from './story-art.js';
import {wrapLines} from './text-layout.js';
export const STORY_WIDTH=1080,STORY_HEIGHT=1920;
export const MESSAGE_PANEL={x:64,y:640,width:952,height:800};
export const escapeXml=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const approximate=(text,size,family)=>Array.from(text).reduce((sum,char)=>sum+(char===' '?0.28:/[ilI.,'!]/.test(char)?0.26:/[MW@]/.test(char)?0.92:family==='DijeItalic'?0.46:0.57),0)*size;
export function canvasMeasurer(ctx){return (text,size,family='DijeBody',weight=400)=>{ctx.font=`${weight} ${size}px "${family}"`;return ctx.measureText(text).width;};}
function fit(text,maxWidth,maxHeight,start,min,measure,family='DijeBody',weight=400){
 let size=start,lines=[];
 for(;size>=min;size--){lines=wrapLines(text,t=>measure(t,size,family,weight),maxWidth);if(lines.length*size*1.4<=maxHeight)break;}
 if(size<min){size=min;lines=wrapLines(text,t=>measure(t,size,family,weight),maxWidth);}
 return {size,lines,lineHeight:size*1.4};
}
export function storyLayout(card,measure=approximate){
 const model=models.find(m=>m.id===card.model)||models[0];
 const to=String(card.to||'alguien muy especial'),from=String(card.from||'quien pensó en vos'),message=String(card.message||model.message);
 const toLayout=fit(to,848,102,45,26,measure,'DijeBody',700);
 const messageTop=758+toLayout.lines.length*toLayout.lineHeight+36;
 const messageBottom=1280;
 const messageLayout=fit(message,848,messageBottom-messageTop,40,8,measure);
 const fromLayout=fit(from,848,77,33,22,measure,'DijeBody',700);
 let headlineSize=112;while(headlineSize>72&&model.headline.some(t=>measure(t,headlineSize,'DijeItalic',800)>624))headlineSize--;
 return {model,to,from,message,toLayout,messageLayout,fromLayout,messageTop,messageBottom,headlineSize};
}
function textLines(lines,x,top,size,{family='DijeBody',weight=400,fill='#17201e',lineHeight=size*1.4,anchor='start',extra='',measure=approximate,maxWidth=848}={}){
 return lines.map((line,index)=>`<text x="${x}" y="${top+size*.96+index*lineHeight}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" textLength="${Math.min(maxWidth,measure(line,size,family,weight))}" lengthAdjust="spacingAndGlyphs" ${extra}>${escapeXml(line)||' '}</text>`).join('');
}
function background(model,p){
 const stripes=model.id==='river'?`<path d="M460 -150 L1220 380 L1220 70 L750 -150 Z M-150 1740 L1230 1010 L1230 1280 L-150 2010 Z" fill="#ed1534"/>`:
 `<path d="M-120 110 Q170 -70 580 -80 L1000 -80 Q310 50 -120 290 Z" fill="${model.accent}"/><path d="M-100 1770 Q360 1420 1190 1280 L1190 1460 Q510 1570 -100 2010 Z" fill="${model.accent}"/><path d="M-120 1550 Q550 1530 1190 1730" fill="none" stroke="${model.accent}" stroke-width="42" opacity=".65"/>`;
 let detail='';
 if(model.motif==='ball')detail='<g fill="none" stroke="#d9ffe7" stroke-width="4" opacity=".5"><path d="M100 0 L40 620 M550 0 L480 620 M1080 100 L0 500 M720 0 L660 260 L1080 140"/></g>';
 if(model.motif==='vinyl')detail='<path d="M0 552 L145 530 L260 537 L350 505 L390 558 L424 478 L449 566 L485 527 L700 530" fill="none" stroke="#d2f72d" stroke-width="8"/>';
 return `<defs><linearGradient id="${p}-background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${model.background}"/><stop offset="1" stop-color="${model.secondary}"/></linearGradient><pattern id="${p}-texture" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill="#fff" opacity=".13"/></pattern></defs><rect width="1080" height="1920" fill="url(#${p}-background)"/>${stripes}${detail}<rect width="1080" height="1920" fill="url(#${p}-texture)" opacity=".7"/>`;
}
export function renderStorySvg(card,{uid='dije-story',measure=approximate,embedFonts=false,embedAssets=false,thumbnail=false,omitDedication=false}={}){
 const p=uid.replace(/[^a-zA-Z0-9_-]/g,''),layout=storyLayout(card,measure),{model,toLayout,messageLayout,fromLayout,headlineSize}=layout;
 const faces=embedFonts?`<style>${Object.entries(storyFonts).map(([family,url])=>`@font-face{font-family:'${family}';src:url('${url}') format('truetype');font-weight:${family==='DijeItalic'?'800':family==='DijeBody'?'100 900':'400'};font-style:normal;}`).join('')}</style>`:'';
 const logo=embedAssets?storyLogo:'./logo-card.png';
 const text=(lines,x,top,size,style={})=>textLines(lines,x,top,size,{...style,measure});
 const dedication=(...args)=>omitDedication?'':text(...args);
 const panel=thumbnail?`<rect x="64" y="640" width="952" height="800" rx="65" fill="#fff9ec"/><g fill="#ddd5c4"><rect x="115" y="760" width="300" height="22" rx="11"/><rect x="115" y="890" width="810" height="16" rx="8"/><rect x="115" y="955" width="760" height="16" rx="8"/><rect x="115" y="1020" width="800" height="16" rx="8"/><rect x="115" y="1230" width="250" height="20" rx="10"/></g>`:
 `<rect x="64" y="648" width="952" height="800" rx="65" fill="#000" opacity=".13"/><rect x="64" y="640" width="952" height="800" rx="65" fill="#fff9ef" stroke="#ffffff" stroke-width="2"/>
 ${dedication(['PARA'],110,694,21,{weight:700,fill:'#7b756b'})}
 ${dedication(toLayout.lines,110,744,toLayout.size,{weight:700,lineHeight:toLayout.lineHeight})}
 <path d="M110 ${layout.messageTop-16} H970" stroke="#e4dbcb" stroke-width="2"/>
 ${dedication(messageLayout.lines,110,layout.messageTop,messageLayout.size,{lineHeight:messageLayout.lineHeight})}
 <path d="M110 1310 H970" stroke="#e4dbcb" stroke-width="2"/>
 ${dedication(['DE'],110,1325,19,{weight:700,fill:'#7b756b'})}
 ${dedication(fromLayout.lines,110,1364,fromLayout.size,{weight:700,lineHeight:fromLayout.lineHeight})}`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920" role="img" aria-label="${escapeXml('Tarjeta '+model.name+' para '+layout.to)}"><title>${escapeXml(model.name)}</title><desc>${escapeXml(layout.to+'. '+layout.message+'. De '+layout.from+'. @elclubdeldije')}</desc>${faces}${storyDefs(p)}${background(model,p)}
 <g transform="rotate(-3 350 340)">${text(model.headline,70,205,headlineSize,{family:'DijeItalic',weight:800,fill:model.headlineInk,lineHeight:headlineSize*1.06,extra:`style="paint-order:stroke" stroke="${model.background}" stroke-width="1"`})}</g>
 ${motifMarkup(model,p)}${panel}
 <svg x="160" y="1485" width="760" height="350" viewBox="0 250 1536 774" overflow="hidden"><image href="${logo}" width="1536" height="1024"/></svg>
 ${text(['@elclubdeldije'],540,1834,34,{weight:700,fill:model.id==='river'||['bebe','docente','mascotas','botanica','club-neon','medicina','aurora','quince-rosa'].includes(model.id)?'#111a23':'#fff9ed',anchor:'middle'})}
 </svg>`;
}
export function svgDataUrl(svg){
 const bytes=new TextEncoder().encode(svg);let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));return 'data:image/svg+xml;base64,'+btoa(binary);
}
export async function loadStoryFonts(){
 if(typeof document==='undefined'||!document.fonts?.load)return;
 await Promise.all(['800 64px DijeItalic','400 40px DijeBody','700 40px DijeBody'].map(font=>document.fonts.load(font)));
}
export function loadSvgImage(svg){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('No se pudo preparar la imagen de tu tarjeta. Volvé a intentar la descarga.'));image.src=svgDataUrl(svg);});}

// Canvas uses the same loaded fonts and wrapping as the preview, so the exported
// dedication does not depend on a browser's SVG-image font implementation.
export async function drawStoryCard(canvas,card){
 await loadStoryFonts();
 const ctx=canvas.getContext('2d');
 if(!ctx)throw new Error('Este navegador no permite descargar la imagen. Probá desde Chrome o Firefox.');
 const measure=canvasMeasurer(ctx),layout=storyLayout(card,measure);
 const svg=renderStorySvg(card,{measure,embedAssets:true,embedFonts:true,omitDedication:true});
 const image=await loadSvgImage(svg);ctx.drawImage(image,0,0,STORY_WIDTH,STORY_HEIGHT);
 const draw=(lines,top,size,weight=400,color='#17201e',lineHeight=size*1.4)=>{
  ctx.font=`${weight} ${size}px "DijeBody"`;ctx.fillStyle=color;ctx.textBaseline='alphabetic';
  lines.forEach((line,i)=>ctx.fillText(line,110,top+size*.96+i*lineHeight,848));
 };
 draw(['PARA'],694,21,700,'#7b756b');
 draw(layout.toLayout.lines,744,layout.toLayout.size,700,'#17201e',layout.toLayout.lineHeight);
 draw(layout.messageLayout.lines,layout.messageTop,layout.messageLayout.size,400,'#17201e',layout.messageLayout.lineHeight);
 draw(['DE'],1325,19,700,'#7b756b');
 draw(layout.fromLayout.lines,1364,layout.fromLayout.size,700,'#17201e',layout.fromLayout.lineHeight);
 return canvas;
}
