// Deterministic editorial layout: original app captures are scaled uniformly,
// without reconstructing, retouching or hiding the UI's preview labels.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = path.resolve(__dirname, '../../..');
const pack = path.resolve(__dirname, '..');
const cache = path.join(os.tmpdir(), 'bora-store-fontcache');
fs.mkdirSync(cache, { recursive: true });
const fonts = path.join(root, 'node_modules/@expo-google-fonts/montserrat');
const config = path.join(cache, 'fonts.conf');
fs.writeFileSync(config, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${fonts}</dir><cachedir>${cache}</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = config;
let sharp;
try { sharp = require('sharp'); } catch {
  sharp = require(path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'));
}
const titles = [
  { file:'01-home', lines:['Seu ritmo.','Sua energia.'], sub:'Movimento e mente na mesma jornada.' },
  { file:'02-atividades', lines:['Cada atividade','conta.'], sub:'Encontre um jeito de cuidar de você.' },
  { file:'03-constancia', lines:['Um dia','de cada vez.'], sub:'Explore sua constância no calendário.' },
  { file:'04-nivel', lines:['Sua evolução,','com clareza.'], sub:'EV acumulados e Vitalidade lado a lado.' },
  { file:'05-apresentacao', lines:['Corpo e mente.','Juntos em EV.'], sub:'Conheça a proposta do Bóra.' },
];
function xml(s) { return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function svgBuffer(s) { return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="2064" height="2752">${s}</svg>`); }
async function label(value, size, color='#FFFFFF', bold=false) {
  return sharp({text:{text:`<span foreground="${color}">${xml(value)}</span>`,font:`Montserrat ${bold?'Bold':'Regular'} ${size}`,fontfile:path.join(fonts,bold?'700Bold/Montserrat_700Bold.ttf':'400Regular/Montserrat_400Regular.ttf'),rgba:true,dpi:72}}).png().toBuffer();
}
async function make(device, item) {
  const tablet=device==='ipad';
  const w=tablet?2064:1206, h=tablet?2752:2622;
  const x=tablet?130:78;
  const sw=tablet?1530:900, sh=tablet?2040:1957, sx=Math.round((w-sw)/2), sy=tablet?600:610;
  const source=path.join(pack,'capturas-originais',device,`${item.file}.png`);
  const bg=await sharp(path.join(__dirname,'fundo-energia-original.png')).resize(w,h,{fit:'cover'}).removeAlpha().toBuffer();
  const mark=await sharp(path.join(root,'assets/imgs/Logo.svg')).resize(tablet?62:49,tablet?70:56).png().toBuffer();
  const signature=fs.readFileSync(path.join(root,'assets/imgs/Tipo.svg'),'utf8').replace(/fill="#[^"]+"/g,'fill="#FFFFFF"');
  const typeWhite=await sharp(Buffer.from(signature)).resize(tablet?175:140,null).png().toBuffer();
  const plate=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect x="${sx-14}" y="${sy-14}" width="${sw+28}" height="${sh+28}" rx="76" fill="#0A3C55" stroke="#39728B" stroke-width="3"/></svg>`);
  const screenshot=await sharp(source).resize(sw,sh,{fit:'fill'}).composite([{input:Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${sw}" height="${sh}"><rect width="${sw}" height="${sh}" rx="64" fill="white"/></svg>`),blend:'dest-in'}]).png().toBuffer();
  const overlays=[{input:plate,top:0,left:0},{input:mark,top:tablet?72:64,left:x},{input:typeWhite,top:tablet?83:74,left:x+(tablet?76:62)}];
  overlays.push({input:await label('PILOTO · TESTFLIGHT',tablet?27:22,'#79FF00',true),top:tablet?174:160,left:x});
  for(let i=0;i<item.lines.length;i++) overlays.push({input:await label(item.lines[i],tablet?112:86,'#FFFFFF',true),top:(tablet?244:230)+i*(tablet?132:105),left:x});
  overlays.push({input:await label(item.sub,tablet?38:31,'#C0D9E5'),top:tablet?515:473,left:x});
  overlays.push({input:screenshot,top:sy,left:sx});
  const output=path.join(pack,'imagens',device,`${item.file}-${w}x${h}.png`);
  await sharp(bg).composite(overlays).flatten({background:'#002B45'}).removeAlpha().png().toFile(output);
  return {device,file:path.relative(pack,output),width:w,height:h,title:item.lines.join(' '),source:path.relative(pack,source)};
}
(async()=>{
 const outputs=[];
 for(const item of titles) outputs.push(await make('iphone',item));
 outputs.push(await make('ipad',{file:'01-apresentacao',lines:['Sua jornada','começa aqui.'],sub:'Corpo e mente, no seu ritmo.'}));
 const thumbs=[];
 for(let i=0;i<5;i++) thumbs.push({input:await sharp(path.join(pack,outputs[i].file)).resize(270,587).toBuffer(),left:45+i*310,top:250});
 const logo=await sharp(path.join(pack,'icones/bora-principal-1024.png')).resize(110,110).toBuffer();
 const title=await label('Bóra · piloto TestFlight',44,'#FFFFFF',true);
 const subtitle=await label('Nibilabs · ícones, imagens e textos em português',25,'#9BBBCF');
 await sharp({create:{width:1600,height:960,channels:3,background:'#002B45'}}).composite([{input:logo,left:50,top:50},{input:title,left:190,top:65},{input:subtitle,left:190,top:127},...thumbs,{input:await label('Capturas reais do app · valores de demonstração preservados',24,'#9BBBCF'),left:50,top:890}]).png().toFile(path.join(pack,'visao-geral.png'));
 fs.writeFileSync(path.join(pack,'manifesto-imagens.json'),JSON.stringify({created:'2026-10-19',locale:'pt-BR',distribution:'TestFlight pilot',copyright:'Nibilabs',images:outputs},null,2)+'\n');
 console.log(`Geradas ${outputs.length} imagens e uma visão geral.`);
})();
