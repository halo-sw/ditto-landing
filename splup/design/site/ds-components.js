/* Approved surfaces use the same material and press implementation as the reference. */
(() => {
  const spec=window.DittoDSTokens,logo='../../'+spec.logo.source,tiles=[];
  for(const [name,value] of Object.entries({width:spec.logo.widthRatio,left:spec.logo.leftRatio,top:spec.logo.topRatio}))document.documentElement.style.setProperty('--ds-logo-'+name,(value*100)+'%');
  const svg=(p,i)=>`<svg aria-hidden="true" viewBox="0 0 181 181"><defs><clipPath id="ds-clip-${i}"><path d="${spec.geometry.path}"/></clipPath><linearGradient id="ds-grad-${i}" gradientUnits="userSpaceOnUse" x1="${p.from[0]}" y1="${p.from[1]}" x2="${p.to[0]}" y2="${p.to[1]}">${p.offsets.map((o,k)=>`<stop offset="${o}" stop-color="${p.colors[p.colorIndices[k]]}"/>`).join('')}</linearGradient><filter id="ds-soft-${i}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${spec.material.rim.stdDeviation}"/></filter></defs><g clip-path="url(#ds-clip-${i})"><g class="field"><rect width="181" height="181" fill="url(#ds-grad-${i})"/></g><rect width="181" height="181" class="surface-coat" fill="white" opacity="${spec.material.surfaceWhiteCoatOpacity}"/><path d="${spec.geometry.path}" fill="none" stroke="white" stroke-width="${spec.material.rim.width}" opacity="${spec.material.rim.restOpacity}" filter="url(#ds-soft-${i})"/></g></svg>`;
  function live(p,i,target){const b=document.createElement('button');b.type='button';b.className='tile';b.setAttribute('aria-label',p.name+' Ditto 버튼 눌림 확인');b.innerHTML=svg(p,i)+`<img class="logo" src="${logo}" alt="">`;target.append(b);tiles.push({button:b});return b;}
  spec.gradient.palettes.forEach((p,i)=>{
    const figure=document.createElement('figure');live(p,i,figure);const caption=document.createElement('figcaption');caption.textContent=p.name;figure.append(caption);document.querySelector('#ditto-live-buttons').append(figure);
    const graphic=document.createElement('figure');graphic.innerHTML=`<div class="ds-art-surface" role="img" aria-label="${p.name} 기본 표면">${svg(p,i+20)}<img class="ds-wordmark" src="${logo}" alt=""></div><figcaption>${p.name}<small>고정된 색 · 부드러운 테두리</small></figcaption>`;
    document.querySelector('#graphic-surfaces').append(graphic);DittoButtonMaterial.attach(graphic.querySelector('svg'),i+20);
  });
  live(spec.gradient.palettes[0],10,document.querySelector('#component-ditto'));
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const press=DittoSoftPress.setup(tiles,{isReduced:()=>media.matches,onActivate:i=>{document.querySelector('#ditto-live-feedback').textContent=(spec.gradient.palettes[i]?.name||'Ditto')+' 눌림을 확인했어요. 실제로 디토한 것은 아니에요.';}});
  media.addEventListener('change',()=>press.resetAll());document.addEventListener('visibilitychange',()=>{if(document.hidden)press.resetAll();});window.addEventListener('pagehide',()=>press.resetAll());
  const cta=document.querySelector('#standard-cta'),feedback=document.querySelector('#cta-feedback');let timer;
  function setCTA(state,announce=true){
    clearTimeout(timer);cta.dataset.state=state;cta.classList.toggle('is-pressed',state==='pressed');cta.disabled=state==='loading'||state==='disabled';cta.setAttribute('aria-busy',String(state==='loading'));
    cta.innerHTML=state==='loading'?'<span class="ds-spinner" aria-hidden="true"></span>저장 중…':'수정 완료';
    document.querySelectorAll('[data-cta-state]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ctaState===state)));
    if(announce)feedback.textContent={default:'버튼을 누르면 저장 중 → 완료 피드백을 체험할 수 있어요.',pressed:'눌렀을 때의 모습입니다. 입력 영역의 크기는 그대로 유지합니다.',loading:'저장 중 예시입니다. 중복 입력을 받지 않으며 실제 저장 요청은 보내지 않습니다.',disabled:'아직 수정한 내용이 없어 누를 수 없는 상태의 예시입니다.'}[state];
  }
  document.querySelectorAll('[data-cta-state]').forEach(b=>b.onclick=()=>setCTA(b.dataset.ctaState));
  cta.onclick=()=>{setCTA('loading');timer=setTimeout(()=>{setCTA('default',false);feedback.textContent='저장 완료 피드백을 확인했어요. 실제 데이터는 바뀌지 않았습니다.';},850);};
  const inventory=[
    ['대표·라이프 전환','두 플래터를 구분하는 텍스트 탭입니다.','플래터에서 직접 확인','segment.png'],
    ['하단 탐색','홈 · Ditto! · 친구, 세 목적지를 유지합니다.','웹은 재질 참고용 · 네이티브 검수 필요','tabbar.png'],
    ['위젯 크기 선택','위젯에 맞는 비율만 제공합니다. 크기 변경 후 배치도 확인합니다.','플래터에서 직접 확인','ratiobar.png'],
    ['입력창과 도움말','입력 목적과 오류 해결 방법을 함께 안내합니다.','기존 앱 캡처 · 별도 변경 없음','fields.png'],
    ['완료 알림','사용자가 방금 수행한 행동의 결과를 짧게 알려줍니다.','기존 앱 캡처 · 별도 변경 없음','snackbar.png'],
    ['아래에서 열리는 시트','추가·수정 작업에 집중하도록 탐색과 분리합니다.','기존 앱 캡처 · 별도 변경 없음','bottomsheet.png']
  ];
  const sizes=[['정사각형',4,4],['가로 배너',6,2],['세로형',3,4],['가로형',4,3],['세로 배너',2,6]];
  const previews=[
    '<div class="ds-mini-tabs" role="group" aria-label="플래터 탭 체험"><button type="button" data-preview-segment="rep">대표</button><button type="button" data-preview-segment="life" class="is-current">라이프</button></div><p class="ds-muted">탭을 누르면 해당 플래터 미리보기로 이동해요.</p>',
    '<div class="ds-nav-sample" aria-label="세 목적지의 시각 견본">'+[['home','홈'],['ditto','Ditto!'],['friend','친구']].map(([key,name],i)=>`<span${i===0?' class="is-current"':''}><img src="../../DittoPrototype/Assets.xcassets/tab-${key}-bar.imageset/tab-${key}-bar.svg" alt="">${name}</span>`).join('')+'</div><p class="ds-muted">위치·재질 확인용입니다. 다른 탭은 열리지 않아요.</p>',
    '<div class="ds-size-options" role="group" aria-label="위젯 비율 미리보기">'+sizes.map(([name,w,h],i)=>`<button type="button" data-preview-size="${w},${h}" aria-label="${name}, 가로 ${w}칸 세로 ${h}칸" aria-pressed="${i===0}"><i style="width:${w*5}px;height:${h*5}px"></i><span>${name}</span></button>`).join('')+'</div><p class="ds-muted" id="ds-size-description" role="status">정사각형 · 가로 4칸 × 세로 4칸</p>'
  ];
  document.querySelector('#component-inventory').innerHTML=inventory.map(([title,desc,state,img],i)=>`<article><h3>${title}</h3><p>${desc}</p>${previews[i]||`<img src="ds-web/comps/${img}" alt="${title}의 기존 앱 모습" loading="lazy">`}<span class="ds-pill">${state}</span>${state.startsWith('플래터')?'<p><a href="#plattergrid">플래터에서 사용해 보기</a></p>':''}</article>`).join('');
  document.querySelectorAll('[data-preview-segment]').forEach(b=>b.onclick=()=>{document.querySelector(`[data-segment="${b.dataset.previewSegment}"]`).click();document.querySelector('#plattergrid').scrollIntoView({behavior:media.matches?'instant':'smooth'});});
  document.querySelectorAll('[data-preview-size]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-preview-size]').forEach(o=>o.setAttribute('aria-pressed',String(o===b)));const [w,h]=b.dataset.previewSize.split(',');document.querySelector('#ds-size-description').textContent=b.textContent+' · 가로 '+w+'칸 × 세로 '+h+'칸';});
  document.querySelectorAll('.ds-legacy button').forEach(b=>{b.disabled=true;b.tabIndex=-1;});
  window.DittoDSPreview={spec,press,setCTA};
})();
