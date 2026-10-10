(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SplupMusicPlayerModel=api;})(globalThis,function(){
  'use strict';
  const spec={version:'2026-10-07-album-cdp',sizes:{compact:{grid:'4x2',w:181,h:86.5},standard:{grid:'6x2',w:275.5,h:86.5},expanded:{grid:'6x4',w:275.5,h:181},vertical:{grid:'2x6',w:86.5,h:275.5}},motion:{rotationMs:8000,equalizerMs:720,pressMs:110,resizeMs:280,easing:'cubic-bezier(.22,1,.36,1)',tiltY:0,projection:1,previewDuration:30}};
  spec.disc={aspectRatio:1,outerDiameterMm:120,holeDiameterMm:15,holeRatio:.125,hubRatio:.275,projection:'front',crop:'none',source:'https://ecma-international.org/wp-content/uploads/ECMA-130_2nd_edition_june_1996.pdf'};
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  function geometry(w,h,options={}){
    const external=!!options.external,tiny=w<110&&h<110,rail=h/w>=2.5;
    const portrait=rail||!(w/h>=1.55||(w>=240&&w>h)),expanded=!portrait&&w>=240&&h>=150,compact=!portrait&&!expanded;
    const albumSquare=w>=170&&w<210&&Math.abs(w-h)<8;
    const pad=tiny?8:rail?Math.min(12,Math.max(8,(w-44)/2)):12,controls=expanded&&!external?44:0,bodyH=h-controls;
    const titleSize=tiny?10:w<150?12:14,titleLine=tiny?13:18,artistSize=10,artistLine=14;
    const sourceLine=tiny||(portrait&&!rail&&h<150)?0:16,sourceGap=sourceLine?3:0,titleLines=rail?2:1;
    const metaH=tiny?13:titleLine*titleLines+2+artistLine+sourceGap+sourceLine;
    let d,disc,meta,artwork,play;
    if(portrait){
      d=Math.max(12,Math.min(w-2*pad,rail?w-2*pad:bodyH-2*pad-metaH-8));
      if(albumSquare)d=Math.min(104,w-24,bodyH-2*pad-metaH-8);
      disc={x:(w-d)/2,y:pad,size:d,w:d,h:d};
      meta={x:albumSquare?12:pad,y:rail?pad+d+18:bodyH-pad-metaH,w:w-2*(albumSquare?12:pad),h:metaH};
      play={x:rail?(w-30)/2:w-pad-26,y:rail?bodyH-pad-30:meta.y,size:rail?30:26,visible:false};
      artwork={x:pad,y:meta.y+metaH-18,size:tiny?0:18};
    }else{
      d=Math.min(bodyH-2*pad,expanded?112:72);
      disc={x:w-pad-d,y:(bodyH-d)/2,size:d,w:d,h:d};
      meta={x:pad,y:(bodyH-metaH)/2,w:disc.x-pad-12,h:metaH};
      play={x:pad+meta.w-24,y:meta.y+metaH-24,size:24,visible:false};
      artwork={x:pad,y:meta.y+metaH-18,size:18};
    }
    const source={x:meta.x,y:meta.y+metaH-sourceLine,w:meta.w,h:sourceLine,compact:true,iconOnly:rail};
    return {w,h,tiny,rail,portrait,expanded,compact,external,bodyH,controls,disc,artwork,meta,source,play,textW:meta.w,titleSize,artistSize,sourceSize:10,titleLine,artistLine,sourceLine,titleLines,sourceGap,gap:8,pad,radius:tiny?17:24};
  }
  function mix(a,b,t){return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');}
  function colors(p={base:'#412410',accent:'#643719'}){
    const a=p.ambient||[p.accent,p.base,p.accent];
    const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722};
    const readable=c=>{for(let i=0;i<20&&(lum('#E7E5EB')+.05)/(lum(c)+.05)<4.8;i++)c=mix(c,'#121218',.06);return c;};
    const base=readable(mix(p.base,'#121218',.48)),accent=readable(mix(a[0]||p.accent,'#121218',.46)),glow=readable(mix(a[1]||p.base,'#121218',.5)),shade=readable(mix(a[2]||p.base,'#121218',.62));
    return {base,accent,glow,shade,foreground:'#FAFAFA',secondary:'#E7E5EB'};
  }
  const luminance=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  const contrast=(fg,bg)=>(Math.max(luminance(fg),luminance(bg))+.05)/(Math.min(luminance(fg),luminance(bg))+.05);
  function paletteFromPixels(pixels){
    // The same content-only rule applies to every cover; album IDs and URLs are never consulted.
    const buckets=new Map(),neutral={count:0,sum:[0,0,0]};let total=0,chromatic=0;
    for(let i=0;i+3<pixels.length;i+=4){
      if(pixels[i+3]<204)continue;
      const c=[pixels[i],pixels[i+1],pixels[i+2]],hi=Math.max(...c),lo=Math.min(...c),delta=hi-lo;total++;
      if(hi<24||lo>244)continue;
      const sat=hi?delta/hi:0;
      if(sat<.16||delta<16){neutral.count++;c.forEach((v,j)=>neutral.sum[j]+=v);continue;}
      let hue=hi===c[0]?(c[1]-c[2])/delta:hi===c[1]?(c[2]-c[0])/delta+2:(c[0]-c[1])/delta+4;hue=(hue*60+360)%360;
      const key=Math.floor(hue/20),bucket=buckets.get(key)||{count:0,sum:[0,0,0],sat:0,brightness:0,hue:key*20+10};
      bucket.count++;c.forEach((v,j)=>bucket.sum[j]+=v);bucket.sat+=sat;bucket.brightness+=hi/255;buckets.set(key,bucket);chromatic++;
    }
    const hex=c=>'#'+c.map(v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,'0')).join('');
    const candidates=[...buckets.values()].filter(b=>b.count>=Math.max(2,total*.015)).map(b=>({...b,color:hex(b.sum.map(v=>v/b.count)),score:Math.sqrt(b.count/Math.max(1,total))*(.2+Math.pow(b.sat/b.count,1.5))*(.25+.75*b.brightness/b.count)})).sort((a,b)=>b.score-a.score||a.hue-b.hue);
    const monochrome=chromatic<Math.max(2,total*.04)||!candidates.length;
    let keys;
    if(monochrome){const n=neutral.count?neutral.sum.map(v=>v/neutral.count):[160,160,160];const gray=hex([n.reduce((a,b)=>a+b)/3,n.reduce((a,b)=>a+b)/3,n.reduce((a,b)=>a+b)/3]);keys=[gray,gray];}
    else {const first=candidates[0],second=candidates.find(b=>Math.min(Math.abs(b.hue-first.hue),360-Math.abs(b.hue-first.hue))>=40);keys=[first.color,second?.color||mix(first.color,'#FFFFFF',.22)];}
    let accent=keys[0];for(let i=0;i<60&&contrast('#FFFFFF',accent)<4.8;i++)accent=mix(accent,'#121218',.06);
    return {base:mix(accent,'#121218',.34),accent,ambient:keys,keyColors:keys,foreground:'#FFFFFF',contrast:+contrast('#FFFFFF',accent).toFixed(2),monochrome,source:'artwork-pixels',algorithmVersion:'cover-key-colors-v2'};
  }
  function cdpColors(p){
    const valid=c=>/^#[0-9a-f]{6}$/i.test(c||'');
    const keys=p?.keyColors||p?.ambient||[p?.accent],primary=valid(keys?.[0])?keys[0]:'#A0A0A0',secondary=valid(keys?.[1])?keys[1]:primary;
    // Preserve the cover hue. Lift only the shell stops if text contrast needs more lightness.
    const readable=(key,white)=>{let color=mix(key,'#FFFFFF',white);while(contrast('#49404B',color)<4.8&&white<1){white=Math.min(1,white+.02);color=mix(key,'#FFFFFF',white);}return color;};
    const top=readable(primary,.70),middle=readable(primary,.58),bottom=readable(secondary,.62);
    return {top,middle,bottom,foreground:'#29282E',secondary:'#49404B',accent:primary,keyColors:[primary,secondary],secondaryContrast:+Math.min(...[top,middle,bottom].map(c=>contrast('#49404B',c))).toFixed(2)};
  }
  const time=t=>`${Math.floor(Math.max(0,t||0)/60)}:${String(Math.floor(Math.max(0,t||0)%60)).padStart(2,'0')}`;
  function serviceUrl(service,value){try{const u=new URL(value),host={'Spotify':'open.spotify.com','Apple Music':'music.apple.com','YouTube Music':'music.youtube.com'}[service];return u.protocol==='https:'&&u.hostname===host&&!u.username&&!u.password?u.href:null;}catch{return null;}}
  // The media port is injected, so playback races and failure recovery can be verified without a browser.
  function createController({media,onChange=()=>{},onActivate=()=>{},schedule=setInterval,unschedule=clearInterval,now=()=>Date.now()}){
    let mode='preview',status='idle',position=0,duration=spec.motion.previewDuration,request=0,intent=false,timer=null,last=0,disposed=false,error='';
    const listeners=[];
    const snapshot=()=>({mode,status,position,duration,error,playing:status==='playing',progress:duration?position/duration:0});
    const emit=()=>{if(!disposed)onChange(snapshot());};
    const clear=()=>{if(timer!==null)unschedule(timer);timer=null;};
    function tick(){const n=now();if(mode==='preview'&&status==='playing'){position=Math.min(duration,position+(n-last)/1000);if(position>=duration){status='ended';intent=false;clear();}}else if(mode==='audio'){position=Number.isFinite(media.currentTime)?media.currentTime:0;duration=Number.isFinite(media.duration)?media.duration:0;}last=n;emit();}
    function run(){clear();last=now();timer=schedule(tick,100);}
    function pause(){request++;intent=false;if(mode==='audio')media.pause();clear();if(status!=='idle'&&status!=='ended'&&status!=='error')status='paused';emit();}
    async function play(){if(disposed)return;if(status==='playing'||status==='loading'){pause();return;}onActivate();const token=++request;intent=true;error='';if(status==='ended'){position=0;if(mode==='audio')media.currentTime=0;}
      if(mode==='preview'){status='playing';run();emit();return;}
      status='loading';emit();try{await media.play();if(token!==request||!intent||disposed){if(!intent)media.pause();return;}status='playing';run();emit();}catch(e){if(token!==request||disposed)return;intent=false;status='error';error='음원을 재생할 수 없어요. 파일을 확인한 뒤 다시 시도해주세요.';clear();emit();}
    }
    function stop(){request++;intent=false;if(mode==='audio'){media.pause();try{media.currentTime=0;}catch{}}clear();position=0;status='idle';error='';emit();}
    function seek(value){const v=Number(value);if(!Number.isFinite(v))return;position=clamp(v,0,duration||0);if(mode==='audio')try{media.currentTime=position;}catch{}if(status==='ended')status='paused';last=now();emit();}
    function setSource(src){stop();request++;mode=src?'audio':'preview';duration=src?0:spec.motion.previewDuration;position=0;if(src)media.src=src;else media.removeAttribute('src');media.load();emit();}
    function listen(name,fn){media.addEventListener(name,fn);listeners.push([name,fn]);}
    listen('loadedmetadata',()=>{if(mode==='audio'){duration=Number.isFinite(media.duration)?media.duration:0;emit();}});
    listen('playing',()=>{if(mode!=='audio')return;if(!intent){media.pause();return;}status='playing';run();emit();});
    listen('waiting',()=>{if(mode==='audio'&&intent){status='loading';clear();emit();}});
    listen('pause',()=>{if(mode==='audio'&&status==='playing'){status='paused';clear();emit();}});
    listen('ended',()=>{if(mode==='audio'){request++;intent=false;status='ended';position=Number.isFinite(media.duration)?media.duration:position;clear();emit();}});
    listen('error',()=>{if(mode==='audio'){request++;intent=false;status='error';error='이 오디오 파일을 읽을 수 없어요. 다른 파일을 선택해주세요.';clear();emit();}});
    return {snapshot,toggle:play,pause,stop,seek,setSource,dispose(){stop();disposed=true;listeners.forEach(([name,fn])=>media.removeEventListener(name,fn));}};
  }
  return {spec,geometry,colors,cdpColors,paletteFromPixels,contrast,serviceUrl,time,createController};
});
