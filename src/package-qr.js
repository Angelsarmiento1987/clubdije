import QRCode from 'qrcode';
import {displayCode,normalizeCode,validCode,wrapLines} from './gift-utils.js';
import {INSTAGRAM_HANDLE} from './business-info.js';
export {INSTAGRAM_HANDLE,INSTAGRAM_URL} from './business-info.js';
export function normalizePublicWebUrl(value){
 let url;try{url=new URL(String(value).trim());}catch{throw new Error('Ingresá la dirección pública completa de tu web, empezando con https://.');}
 const host=url.hostname.toLowerCase();
 if(url.protocol!=='https:'||url.username||url.password)throw new Error('La dirección pública debe usar https:// y no incluir credenciales.');
 if(host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host==='[::1]'||/^(127\.|10\.|192\.168\.|0\.)/.test(host)||/^172\.(1[6-9]|2\d|3[01])\./.test(host))throw new Error('Para el paquete usá la web publicada, no localhost ni una dirección de tu red local.');
 url.pathname=url.pathname.replace(/\/superadmin\/?$/,'/').replace(/index\.html$/,'');
 if(!url.pathname.endsWith('/')&&!url.pathname.split('/').pop().includes('.'))url.pathname+='/';
 url.search='';url.hash='';return url.href;
}
export function publicGiftUrl(base,code,kind='tarjeta'){
 if(!validCode(code))throw new Error('El código de tarjeta no es válido.');
 if(!['tarjeta','regalo','editar'].includes(kind))throw new Error('Tipo de enlace no válido.');
 const url=new URL(normalizePublicWebUrl(base));url.hash=kind+'='+normalizeCode(code);return url.href;
}
export function qrMatrix(url){return QRCode.create(url,{errorCorrectionLevel:'M'}).modules;}
export function qrSvgPath(matrix){
 let path='';for(let row=0;row<matrix.size;row++)for(let col=0;col<matrix.size;col++)if(matrix.data[row*matrix.size+col])path+=`M${col+4} ${row+4}h1v1h-1z`;
 return path;
}
export function drawQr(ctx,matrix,x,y,maxSize){
 const count=matrix.size+8,scale=Math.max(1,Math.floor(maxSize/count)),size=count*scale;
 const left=x+Math.floor((maxSize-size)/2),top=y+Math.floor((maxSize-size)/2);
 ctx.fillStyle='#ffffff';ctx.fillRect(x,y,maxSize,maxSize);ctx.fillStyle='#000000';
 for(let row=0;row<matrix.size;row++)for(let col=0;col<matrix.size;col++)if(matrix.data[row*matrix.size+col])ctx.fillRect(left+(col+4)*scale,top+(row+4)*scale,scale,scale);
}
export function qrCanvas(url){
 const matrix=qrMatrix(url),canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1000;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Este navegador no puede crear la imagen del QR.');drawQr(ctx,matrix,0,0,1000);return canvas;
}
export function packageCardCanvas(url,code){
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1000;const ctx=canvas.getContext('2d');
 if(!ctx)throw new Error('Este navegador no puede crear la etiqueta.');
 ctx.fillStyle='#111715';ctx.fillRect(0,0,1600,1000);ctx.fillStyle='#ffffff';ctx.fillRect(950,0,650,1000);
 ctx.textBaseline='top';ctx.textAlign='left';ctx.fillStyle='#d6ff5f';ctx.font='bold 40px Arial';ctx.fillText('EL CLUB DEL DIJE ●',75,70);
 ctx.font='bold 79px Arial';ctx.fillText('UN DETALLE.',75,180);ctx.fillText('MUY VOS.',75,275);
 ctx.fillStyle='#f3f3ec';ctx.font='30px Arial';
 const instructions='Escaneá el QR o ingresá el código en nuestra web. Elegí tu tarjeta, escribí la dedicatoria y compartí ese mismo código para regalarla.';
 wrapLines(instructions,t=>ctx.measureText(t).width,770).forEach((line,i)=>ctx.fillText(line,75,440+i*44));
 ctx.fillStyle='#bdb7d4';ctx.font='22px Arial';ctx.fillText('TARJETA VIRTUAL DE REGALO PARA DEDICATORIAS',75,660);
 ctx.fillStyle='#f3f3ec';const base=new URL(url);base.hash='';let webSize=26,webLines;
 do{ctx.font=`${webSize}px Arial`;webLines=wrapLines(base.href.replace(/^https:\/\//,''),t=>ctx.measureText(t).width,770);if(webLines.length*webSize*1.4<=120)break;webSize--;}while(webSize>12);
 webLines.forEach((line,i)=>ctx.fillText(line,75,735+i*webSize*1.4));
 ctx.fillStyle='#c6b0ff';ctx.font='bold 34px Arial';ctx.fillText(INSTAGRAM_HANDLE,75,895);
 drawQr(ctx,qrMatrix(url),1020,145,510);
 ctx.fillStyle='#111715';ctx.textAlign='center';ctx.font='bold 22px Arial';ctx.fillText('TU CÓDIGO',1275,710);
 let codeSize=42;do{ctx.font=`bold ${codeSize}px monospace`;if(ctx.measureText(displayCode(code)).width<=510)break;codeSize--;}while(codeSize>12);ctx.fillText(displayCode(code),1275,755);
 ctx.font='25px Arial';ctx.fillText('Escaneá. Escribí. Regalá.',1275,850);
 ctx.font='20px Arial';ctx.fillText('Sin registro. Un código, una historia.',1275,895);
 return canvas;
}
export function canvasBlob(canvas){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No se pudo crear la imagen.')),'image/png'));}
export function downloadBlob(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
export async function copyQr(url){
 if(!navigator.clipboard?.write||typeof ClipboardItem==='undefined')throw new Error('Este navegador no permite copiar imágenes. Descargá el QR y pegalo o insertalo desde ese archivo.');
 const png=canvasBlob(qrCanvas(url));await navigator.clipboard.write([new ClipboardItem({'image/png':png})]);
}
