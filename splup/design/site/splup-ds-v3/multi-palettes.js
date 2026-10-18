(() => {
  'use strict';
  const data = window.SPLUP_MULTI_PALETTES;
  const brand = document.querySelector('[data-color-system-brand]');
  if (!data || !brand) return;
  const descriptions = {
    'purple-pink':'브랜드 보라색에 분홍빛과 푸른 보라색을 더했어요. Splup을 소개하는 배너와 대표 그래픽에 사용해요.',
    'deep-purple':'짙고 밝은 보라색을 넓게 겹쳐 차분한 깊이를 만들어요. 여백이 있는 브랜드 배경에 사용해요.',
    'pink-coral':'분홍색과 코랄을 부드럽게 이어 따뜻한 분위기를 만들어요. 함께한 순간을 소개하는 그래픽에 사용해요.',
    'peach-yellow':'피치와 노란색 사이에 분홍빛을 더해 밝은 온기를 만들어요. 환영이나 시작을 알리는 배경에 사용해요.',
    'cyan-blue':'시안과 파란색을 넓게 섞어 시원하고 맑은 분위기를 만들어요. 사진 주변의 여백이나 브랜드 배경에 사용해요.',
    'mint-lime':'민트와 라임을 부드럽게 이어 산뜻한 분위기를 만들어요. 새로운 콘텐츠를 소개하는 배경에 사용해요.',
    'platter-pink':'연한 분홍색과 피치가 번져 편안한 분위기를 만들어요. 개인 공간을 소개하는 그래픽에 사용해요.',
    'splup-purple':'브랜드 보라색을 중심으로 밝기와 깊이를 연결해요. 다른 색을 더하기보다 Splup의 보라색을 강조할 때 사용해요.'
  };
  const finishes = {soft:'Soft · 색이 부드럽게 섞이는 기본 마감이에요.',satin:'Satin · 가장자리에 은은한 빛을 더한 마감이에요.',grain:'Grain · 표면에 아주 작은 입자를 더한 마감이에요.'};
  const section = document.createElement('section');
  section.className = 'cs-section mp-section';
  section.id = 'multi-palette';
  let selected = data.palettes[0], finish = data.defaultFinish;
  section.innerHTML = `<h2>멀티 팔레트 · 세 색으로 만드는 여덟 가지 분위기</h2>
    <p class="cs-lead">멀티 팔레트는 함께 사용할 세 가지 색을 묶은 조합이에요. 색들이 넓고 부드럽게 겹치며 하나의 분위기를 만들어요. 먼저 원하는 조합을 고른 뒤, 마감으로 빛과 질감을 조절해요.</p>
    <div class="mp-toolbar"><label>마감 <select data-mp-finish>${Object.entries(data.finishes).map(([id,f])=>`<option value="${id}">${f.name}</option>`).join('')}</select></label><p data-mp-description>Soft · 색이 부드럽게 섞이는 기본 마감이에요.</p></div>
    <div class="mp-grid" role="group" aria-label="멀티 팔레트 선택">${data.palettes.map((p,i)=>`<button class="mp-card" type="button" data-mp-palette="${p.id}" aria-pressed="${i===0}"><img src="${p.assets[finish]}" width="200" height="200" alt="" loading="lazy"><strong>${p.name}</strong><span class="mp-recipe">${p.colors.map(c=>`<span><i style="background:${c}"></i>${c}</span>`).join('')}</span></button>`).join('')}</div>
    <div class="mp-selection"><div><strong data-mp-name></strong><p data-mp-usage></p><p data-mp-values></p></div><div class="mp-downloads"><a class="cs-choice" data-mp-svg download>SVG 받기</a><button class="cs-choice" type="button" data-mp-png>PNG 받기</button><button class="cs-choice" type="button" data-mp-copy>3색 복사</button></div></div>
    <p class="mp-status" role="status" aria-live="polite"></p>
    <p class="cs-note">Soft는 부드러운 색 자체를, Satin은 가장자리의 빛을, Grain은 옅은 입자감을 보여줘요. 세 마감은 같은 색 조합을 사용해요. 브랜드 그래픽과 콘텐츠 주변의 여백에 적용하고, 긴 본문은 단색 영역에 담아요.</p>
    <p class="cs-note">Figma에서 Palette는 색 조합, Finish는 표면 마감을 뜻해요. 조합을 바꾸어도 같은 부드러운 번짐을 유지해요. 세 색과 번짐, 가장자리의 빛은 각각 편집할 수 있어요.</p>
    <div class="mp-links"><a class="cs-link" href="https://www.figma.com/design/XG8Cm5nLScPoNc9NAXX1DD?node-id=1771-8732" target="_blank" rel="noopener noreferrer">Figma에서 멀티 팔레트 편집 ↗</a><a class="cs-link" href="../../tokens/multi-palettes.json" download>멀티 팔레트 색상 데이터 받기</a></div>`;
  const anchor = [...brand.querySelectorAll('.cs-section')].find(s=>s.querySelector('h2')?.textContent.startsWith('앱 아이콘'));
  brand.insertBefore(section, anchor || null);
  const $ = selector => section.querySelector(selector);
  const status = text => { $('.mp-status').textContent = text; };
  const filename = () => `splup-multi-${selected.id}-${finish}`;
  function render() {
    for (const card of section.querySelectorAll('[data-mp-palette]')) {
      const p = data.palettes.find(p=>p.id===card.dataset.mpPalette);
      card.setAttribute('aria-pressed', String(p===selected));
      card.querySelector('img').src = p.assets[finish];
    }
    $('[data-mp-name]').textContent = `${selected.name} · ${data.finishes[finish].name}`;
    $('[data-mp-usage]').textContent = descriptions[selected.id] || '세 가지 색이 부드럽게 섞이는 브랜드 배경이에요.';
    $('[data-mp-values]').textContent = selected.colors.join(' / ');
    $('[data-mp-svg]').href = selected.assets[finish];
    $('[data-mp-svg]').download = `${filename()}.svg`;
    $('[data-mp-description]').textContent = finishes[finish];
  }
  $('[data-mp-finish]').addEventListener('change', e=>{finish=e.target.value; render(); status('');});
  section.addEventListener('click', async e=>{
    const card = e.target.closest('[data-mp-palette]');
    if(card){selected=data.palettes.find(p=>p.id===card.dataset.mpPalette);render();status(`${selected.name} 선택됨`);}
    if(e.target.closest('[data-mp-copy]')) {
      try { await navigator.clipboard.writeText(selected.colors.join(', ')); status('세 가지 색상값을 복사했어요.'); }
      catch { status(`복사할 색상값: ${selected.colors.join(', ')}`); }
    }
    const button=e.target.closest('[data-mp-png]');
    if(button) {
      const source=selected.assets[finish], name=filename();
      button.disabled=true; status('PNG를 준비하고 있어요.');
      try {
        const img=new Image(); img.src=source; await img.decode();
        const canvas=document.createElement('canvas');canvas.width=960;canvas.height=960;
        canvas.getContext('2d').drawImage(img,0,0,960,960);
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
        if(!blob)throw new Error('PNG export failed');
        const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${name}.png`;
        document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
        status('960 × 960px 투명 PNG를 저장했어요.');
      } catch { status('PNG를 만들 수 없어요. SVG를 받거나 게시된 Splup에서 다시 시도해 주세요.'); }
      finally {button.disabled=false;}
    }
  });
  render();
})();
