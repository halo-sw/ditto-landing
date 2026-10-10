(function(root){
  'use strict';
  const M=root.SplupMusicPlayerModel,players=new Set();let active=null;
  const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
  const icon=(name)=>{const n=el('img');n.src='./widget-assets/'+name+'.svg';n.alt='';return n;};
  const artworkPalettes=new Map();
  function samplePalette(src){
    if(artworkPalettes.has(src))return artworkPalettes.get(src);
    const job=new Promise((resolve,reject)=>{const image=new Image();image.crossOrigin='anonymous';image.onload=()=>{try{const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,64,64);resolve(M.paletteFromPixels(ctx.getImageData(0,0,64,64).data));}catch(e){reject(e);}};image.onerror=()=>reject(Error('Artwork unavailable'));image.src=src;});
    if(artworkPalettes.size>=64)artworkPalettes.delete(artworkPalettes.keys().next().value);
    artworkPalettes.set(src,job);job.catch(()=>artworkPalettes.delete(src));return job;
  }
  const services={'Spotify':'spotify','Apple Music':'applemusic','YouTube Music':'youtubemusic','YouTube':'youtube'};
  function create(w,h,options={}){
    const external=!!options.external;
    const card=el('div','sw-widget mp-player'),surface=el(external?'a':'button','mp-surface'),info=el('span','mp-info'),line=el('span','mp-line'),provider=icon('spotify'),label=el('span','mp-source-label','Spotify'),eq=el('span','mp-eq'),title=el('span','mp-title'),artist=el('span','mp-artist');
    card.dataset.kind='music';card.dataset.interaction=external?'external':'playback';card.setAttribute('role','group');surface.type='button';provider.className='mp-service-icon';eq.setAttribute('aria-hidden','true');for(let i=0;i<4;i++)eq.append(el('i'));const arrow=el('span','mp-external-arrow','↗');arrow.setAttribute('aria-hidden','true');arrow.hidden=!external;line.append(provider,label,arrow);info.append(title,artist,line);const state=el('span','mp-state-indicator'),stateIcon=icon('player-play');state.setAttribute('aria-hidden','true');state.append(stateIcon,eq);
    const discPosition=el('span','mp-disc-position'),disc=el('span','mp-disc'),art=new Image(),hub=el('span','mp-hub');art.alt='';const discArt=el('img','mp-disc-art');discArt.alt='';discArt.onerror=()=>{discArt.hidden=true;};discArt.onload=()=>{discArt.hidden=false;};disc.append(discArt,el('span','mp-disc-sheen'),hub);discPosition.append(disc);surface.append(info,discPosition,state);const background=el('img','mp-artwork-background');background.alt='';background.hidden=external;card.append(background);
    const transport=el('div','mp-transport'),play=el('button'),playIcon=icon('player-play'),stop=el('button'),seekBlock=el('div','mp-seek-block'),seek=el('input'),times=el('span','mp-time'),elapsed=el('span','','0:00'),total=el('span','','0:30');
    play.type=stop.type='button';play.append(playIcon);stop.append(icon('player-square'));stop.setAttribute('aria-label','정지하고 처음으로');seek.type='range';seek.min=0;seek.max=30;seek.step=.1;seek.value=0;seek.setAttribute('aria-label','재생 위치');times.append(elapsed,total);seekBlock.append(seek,times);transport.append(play,seekBlock,stop);
    const overlay=el('span','mp-state-overlay');overlay.hidden=true;card.append(surface,transport,overlay);
    const media=new Audio();media.preload='metadata';let blob=null,albumOptions={...options},disposed=false,lastStatus='',artworkRequest=0;
    const controller=M.createController({media,onActivate(){if(active&&active!==api)active.pause();active=api;},onChange(s){
      card.dataset.status=s.status;card.dispatchEvent(new CustomEvent('musicprogress',{detail:s}));card.dataset.mode=s.mode;stateIcon.src='./widget-assets/player-'+(s.status==='playing'?'pause':'play')+'.svg';
      if(external)return;
      const action=s.playing||s.status==='loading'?'일시정지':'재생';surface.setAttribute('aria-label',`${title.textContent} · ${artist.textContent} · ${label.textContent} · ${s.mode==='preview'?'무음 모션 미리보기':'오디오'} ${action}`);surface.setAttribute('aria-pressed',String(s.playing));play.setAttribute('aria-label',action);playIcon.src='./widget-assets/player-'+(s.playing?'pause':'play')+'.svg';
      seek.max=s.duration||0;seek.value=s.position;seek.disabled=!s.duration;seek.setAttribute('aria-valuetext',M.time(s.position)+' / '+M.time(s.duration));elapsed.textContent=M.time(s.position);total.textContent=M.time(s.duration);
      overlay.hidden=s.status!=='loading'&&s.status!=='error';overlay.textContent=s.status==='error'?s.error:'불러오는 중…';
      if(s.status!==lastStatus){lastStatus=s.status;card.dispatchEvent(new CustomEvent('musicstatechange',{detail:s,bubbles:true}));}
    }});
    surface.addEventListener('click',()=>{if(card.dataset.empty==='true'){card.dispatchEvent(new CustomEvent('musicaddrequest',{bubbles:true}));return;}if(!external)controller.toggle();});play.addEventListener('click',()=>controller.toggle());stop.addEventListener('click',()=>controller.stop());seek.addEventListener('input',()=>controller.seek(seek.value));
    function setSize(width,height,animate=false){
      const moving=[info,discPosition,transport],before=moving.map(n=>n.getBoundingClientRect()),footer=options.ditto?52:0,g=M.geometry(width,height-footer,{external});
      card.style.width=width+'px';card.style.height=height+'px';card.style.borderRadius=g.radius+'px';card.dataset.layout=g.rail?'rail':g.portrait?'portrait':g.expanded?'expanded':g.compact?'compact':'standard';
      const vars={'art-x':g.artwork.x,'art-y':g.artwork.y,'art-size':g.artwork.size,'body-h':g.bodyH,'meta-x':g.meta.x,'meta-y':g.meta.y,'meta-w':g.meta.w,'text-w':g.textW,'source-gap':g.sourceGap,'source-w':g.source.w,'play-x':g.play.x,'play-y':g.play.y,'play-size':g.play.size,'title-size':g.titleSize,'artist-size':g.artistSize,'source-size':g.sourceSize,'title-line':g.titleLine,'artist-line':g.artistLine,'meta-h':g.meta.h,'pad':g.pad,'disc-x':g.disc.x,'disc-y':g.disc.y,'disc-w':g.disc.w,'disc-size':g.disc.size};Object.entries(vars).forEach(([k,v])=>card.style.setProperty('--mp-'+k,v+'px'));transport.hidden=!g.controls;state.hidden=!g.play.visible;card.dataset.compactSource=String(g.source.compact&&!external);label.hidden=!!g.source.iconOnly;provider.hidden=!g.source.h;card.dataset.iconOnly=String(!!g.source.iconOnly);card.dataset.tiny=String(g.tiny);card.dataset.hideSource=String(!g.source.h);card.style.setProperty('--mp-source-h',g.source.h+'px');card.style.setProperty('--mp-source-x',(g.source.x-g.meta.x)+'px');state.style.display=g.play.visible?'flex':'none';card.style.setProperty('--mp-hole',M.spec.disc.holeRatio*100+'%');card.style.setProperty('--mp-hub',M.spec.disc.hubRatio*100+'%');card.style.setProperty('--mp-hub-offset',(1-M.spec.disc.hubRatio)*50+'%');card.style.setProperty('--mp-hole-in-hub',M.spec.disc.holeRatio/M.spec.disc.hubRatio*100+'%');
      if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){moving.forEach((n,i)=>{const b=before[i],a=n.getBoundingClientRect();if(a.width&&a.height&&b.width&&b.height)n.animate([{transform:`translate(${b.x-a.x}px,${b.y-a.y}px) scale(${b.width/a.width})`},{transform:'none'}],{duration:M.spec.motion.resizeMs,easing:M.spec.motion.easing});});}
    }
    function applyPalette(p){const c=M.cdpColors(p);card.style.setProperty('--mp-shell-top',c.top);card.style.setProperty('--mp-shell-middle',c.middle);card.style.setProperty('--mp-shell-bottom',c.bottom);card.dataset.shellColor=c.bottom;}
    function setAlbum(next){albumOptions={...albumOptions,...next};const o=albumOptions,p=M.colors(o.albumPalette);card.style.setProperty('--mp-base',p.base);card.style.setProperty('--mp-accent',p.accent);card.style.setProperty('--mp-glow',p.glow);card.style.setProperty('--mp-shade',p.shade);card.style.setProperty('--mp-secondary',p.secondary);card.style.setProperty('--mp-indicator','#74419D');card.dataset.service=o.musicService||'YouTube';label.textContent=card.dataset.service;label.hidden=card.dataset.iconOnly==='true';provider.hidden=card.dataset.hideSource==='true';provider.src='./widget-assets/'+(services[card.dataset.service]||'youtube')+'.svg';
      const src=typeof o.albumAsset==='string'?o.albumAsset.trim():'',request=++artworkRequest;applyPalette();discArt.hidden=true;card.dataset.artwork=src?'loading':'missing';card.dataset.paletteStatus=src?'loading':'default';
      discArt.onload=()=>{if(disposed||request!==artworkRequest)return;discArt.hidden=false;card.dataset.artwork='ready';};
      discArt.onerror=()=>{if(disposed||request!==artworkRequest)return;discArt.hidden=true;card.dataset.artwork='error';card.dataset.paletteStatus='fallback';applyPalette();};
      if(src){discArt.src=src;background.src=src;samplePalette(src).then(p=>{if(disposed||request!==artworkRequest)return;applyPalette(p);card.dataset.paletteStatus='ready';}).catch(()=>{if(!disposed&&request===artworkRequest)card.dataset.paletteStatus='fallback';});}
      else{discArt.removeAttribute('src');background.removeAttribute('src');}
      card.dataset.empty=String(!o.trackTitle&&!o.youtubeId);title.textContent=o.trackTitle||'음악 추가';artist.textContent=o.artist||(card.dataset.empty==='true'?'YouTube 링크로 연결':'아티스트 정보 없음');card.title=`${title.textContent} · ${artist.textContent} · ${label.textContent}`;card.setAttribute('aria-label',`${title.textContent} 음악 위젯`);
      if(external){const href=M.serviceUrl(o.musicService,o.href);surface.removeAttribute('href');surface.setAttribute('aria-disabled',String(!href));if(href){surface.href=href;surface.target='_blank';surface.rel='noopener noreferrer';}surface.setAttribute('aria-label',`${title.textContent} · ${artist.textContent} · ${label.textContent}에서 열기, 새 탭`);}
      controller.stop();if(card.dataset.empty==='true')surface.setAttribute('aria-label','음악 추가 · YouTube 링크로 연결');}
    const api={seek:v=>controller.seek(v),setMuted:v=>{media.muted=!!v;},pause:()=>controller.pause(),stop:()=>controller.stop(),toggle:()=>external?undefined:controller.toggle(),snapshot:()=>controller.snapshot(),setSize,setAlbum,
      loadAudio(file){if(external)return;if(blob)URL.revokeObjectURL(blob);blob=URL.createObjectURL(file);controller.setSource(blob);title.textContent=file.name.replace(/\.[^.]+$/,'');artist.textContent='내 오디오';card.dataset.empty='false';label.textContent='로컬 파일';label.hidden=false;provider.hidden=true;controller.stop();},
      usePreview(){controller.setSource(null);if(blob)URL.revokeObjectURL(blob);blob=null;setAlbum(albumOptions);},
      dispose(){if(disposed)return;disposed=true;controller.dispose();media.removeAttribute('src');media.load();if(blob)URL.revokeObjectURL(blob);players.delete(card);if(active===api)active=null;}
    };
    card.musicPlayer=api;players.add(card);setSize(w,h);setAlbum(options);
    if(options.ditto){const footer=el('div','mp-origin'),avatar=el('img');avatar.src=root.SplupWidgetContent.assets.avatar||'../assets/ditto-attribution/source-avatar.jpg';avatar.alt='';const text=el('span');text.append(el('strong','','@haseul.e'),document.createTextNode('에게서 가져옴'));footer.append(avatar,text);card.append(footer);}
    return card;
  }
  new MutationObserver(()=>{for(const n of players){if(n.isConnected)n.wasConnected=true;else if(n.wasConnected)n.musicPlayer.dispose();}}).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)active.pause();});root.addEventListener('hashchange',()=>{if(active)active.pause();});
  root.SplupMusicPlayer={create};
})(window);
