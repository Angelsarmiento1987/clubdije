import {useEffect,useState} from 'react';
import {doc,onSnapshot,setDoc,serverTimestamp,collection,getCountFromServer,query,where,Timestamp} from 'firebase/firestore';
import {db} from './firebase.js';
import initialCatalog from './productos.json' with {type:'json'};
import {newCode} from './gift-utils.js';
export {initialCatalog};
export function mergeCatalogs(remote){
 const catalogs=remote.updatedAt>=initialCatalog.updatedAt?[initialCatalog,remote]:[remote,initialCatalog];
 const merged=new Map();catalogs.forEach(c=>c.products.forEach(p=>merged.set(p.id,p)));
 return {updatedAt:catalogs[1].updatedAt,products:[...merged.values()]};
}
export function useCatalog(){
 const [catalog,setCatalog]=useState(initialCatalog);
 useEffect(()=>onSnapshot(doc(db,'site','catalog'),snap=>{if(snap.exists()&&Array.isArray(snap.data().products)&&snap.data().products.length)setCatalog(mergeCatalogs(snap.data()));},()=>{/* El catálogo incluido sigue disponible si falla la conexión. */}),[]);
 return catalog;
}
export async function publishCatalog(catalog){
 const products=catalog.products.map(({id,title,category,image,url})=>({id,title,category,image,url}));
 const value={updatedAt:new Date().toISOString().slice(0,10),products};
 if(products.length>1000||new TextEncoder().encode(JSON.stringify(value)).length>800000)throw new Error('El catálogo excede el límite de esta versión (1000 productos o 800 KB).');
 await setDoc(doc(db,'site','catalog'),value);
}
export function recordVisit(){
 try{
  if(sessionStorage.getItem('club-visit-saved'))return;
  let id=sessionStorage.getItem('club-visit-id');if(!id){id=newCode();sessionStorage.setItem('club-visit-id',id);}
  setDoc(doc(db,'visits',id),{createdAt:serverTimestamp()}).then(()=>sessionStorage.setItem('club-visit-saved','1')).catch(()=>{});
 }catch{/* Navegar no depende de permitir almacenamiento de sesión. */}
}
export async function visitStats(){
 const visits=collection(db,'visits');
 const [all,month]=await Promise.all([getCountFromServer(visits),getCountFromServer(query(visits,where('createdAt','>=',Timestamp.fromMillis(Date.now()-30*86400000))))]);
 return {total:all.data().count,last30:month.data().count};
}
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const allowedProduct=url=>{try{const u=new URL(url);return u.protocol==='https:'&&(u.hostname==='mercadolibre.com.ar'||u.hostname.endsWith('.mercadolibre.com.ar'));}catch{return false;}};
function identifier(url){const u=new URL(url);const wid=new URLSearchParams(u.hash.slice(1)).get('wid')||u.searchParams.get('wid');if(/^MLA\d+$/.test(wid||''))return wid;const match=u.pathname.match(/\b(MLAU?)-?(\d+)\b/);return match?match[1]+match[2]:null;}
function category(title){const t=normalize(title);if(/\bpulseras?\b/.test(t))return 'Pulseras';if(/\baros?\b/.test(t))return 'Aros';if(/\banillos?\b/.test(t))return 'Anillos';if(/\bllaveros?\b/.test(t))return 'Llaveros';return 'Dijes y collares';}
export async function importProductFiles(files,current){
 const found=new Map();let expected=0;
 for(const file of files){
  const text=await file.text();
  if(file.name.toLowerCase().endsWith('.json')){
   const data=JSON.parse(text);if(!Array.isArray(data.products))throw new Error('El JSON debe tener un arreglo products.');
   for(const p of data.products){if(!['id','title','category','image','url'].every(key=>typeof p[key]==='string'&&p[key].length>0)||!/^MLAU?\d+$/.test(p.id)||!allowedProduct(p.url)||!/^https:\/\/[^/]*\.mlstatic\.com\//.test(p.image||''))throw new Error('Un producto del JSON tiene datos o enlaces inválidos.');found.set(p.id,{id:p.id,title:p.title,category:p.category,url:p.url,image:p.image});}
  }else{
   const html=new DOMParser().parseFromString(text,'text/html');
   let tiles=[...html.querySelectorAll('.ui-search-layout__item')];if(!tiles.length)tiles=[...html.querySelectorAll('.poly-card')];
   if(!tiles.length)throw new Error(`No se encontraron productos en ${file.name}. Guardá la página con sus publicaciones visibles.`);
   const textNodes=[];const walker=html.createTreeWalker(html.body,4);let node;while((node=walker.nextNode())){if(!['SCRIPT','STYLE'].includes(node.parentElement?.tagName))textNodes.push(node.textContent);}
   const total=textNodes.join(' ').match(/([\d.]+)\s+resultados?\b/i);if(total)expected=Math.max(expected,Number(total[1].replaceAll('.','')));
   for(const tile of tiles){
    const link=tile.querySelector('a.poly-component__title')||tile.querySelector('a.ui-search-link')||[...tile.querySelectorAll('a[href]')].find(a=>allowedProduct(a.getAttribute('href'))&&identifier(a.getAttribute('href')));
    const url=link?.getAttribute('href');if(!url||!allowedProduct(url))throw new Error('Una publicación tiene un enlace inválido.');
    const id=identifier(url),title=(tile.querySelector('.poly-component__title,.ui-search-item__title')||link).textContent.replace(/\s+/g,' ').trim();
    const image=[...tile.querySelectorAll('img')].flatMap(img=>[img.getAttribute('data-src'),img.getAttribute('data-lazy-src'),img.getAttribute('src')]).find(u=>/^https:\/\/[^/]*\.mlstatic\.com\//.test(u||''));
    if(!id||!title||!image)throw new Error('Una publicación no tiene título, identificador o imagen. Se conserva el catálogo actual.');
    found.set(id,{id,title,image,url,category:category(title)});
   }
  }
 }
 if(!found.size)throw new Error('No se encontraron productos para importar.');
 if(expected&&found.size<expected)throw new Error(`Faltan páginas: hay ${found.size} productos de ${expected}. Seleccioná todas las páginas del vendedor juntas.`);
 if(found.size<Math.max(1,Math.floor(current.products.length/2)))throw new Error('La lectura es demasiado pequeña. Seleccioná todas las páginas del vendedor.');
 const merged=new Map(current.products.map(p=>[p.id,p]));const added=[];
 for(const p of found.values()){const previous=merged.get(p.id);if(!previous)added.push(p);merged.set(p.id,{...p,category:previous?.category||p.category});}
 return {products:[...merged.values()],added,readCount:found.size};
}
