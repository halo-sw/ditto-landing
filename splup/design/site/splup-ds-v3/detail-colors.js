(() => {
  'use strict';
  const D=window.SplupDetailColors,M=window.SplupDetailColorModel;
  if(!D||!M)return;
  const root=document.querySelector('[data-detail-colors]');if(!root)return;
  let state=M.create(),active='background',customHSV=M.toHSV('#862FC6');
  const label=f=>f==='background'?'배경':'텍스트';
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const option=(p,field)=>`<button type="button" class="dc-option" role="radio" aria-checked="false" tabindex="-1" data-color="${p.id}" data-field="${field}" aria-label="${escape(p.name)}${p.value?' '+p.value:''}" title="${escape(p.name)}${p.value?' · '+p.value:''}"><span class="dc-swatch" style="--swatch:${M.css(p.id)}"></span></button>`;
  const widget=body=>`<div class="dc-widget"><span class="dc-kicker">나의 일상</span><span class="dc-body">${escape(body)}</span><span class="dc-footer">지우 · 오늘</span></div>`;
  root.innerHTML=`<div class="dc-workspace">
    <div class="dc-preview-column"><h3>이렇게 보여요</h3><div class="dc-preview-stage" data-dc-preview>${widget('좋아하는 순간을\n오래 기억하고 싶어.')}</div><div class="dc-detail-preview" data-dc-preview><strong>오늘의 작은 발견</strong><p>걸음을 늦추니 보이는 것들.\n오늘은 이 색으로 남겨볼래.</p></div><p class="dc-caption">위젯 181 × 181 · 상세 본문에 같은 색을 적용해요.</p><div class="dc-values" data-dc-values></div></div>
    <div class="dc-controls">${['background','text'].map(f=>`<div class="dc-field"><div class="dc-field-label"><strong>${label(f)}</strong><span data-dc-name="${f}"></span></div><div class="dc-bar"><button type="button" class="dc-icon-button" data-dc-open="${f}" aria-label="${label(f)} 전체 팔레트 열기" aria-controls="dc-expanded-palette" aria-expanded="${f===active}"><img src="widget-assets/palette.svg" alt=""></button><div class="dc-scroll" role="radiogroup" aria-label="${label(f)} 빠른 선택" data-dc-strip="${f}"></div><button type="button" class="dc-icon-button" data-dc-reset="${f}" aria-label="${label(f)} 기본색으로 초기화" title="${label(f)} 기본색으로 초기화"><img src="widget-assets/rotate-ccw.svg" alt=""></button></div></div>`).join('')}
    <p class="dc-caption">무지개 버튼에서 원하는 색을 직접 골라보세요.</p>
    <section class="dc-palette" id="dc-expanded-palette" aria-label="컬러 팔레트"><div class="dc-palette-head"><h3 data-dc-panel-title>배경 색상</h3><button type="button" class="dc-text-button" data-dc-close>접기</button></div><div class="dc-palette-surface"><div data-dc-matrix></div><form class="dc-custom" id="dc-mini-picker" role="dialog" aria-labelledby="dc-mini-title" hidden novalidate>
      <h4 id="dc-mini-title">직접 선택</h4>
      <div class="dc-wheel-wrap"><div class="dc-hue-wheel" data-dc-hue role="slider" tabindex="0" aria-label="색조" aria-valuemin="0" aria-valuemax="359" aria-valuenow="275"><span class="dc-hue-handle"></span></div><div class="dc-sv" data-dc-sv><span class="dc-sv-handle"></span><label class="dc-visually-hidden">채도<input type="range" min="0" max="100" value="76" data-dc-saturation></label><label class="dc-visually-hidden">밝기<input type="range" min="0" max="100" value="78" data-dc-brightness></label></div></div>
      <div class="dc-hex-field"><span class="dc-current-swatch" data-dc-custom-swatch></span><label for="dc-custom-hex">HEX</label><input type="text" value="#862FC6" id="dc-custom-hex" aria-describedby="dc-custom-message" maxlength="7" autocomplete="off" autocapitalize="characters" spellcheck="false"></div><p id="dc-custom-message" class="dc-custom-message" role="status" hidden></p>
      <div class="dc-mini-actions"><button type="button" data-dc-custom-cancel>취소</button><button type="submit" class="dc-custom-confirm">확인</button></div>
    </form></div></section>
    <div class="dc-contrast" data-dc-contrast></div><div class="dc-actions"><button type="button" data-dc-cancel>취소</button><button type="button" class="dc-apply" data-dc-apply>적용하기</button></div><p class="dc-status" data-dc-status role="status" aria-live="polite">색을 선택하면 미리보기가 바뀌어요. 적용하기로 확정해보세요.</p></div></div>
    <h3 style="margin-top:32px;color:var(--ink)">배색 적용 예시</h3><div class="dc-examples">${D.examples.map((e,i)=>`<figure class="dc-example"><div class="dc-example-surface" style="--dc-background:${M.css(e.background)};--dc-text:${M.css(e.text)}">${widget(e.body)}</div><figcaption>${e.name}</figcaption><small>${M.find(e.background).name} + ${M.find(e.text).name}<br>최저 대비 ${M.contrast(e.background,e.text).toFixed(1)}:1</small><button type="button" data-dc-example="${i}">이 조합 미리보기</button></figure>`).join('')}</div>
    <div class="dc-rules"><div><h3>선택은 테두리로</h3><p>색을 바꾸지 않고 얇은 테두리로 선택을 표시해요. 무지개 버튼을 누르면 작은 컬러 휠이 열려요.</p></div><div><h3>텍스트는 단색으로</h3><p>색상표와 컬러 휠에서 단색을 선택해요. 그라디언트 7종은 배경에서만 사용할 수 있어요.</p></div><div><h3>각각 초기화할 수 있어요</h3><p>배경은 화이트, 텍스트는 그레이 950으로 돌아가요. 취소하면 마지막으로 적용한 두 색으로 복원해요.</p></div></div>`;
  const q=s=>root.querySelector(s),qa=s=>[...root.querySelectorAll(s)];
  function drawMatrix(){
    q('[data-dc-panel-title]').textContent=`${label(active)} 색상`;
    q('[data-dc-matrix]').innerHTML=M.paletteRows.slice(0,active==='background'?5:4).map((row,i)=>`<div class="dc-palette-row" role="radiogroup" aria-label="${label(active)} ${['라이트','브랜드','딥','잉크','그라디언트'][i]}">${row.map(id=>id==='custom'?'<button type="button" class="dc-option dc-custom-trigger" data-dc-custom-open aria-label="직접 색 선택" aria-controls="dc-mini-picker" aria-expanded="false"><span class="dc-swatch dc-rainbow"></span></button>':option(M.find(id),active)).join('')}</div>`).join('');
    updateSelection();
  }
  function updateSelection(){
    qa('[role=radiogroup]').forEach(g=>{let found=false;const options=[...g.querySelectorAll('[data-color]')];options.forEach(b=>{const on=b.dataset.color===state.draft[b.dataset.field];b.setAttribute('aria-checked',String(on));b.tabIndex=on?0:-1;if(on)found=true;});if(!found&&options[0])options[0].tabIndex=0;});
    const custom=q('[data-dc-custom-open]'),item=M.find(state.draft[active]);if(custom){custom.dataset.selected=String(item.group==='custom');custom.style.setProperty('--custom-color',item.group==='custom'?item.value:'transparent');}
  }
  function refresh(){
    qa('[data-dc-preview]').forEach(el=>{el.style.setProperty('--dc-background',M.css(state.draft.background));el.style.setProperty('--dc-text',M.css(state.draft.text));});
    ['background','text'].forEach(f=>{
      const item=M.find(state.draft[f]);q(`[data-dc-name=${f}]`).textContent=item.name;
      const strip=q(`[data-dc-strip=${f}]`),items=[item,...D.colors.filter(p=>p.level==='500'&&p.id!==item.id)];
      const signature=items.map(p=>p.id).join('|');
      // Keep the active control and focus stable when selecting colors already in this rail.
      if(![...strip.children].some(b=>b.dataset.color===item.id)){
        const scroll=strip.scrollLeft;strip.innerHTML=items.map(p=>option(p,f)).join('');strip.scrollLeft=scroll;strip.dataset.signature=signature;
      }
    });
    q('[data-dc-values]').innerHTML=['background','text'].map(f=>`<span>${label(f)} · ${M.find(state.draft[f]).value||M.find(state.draft[f]).name}</span>`).join('');
    const ratio=M.contrast(state.draft.background,state.draft.text),best=M.recommend(state.draft.background),low=ratio<D.rules.minimumContrast;
    const contrast=q('[data-dc-contrast]');contrast.dataset.low=String(low);
    contrast.innerHTML=`<strong>${low?'텍스트가 잘 안 보일 수 있어요':'텍스트가 또렷하게 보여요'} · ${ratio.toFixed(1)}:1</strong>${low?'배경과 텍스트의 밝기가 가까워요. ':''}${M.find(state.draft.background).stops?'그라디언트 전체에서 가장 낮은 대비를 확인해요.':'본문 권장 대비는 4.5:1 이상이에요.'}${low&&best.ratio>=4.5?`<button type="button" data-dc-suggest="${best.text}">${M.find(best.text).name} 텍스트로 변경 · ${best.ratio.toFixed(1)}:1</button>`:low?'<span>배경을 더 밝거나 어두운 단색으로 바꿔보세요.</span>':''}`;
    updateSelection();
  }
  function dispatch(action,message){state=M.reduce(state,action);refresh();if(message)q('[data-dc-status]').textContent=message;}
  function open(field,focus=false){closeCustom(false);active=field;q('.dc-palette').hidden=false;qa('[data-dc-open]').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.dcOpen===field)));drawMatrix();if(focus)q('[data-dc-matrix] [tabindex="0"]')?.focus({preventScroll:true});}
  function close(){closeCustom(false);q('.dc-palette').hidden=true;qa('[data-dc-open]').forEach(b=>b.setAttribute('aria-expanded','false'));q(`[data-dc-open=${active}]`).focus({preventScroll:true});}
  function closeCustom(focus=true){q('.dc-custom').hidden=true;q('[data-dc-custom-open]')?.setAttribute('aria-expanded','false');if(focus)q('[data-dc-custom-open]')?.focus({preventScroll:true});}
  function customFeedback(value){
    const valid=!!M.toHSV(value),field=q('#dc-custom-hex'),message=q('#dc-custom-message');field.setAttribute('aria-invalid',String(!valid));q('.dc-custom-confirm').disabled=!valid;
    let text=valid?'':'6자리 HEX 코드를 입력해 주세요.';
    if(valid){const bg=active==='background'?value:state.draft.background,fg=active==='text'?value:state.draft.text;if(M.contrast(bg,fg)<4.5)text='글자와 배경의 대비도 확인해 주세요.';}
    message.textContent=text;message.hidden=!text;message.dataset.error=String(!valid);
  }
  function drawCustom(updateHex=true){
    const {h,s,v}=customHSV,value=M.fromHSV(h,s,v),wheel=q('[data-dc-hue]');
    q('.dc-custom').style.setProperty('--picker-hue',M.fromHSV(h,1,1));
    wheel.style.setProperty('--hue-x',`${80+Math.sin(h*Math.PI/180)*72}px`);wheel.style.setProperty('--hue-y',`${80-Math.cos(h*Math.PI/180)*72}px`);wheel.setAttribute('aria-valuenow',String(Math.round(h)%360));wheel.setAttribute('aria-valuetext',`${Math.round(h)%360}도`);
    q('[data-dc-sv]').style.setProperty('--sv-x',`${s*100}%`);q('[data-dc-sv]').style.setProperty('--sv-y',`${(1-v)*100}%`);q('[data-dc-saturation]').value=Math.round(s*100);q('[data-dc-brightness]').value=Math.round(v*100);q('[data-dc-custom-swatch]').style.background=value;
    if(updateHex)q('#dc-custom-hex').value=value;customFeedback(q('#dc-custom-hex').value);
  }
  function openCustom(){const item=M.find(state.draft[active]);customHSV=M.toHSV(item.value||'#862FC6');q('.dc-custom').hidden=false;q('[data-dc-custom-open]').setAttribute('aria-expanded','true');drawCustom();q('[data-dc-hue]').focus({preventScroll:true});}
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-dc-custom-open')){q('.dc-custom').hidden?openCustom():closeCustom();}
    else if(b.hasAttribute('data-dc-custom-cancel'))closeCustom();
    else if(b.dataset.color){closeCustom(false);dispatch({type:'select',field:b.dataset.field,id:b.dataset.color},`${label(b.dataset.field)}에 ${M.find(b.dataset.color).name}을 미리보기했어요.`);if(b.closest('.dc-scroll')){b.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});if(!q('.dc-palette').hidden&&active!==b.dataset.field)open(b.dataset.field);}}
    else if(b.dataset.dcOpen)open(b.dataset.dcOpen,true);
    else if(b.hasAttribute('data-dc-close'))close();
    else if(b.dataset.dcReset)dispatch({type:'reset',field:b.dataset.dcReset},`${label(b.dataset.dcReset)}만 기본색으로 돌아왔어요. 적용하기를 눌러 확정하세요.`);
    else if(b.hasAttribute('data-dc-apply'))dispatch({type:'apply'},'선택한 두 색을 이 예시에 적용했어요. 실제 앱에는 저장되지 않아요.');
    else if(b.hasAttribute('data-dc-cancel'))dispatch({type:'cancel'},'변경을 취소하고 마지막으로 적용한 두 색으로 돌아왔어요.');
    else if(b.dataset.dcSuggest)dispatch({type:'select',field:'text',id:b.dataset.dcSuggest},'가독성이 높은 텍스트 색으로 미리보기했어요.');
    else if(b.hasAttribute('data-dc-example')){const example=D.examples[Number(b.dataset.dcExample)];state=M.reduce(state,{type:'select',field:'background',id:example.background});dispatch({type:'select',field:'text',id:example.text},`${example.name} 조합을 미리보기했어요.`);q('.dc-workspace').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  });
  root.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!q('.dc-custom').hidden){e.preventDefault();closeCustom();return;}
    if(e.key==='Escape'&&!q('.dc-palette').hidden){e.preventDefault();close();return;}
    const b=e.target.closest('[data-color]');if(!b||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
    e.preventDefault();const list=[...b.parentElement.querySelectorAll('[data-color]')],index=list.indexOf(b),next=e.key==='Home'?0:e.key==='End'?list.length-1:(index+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)+list.length)%list.length;list[next].click();list[next].focus({preventScroll:true});
  });
  q('#dc-custom-hex').addEventListener('input',e=>{const id=e.target.value.trim().replace(/^#?/,'#').toUpperCase(),hsv=M.toHSV(id);if(hsv){customHSV=hsv;drawCustom(false);customFeedback(id);}else customFeedback(id);});
  q('.dc-custom').addEventListener('submit',e=>{e.preventDefault();const id=q('#dc-custom-hex').value.trim().replace(/^#?/,'#').toUpperCase();if(!M.toHSV(id)){customFeedback(id);return;}dispatch({type:'select',field:active,id},`${label(active)}에 ${id}을 미리보기했어요.`);closeCustom();});
  function pointerControl(element,change){element.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();element.setPointerCapture(e.pointerId);change(e);});element.addEventListener('pointermove',e=>{if(element.hasPointerCapture(e.pointerId))change(e);});element.addEventListener('pointerup',e=>{if(element.hasPointerCapture(e.pointerId))element.releasePointerCapture(e.pointerId);});}
  pointerControl(q('[data-dc-hue]'),e=>{const box=e.currentTarget.getBoundingClientRect();customHSV.h=M.hueAt(e.clientX-box.left-box.width/2,e.clientY-box.top-box.height/2);drawCustom();});
  pointerControl(q('[data-dc-sv]'),e=>{const box=e.currentTarget.getBoundingClientRect();customHSV.s=Math.max(0,Math.min(1,(e.clientX-box.left)/box.width));customHSV.v=1-Math.max(0,Math.min(1,(e.clientY-box.top)/box.height));drawCustom();});
  q('[data-dc-hue]').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();const delta=['ArrowLeft','ArrowDown'].includes(e.key)?-1:1;customHSV.h=e.key==='Home'?0:e.key==='End'?359:(customHSV.h+delta*(e.shiftKey?10:1)+360)%360;drawCustom();});
  q('[data-dc-saturation]').addEventListener('input',e=>{customHSV.s=Number(e.target.value)/100;drawCustom();});q('[data-dc-brightness]').addEventListener('input',e=>{customHSV.v=Number(e.target.value)/100;drawCustom();});
  document.addEventListener('pointerdown',e=>{if(!q('.dc-custom').hidden&&!q('.dc-custom').contains(e.target)&&!e.target.closest('[data-dc-custom-open]'))closeCustom(false);});
  drawMatrix();refresh();
})();
