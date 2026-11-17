function baseURL(){
 const url=new URL(window.location.href);
 url.pathname=url.pathname.replace(/\/superadmin\/?$/,'/').replace(/index\.html$/,'');
 if(!url.pathname.endsWith('/'))url.pathname+='/';
 url.hash='';url.search='';return url;
}
export function adminLink(){if(typeof window==='undefined')return './superadmin';const url=baseURL();url.pathname+='superadmin';return url.href;}
export function homeLink(){if(typeof window==='undefined')return './#tarjetas';const url=baseURL();url.hash='tarjetas';return url.href;}
