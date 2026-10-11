/* Isolated design preview. No app state, account, server, or real widget data writes. */
(() => {
  const G=DittoGrid,F=DittoPlatterFixtures,WF=DittoWidgetFloating,host=document.querySelector('#platter-simulator');
  let boards={life:structuredClone(F.life),rep:structuredClone(F.rep)},segment='life',editing=false,selected=null,width=390,scale=1;
  let active=null,pending=null,raf=0,lastTime=0,skipClickUntil=0,sequence=1;const history=[];
  host.innerHTML=`<div class="sim-layout">
    <div class="sim-stage"><div class="sim-phone">
      <div class="sim-statusbar" aria-hidden="true"><span>9:41</span><i></i><small>▮▮▮ ▰</small></div>
      <div class="sim-tabs" role="tablist" aria-label="플래터 선택"><button type="button" role="tab" data-segment="rep" id="sim-tab-rep" aria-controls="sim-board" aria-selected="false" tabindex="-1">대표</button><button type="button" role="tab" data-segment="life" id="sim-tab-life" aria-controls="sim-board" aria-selected="true">라이프</button></div>
      <div class="sim-profile"><img class="sim-avatar" src="${F.profile.avatar}" alt=""><div class="sim-profile-name">${F.profile.name} ⭐<small>나의 애칭목록</small></div><button type="button" id="sim-edit" aria-label="플래터 편집"><img src="ds-web/assets/ic/ic-pencil.png" alt=""></button></div>
      <div class="sim-hint"><span id="sim-edit-hint">밀어서 스크롤 · 꾹 눌러 이동</span><button type="button" id="sim-compact" hidden>정리하기</button></div>
      <div class="sim-scroll" id="sim-board" role="tabpanel" aria-labelledby="sim-tab-life" tabindex="0"><div class="sim-canvas"><div class="sim-ghost" hidden><span></span></div></div></div>
      <div class="sim-nav" aria-label="홈 화면의 하단 탐색 위치 참고"><span aria-current="page"><img src="../../DittoPrototype/Assets.xcassets/tab-home-bar.imageset/tab-home-bar.svg" alt="">홈</span><span><img src="../../DittoPrototype/Assets.xcassets/tab-ditto-bar.imageset/tab-ditto-bar.svg" alt="">Ditto!</span><span><img src="../../DittoPrototype/Assets.xcassets/tab-friend-bar.imageset/tab-friend-bar.svg" alt="">친구</span></div>
      <div class="sim-edit-footer" hidden><button type="button" id="sim-add">＋ 위젯 자리 추가</button><button type="button" id="sim-done">수정 완료</button></div><div class="sim-home-indicator" aria-hidden="true"></div>
    </div></div>
    <aside class="sim-controls" aria-label="플래터 실험 도구">
      <span class="ds-kicker">배치와 스크롤 실험</span><p class="ds-muted">일반 화면에서 0.5초, 편집 중에는 0.18초 눌러 이동합니다. 편집 중에도 바로 밀면 스크롤할 수 있어요.</p>
      <label for="sim-width">기준 화면 너비</label><select id="sim-width"><option value="390">390 · 기본 화면</option><option value="402">402 · 넓은 화면</option></select>
      <div class="sim-control-row"><button class="ds-control" type="button" id="sim-grid" aria-pressed="false">배치 안내선 보기</button><button class="ds-control" type="button" id="sim-undo" disabled>되돌리기</button></div>
      <div class="sim-readout"><strong id="sim-selection">위젯을 선택해 보세요</strong><p id="sim-coordinates">모든 배치는 8열 × 16행 안에서 이루어집니다.</p></div>
      <fieldset id="sim-selection-tools" disabled><legend>선택한 위젯 조절</legend>
        <div class="sim-position" role="group" aria-label="한 칸씩 이동"><button type="button" data-step="up" aria-label="위로 한 칸">↑</button><button type="button" data-step="left" aria-label="왼쪽으로 한 칸">←</button><button type="button" data-step="down" aria-label="아래로 한 칸">↓</button><button type="button" data-step="right" aria-label="오른쪽으로 한 칸">→</button></div>
        <label for="sim-size">위젯 크기</label><select id="sim-size"><option value="4,4">정사각형 · 4 × 4칸</option><option value="6,2">가로 배너 · 6 × 2칸</option><option value="3,4">세로형 · 3 × 4칸</option><option value="4,3">가로형 · 4 × 3칸</option><option value="2,6">세로 배너 · 2 × 6칸</option></select>
        <div class="sim-control-row"><button type="button" class="ds-control" id="sim-promote">대표로 옮기기</button><button type="button" class="ds-control" id="sim-remove">자리 삭제</button></div>
      </fieldset>
      <p class="sim-announcement" id="sim-message" role="status">보기 모드입니다. 위젯을 누르면 임시 콘텐츠를 확인할 수 있어요.</p>
      <button type="button" class="ds-control" id="sim-reset">샘플 배치로 되돌리기</button>
      <details><summary>현재 앱과 맞춘 부분</summary><p class="ds-muted">대표/라이프 탭, 64 높이 프로필, 16 여백·8 간격, 8열×16행, 길게 누르기, 먼저 밀기→안 되면 같은 크기 맞교환, 배치 실패 시 복귀, 가장자리 스크롤을 반영했습니다. 하단 유리 재질은 웹 참고 표현이며 네이티브 Liquid Glass가 아닙니다. 위젯 상세·콘텐츠 편집·다른 하단 탭은 이번 실험 범위가 아닙니다.</p></details>
    </aside>
  </div><dialog class="sim-detail" aria-labelledby="sim-detail-title"><h3 id="sim-detail-title"></h3><p id="sim-detail-copy"></p><p class="ds-muted">기존 자료로 만든 임시 콘텐츠입니다. 새 위젯 디자인은 전달 후 교체합니다.</p><button type="button" class="ds-control" id="sim-detail-close">닫기</button></dialog>`;
  const $=s=>host.querySelector(s),phone=$('.sim-phone'),stage=$('.sim-stage'),canvas=$('.sim-canvas'),scroll=$('.sim-scroll'),ghost=$('.sim-ghost'),dialog=$('dialog');
  const list=()=>boards[segment],geo=()=>G.geometry(width),find=id=>list().find(w=>w.id===id),count=()=>list().filter(w=>w.type!=='ditto').length;
  const eligible=w=>w&&!['status','gif','ditto'].includes(w.type);
  const say=message=>{$('#sim-message').textContent=message;};
  const snapshot=()=>{history.push(structuredClone(boards));if(history.length>20)history.shift();};
  function commit(next,message){if(!G.valid(next)){say('배치를 적용할 수 없어 원래 위치를 유지했어요.');return false;}snapshot();boards[segment]=next;render();say(message);return true;}
  function card(w){
    const wrapper=document.createElement('div');wrapper.className='sim-widget';wrapper.dataset.widget=w.id;
    const b=document.createElement('button');b.type='button';b.className='sim-widget-face';b.dataset.type=w.type;b.dataset.openWidget=w.id;
    b.setAttribute('aria-label',`${w.title}, ${w.col+1}열 ${w.row+1}행, ${w.w}칸 곱하기 ${w.h}칸${editing?', 선택해서 이동 또는 크기 조절':''}`);
    if(w.attribution){b.classList.add('dw-host');b.append(DittoAttribution.createCard({source:w.attribution,content:{image:w.art,alt:w.title}}));b.setAttribute('aria-label',b.getAttribute('aria-label')+', '+DittoAttribution.attributionFor(w.attribution));}
    else if(w.art){const img=document.createElement('img');img.src=w.art;img.alt='';img.draggable=false;b.append(img);}
    else if(w.type==='ditto'){const img=document.createElement('img');img.src='../../'+DittoDSTokens.logo.source;img.alt='';img.draggable=false;b.append(img);}
    else {const text=document.createElement('p');text.textContent=w.content||'새 위젯 디자인 대기';b.append(text);}
    const title=document.createElement('strong');title.textContent=w.title;if(!w.attribution)b.append(title);
    const visual=document.createElement('div');visual.className='wf-visual';
    const shadow=document.createElement('span');shadow.className='wf-release-shadow';shadow.setAttribute('aria-hidden','true');
    visual.append(shadow,b);wrapper.append(visual);
    if(editing&&selected===w.id){
      if(segment==='life'&&eligible(w)){const b=document.createElement('button');b.type='button';b.className='sim-tool promote';b.dataset.promote=w.id;b.textContent='대표로 ↑';wrapper.append(b);}
      const del=document.createElement('button');del.type='button';del.className='sim-tool remove';del.dataset.remove=w.id;del.textContent='×';del.setAttribute('aria-label',w.title+' 자리 삭제');wrapper.append(del);
      if(!w.fixed){const resize=document.createElement('button');resize.type='button';resize.className='sim-tool resize';resize.dataset.resize=w.id;resize.setAttribute('aria-label',w.title+' 크기 조절, 방향키로 한 칸씩 변경');resize.textContent='↔';wrapper.append(resize);}
    }
    return wrapper;
  }
  function render(preserveId){
    phone.classList.toggle('editing',editing);$('.sim-profile').classList.toggle('is-rep',segment==='rep');
    $('#sim-edit').dataset.editing=String(editing);$('#sim-edit').innerHTML=editing?'수정완료':'<img src="ds-web/assets/ic/ic-pencil.png" alt="">';$('#sim-edit').setAttribute('aria-label',editing?'플래터 수정 완료':'플래터 편집');
    $('#sim-edit-hint').textContent=editing?`위젯 ${count()}/10 · 꾹 눌러 이동 · 밀어서 스크롤`:'밀어서 스크롤 · 꾹 눌러 이동';$('#sim-compact').hidden=!editing;$('.sim-edit-footer').hidden=!editing;
    host.querySelectorAll('[data-segment]').forEach(b=>{const on=b.dataset.segment===segment;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});scroll.setAttribute('aria-labelledby','sim-tab-'+segment);
    // A touch sequence keeps its original target. Replacing that node mid-gesture
    // strands touchmove/touchend on a detached element, leaving drag active forever.
    canvas.querySelectorAll('.sim-widget').forEach(n=>{if(n.dataset.widget!==preserveId)n.remove();});for(const w of list())if(w.id!==preserveId)canvas.append(card(w));layout();
    $('#sim-selection-tools').disabled=!selected;const w=find(selected);
    $('#sim-selection').textContent=w?w.title:'위젯을 선택해 보세요';$('#sim-coordinates').textContent=w?`${w.col+1}열 · ${w.row+1}행 / 가로 ${w.w}칸 · 세로 ${w.h}칸`:'8열 × 16행 · 위젯 간격 8 · 좌우 여백 16';
    const sizes=$('#sim-size');sizes.querySelectorAll('[data-current]').forEach(n=>n.remove());if(w){const value=`${w.w},${w.h}`;if(![...sizes.options].some(o=>o.value===value)){const o=new Option(`현재 크기 · ${w.w} × ${w.h}칸`,value);o.dataset.current='true';sizes.add(o);}sizes.value=value;}sizes.disabled=!w||w.fixed;
    for(const option of sizes.options)option.disabled=!!w?.attribution&&Number(option.value.split(',')[0])<3;
    $('#sim-promote').disabled=segment!=='life'||!eligible(w);$('#sim-undo').disabled=!history.length;
  }
  function layout(){
    const g=geo();canvas.style.width=g.width+'px';canvas.style.height=g.height+'px';canvas.style.setProperty('--grid-unit',g.unit+'px');canvas.classList.toggle('show-grid',editing||$('#sim-grid').getAttribute('aria-pressed')==='true');
    const current=active?.result?.valid?active.result.layout:list();
    for(const w of current){const n=canvas.querySelector(`[data-widget="${w.id}"]`);if(!n)continue;
      const dragging=active?.id===w.id,live=dragging?active.live:null;
      n.classList.toggle('is-selected',editing&&selected===w.id);n.classList.toggle('is-moving',dragging);n.classList.toggle('is-resizing',dragging&&active.kind==='resize');n.style.borderRadius=G.radius(w.w,w.h)+'px';
      n.style.width=(dragging&&active.kind==='resize'?live.w:g.pw(w.w))+'px';n.style.height=(dragging&&active.kind==='resize'?live.h:g.pw(w.h))+'px';
      n.style.transform=`translate(${dragging&&active.kind==='move'?live.x:g.px(w.col)}px,${dragging&&active.kind==='move'?live.y:g.px(w.row)}px)`;
    }
    ghost.hidden=!active||active.promote;
    if(active&&!active.promote){const t=active.target;ghost.style.transform=`translate(${g.px(t.x)}px,${g.px(t.y)}px)`;ghost.style.width=g.pw(t.w)+'px';ghost.style.height=g.pw(t.h)+'px';ghost.classList.toggle('invalid',!active.result.valid);ghost.querySelector('span').textContent=active.result.valid?'여기에 놓기':'놓을 수 없어요';}
    $('[data-segment="rep"]').classList.toggle('is-promote-target',!!active?.promote);
  }
  function cancelPending(){if(pending){clearTimeout(pending.timer);canvas.querySelector(`[data-widget="${pending.id}"]`)?.classList.remove('is-pressing');pending=null;}}
  function stop(cancelled=true){cancelPending();if(raf)cancelAnimationFrame(raf);raf=0;lastTime=0;const old=active,previous=old?WF.capture(canvas.querySelector(`[data-widget="${old.id}"]`)):null;active=null;scroll.style.overflowY='auto';if(old?.pointerId!==undefined&&scroll.hasPointerCapture(old.pointerId))scroll.releasePointerCapture(old.pointerId);if(old){skipClickUntil=performance.now()+450;render();if(cancelled){WF.settle(canvas.querySelector(`[data-widget="${old.id}"]`),previous,scale,true);say('이동을 취소하고 원래 위치로 돌아왔어요.');}}return old;}
  function begin(id,kind,point,pointerId){
    cancelPending();const w=find(id);if(!w)return;const before=canvas.getBoundingClientRect(),g=geo(),grab={x:(point.x-before.x)/scale-g.px(w.col),y:(point.y-before.y)/scale-g.px(w.row)};
    editing=true;selected=id;render(id);
    active={id,kind,pointerId,start:point,point,grab,base:structuredClone(list()),origin:{col:w.col,row:w.row},target:G.rect(w),live:{x:g.px(w.col),y:g.px(w.row),w:g.pw(w.w),h:g.pw(w.h)},result:{valid:true,layout:list()},entry:{x:0,y:1},last:null,promote:false};
    scroll.style.overflowY='hidden';if(pointerId!==undefined)scroll.setPointerCapture(pointerId);
    layout();say(kind==='resize'?'크기를 조절하고 있어요. 놓으면 적용합니다.':'위젯을 옮기고 있어요. 놓으면 배치하고 Escape로 취소합니다.');if(kind==='move')raf=requestAnimationFrame(tick);
  }
  function update(point){
    if(!active)return;active.point=point;const a=active,w=a.base.find(o=>o.id===a.id),g=geo(),cr=canvas.getBoundingClientRect(),tab=$('.sim-tabs').getBoundingClientRect();
    if(a.kind==='move'){
      const live={x:(point.x-cr.x)/scale-a.grab.x,y:(point.y-cr.y)/scale-a.grab.y};
      if(a.last){a.entry.x=a.entry.x*.7+(live.x-a.last.x)*.3;a.entry.y=a.entry.y*.7+(live.y-a.last.y)*.3;}a.last=live;a.live=live;
      a.target={x:Math.max(0,Math.min(8-w.w,Math.round(live.x/g.unit))),y:Math.max(0,Math.min(16-w.h,Math.round(live.y/g.unit))),w:w.w,h:w.h};
      a.promote=segment==='life'&&eligible(w)&&point.x>=tab.left&&point.x<=tab.right&&point.y>=tab.top-19*scale&&point.y<=tab.bottom+19*scale;
    }else{
      const minW=w.attribution?3:2,maxW=Math.min(6,8-w.col),maxH=Math.min(8,16-w.row),rub=(v,mn,mx)=>v>mx?mx+Math.min((v-mx)*.4,28):v<mn?mn+Math.max((v-mn)*.4,-28):v;
      a.live={w:rub(g.pw(w.w)+(point.x-a.start.x)/scale,g.pw(minW),g.pw(maxW)),h:rub(g.pw(w.h)+(point.y-a.start.y)/scale,g.pw(2),g.pw(maxH))};
      a.target={x:w.col,y:w.row,w:Math.max(minW,Math.min(maxW,Math.round((a.live.w+8)/g.unit))),h:Math.max(2,Math.min(maxH,Math.round((a.live.h+8)/g.unit)))};
    }
    const first=Math.abs(a.entry.x)>Math.abs(a.entry.y)?(a.entry.x>0?'right':'left'):(a.entry.y>0?'down':'up');
    const dirs=a.kind==='resize'?['down','right','left','up']:[first,...['down','right','left','up'].filter(d=>d!==first)];
    a.result=G.preview(a.base,a.id,a.target,dirs,a.origin);layout();
  }
  function tick(now){
    if(!active||active.kind!=='move'){raf=0;return;}const dt=lastTime?Math.min((now-lastTime)/1000,1/30):1/60;lastTime=now;
    const r=scroll.getBoundingClientRect(),p=active.point,edge=56*scale;let velocity=0;
    if(!active.promote&&p.x>=r.left-24*scale&&p.x<=r.right+24*scale){if(p.y<r.top+edge)velocity=-Math.min(1,Math.max(0,(r.top+edge-p.y)/edge));else if(p.y>r.bottom-edge)velocity=Math.min(1,Math.max(0,(p.y-r.bottom+edge)/edge));}
    if(velocity){const y=scroll.scrollTop;scroll.scrollTop+=velocity*420*dt;if(Math.abs(scroll.scrollTop-y)>.25)update(p);}
    raf=requestAnimationFrame(tick);
  }
  function finish(point){
    if(!active){cancelPending();return;}update(point);const r=scroll.getBoundingClientRect(),inside=point.x>=r.left-24*scale&&point.x<=r.right+24*scale&&point.y>=r.top-24*scale&&point.y<=r.bottom+24*scale;
    const previous=WF.capture(canvas.querySelector(`[data-widget="${active.id}"]`));
    const a=stop(false);if(a.promote){promote(a.id);return;}
    let applied=false;
    if(a.result.valid&&inside)applied=commit(a.result.layout,a.kind==='resize'?'크기를 바꿨어요.':a.result.kind==='push'?'겹치는 위젯을 밀어서 배치했어요.':a.result.kind==='swap'?'같은 크기 위젯과 자리를 바꿨어요.':'새 위치에 놓았어요.');else{render();say('여기에는 놓을 수 없어 원래 위치를 유지했어요.');}
    if(a.kind==='move')WF.settle(canvas.querySelector(`[data-widget="${a.id}"]`),previous,scale,!applied);
  }
  function arm(e,point,pointerId){
    if(active)return;const resize=e.target.closest('[data-resize]'),face=e.target.closest('[data-open-widget]');if(resize){begin(resize.dataset.resize,'resize',point,pointerId);return;}
    if(!face)return;const id=face.dataset.openWidget;cancelPending();WF.stopAll();canvas.querySelector(`[data-widget="${id}"]`)?.classList.add('is-pressing');pending={id,start:point,point,timer:setTimeout(()=>{if(pending)begin(id,'move',pending.point,pointerId);},editing?WF.recipe.motion.holdEditingMs:WF.recipe.motion.holdBrowseMs)};
  }
  scroll.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button!==0||!e.isPrimary)return;arm(e,{x:e.clientX,y:e.clientY},e.pointerId);});
  window.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const p={x:e.clientX,y:e.clientY};if(active?.pointerId===e.pointerId){e.preventDefault();update(p);}else if(pending){pending.point=p;if(Math.hypot(p.x-pending.start.x,p.y-pending.start.y)>WF.recipe.motion.scrollCancelDistance)cancelPending();}});
  window.addEventListener('pointerup',e=>{if(e.pointerType==='touch')return;if(active?.pointerId===e.pointerId)finish({x:e.clientX,y:e.clientY});else cancelPending();});
  scroll.addEventListener('pointercancel',e=>{if(e.pointerType!=='touch')stop();});scroll.addEventListener('lostpointercapture',e=>{if(active?.pointerId===e.pointerId)stop();});
  scroll.addEventListener('touchstart',e=>{if(e.touches.length!==1){stop();return;}const t=e.touches[0];arm(e,{x:t.clientX,y:t.clientY});},{passive:true});
  scroll.addEventListener('touchmove',e=>{if(e.touches.length!==1){stop();return;}const t=e.touches[0],p={x:t.clientX,y:t.clientY};if(active){if(e.cancelable)e.preventDefault();update(p);}else if(pending){pending.point=p;if(Math.hypot(p.x-pending.start.x,p.y-pending.start.y)>WF.recipe.motion.scrollCancelDistance)cancelPending();}},{passive:false});
  scroll.addEventListener('touchend',e=>{const t=e.changedTouches[0];if(active)finish({x:t.clientX,y:t.clientY});else cancelPending();});scroll.addEventListener('touchcancel',()=>stop());
  scroll.addEventListener('scroll',()=>{if(!active)cancelPending();},{passive:true});
  function focusSelected(){canvas.querySelector(`[data-open-widget="${selected}"]`)?.focus({preventScroll:true});}
  function move(dx,dy){const w=find(selected);if(!w)return;stop(false);const r=G.preview(list(),w.id,{...G.rect(w),x:w.col+dx,y:w.row+dy},[dy>0?'down':dy<0?'up':dx>0?'right':'left','down','right','left','up']);if(r.valid)commit(r.layout,'한 칸 이동했어요.');else say('그 방향에는 놓을 공간이 없어요.');}
  function remove(id){stop(false);if(!find(id))return;selected=null;commit(list().filter(w=>w.id!==id),'미리보기에서 자리를 지웠어요. 되돌리기로 복구할 수 있습니다.');}
  function promote(id){stop(false);const w=find(id);if(segment!=='life'||!eligible(w))return;const target=G.firstFit(boards.rep,w.w,w.h);if(!target||boards.rep.filter(o=>o.type!=='ditto').length>=10){say('대표 플래터에 빈자리가 없어 현재 위치를 유지했어요.');return;}snapshot();boards.life=boards.life.filter(o=>o.id!==id);boards.rep.push({...w,...target});segment='rep';selected=id;scroll.scrollTop=0;render();say('대표 플래터로 옮겼어요.');}
  canvas.addEventListener('click',e=>{
    if(performance.now()<skipClickUntil){e.preventDefault();return;}
    const del=e.target.closest('[data-remove]'),pro=e.target.closest('[data-promote]');if(del){remove(del.dataset.remove);return;}if(pro){promote(pro.dataset.promote);return;}
    if(e.target.closest('[data-resize]'))return;const face=e.target.closest('[data-open-widget]');
    if(face){const w=find(face.dataset.openWidget);if(editing){selected=w.id;render();focusSelected();say(w.title+' 선택. 방향키나 옆의 위치 버튼으로도 옮길 수 있어요.');}else {stop(false);$('#sim-detail-title').textContent=w.title;$('#sim-detail-copy').textContent=w.content||'사진 위젯의 자리와 비율을 확인하는 샘플입니다.';dialog.showModal();}}
    else if(editing){stop(false);editing=false;selected=null;render();say('편집을 마쳤어요. 현재 미리보기에만 적용됩니다.');}
  });
  canvas.addEventListener('keydown',e=>{
    const face=e.target.closest('[data-open-widget]'),handle=e.target.closest('[data-resize]');if(!editing||!face&&!handle)return;
    const dirs={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]},d=dirs[e.key];if(!d)return;e.preventDefault();selected=(handle||face).dataset[handle?'resize':'openWidget'];
    if(handle){const w=find(selected),r=G.preview(list(),w.id,{...G.rect(w),w:Math.max(w.attribution?3:2,Math.min(6,w.w+d[0])),h:Math.max(2,Math.min(8,w.h+d[1]))});if(r.valid)commit(r.layout,'크기를 한 칸 조절했어요.');else say('이 크기는 여기에 들어가지 않아요.');canvas.querySelector(`[data-resize="${selected}"]`)?.focus({preventScroll:true});}else{move(...d);focusSelected();}
  });
  function switchSegment(next){stop(false);segment=next;editing=false;selected=null;scroll.scrollTop=0;render();say((next==='life'?'라이프':'대표')+' 플래터를 보고 있어요.');}
  host.querySelectorAll('[data-segment]').forEach(b=>{b.onclick=()=>switchSegment(b.dataset.segment);b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'rep':e.key==='End'?'life':segment==='life'?'rep':'life';switchSegment(next);$('[data-segment="'+next+'"]').focus();}};});
  $('#sim-edit').onclick=()=>{stop(false);editing=!editing;selected=null;render();say(editing?'편집 모드입니다. 위젯을 선택하거나 꾹 눌러 이동하세요.':'편집을 마쳤어요. 현재 미리보기에만 적용됩니다.');};
  $('#sim-done').onclick=()=>{stop(false);editing=false;selected=null;render();$('#sim-edit').focus();say('편집을 마쳤어요. 실제 앱 데이터는 바뀌지 않습니다.');};
  $('#sim-compact').onclick=()=>{stop(false);commit(G.compact(list()),'위젯을 위쪽 빈자리로 정리했어요.');};
  $('#sim-grid').onclick=()=>{const b=$('#sim-grid');b.setAttribute('aria-pressed',String(b.getAttribute('aria-pressed')!=='true'));layout();};
  $('#sim-undo').onclick=()=>{stop(false);if(!history.length)return;boards=history.pop();selected=null;render();say('직전 배치로 되돌렸어요.');};
  $('#sim-reset').onclick=()=>{stop(false);snapshot();boards={life:structuredClone(F.life),rep:structuredClone(F.rep)};segment='life';selected=null;editing=false;scroll.scrollTop=0;render();say('샘플 배치로 돌아왔어요. 되돌리기로 복구할 수 있습니다.');};
  $('#sim-add').onclick=()=>{stop(false);if(count()>=10){say('한 플래터에는 위젯을 10개까지 놓을 수 있어요. 자리를 지운 뒤 추가해 주세요.');return;}const place=G.firstFit(list(),2,2,Math.floor(scroll.scrollTop/geo().unit));if(!place){say('빈자리가 없어요. 크기나 위치를 먼저 조정해 주세요.');return;}const w={id:'placeholder-'+sequence++,type:'text',title:'새 위젯 자리',content:'에셋 전달 후\n교체 예정',w:2,h:2,...place};selected=w.id;commit([...list(),w],'새 위젯 자리를 추가했어요. 내부 디자인은 아직 적용하지 않았습니다.');};
  host.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>move(...({up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[b.dataset.step])));
  $('#sim-size').onchange=e=>{const w=find(selected);if(!w||w.fixed)return;stop(false);const [nw,nh]=e.target.value.split(',').map(Number);if(w.attribution&&nw<3){render();say('출처 정보를 유지하려면 너비가 3칸 이상 필요해요. 2칸용 디자인은 아직 미확정입니다.');return;}const r=G.preview(list(),w.id,{x:Math.min(w.col,8-nw),y:Math.min(w.row,16-nh),w:nw,h:nh});if(r.valid)commit(r.layout,'선택한 크기로 바꿨어요.');else {render();say('이 크기를 놓을 공간이 없어요. 위치를 옮긴 후 다시 시도해 주세요.');}};
  $('#sim-remove').onclick=()=>remove(selected);$('#sim-promote').onclick=()=>promote(selected);
  $('#sim-detail-close').onclick=()=>dialog.close();
  let fittedWidth=0,fittedScale=0;
  function fit(){const nextScale=Math.min(1,stage.clientWidth/width);if(fittedWidth===width&&Math.abs(fittedScale-nextScale)<.0001)return;stop(false);scale=nextScale;fittedWidth=width;fittedScale=scale;phone.style.width=width+'px';phone.style.transform=`scale(${scale})`;phone.style.setProperty('--sim-scale',scale);stage.style.height=(800*scale)+'px';render();}
  $('#sim-width').onchange=e=>{width=Number(e.target.value);fit();};new ResizeObserver(fit).observe(stage);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&(active||pending))stop();});window.addEventListener('blur',()=>stop());document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.DittoPlatterPreview={get state(){return {segment,editing,selected,width,scale,boards:structuredClone(boards),active:active?{id:active.id,kind:active.kind,target:active.target,valid:active.result.valid}:null,animationFrame:raf};},reset:()=>$('#sim-reset').click()};
  render();fit();
})();
