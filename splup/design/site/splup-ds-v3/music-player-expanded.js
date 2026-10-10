/* Larger CDP layouts: the current compact widget is deliberately kept intact. */
(function(root){
'use strict';
const M=root.SplupMusicPlayerModel,P=root.SplupMusicPlayer,original=P.create;
const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
const icon=name=>{const i=node('img');i.src='./widget-assets/cdp-'+name+'.svg';i.alt='';return i;};
function layout(w,h){
 if(w>=240&&h<110)return {kind:'bar',d:54.5,dx:w-70.5,dy:16,x:16,y:12,mw:w-98.5,ts:17,as:12,sourceY:55,px:16,py:74,pw:w-112};
 if(w<110&&h>=240)return {kind:'rail',d:w-24,dx:12,dy:16,x:12,y:102,mw:w-24,ts:14,as:11,sourceY:h-32,px:12,py:h-37,pw:w-26};
 if(w>=240&&h>=320)return {kind:'tower',d:204,dx:(w-204)/2,dy:40,x:16,y:260,mw:w-32,ts:24,as:14,sourceY:15,px:16,py:h-38,pw:w-32};
 if(w>=240&&h>=240)return {kind:'square',d:138,dx:(w-138)/2,dy:18,x:16,y:171,mw:w-32,ts:22,as:13,sourceY:13,px:16,py:h-38,pw:w-32};
 if(w>=240&&h>=150)return {kind:'wide',d:100,dx:w-116,dy:16,x:16,y:20,mw:w-144,ts:20,as:12,sourceY:105,px:16,py:h-38,pw:w-32};
 if(w>=170&&w<240&&h>=240)return {kind:'portrait',d:128,dx:(w-128)/2,dy:16,x:16,y:160,mw:w-32,ts:18,as:12,sourceY:212,px:16,py:h-38,pw:w-32};
 return null;
}
let dialog=null;
function openVideo(id,title){
 if(dialog)dialog.remove();
 dialog=node('dialog','cdp-video-dialog');const head=node('div','cdp-video-header'),label=node('strong','',title||'YouTube'),close=node('button','cdp-video-close');close.type='button';close.setAttribute('aria-label','영상 닫기');close.append(icon('close'));head.append(label,close);
 const frame=node('iframe');frame.title=(title||'음악')+' · YouTube 영상';frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';frame.src='https://www.youtube-nocookie.com/embed/'+id+'?playsinline=1&rel=0';
 const footer=node('div','cdp-video-footer'),link=node('a','','YouTube에서 열기 ↗');link.href='https://www.youtube.com/watch?v='+id;link.target='_blank';link.rel='noopener noreferrer';footer.append(link);dialog.append(head,frame,footer);document.body.append(dialog);dialog.addEventListener('close',()=>{dialog?.remove();dialog=null;});close.onclick=()=>dialog.close();dialog.showModal();
}
P.expandedLayout=layout;
P.create=function(w,h,options={}){
 const card=original(w,h,options),api=card.musicPlayer;let config=null,current={...options};
 const source=node('div','cdp-source'),logo=node('img');logo.src='./widget-assets/youtube.svg';logo.alt='';source.append(logo,node('span','','YouTube'));
 const detail=node('div','cdp-progress'),range=node('input'),times=node('div','cdp-times'),elapsed=node('span','','0:00'),duration=node('span','','0:30');range.type='range';range.min=0;range.max=30;range.step=.1;range.value=0;range.setAttribute('aria-label','재생 위치');times.append(elapsed,duration);detail.append(range,times);
 const grille=node('div','cdp-grille');grille.setAttribute('aria-hidden','true');for(let n=0;n<7;n++)grille.append(node('i'));
 const status=node('span','cdp-live');status.setAttribute('aria-hidden','true');for(let n=0;n<4;n++)status.append(node('i'));
 const screen=node('div','cdp-screen');screen.hidden=true;const poster=node('img','cdp-poster'),emptyDisc=node('span','cdp-empty-disc'),screenButton=node('button','cdp-screen-open'),screenLabel=node('span','cdp-video-label','YouTube · MUSIC VIDEO');emptyDisc.setAttribute('aria-hidden','true');emptyDisc.hidden=true;poster.alt='';screenButton.type='button';screen.append(poster,emptyDisc,screenLabel,screenButton);
 card.append(source,detail,grille,status,screen);
 function video(){api.pause();const id=String(current.youtubeId||'');if(/^[\w-]{11}$/.test(id))openVideo(id,current.trackTitle);else {card.dispatchEvent(new CustomEvent('musicvideorequest',{bubbles:true,detail:{title:current.trackTitle}}));}}
 screenButton.onclick=video;
 range.oninput=()=>api.seek(Number(range.value));
 function update(){const s=api.snapshot(),empty=card.dataset.empty==='true';range.max=s.duration||0;range.value=s.position;range.disabled=empty||!s.duration||!screen.hidden;range.style.setProperty('--cdp-progress',(s.progress*100)+'%');elapsed.textContent=empty?'0:00':M.time(s.position);duration.textContent=empty?'—:—':M.time(s.duration);range.setAttribute('aria-valuetext',elapsed.textContent+' / '+duration.textContent);}
 card.addEventListener('musicprogress',update);
 function updateScreen(){const isVideo=!!config&&['square','tower'].includes(config.kind),src=current.videoPoster||current.albumAsset;screen.hidden=!isVideo;card.dataset.screen=String(isVideo);card.dataset.videoStatus=current.videoPoster?'poster':src?'album-fallback':'default';poster.hidden=!src;emptyDisc.hidden=!!src;if(src)poster.src=src;else poster.removeAttribute('src');poster.onerror=()=>{poster.hidden=true;emptyDisc.hidden=false;card.dataset.videoStatus='default';screenLabel.textContent='영상 미리보기 없음';};poster.onload=()=>{poster.hidden=false;emptyDisc.hidden=true;};screen.style.setProperty('--cdp-screen-height',config?.kind==='square'?'155px':'244px');screenLabel.textContent=current.videoPoster?'YouTube · MUSIC VIDEO':src?'YouTube':'영상 미리보기 없음';screenButton.setAttribute('aria-label',(current.trackTitle||'음악')+' · YouTube 영상 열기');screenButton.disabled=!/^[\w-]{11}$/.test(String(current.youtubeId||''));}
 function arrange(width,height){config=layout(width,height);card.classList.toggle('cdp-extended',!!config);for(const n of [source,detail,grille,status])n.hidden=!config;if(!config){updateScreen();return;}card.dataset.cdp=config.kind;const g=config;for(const [k,v]of Object.entries({'disc-x':g.dx,'disc-y':g.dy,'disc-size':g.d,'meta-x':g.x,'meta-y':g.y,'meta-w':g.mw,'text-w':g.mw,'title-size':g.ts,'title-line':Math.round(g.ts*1.2),'artist-size':g.as,'artist-line':g.as+5,'body-h':height}))card.style.setProperty('--mp-'+k,v+'px');card.style.setProperty('--cdp-source-y',g.sourceY+'px');card.style.setProperty('--cdp-progress-x',g.px+'px');card.style.setProperty('--cdp-progress-y',g.py+'px');card.style.setProperty('--cdp-progress-w',g.pw+'px');grille.hidden=true;status.hidden=true;detail.hidden=['bar','rail'].includes(g.kind);updateScreen();update();}
 const resize=api.setSize,setAlbum=api.setAlbum;api.setSize=(width,height,animate)=>{resize(width,height,animate);arrange(width,height);};api.setAlbum=next=>{current={...current,...next};setAlbum(next);updateScreen();update();};api.setPresentation=()=>{updateScreen();update();};
 arrange(w,h);return card;
};
})(window);
