(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SplupWidgetContent=api;})(globalThis,function(){
  'use strict';
  const assets={photo:'./widget-assets/original-photo.png',gif:'./widget-assets/original-gif-still.png',album:'../../../DittoPrototype/Assets.xcassets/ob-album.imageset/ob-album.png',avatar:'../assets/ditto-attribution/source-avatar.jpg',mark:'../../brand/color-system/appicon-source.svg',youtube:'./widget-assets/youtube.svg',instagram:'./widget-assets/instagram.svg',spotify:'./widget-assets/spotify.svg',applemusic:'./widget-assets/applemusic.svg',youtubemusic:'./widget-assets/youtubemusic.svg'};
  const ink='#302937',muted='#77717E',purple='#6655D2';
  const t=(name,text,w,h,size=14,color=ink,weight=400,lines=1)=>({kind:'text',name,text,w,h,size,line: size===14?20:size===11?16:size===12?17:size===13?18:Math.ceil(size*1.25),color,weight,lines});
  const rect=(name,w,h,color,radius=0)=>({kind:'rect',name,w,h,color,radius});
  const img=(name,w,h,asset,radius=0)=>({kind:'image',name,w,h,asset,radius});
  const group=(name,x,y,w,h,children,options={})=>({kind:'group',name,x,y,w,h,children,layout:'VERTICAL',gap:4,...options});
  const place=(n,x,y)=>({...n,x,y,absolute:true});
  function provider(name,w,h,compact=false){
    const full=!compact&&w>=175,brandMusic=['Spotify','Apple Music','YouTube Music'].includes(name),iconSize=brandMusic?16:14;
    const width=full?({'Instagram':106,'Spotify':90,'Apple Music':110,'YouTube Music':126}[name]||94):brandMusic?44:42;
    return group('External service / '+name,w-width-8,h-30,width,22,[img('Provider icon',iconSize,iconSize,name.toLowerCase().replaceAll(' ','')),t('Destination',full?name+' ↗':'↗',width-iconSize-12,16,11,ink,500)],{layout:'HORIZONTAL',gap:4,padding:3,paddingX:4,fill:'#FFFFFF',radius:6,align:'CENTER'});
  }
  function plan(id,w,h,options={}){
    const sourced=!!options.ditto,footer=sourced?52:0,H=h-footer,p=12,inner=w-24,nodes=[];
    let bg='#FFFFFF'; const compact=H<110,narrow=w<160;
    const add=n=>{nodes.push(n);return n;};
    if(['image','video','social','gif','ditto'].includes(id)){
      add(place(img('Media / editable crop',w,H,id==='gif'?'gif':'photo'),0,0));
      if(id==='video'||id==='social'){
        add({...place(rect('Title contrast',w,Math.min(H,95),'#302937'),0,0),gradient:['#302937D9','#30293700']});
        if(w>=120)add(group('Title',p,p,inner,40,[t('Content title',id==='video'?'너만 내 생일 파티에 안 온 그날':'세상 사람들 동글이 보세요',inner,40,14,'#FFFFFF',600,2)]));
        add(provider(id==='video'?'YouTube':'Instagram',w,H));
      }
      if(id==='gif')add(group('File format',8,H-30,32,22,[t('Format label','GIF',24,16,11,'#FFFFFF',600)],{padding:3,paddingX:4,fill:'#302937',radius:6}));
    }else if(id==='music'){
      const pal=options.albumPalette||{base:'#51372F',accent:'#795144',foreground:'#FFFFFF'};bg=pal.base;
      add({...place(rect('Artwork color field',w,H,pal.base),0,0),gradient:[pal.accent,pal.base]});
      const horizontal=w/H>1.5,cover=horizontal?Math.min(H-24,72):Math.max(36,Math.min(inner,H-99));
      const coverNode=img('Album cover',cover,cover,options.albumAsset||'album',options.musicService==='Spotify'?4:8);
      if(horizontal){const trackW=inner-cover-10,trackH=compact?41:H-48;add(group('Cover and track',p,p,inner,H-24,[coverNode,group('Track',0,0,trackW,trackH,[t('Track title',options.trackTitle||'dance all night',trackW,compact?20:40,14,pal.foreground,600,compact?1:2),t('Artist',options.artist||'ROSÉ',trackW,17,12,pal.foreground,400)],{justify:compact?'MIN':'CENTER'})],{layout:'HORIZONTAL',gap:10,align:'MIN'}));}
      else{add(group('Album and track',p,p,inner,H-42,[coverNode,t('Track title',options.trackTitle||'dance all night',inner,20,14,pal.foreground,600),...(H>=128?[t('Artist',options.artist||'ROSÉ',inner,17,12,pal.foreground,400)]:[])],{gap:5}));}
      if(!horizontal)add(provider(options.musicService||'YouTube',w,H));
      else add(provider(options.musicService||'YouTube',w,H,true));
    }else if(id==='text'){
      bg='#F2F1F4';const header=compact?0:22,bodyY=p+header,lines=Math.max(1,Math.floor((H-bodyY-35)/20));
      if(!compact)add(group('Memo label',p,p,inner,16,[t('Label','나의 기록',inner,16,11,muted,500)]));
      add(group('Memo body',p,bodyY,inner,lines*20,[t('Body','처음이라서 설레기도 어렵기도 했던 순간들. 좋아하는 것을 찾고, 소중한 것을 곁에 두기.',inner,lines*20,14,ink,400,lines)]));
      add(group('Memo footer',p,H-28,inner,16,[t('Collection','인터뷰 아카이브',inner,16,11,muted)]));
    }else if(id==='dday'){
      bg='#F6F4FA';const wide=w>=145;
      if(wide){add(group('Countdown',p,12,78,H-24,[t('Days','D–21',78,35,28,purple,600),t('Date','10.23 FRI',78,16,11,muted)],{gap:2,justify:'CENTER'}));add(group('Event',102,12,w-114,H-24,[t('Title','부산 여행',w-114,40,14,ink,600,2)],{justify:'CENTER'}));}
      else{add(group('Compact countdown',10,8,w-20,H-16,[t('Event',w<80?'여행':'부산 여행',w-20,16,11,muted,500),t('Days','D–21',w-20,30,w<80?20:24,purple,600),...(H>=80?[t('Date','10.23',w-20,16,11,muted)]:[])],{gap:2}));}
    }else if(id==='todo'){
      bg='#FFFFFF';add(group('List heading',p,p,inner,20,[t('Title',narrow?'할 일':'오늘 할 일',inner-30,20,14,ink,600),t('Completion','1/4',26,16,11,muted)],{layout:'HORIZONTAL',gap:4,align:'CENTER'}));
      const count=Math.max(1,Math.min(4,Math.floor((H-76)/28)));const tasks=['산책하기','사진 정리하기','친구 만나기','책 한 장 읽기'];
      for(let i=0;i<count;i++)add(group('Task '+(i+1),p,42+i*28,inner,24,[{...rect('Checkbox',16,16,i===0?purple:'#FFFFFF',4),stroke:i===0?purple:'#C6C2CC',check:i===0},t('Task text',tasks[i],inner-24,20,14,i===0?muted:ink,400)],{layout:'HORIZONTAL',gap:8,align:'CENTER',taskIndex:i}));
      add(group('List summary',p,H-27,inner,16,[t('Remaining',count<4?'+'+(4-count)+'개 더 보기':'나의 작은 계획',inner,16,11,muted)]));
    }else if(id==='polaroid'){
      bg='#FAF9F6';const padding=w<160?8:10,cap=38;const photoH=H-padding-cap;
      add(place(img('Instant print / photo',w-padding*2,photoH,'photo',3),padding,padding));
      add(group('Paper caption',padding+2,H-cap+6,w-padding*2-4,30,[t('Photo caption','오늘의 작은 순간',w-padding*2-4,17,12,ink,500),t('Photo date','2026.10.02',w-padding*2-4,13,10,muted)],{gap:0}));
    }else if(id==='ask'){
      bg='#EEE9F8';const labelH=16;const qLines=Math.max(1,Math.min(narrow?3:2,Math.floor((H-112)/20))),qH=qLines*20;const aY=12+labelH+8+qH+10,avail=H-aY-12;
      add(group('Question header',p,p,inner,labelH,[t('Label','친구의 질문',inner,labelH,11,purple,500)]));
      add(group('Question',p,36,inner,qH,[t('Question text',options.longText?'최근에 들었던 노래 중에서 친구에게 꼭 추천해 주고 싶은 노래가 있나요?':'요즘 가장 자주 듣는 노래는?',inner,qH,14,ink,600,qLines)]));
      const answerLines=Math.max(1,Math.min(6,Math.floor((avail-34)/20)));
      add(group('Answer',p,aY,inner,Math.max(44,avail),[t('Answer label','나의 답변',inner-16,16,11,muted,500),t('Answer text',options.longText?'집에 돌아가는 길에는 이 노래를 들어요. 익숙한 풍경이 조금 새롭게 느껴져서 좋아요.':'요즘은 Ditto를 듣고 있어요.',inner-16,answerLines*20,14,ink,400,answerLines)],{fill:'#FFFFFF',radius:8,padding:8,gap:2}));
    }else if(id==='mood'){
      bg='#F0EBF8';const big=H>=140;
      add(group('Mood label',p,p,inner,16,[t('Label','오늘의 기분',inner,16,11,muted,500)]));
      add(group('Mood state',p,big?44:36,inner,24,[rect('Mood color',8,8,'#AA4AF4',4),t('Mood','마음이 가벼워요',inner-16,20,14,ink,600)],{layout:'HORIZONTAL',gap:8,align:'CENTER'}));
      if(big)add(group('Mood note',p,82,inner,40,[t('Note','산책하고 돌아온 오후.\n나만의 속도로 쉬어가기.',inner,40,14,ink,400,2)]));
      if(big)add(group('Updated at',p,H-28,inner,16,[t('Time','오늘 · 14:30',inner,16,11,muted)]));
    }else if(id==='guestbook'){
      bg='#F9F7F2';add(group('Guestbook heading',p,p,inner,20,[t('Title','친구가 남긴 안부',inner,20,14,ink,600)]));
      const count=H>=245?3:H>=175?2:1;
      ['주말에 같이 산책할래?','이 사진 보니까 네 생각 나','오늘도 좋은 하루 보내'].slice(0,count).forEach((s,i)=>add(group('Message '+(i+1),p,42+i*59,inner,51,[t('Author',['지민 · 방금','서연 · 어제','민지 · 어제'][i],inner,16,11,muted,500),t('Message',s,inner,Math.min(40,31),14,ink,400,1)],{gap:4})));
      add(group('Guestbook footer',p,H-27,inner,16,[t('Open guestbook','안부 남기기  ↗',inner,16,11,purple,500)]));
    }else if(id==='playlist'){
      const pal=options.albumPalette||{base:'#51372F',accent:'#795144',foreground:'#FFFFFF'};bg=pal.base;
      add(group('Playlist header',p,p,inner,45,[img('Playlist cover',44,44,options.albumAsset||'album',6),group('Playlist name',0,0,inner-52,42,[t('Title','집으로 가는 길',inner-52,20,14,pal.foreground,600),t('Count','8곡 · 나의 플레이리스트',inner-52,16,11,pal.foreground)],{gap:4})],{layout:'HORIZONTAL',gap:8}));
      const count=Math.max(1,Math.min(3,Math.floor((H-99)/36)));
      [['Love wins all','IU'],['Ditto','NewJeans'],['Hype Boy','NewJeans']].slice(0,count).forEach(([name,artist],i)=>add(group('Track '+(i+1),p,70+i*36,inner,32,[t('Number',String(i+1).padStart(2,'0'),20,16,11,pal.foreground),group('Track text',0,0,inner-26,32,[t('Track title',name,inner-26,17,12,pal.foreground,500),t('Artist',artist,inner-26,13,10,pal.foreground)],{gap:1})],{layout:'HORIZONTAL',gap:6})));
      add(provider('YouTube',w,H));
    }
    if(sourced){
      const overlayBadge=['image','ditto','gif'].includes(id);
      const identityWidth=w-(overlayBadge?60:100);
      const sourceChildren=[img('Source avatar',28,28,'avatar',7),group('Source identity',0,0,identityWidth,34,[t('Username','@haseul.e',identityWidth,18,13,ink,600),t('Origin','에게서 가져옴',identityWidth,16,11,muted)],{gap:0})];
      if(overlayBadge)add(place(img('Ditto origin badge',32,32,'dittoBadge',9),w-44,12));
      else sourceChildren.push(img('Ditto origin badge',32,32,'dittoBadge',9));
      add(group('Source / profile',0,H,w,52,sourceChildren,{layout:'HORIZONTAL',padding:9,paddingX:12,gap:8,align:'CENTER',fill:'#FFFFFF'}));
    }
    return {id,w,h,bg,nodes,contentHeight:H};
  }
  function paletteFromPixels(pixels){
    // Hue clusters keep a cover's characteristic color from losing to black/white space.
    const chromatic=new Map(),neutral={count:0,sum:[0,0,0]};let chromaticCount=0,total=0;
    for(let i=0;i<pixels.length;i+=4){
      if(pixels[i+3]<200)continue;
      const c=[pixels[i],pixels[i+1],pixels[i+2]],hi=Math.max(...c),lo=Math.min(...c),delta=hi-lo;
      total++;if(hi<38||lo>235)continue;
      const saturation=delta/hi;
      if(saturation<.18||delta<18){neutral.count++;c.forEach((v,j)=>neutral.sum[j]+=v);continue;}
      let hue=hi===c[0]?((c[1]-c[2])/delta)%6:hi===c[1]?(c[2]-c[0])/delta+2:(c[0]-c[1])/delta+4;
      hue=(hue*60+360)%360;const key=Math.round(hue/30)%12;
      const weight=(.3+saturation)*(.35+.65*hi/255),bucket=chromatic.get(key)||{count:0,sum:[0,0,0]};
      bucket.count+=weight;c.forEach((v,j)=>bucket.sum[j]+=v*weight);chromatic.set(key,bucket);chromaticCount++;
    }
    const winner=chromaticCount>=Math.max(1,total*.025)?[...chromatic.values()].sort((a,b)=>b.count-a.count)[0]:neutral;
    const c=winner&&winner.count?winner.sum.map(x=>x/winner.count):[92,92,92];
    const lum=a=>a.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const hex=a=>'#'+a.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
    let accent=c;while(lum(accent)>.175)accent=accent.map(v=>v*.96);
    const base=accent.map(v=>v*.66),rounded=accent.map(Math.round);
    const ambient=[...chromatic.values()].sort((a,b)=>b.count-a.count).slice(0,3).map(b=>hex(b.sum.map(v=>v/b.count)));
    return {base:hex(base),accent:hex(accent),ambient:ambient.length?ambient:[hex(c),hex(c),hex(c)],foreground:'#FFFFFF',contrast:+(1.05/(lum(rounded)+.05)).toFixed(2)};
  }
  const albumPalettes={'./widget-assets/album-rose.png':{base:'#412410',accent:'#643719',foreground:'#FFFFFF',contrast:9.93},'./widget-assets/album-blue.svg':{base:'#1d3454',accent:'#2c5081',foreground:'#FFFFFF',contrast:8.17}};
  return {assets,plan,paletteFromPixels,albumPalettes};
});
