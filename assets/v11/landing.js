(function(){
 'use strict';
 var W=window.DittoWidgets,DP=window.DittoPlatter,P=window.DITTO_PLATTERS,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!W||!P)return;
 var $=function(s){return document.querySelector(s);},clone=function(v){return JSON.parse(JSON.stringify(v));};
 var rail=$('#v11Ribbon'),cards=[],motions=[],turn=0;
 function nativeWidget(holder,w){
  var gw=w.w*45.75-8,gh=w.h*45.75-8,canvas=document.createElement('div');
  holder.classList.add('v11-native');holder.style.aspectRatio=gw+'/'+gh;
  canvas.className='dpl';canvas.style.width=(358/gw*100)+'%';
  w.x=0;w.y=0;canvas.appendChild(W.box(w));holder.appendChild(canvas);
 }
 if(rail){
  var catalog=function(k){return W.catalog.find(function(c){return c.kind===k;});};
  var defs=[
   {kind:'guestbook',name:'친구가 남긴 안부',who:'방명록',w:6,h:4,data:clone(catalog('guestbook').sample)},
   {kind:'image',name:'함께한 소풍',who:'사진',w:3,h:4,data:{title:'함께한 소풍'},ditto:true},
   {kind:'music',name:'요즘 가장 자주 듣는',who:'음악',w:4,h:3,data:clone(P.haeunzip.widgets.find(function(w){return w.kind==='music';}).data)},
   {kind:'status',name:'오늘의 기분',who:'상태',w:2,h:2,data:clone(P.jiuallday.widgets.find(function(w){return w.kind==='status';}).data)},
   {kind:'todo',name:'우리의 이번 주',who:'To-do',w:3,h:4,data:clone(catalog('todo').sample)}
  ];
  defs.forEach(function(def,i){
   var f=document.createElement('figure');f.className='v11-ribbon-item';f.setAttribute('role','img');f.setAttribute('aria-label',def.who+' 위젯: '+def.name);
   f.style.setProperty('--field-ratio',(def.w*45.75-8)/(def.h*45.75-8));
   var frame=document.createElement('div');nativeWidget(frame,{id:'v11-ribbon-'+i,kind:def.kind,w:def.w,h:def.h,data:def.data,ditto:!!def.ditto});
   frame.setAttribute('aria-hidden','true');var cap=document.createElement('figcaption'),name=document.createElement('span'),type=document.createElement('span');name.textContent=def.name;type.textContent=def.who;cap.append(name,type);f.append(frame,cap);rail.appendChild(f);cards.push(f);
  });
  function shift(direction){
   var before=new Map(cards.map(function(c){return[c,c.getBoundingClientRect()];}));
   motions.forEach(function(a){a.cancel();});motions=[];
   if(direction>0)rail.appendChild(rail.firstElementChild);else rail.prepend(rail.lastElementChild);
   turn=(turn+direction+5)%5;$('#v11RibbonCount').textContent=String(turn+1).padStart(2,'0')+' / 05';
   if(reduce)return;
   cards.forEach(function(c){var a=before.get(c),b=c.getBoundingClientRect();motions.push(c.animate([{transform:'translate('+(a.left+a.width/2-b.left-b.width/2)+'px,'+(a.top+a.height/2-b.top-b.height/2)+'px) scale('+(a.width/b.width)+')'},{transform:'none'}],{duration:700,easing:'cubic-bezier(.22,1,.36,1)'}));});
  }
  $('#v11RibbonPrev').addEventListener('click',function(){shift(-1);});$('#v11RibbonNext').addEventListener('click',function(){shift(1);});
  rail.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();shift(e.key==='ArrowRight'?1:-1);}});
  if(!reduce)cards.forEach(function(c,i){motions.push(c.animate([{opacity:0,transform:'translateY(30px)'},{opacity:1,transform:'none'}],{duration:700,delay:100+i*55,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}));});
 }
 var lab=$('.h8-lab'),stage=$('.h8-lab-stage'),side=$('.h8-lab-side');
 if(lab&&stage&&side&&DP){
  var scene=document.createElement('div');scene.className='v11-platter-scene';
  var widgets=window.__v11LabWidgets||P.jiuallday.widgets;
  function comparison(index,label){
   var panel=document.createElement('div');panel.className='v11-platter-side';panel.setAttribute('aria-hidden','true');panel.inert=true;
   var header=document.createElement('header');var title=document.createElement('b');title.textContent=label;var number=document.createElement('span');number.textContent='0'+(index+1);header.append(title,number);
   var root=document.createElement('div');root.className='dpl';panel.append(header,root);
   var layout=window.__v9Layouts[index],list=clone(widgets);list.forEach(function(w){var r=layout[w.id.replace('fs-07-jiu-','')];w.x=r[0];w.y=r[1];w.w=r[2];w.h=r[3];});
   DP.create(root,{widgets:list,editable:false,removable:false,minRows:16});return panel;
  }
  scene.append(comparison(1,'가지런한 나'),stage,comparison(2,'조금 더 자유로운 나'));lab.replaceChildren(scene,side);
  var root=$('#h8LabPl');if(root)new ResizeObserver(function(){window.dispatchEvent(new Event('v11:platter-size'));}).observe(root);
 }
 // The old specimen scales to its field before this layout is installed.
 var specimen=$('#v9WidgetPreview');if(specimen&&specimen._fit)specimen._fit();
 // Scene colors now include the dark chapter's introduction, too.
 var nav=$('.gnb'),zones=Array.from(document.querySelectorAll('#h8-freq-head,#h8-freq,#get,.foot')),bounds=[],tick=0;
 function navColor(){tick=0;if(!nav)return;var y=scrollY+nav.offsetHeight/2;nav.classList.toggle('v10-nav-dark',bounds.some(function(b){return y>=b[0]&&y<b[1];}));}
 function measure(){bounds=zones.map(function(e){var r=e.getBoundingClientRect();return[r.top+scrollY,r.bottom+scrollY];});navColor();}
 addEventListener('scroll',function(){if(!tick)tick=requestAnimationFrame(navColor);},{passive:true});addEventListener('resize',measure);new ResizeObserver(measure).observe(document.body);measure();
})();
