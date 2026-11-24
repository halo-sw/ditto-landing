(function(){
'use strict';
var $=function(s){return document.querySelector(s);}, W=window.DittoWidgets;
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function place(box,size,cx,cy){var u=100/358;box.style.left=((cx-(size.w*45.75-8)/2)*u)+'cqw';box.style.top=((cy-(size.h*45.75-8)/2)*u)+'cqw';box.style.width=((size.w*45.75-8)*u)+'cqw';box.style.height=((size.h*45.75-8)*u)+'cqw';}
function clone(o){return JSON.parse(JSON.stringify(o));}
if(W && $('#v9WidgetTypes')){
  var catalog=W.catalog, current=catalog.findIndex(function(c){return c.kind==='music';}), choice=0, selectedBox=null, specimenKind=null, specimenMotion=null;
  var types=$('#v9WidgetTypes'), stage=$('#v9WidgetPreview'), sizes=$('#v9WidgetSizes');
  var ruler=document.createElement('div');ruler.className='v10-specimen-ruler';ruler.setAttribute('aria-hidden','true');ruler.innerHTML='<span></span><i></i><b></b>';stage.appendChild(ruler);
  var nextSize=document.createElement('button');nextSize.type='button';nextSize.className='v10-size-next';nextSize.setAttribute('aria-label','다음 크기로 바꾸기');nextSize.innerHTML='<span aria-hidden="true">↗</span>';stage.appendChild(nextSize);
  nextSize.addEventListener('click',function(){show(current,(choice+1)%catalog[current].sizes.length);});
  function show(index,sizeIndex){
    var first=selectedBox&&selectedBox.getBoundingClientRect(), oldKind=specimenKind;
    if(specimenMotion)specimenMotion.cancel();
    current=index;var c=catalog[index];choice=sizeIndex==null?c.sizes.findIndex(function(s){return s.w===c.defaultSize.w&&s.h===c.defaultSize.h;}):sizeIndex;if(choice<0)choice=0;
    var dim=c.sizes[choice], wd={id:'v9-specimen',kind:c.kind,x:0,y:0,w:dim.w,h:dim.h,data:clone(c.sample||{}),ditto:!!c.dittoable};
    if(selectedBox&&oldKind===c.kind){W.applyBox(selectedBox,wd);W.update(selectedBox.firstElementChild,wd);}
    else{if(selectedBox)selectedBox.remove();selectedBox=W.box(wd);stage.prepend(selectedBox);}
    specimenKind=c.kind;place(selectedBox,dim,179,179);place(ruler,dim,179,179);
    // A tall 6×8 widget still fits the same specimen field.
    var field=stage.parentElement;
    function fit(){stage.style.width=Math.min(field.clientWidth*1.4,600,(field.clientWidth-70)*358/(dim.w*45.75-8),(field.clientHeight-96)*358/(dim.h*45.75-8))+'px';}
    stage.style.maxWidth='none';stage.style.transform='';fit();stage._fit=fit;
    ruler.querySelector('span').textContent=dim.w+'칸';ruler.querySelector('b').textContent=dim.h+'칸';
    var unit=100/358;nextSize.style.left=((179+(dim.w*45.75-8)/2)*unit)+'cqw';nextSize.style.top=((179+(dim.h*45.75-8)/2)*unit)+'cqw';nextSize.hidden=c.sizes.length<2;
    $('#v9WidgetName').textContent=c.name;$('#v9WidgetGroup').textContent=c.section+' · '+String(index+1).padStart(2,'0')+'/14';$('#v9WidgetDesc').textContent=c.desc;
    $('#v9WidgetMeasure').textContent=dim.w+' × '+dim.h+'칸';
    $('#v9WidgetNote').textContent=c.dittoable?'친구에게 디토를 허용할 수 있어요.':c.kind==='together'?'함께 찍은 네 컷의 비율을 유지해요.':'플래터에서 내용과 위치를 자유롭게 바꿔요.';
    sizes.replaceChildren();c.sizes.forEach(function(s,i){var b=document.createElement('button');b.type='button';b.textContent=s.w+'×'+s.h;b.setAttribute('aria-pressed',i===choice);b.setAttribute('aria-label',s.w+'칸 너비, '+s.h+'칸 높이');b.addEventListener('click',function(){show(current,i);var next=sizes.children[i];if(next)next.focus({preventScroll:true});});sizes.appendChild(b);});
    Array.from(types.children).forEach(function(b,i){b.setAttribute('aria-pressed',i===index);});
    if(!reduce&&selectedBox.animate&&first){
      var last=selectedBox.getBoundingClientRect(), dx=first.left-last.left, dy=first.top-last.top;
      selectedBox.style.transformOrigin='0 0';
      specimenMotion=selectedBox.animate([{transform:'translate('+dx+'px,'+dy+'px) scale('+(first.width/last.width)+','+(first.height/last.height)+')',opacity:oldKind===c.kind?1:.25},{transform:'none',opacity:1}],{duration:520,easing:'cubic-bezier(.22,1,.36,1)'});
      ruler.animate([{opacity:0},{opacity:1}],{duration:240,delay:260,fill:'backwards'});
      nextSize.animate([{opacity:0,scale:'.8'},{opacity:1,scale:'1'}],{duration:240,delay:260,fill:'backwards'});
    }
  }
  catalog.forEach(function(c,i){var b=document.createElement('button');b.type='button';b.className='v9-type';b.setAttribute('aria-label',c.name+' 위젯 자세히 보기');
    var mini=document.createElement('div');mini.className='dpl';mini.setAttribute('aria-hidden','true');var size=c.defaultSize;
    var box=W.box({id:'v9-mini-'+c.kind,kind:c.kind,x:0,y:0,w:size.w,h:size.h,data:clone(c.sample||{}),ditto:false});mini.appendChild(box);place(box,size,179,145);box.style.transform='scale('+Math.min(300/(size.w*45.75-8),255/(size.h*45.75-8))+')';box.style.transformOrigin='center';
    var label=document.createElement('b');label.textContent=c.name;b.append(mini,label);b.addEventListener('click',function(){show(i);});
    b.addEventListener('keydown',function(e){if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();var ni=e.key==='Home'?0:e.key==='End'?catalog.length-1:(i+(e.key==='ArrowRight'?1:-1)+catalog.length)%catalog.length;types.children[ni].focus();show(ni);}});types.appendChild(b);
  });show(current);
  addEventListener('resize',function(){if(stage._fit)stage._fit();});
}
var layouts=$('#v9Layouts');
if(layouts&&window.__v9Layouts){var names=['자유롭게','가지런히','사진을 크게'];
 window.__v9Layouts.forEach(function(lay,index){var b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed',index===0);b.setAttribute('aria-label',names[index]+' 배치로 바꾸기');
 var map=document.createElement('span');map.className='v9-layout-map';map.setAttribute('aria-hidden','true');
 window.DITTO_PLATTERS.jiuallday.widgets.forEach(function(w,wi){var r=lay?lay[w.id.replace('fs-07-jiu-','')]:[w.x,w.y,w.w,w.h];var cell=document.createElement('i');cell.style.cssText='left:'+r[0]/8*100+'%;top:'+r[1]/16*100+'%;width:calc('+r[2]/8*100+'% - 2px);height:calc('+r[3]/16*100+'% - 2px);';if(wi===0)cell.className='accent';map.appendChild(cell);});
 var label=document.createElement('b');label.textContent=names[index];b.append(map,label);b.addEventListener('click',function(){window.__v9SetLayout(index);});layouts.appendChild(b);
 });window.addEventListener('v9:layout',function(e){Array.from(layouts.children).forEach(function(b,i){b.setAttribute('aria-pressed',i===e.detail);});});
}
var grid=$('#v9GridToggle');if(grid)grid.addEventListener('click',function(){var on=grid.getAttribute('aria-pressed')!=='true';grid.setAttribute('aria-pressed',on);if(window.__v9Lab)window.__v9Lab.setGridVisible(on);});
var hero=$('#v9HeroLayout'), hi=0;
if(hero)hero.addEventListener('click',function(){var ins=window.__v9Hero;if(!ins)return;hi=(hi+1)%3;var all=window.DITTO_PLATTERS.jiuallday.widgets;
 var L=[null,[[0,0,4,3],[4,0,2,2],[6,0,2,2],[0,3,3,4],[3,3,4,3],[3,6,3,4],[0,7,3,4],[4,10,4,2],[0,11,4,3],[4,12,4,3]],[[0,0,6,4],[6,0,2,2],[6,2,2,2],[0,4,4,4],[4,4,4,3],[4,7,4,3],[0,8,4,3],[0,11,4,2],[4,10,4,3],[0,13,4,3]]];
 ins.setLayout(all.map(function(w,i){var p=L[hi]?L[hi][i]:[w.x,w.y,w.w,w.h];return{id:w.id,kind:w.kind,x:p[0],y:p[1],w:p[2],h:p[3]};}),{animate:!reduce,stagger:25});
});
// Save a personal photo card without pretending to issue a server invite code.
async function saveCard(){
 var name=$('#tmDisp'), id=$('#tmName'), message=$('#v9SaveMessage');
 if(!name.value.trim()){message.textContent='초대장에 적을 이름을 먼저 알려 주세요.';name.focus();return;}
 if(!/^[a-z]{3,16}$/.test(id.value)){message.textContent='아이디는 영문 소문자 3–16자로 적어 주세요.';id.focus();return;}
 if(!window.__dittoTicket){message.textContent='카드를 준비하고 있어요. 잠시 뒤 다시 눌러 주세요.';return;}
 var t={name:name.value.trim(),nickname:id.value,note:$('#tmNote').value.trim(),palette:document.querySelector('#tmSw [aria-checked=true]')?.dataset.k||'purple-pink'};
 try{var mine=JSON.parse(localStorage.getItem('ditto.ticket2')||'null');if(mine&&mine.nickname===t.nickname)t=mine;}catch(e){}
 var buttons=[$('#v9PreviewSave'),$('#v9ModalSave')];buttons.forEach(function(b){if(b)b.disabled=true;});
 try{
  await document.fonts.ready;
  var svg=window.__dittoTicket(t,1200,760);var image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await image.decode();
  var c=document.createElement('canvas');c.width=1200;c.height=760;var ctx=c.getContext('2d');ctx.drawImage(image,0,0);
  var ph=window.__dittoInvitePhoto;if(ph){var width=618,k=Math.max(width/ph.width,760/ph.height),sw=width/k,sh=760/k;ctx.save();ctx.beginPath();ctx.roundRect(0,0,1200,760,48);ctx.clip();ctx.drawImage(ph,(ph.width-sw)/2,(ph.height-sh)/2,sw,sh,0,0,width,760);ctx.restore();}
  var blob=await new Promise(function(resolve){c.toBlob(resolve,'image/png');});if(!blob)throw new Error('empty image');
  var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ditto-'+t.nickname+(t.code?'-invite':'-photo-card')+'.png';a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);
  message.textContent=t.code?'초대 코드가 담긴 카드를 저장했어요.':'사진 카드를 저장했어요. 실제 초대 코드는 초대장 발급 후 담겨요.';
 }catch(e){message.textContent='이미지를 저장하지 못했어요. 다시 한 번 눌러 주세요.';}
 finally{buttons.forEach(function(b){if(b)b.disabled=false;});}
}
['#v9PreviewSave','#v9ModalSave'].forEach(function(sel){var b=$(sel);if(b)b.addEventListener('click',saveCard);});
})();
