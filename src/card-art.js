// Vectores compartidos por las miniaturas, la tarjeta web y el PNG descargado.
export function cardArt(id){
 const arc='M -120 320 C 90 50 440 60 570 260 C 700 480 470 660 220 610';
 const leaf='M 80 1420 C 90 1270 180 1140 290 1070 M 120 1310 C 15 1260 25 1170 120 1210 C 180 1235 155 1280 120 1310 M 175 1210 C 160 1100 245 1065 255 1140 C 260 1180 210 1200 175 1210 M 220 1130 C 210 1020 300 990 300 1060 C 295 1100 250 1120 220 1130';
 const stars=[[115,180,12],[1060,370,18],[100,850,9],[1085,1110,13],[180,1460,15],[925,170,7],[1005,1490,8]];
 const starShapes=stars.map(([x,y,r])=>({type:'path',d:`M ${x-r} ${y} L ${x} ${y-r*2} L ${x+r} ${y} L ${x} ${y+r*2} Z`,fill:'currentColor',opacity:.5}));
 if(id==='club-neon')return [
  {type:'circle',cx:1150,cy:30,r:280,fill:'#c6b0ff',opacity:.16},
  {type:'path',d:'M 1030 170 L 1054 215 L 1100 210 L 1067 245 L 1090 290 L 1043 270 L 1010 305 L 1013 255 L 965 235 L 1013 225 Z',fill:'#d6ff5f',opacity:.9},
  {type:'path',d:'M 80 172 L 1120 172 M 80 1405 L 1120 1405',stroke:'#8e9d92',strokeWidth:2,opacity:.4},
  {type:'circle',cx:1200,cy:1100,r:230,stroke:'#c6b0ff',strokeWidth:2,opacity:.25}
 ];
 if(id==='boca')return [
  {type:'path',d:'M 0 135 H 1200 V 145 H 0 Z M 0 1580 H 1200 V 1600 H 0 Z',fill:'#ffd43b',opacity:.8},
  {type:'path',d:'M 0 135 L 1200 135 M 70 60 V 1540 M 1130 60 V 1540',stroke:'#ffd43b',strokeWidth:3,opacity:.2},
  {type:'circle',cx:1120,cy:0,r:240,fill:'#ffd43b',opacity:.1},
  {type:'path',d:'M 1020 1370 L 1031 1390 L 1054 1392 L 1037 1408 L 1040 1432 L 1020 1420 L 999 1432 L 1003 1408 L 985 1392 L 1009 1390 Z',fill:'#ffd43b',opacity:.7}
 ];
 if(id==='river')return [
  {type:'path',d:'M 680 -120 L 1320 520 L 1320 270 L 930 -120 Z',fill:'#c62d3d',opacity:1},
  {type:'path',d:'M -100 1050 L 450 1600 L 200 1600 L -100 1300 Z',fill:'#c62d3d',opacity:1},
  {type:'path',d:'M 110 135 H 850 M 350 1430 H 1090',stroke:'#c62d3d',strokeWidth:3,opacity:.35},
  {type:'circle',cx:1080,cy:1500,r:180,stroke:'#c62d3d',strokeWidth:2,opacity:.12}
 ];
 if(id==='futbol')return [
  {type:'path',d:'M 65 65 H 1135 V 1535 H 65 Z M 350 65 V 195 H 850 V 65 M 350 1535 V 1405 H 850 V 1535',stroke:'#f0f5e5',strokeWidth:3,opacity:.22},
  {type:'circle',cx:600,cy:800,r:190,stroke:'#f0f5e5',strokeWidth:3,opacity:.1},
  {type:'path',d:'M 65 800 H 1135',stroke:'#f0f5e5',strokeWidth:2,opacity:.08},
  {type:'path',d:'M 1070 225 L 1094 242 L 1085 270 H 1055 L 1046 242 Z',fill:'#f0f5e5',opacity:.65},
  {type:'circle',cx:1070,cy:247,r:54,stroke:'#f0f5e5',strokeWidth:3,opacity:.55}
 ];
 if(id==='amor')return [
  {type:'circle',cx:1090,cy:240,r:260,fill:'#f2a18f',opacity:.3},
  {type:'circle',cx:20,cy:1520,r:350,fill:'#df806e',opacity:.18},
  {type:'path',d:arc,stroke:'currentColor',strokeWidth:3,opacity:.23},
  {type:'path',d:'M 850 1410 C 700 1280 830 1180 870 1285 C 910 1180 1040 1280 850 1410 Z',stroke:'currentColor',strokeWidth:3,opacity:.2}
 ];
 if(id==='magia')return [...starShapes,{type:'circle',cx:600,cy:250,r:180,stroke:'currentColor',strokeWidth:2,opacity:.16},{type:'circle',cx:600,cy:250,r:205,stroke:'currentColor',strokeWidth:1,opacity:.12}];
 if(id==='pasion')return [
  {type:'circle',cx:1200,cy:40,r:300,stroke:'#20291c',strokeWidth:75,opacity:.13},
  {type:'circle',cx:-10,cy:1600,r:340,stroke:'#20291c',strokeWidth:55,opacity:.13},
  {type:'path',d:'M 55 280 L 180 280 M 117 217 L 117 343 M 1055 1300 L 1155 1300 M 1105 1250 L 1105 1350',stroke:'#20291c',strokeWidth:12,opacity:.5}
 ];
 if(id==='aurora')return [
  {type:'path',d:'M -100 -50 C 360 -150 150 310 680 150 C 1110 20 1400 280 1250 650 L 1250 -50 Z',fill:'#b5a2e1',opacity:.45},
  {type:'path',d:'M -50 1220 C 280 1020 500 1640 850 1330 C 1080 1110 1340 1370 1290 1640 L -50 1640 Z',fill:'#79bfae',opacity:.4},
  {type:'circle',cx:100,cy:400,r:190,stroke:'#7b659e',strokeWidth:2,opacity:.22}
 ];
 if(id==='botanica')return [
  {type:'path',d:leaf,stroke:'#718568',strokeWidth:4,opacity:.65},
  {type:'path',d:'M 1110 70 C 1130 250 1050 390 950 490 M 1070 280 C 1170 245 1190 340 1115 350 M 1030 370 C 1090 420 1020 490 990 430',stroke:'#718568',strokeWidth:4,opacity:.5},
  {type:'circle',cx:600,cy:250,r:145,stroke:'#718568',strokeWidth:2,opacity:.15}
 ];
 if(id==='quince-rosa')return [
  {type:'circle',cx:600,cy:260,r:190,stroke:'#aa6b78',strokeWidth:2,opacity:.32},
  {type:'circle',cx:600,cy:260,r:210,stroke:'#aa6b78',strokeWidth:1,opacity:.2},
  {type:'path',d:'M -40 110 C 120 0 250 30 220 160 C 160 310 -40 270 -40 110 Z M 1040 1330 C 1190 1190 1350 1320 1200 1510 C 1010 1570 960 1440 1040 1330 Z',fill:'#e8b6c2',opacity:.35},
  ...starShapes.slice(0,4)
 ];
 if(id==='quince-noche')return [
  {type:'path',d:'M 115 250 L 280 125 L 440 190 M 920 1400 L 1040 1230 L 1150 1320',stroke:'#ecd299',strokeWidth:2,opacity:.5},
  {type:'circle',cx:600,cy:255,r:195,stroke:'#ecd299',strokeWidth:2,opacity:.3},
  ...starShapes
 ];
 return [];
}
export function drawCardArt(ctx,model){
 for(const shape of cardArt(model.id)){
  ctx.save();ctx.globalAlpha=shape.opacity??1;ctx.lineWidth=shape.strokeWidth??1;
  const color=value=>value==='currentColor'?model.ink:value;
  if(shape.type==='circle'){ctx.beginPath();ctx.arc(shape.cx,shape.cy,shape.r,0,Math.PI*2);if(shape.fill){ctx.fillStyle=color(shape.fill);ctx.fill();}if(shape.stroke){ctx.strokeStyle=color(shape.stroke);ctx.stroke();}}
  else {const path=new Path2D(shape.d);if(shape.fill){ctx.fillStyle=color(shape.fill);ctx.fill(path);}if(shape.stroke){ctx.strokeStyle=color(shape.stroke);ctx.stroke(path);}}
  ctx.restore();
 }
}
