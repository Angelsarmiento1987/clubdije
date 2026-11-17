import * as esbuild from 'esbuild';
const ctx = await esbuild.context({entryPoints:['src/index.jsx'],bundle:true,outdir:'public/assets',sourcemap:true,loader:{'.js':'jsx'},define:{'process.env.NODE_ENV':'"development"'}});
await ctx.watch();
await ctx.serve({servedir:'public',fallback:'public/index.html',port:3000,host:'127.0.0.1'});
console.log('El Club del Dije: http://localhost:3000');
