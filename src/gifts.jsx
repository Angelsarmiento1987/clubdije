import React,{useEffect,useState,useMemo,useId} from 'react';
import {models,validCode,shortCode,displayCode,giftLink,formatExpiry,expiryDate,validateGift,downloadCard} from './gift-utils.js';
import {loadInvitation,confirmGift,loadCard,resolveGiftCode} from './gift-service.js';
import Admin from './superadmin.jsx';
import {modelGroups} from './card-models.js';
import {renderStorySvg,canvasMeasurer,loadStoryFonts} from './story-card.js';
import {INSTAGRAM_HANDLE,INSTAGRAM_URL} from './business-info.js';
import {adminLink,homeLink} from './site-links.js';
import {ComicLogo} from './comic-art.jsx';

export function useGiftRoute(){
 const read=()=>{
  if(typeof window==='undefined')return {kind:'home',code:''};
  if(/\/superadmin\/?$/.test(window.location.pathname))return {kind:'admin',code:''};
  const params=new URLSearchParams(window.location.hash.slice(1));
  if(params.has('tarjeta'))return {kind:'auto',code:params.get('tarjeta')};
  if(params.has('editar'))return {kind:'edit',code:params.get('editar')};
  if(params.has('regalo'))return {kind:'read',code:params.get('regalo')};
  if(window.location.hash==='#admin-tarjetas')return {kind:'admin',code:''};
  return {kind:'home',code:''};
 };
 const [route,setRoute]=useState(read);
 useEffect(()=>{const update=()=>setRoute(read());window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
 return route;
}
export function errorText(error){
 if(error?.code==='auth/unauthorized-domain')return 'Este dominio no está autorizado para Google. En Firebase → Authentication → Settings → Authorized domains agregá localhost para la prueba local o el dominio de tu web publicada.';
 if(error?.code==='auth/operation-not-allowed')return 'Habilitá Google en Firebase → Authentication → Sign-in method.';
 if(error?.code==='auth/popup-blocked')return 'El navegador bloqueó la ventana de Google. Permití ventanas emergentes para esta página y volvé a ingresar.';
 if(error?.code==='auth/popup-closed-by-user'||error?.code==='auth/cancelled-popup-request')return 'No se completó el ingreso con Google. Volvé a intentarlo cuando estés listo.';
 if(error?.code==='admin/data-timeout')return 'La consulta tardó demasiado. Revisá la conexión y volvé a actualizar.';

 if(error?.code==='permission-denied')return 'No pudimos acceder. El código puede estar vencido, utilizado o cancelado. Si sos administrador, revisá los permisos de tu usuario.';
 if(error?.code==='unavailable')return 'No pudimos conectar con el servidor. Revisá tu conexión y volvé a intentarlo.';
 if(error?.code?.startsWith('auth/'))return 'No pudimos iniciar sesión. Revisá la configuración de Google y el dominio habilitado en Firebase.';
 if(error?.code==='failed-precondition')return 'Falta completar la configuración de la base de datos. Revisá los índices indicados en las instrucciones.';
 return error?.message || 'Ocurrió un problema. Volvé a intentarlo.';
}
export function Notice({children,error=false}){return children?<p className={'gift-notice '+(error?'gift-error':'')} role={error?'alert':'status'}>{children}</p>:null;}
function StoryThumbnail({model}){
 const uid=useId();
 const svg=useMemo(()=>renderStorySvg({model:model.id},{uid:'thumb-'+uid,thumbnail:true}),[model.id,uid]);
 return <span className="story-thumbnail" aria-hidden="true" dangerouslySetInnerHTML={{__html:svg}}/>;
}
export function ModelPicker({model,onChange}){
 const selected=models.find(m=>m.id===model)||models[0];
 return <div className="story-picker">
  <h3>Elegí la temática de tu regalo</h3>
  <div className="story-theme-tabs" role="group" aria-label="Temáticas de tarjetas">
   {modelGroups.map(([id,label])=><button key={id} type="button" aria-pressed={selected.group===id}
    onClick={()=>onChange(models.find(m=>m.group===id).id)}>{label}</button>)}
  </div>
  <div className="story-theme-grid" role="group" aria-label="Diseños de la temática elegida">
   {models.filter(m=>m.group===selected.group).map(m=><button className="story-option" key={m.id} type="button"
    aria-pressed={m.id===model} onClick={()=>onChange(m.id)}>
    <StoryThumbnail model={m}/><span>{m.name}</span>{m.id===model&&<b aria-hidden="true">✓</b>}
   </button>)}
  </div>
 </div>;
}
export function CardPreview({card}){
 const uid=useId(),[fontsReady,setFontsReady]=useState(false);
 useEffect(()=>{let active=true;loadStoryFonts().then(()=>{if(active)setFontsReady(true);}).catch(()=>{});return()=>{active=false;};},[]);
 const svg=useMemo(()=>{
  let measure;if(typeof document!=='undefined'){const ctx=document.createElement('canvas').getContext('2d');if(ctx)measure=canvasMeasurer(ctx);}
  return renderStorySvg(card,{uid:'preview-'+uid,measure});
 },[card.model,card.to,card.from,card.message,uid,fontsReady]);
 return <div className="story-card-frame" dangerouslySetInnerHTML={{__html:svg}}/>;
}
function CodeForm({kind='tarjeta',label='Ingresá tu código'}){
 const [code,setCode]=useState(''),[error,setError]=useState('');
 return <form className="gift-form" onSubmit={e=>{e.preventDefault();if(!validCode(code)){setError('Copiá el código completo de tu tarjeta. Se permiten espacios y guiones.');return;}window.location.hash=kind+'='+encodeURIComponent(code.replace(/[\s-]/g,'').toUpperCase());}}><label>{label}<input value={code} onChange={e=>{setCode(e.target.value);setError('');}} placeholder="Ej.: ABCDE-FG234" autoComplete="off" autoCapitalize="characters" spellCheck="false" required maxLength={100}/></label><button className="button primary" type="submit">Abrir tarjeta ↗</button><Notice error>{error}</Notice></form>;
}
export function GiftCards(){
 const [model,setModel]=useState('club-neon');
 const selected = models.find(item => item.id === model);
 return <section className="gifts gift-studio" id="tarjetas" aria-labelledby="gift-heading">
  <div className="gift-studio-top">
   <div className="gift-intro">
    <div className="comic-kicker">TARJETAS DE REGALO</div>
    <h2 id="gift-heading">Un regalo. <span>Tu mensaje.</span></h2>
    <p>Con el código de tu dije podés escribir una dedicatoria o descubrir la que prepararon para vos.</p>
   </div>
   <CodeForm/>
  </div>
  <div className="gift-studio-body">
   <div className="gift-studio-picker">
    <span className="gift-studio-label">EXPLORÁ LOS {models.length} DISEÑOS</span>
    <ModelPicker model={model} onChange={setModel}/>
   </div>
   <div className="gift-showcase">
    <div className="gift-showcase-heading">
     <span className="gift-studio-label">VISTA PREVIA</span>
     <span className="gift-story-format">Historia · 9:16</span>
    </div>
    <CardPreview card={{model}}/>
    <p className="gift-showcase-title" aria-live="polite">{selected?.name}</p>
   </div>
  </div>
  <div className="gift-studio-foot">
   <p>Podés descargar la tarjeta para Instagram. Queda disponible durante 30 días desde que la confirmás.</p>
   <a className="gift-admin-link" href={adminLink()}>Administración de tarjetas</a>
  </div>
 </section>;
}
export function CopyValue({label,value}){
 const [copied,setCopied]=useState(false),[error,setError]=useState('');
 return <label className="gift-copy">{label}<input readOnly value={value} onFocus={e=>e.target.select()}/><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(value);setCopied(true);setError('');}catch{setError('Seleccioná el texto y copialo manualmente.');}}}>{copied?'Copiado ✓':'Copiar'}</button>{error&&<small role="status">{error}</small>}</label>;
}
function Writer({code,initialInvitation=null}){
 const [invitation,setInvitation]=useState(initialInvitation),[error,setError]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(''),[review,setReview]=useState(false);
 const [values,setValues]=useState({to:'',from:'',message:'',model:'club-neon'});
 useEffect(()=>{if(initialInvitation)return;let active=true;loadInvitation(code).then(d=>{if(active)setInvitation(d);}).catch(e=>{if(active)setError(errorText(e));});return()=>{active=false;};},[code,initialInvitation]);
 useEffect(()=>{if(done||!values.message)return;const warn=e=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[values.message,done]);
 const send=async()=>{
  if(busy)return;if(!navigator.onLine){setError('Necesitás conexión para confirmar tu tarjeta.');return;}
  setBusy(true);setError('');
  try{setDone(await confirmGift(invitation,values));}catch(e){setError(errorText(e));}finally{setBusy(false);}
 };
 if(done)return <div className="gift-complete"><div className="eyebrow">DEDICATORIA CONFIRMADA</div><h1>Ya tiene algo de vos ♡</h1><p>La tarjeta quedó guardada. Quien tenga el código de lectura podrá verla y descargarla durante 30 días desde este momento.</p><CopyValue label="Código de la tarjeta" value={displayCode(done)}/><CopyValue label="Enlace para compartir" value={giftLink(shortCode(done)?'tarjeta':'regalo',done)}/><a className="button primary" href={giftLink(shortCode(done)?'tarjeta':'regalo',done)}>Ver la tarjeta ↗</a><p className="gift-note">Compartí el código o enlace de la tarjeta. La dedicatoria ya no se puede modificar.</p></div>;
 if(!invitation)return <><h1>Tu regalo empieza acá.</h1><Notice error={!!error}>{error||'Comprobando tu código…'}</Notice><CodeForm label="Ingresá otro código"/></>;
 const update=(name,value)=>{setValues(v=>({...v,[name]:value}));setReview(false);setError('');};
 return <><div className="gift-page-heading"><div className="eyebrow">UN MENSAJE QUE QUEDA</div><h1>Decilo a tu manera.</h1><p>La tarjeta se podrá ver durante 30 días desde que la confirmes. El destinatario podrá descargarla para conservarla.</p></div><div className="gift-editor"><form className="gift-form" onSubmit={e=>{e.preventDefault();const message=validateGift(values);setError(message);if(!message)setReview(true);}}><fieldset disabled={busy}>{[['to','Para',60],['from','De parte de',60]].map(([name,label,max])=><label key={name}>{label}<input required maxLength={max} value={values[name]} onChange={e=>update(name,e.target.value)} autoComplete="off"/></label>)}<label>Tu dedicatoria<textarea required rows={7} maxLength={1200} value={values.message} onChange={e=>update('message',e.target.value)}/><small>{values.message.length}/1200 caracteres · hasta 24 renglones</small></label><ModelPicker model={values.model} onChange={model=>update('model',model)}/><p className="gift-note">Quien tenga el código de lectura podrá ver este mensaje. Evitá incluir datos sensibles. Después de confirmar, el texto queda cerrado.</p>{!review&&<button className="button primary" type="submit">Revisar mi tarjeta ↗</button>}</fieldset>{review&&<div className="gift-confirm"><p>Revisá los nombres y el mensaje. ¿Está lista para regalar?</p><button className="button primary" type="button" disabled={busy} onClick={send}>{busy?'Guardando en el servidor…':'Confirmar y cerrar tarjeta'}</button><button type="button" className="button outline" disabled={busy} onClick={()=>setReview(false)}>Seguir editando</button></div>}<Notice error>{error}</Notice></form><div><span className="gift-preview-label">VISTA PREVIA</span><CardPreview card={values}/></div></div></>;
}
function Reader({code,initialCard=null}){
 const [card,setCard]=useState(initialCard),[error,setError]=useState(''),[busy,setBusy]=useState(false),[opened,setOpened]=useState(false),[expired,setExpired]=useState(false),[downloadError,setDownloadError]=useState('');
 useEffect(()=>{if(initialCard)return;let active=true;loadCard(code).then(d=>{if(active)setCard(d);}).catch(e=>{if(active)setError(errorText(e));});return()=>{active=false;};},[code,initialCard]);
 useEffect(()=>{if(!card)return;let timer;const check=()=>{const remain=expiryDate(card.createdAt).getTime()-Date.now();if(remain<=0){setExpired(true);setCard(null);}else timer=setTimeout(check,Math.min(remain,60000));};check();return()=>clearTimeout(timer);},[card]);
 if(expired)return <><h1>Esta tarjeta ya venció.</h1><p>Se cumplieron los 30 días de disponibilidad. Si la descargaste, tu copia sigue en tu celular.</p></>;
 if(!card)return <><h1>Un detalle para vos.</h1><Notice error={!!error}>{error||'Buscando tu tarjeta…'}</Notice><CodeForm/></>;
 return <div className="gift-reader"><div className="eyebrow">ALGUIEN PENSÓ EN VOS</div><h1>Hay algo para vos{opened?' ♡':'.'}</h1>{!opened?<button className="gift-envelope" onClick={()=>setOpened(true)} aria-label="Abrir mi tarjeta de regalo"><span aria-hidden="true">✉</span><strong>Un pequeño detalle.<br/>Un gran significado.</strong><span className="button primary">Abrir mi tarjeta ♡</span></button>:<div className="gift-reveal"><CardPreview card={card}/><p className="gift-expiry">Disponible hasta el {formatExpiry(card.createdAt)} (Argentina).<br/>Descargala para conservarla después de esa fecha.</p><button className="button primary" disabled={busy} onClick={async()=>{setBusy(true);setDownloadError('');try{const fresh=await loadCard(code);await downloadCard(fresh);}catch(e){setDownloadError(errorText(e));}finally{setBusy(false);}}}>{busy?'Preparando imagen…':'Descargar tarjeta como imagen ↓'}</button><p className="gift-note">Se descarga como PNG vertical de 1080 × 1920. Podés subirla a tus historias de Instagram o compartirla por WhatsApp.</p><Notice error>{downloadError}</Notice></div>}</div>;
}
function CodeResolver({code}){
 const [resolved,setResolved]=useState(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;resolveGiftCode(code).then(value=>{if(active)setResolved(value);}).catch(e=>{if(active)setError(errorText(e));});return()=>{active=false;};},[code]);
 if(!resolved)return <><h1>Tu tarjeta de regalo.</h1><Notice error={!!error}>{error||'Comprobando tu código…'}</Notice>{error&&<CodeForm label="Ingresá otro código"/>}</>;
 return resolved.kind==='edit'?<Writer code={code} initialInvitation={resolved.invitation}/>:<Reader code={code} initialCard={resolved.card}/>;
}
export function GiftPortal({route}){
 useEffect(()=>{window.scrollTo(0,0);const meta=document.createElement('meta');meta.name='robots';meta.content='noindex,nofollow';document.head.append(meta);return()=>meta.remove();},[route.kind,route.code]);
 return <div className="gift-portal comic-portal"><header className="gift-portal-header"><a href={homeLink()} aria-label="El Club del Dije, inicio"><ComicLogo/></a><a href={homeLink()}>Volver al catálogo ↗</a></header><main className="gift-portal-main" key={route.kind+route.code}>{route.kind==='admin'?<Admin/>:route.kind==='auto'?<CodeResolver code={route.code}/>:route.kind==='edit'?<Writer code={route.code}/>:<Reader code={route.code}/>}</main><footer className="gift-portal-footer">Detalles que hablan de vos. · El Club del Dije</footer></div>;
}
