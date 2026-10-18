(() => {
  'use strict';
  const D = window.SPLUP_COLOR_SYSTEM;
  if (!D) return;
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const gradient = stops => `linear-gradient(180deg,${stops.map(([p,c])=>`${c} ${p*100}%`).join(',')})`;
  const mark = '<span class="cs-mark" aria-hidden="true"></span>';
  const section = (title,copy,body,id='') => `<section class="cs-section"${id?` id="${id}"`:''}><h2>${title}</h2><p class="cs-lead">${copy}</p>${body}</section>`;
  let surfaceSerial=0;
  const surfaceSVG = p => {
    const id=`splup-fluid-${++surfaceSerial}`;
    const {fields,falloff,overscan,blurRatio}=p.surface;
    const phases=[
      [[.035,.025,1.03,.98],[-.02,-.012,.98,1.025]],
      [[.02,-.02,.985,1.025],[-.022,.025,1.025,.98]],
      [[-.025,.018,1.02,.985],[.025,-.028,.99,1.03]]
    ];
    const gradients=fields.map((field,j)=>`<radialGradient id="${id}-color-${j}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${field.center.map(v=>v*320).join(' ')}) scale(${field.radius.map(v=>v*320).join(' ')})">${falloff.map(([offset,opacity])=>`<stop offset="${offset}" stop-color="${p.colors[j]}" stop-opacity="${opacity}"/>`).join('')}</radialGradient>`).join('');
    const surfaces=fields.map((field,j)=>{
      const motion=phases[j].map(([x,y,sx,sy],i)=>`--move-x-${i+1}:${x*320}px;--move-y-${i+1}:${y*320}px;--scale-x-${i+1}:${sx};--scale-y-${i+1}:${sy}`).join(';');
      return `<g class="cs-fluid-field" style="${motion}"><rect x="${-overscan*320}" y="${-overscan*320}" width="${(1+overscan*2)*320}" height="${(1+overscan*2)*320}" fill="url(#${id}-color-${j})" opacity="${field.opacity}" filter="url(#${id}-blur)"/></g>`;
    }).join('');
    return `<svg viewBox="0 0 320 320" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="${id}-blur" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${blurRatio*320}"/></filter>${gradients}</defs><rect width="320" height="320" fill="${p.surface.base}"/>${surfaces}</svg>`;
  };
  const fluid = (p,cls='') => `<div class="cs-fluid ${cls}" role="img" aria-label="${escape(p.name)} 기존 세 색이 은은하게 흐르는 배경">${surfaceSVG(p)}</div>`;
  const appIcon = (p,finish) => {
    const spec=D.brand.appIcon,{rim,topVeil,glassEdge}=spec.softShell,id=`splup-icon-${++surfaceSerial}`;
    const whiteStops=stops=>stops.map(([offset,opacity])=>`<stop offset="${offset}" stop-color="#fff" stop-opacity="${opacity}"/>`).join('');
    const shell=`<svg class="cs-icon-shell" viewBox="0 0 240 240" aria-hidden="true"><defs><linearGradient id="${id}-veil" x1="0" y1="0" x2="0" y2="1">${whiteStops(topVeil.stops)}</linearGradient><linearGradient id="${id}-edge" x1="0" y1="0" x2="0" y2="1">${whiteStops(glassEdge.stops)}</linearGradient><filter id="${id}-rim" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${rim.svgStdDeviation}"/></filter><filter id="${id}-reflection" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${glassEdge.svgStdDeviation}"/></filter></defs><rect width="240" height="240" rx="54" fill="url(#${id}-veil)"/><rect width="240" height="240" rx="54" fill="none" stroke="${rim.color}" stroke-width="${rim.width}" opacity="${rim.opacity}" filter="url(#${id}-rim)"/>${finish==='Glass'?`<rect x=".6" y=".6" width="238.8" height="238.8" rx="53.4" fill="none" stroke="url(#${id}-edge)" stroke-width="${glassEdge.width}" filter="url(#${id}-reflection)"/>`:''}</svg>`;
    return `<div class="cs-app-icon ${finish==='Glass'?'is-glass':''}" style="--icon-logo-width:${spec.logo.widthRatio*100}%;--icon-logo-height:${spec.logo.heightRatio*100}%" role="img" aria-label="${escape(p.name)} ${finish} 앱 아이콘">${surfaceSVG(p)}${shell}${mark}</div>`;
  };

  const widgetTile = (g,title=g.name,artwork=false,override=null) => {
    const id=`splup-widget-${++surfaceSerial}`,sample=override??(artwork?D.widgetGraphics.sampleRevision?.samples[g.id]:null);
    const spec=override?{...D.widgetGraphics,...D.widgetGraphics.pickerObjects.geometry}:sample?{...D.widgetGraphics,...D.widgetGraphics.sampleRevision.common}:D.widgetGraphics;
    if(sample)g={...g,...sample};
    const glow=spec.glow;
    return `<div class="cs-widget-tile${override?' is-picker':sample?' is-refined':''}" data-widget-palette="${escape(g.id)}" style="--widget-title:${g.titleColor}">
      <svg viewBox="0 0 288 288" aria-hidden="true"><defs>
        <linearGradient id="${id}-base" x1="0" y1="0" x2="0" y2="1">${g.stops.map(([offset,color])=>`<stop offset="${offset}" stop-color="${color}"/>`).join('')}</linearGradient>
        <linearGradient id="${id}-shade" x1="0" y1="0" x2="0" y2="1">${spec.titleShade.stops.map(([offset,opacity])=>`<stop offset="${offset}" stop-color="${spec.titleShade.color}" stop-opacity="${opacity}"/>`).join('')}</linearGradient>
        <filter id="${id}-blur" x="-70%" y="-90%" width="240%" height="280%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${glow.blur/2}"/></filter>
      </defs><rect width="288" height="288" fill="url(#${id}-base)"/>
      <ellipse cx="${glow.x+glow.width/2}" cy="${glow.y+glow.height/2}" rx="${glow.width/2}" ry="${glow.height/2}" fill="${g.glow}" opacity="${g.glowOpacity}" filter="url(#${id}-blur)"/>
      <rect width="288" height="288" fill="url(#${id}-shade)"/></svg>
      ${artwork?`<img class="cs-widget-art" src="${sample?.asset??spec.assets[g.art]}" alt="${escape(g.use)} 오브젝트" loading="lazy" width="204" height="204">`:''}
      <strong>${escape(title)}</strong></div>`;
  };

  const pickerObjects = () => {
    const p=D.widgetGraphics.pickerObjects;
    if(!p)return '';
    const originals=p.original.map(o=>`<figure><img class="cs-picker-original" src="${escape(o.asset)}" alt="${escape(o.title)} 원본 선택 그래픽" loading="lazy" width="288" height="288"><figcaption>${escape(o.ko)}<span class="cs-widget-caption">최초 그래픽 유지</span></figcaption></figure>`).join('');
    const additions=p.extended.map(o=>`<figure>${o.render==='original-card'?`<div class="cs-picker-original-crop"><img src="${escape(o.asset)}" alt="Block 원본 그래픽" loading="lazy" width="165" height="190"></div>`:widgetTile(D.graphics.find(g=>g.id===o.palette),o.title,true,{asset:o.asset,titleColor:'#FFFFFF'})}<figcaption>${escape(o.ko)}<span class="cs-widget-caption">${escape(o.caption)}</span></figcaption></figure>`).join('');
    return `<h3>원본 유지 · 6종</h3><div class="cs-picker-objects">${originals}</div><h3>확장 및 원본 복원 · 9종</h3><div class="cs-picker-objects">${additions}</div><p class="cs-note">288px 기준 · 오브제 248×208px 안에 FIT · 제목 36/44 · 좌우 20px · R28. 기본 6종과 Block은 최초 그래픽을 보존해요. Sticker는 디토 앱 아이콘과 앱 오브제를 담은 종이 팩, 방명록은 로고 없는 롤링페이퍼, D-Day는 남은 날짜만 보이는 플립보드예요.</p><figure class="cs-logo-charm"><img src="color-assets/widget-objects/ditto-logo-metal-charm-v3.png" alt="디토 로고 윤곽 자체로 만든 라일락 금속 키링" width="220" height="220" loading="lazy"><figcaption>Ditto · 로고 윤곽 금속 키링</figcaption></figure><p class="cs-note">ASK는 확정 은색 우편함을 유지해요. 챰은 공용 에셋이며 출시 15종에 추가되는 위젯이 아니에요. 실제 위젯의 버튼·상태·레이아웃은 기존 확정 UI를 따라요.</p><a class="cs-link" href="https://www.figma.com/design/XG8Cm5nLScPoNc9NAXX1DD?node-id=2976-9554" target="_blank" rel="noopener noreferrer">Figma에서 위젯 선택 오브제 가이드 열기 ↗</a>`;
  };

  const widgetPaletteGrid = palettes => `<div class="cs-widget-palette-grid">${palettes.map(g=>`<figure>${widgetTile(g)}<figcaption>${String(g.number).padStart(2,'0')} · ${escape(g.label)}<span class="cs-widget-caption">${escape(g.recipeLabel)}</span><span class="cs-widget-stops" aria-label="같은 계열의 밝은 톤, 중간 톤, 깊은 톤">${g.sourceColors.map(c=>`<span><i style="background:${c}"></i><small>${c}</small></span>`).join('')}</span></figcaption></figure>`).join('')}</div>`;
  const dittoSurface = (palette,id,original=false) => {
    const rgb=D.dittoButton.originalCTA.rgb;
    const fill=original?`rgb(${rgb.r*255},${rgb.g*255},${rgb.b*255})`:`url(#${id})`;
    const stops=palette.offsets.map((offset,i)=>`<stop offset="${offset}" stop-color="${palette.colors[palette.colorIndices[i]]}"/>`).join('');
    return `<svg class="cs-ditto-surface" viewBox="0 0 181 181" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${palette.from[0]}" y1="${palette.from[1]}" x2="${palette.to[0]}" y2="${palette.to[1]}">${stops}</linearGradient></defs><rect width="181" height="181" fill="${fill}"/>${original?'':`<rect width="181" height="181" fill="#fff" opacity="${D.dittoButton.whiteCoatOpacity}"/>`}</svg>`;
  };
  const badge = (palette=D.dittoButton.palettes[0],size=32) => `<span class="cs-ditto-badge" role="img" aria-label="디토한 위젯" style="--badge-size:${size}px">${dittoSurface(palette,`splup-badge-${++surfaceSerial}`)}${mark}</span>`;
  const ditto = (state='default',palette=D.dittoButton.palettes[0],progress=0) => {
    const id=`splup-ditto-${++surfaceSerial}`,original=palette.variant===D.dittoButton.originalCTA.variant;
    const interactive=state==='default';
    const label={default:'내 플래터에 디토하기',holding:'계속 누르세요',pending:'가져오는 중…',complete:'내 플래터에 담았어요',rest:'내 플래터에 디토하기',disabled:'지금은 가져올 수 없어요',error:'다시 시도 · 3초간 누르기'}[state];
    const ink=(original?D.dittoButton.originalCTA.fill:palette.colors[0]).match(/[0-9a-f]{2}/gi).map(c=>Math.round(parseInt(c,16)*.58));
    const pressure=state==='holding'?.12+.46*progress*progress*(3-2*progress):state==='pending'?.58:0;
    const inner=`${dittoSurface(palette,id,original)}<span class="cs-ditto-depth" aria-hidden="true"></span><span class="cs-ditto-light" aria-hidden="true"></span>${mark}<span data-ditto-label>${label}</span>`;
    const classes=`cs-action cs-ditto ${original?'is-original':''}`;
    const attributes=`class="${classes}" data-role="primary" data-state="${state}" data-hold-state="${state==='default'?'idle':state}" style="--pressure:${pressure};--pressure-ink:${ink.join(' ')}"`;
    return interactive?`<div class="cs-hold-control"><button type="button" ${attributes} data-ditto-hold aria-describedby="${id}-help">${inner}</button><p class="cs-hold-help" id="${id}-help" role="status">3초간 꾸욱 누르세요. 떼면 취소돼요.</p></div>`:`<div ${attributes} role="img" aria-label="${label}">${inner}</div>`;
  };
  // Keep both modes derived from the same manifest used to update Figma variables.
  const sheet=document.createElement('style');
  const variables=mode=>Object.entries(D.semantic).map(([k,v])=>`--cs-${k.replaceAll('/','-')}:${v[mode]}`).join(';');
  sheet.textContent=`.cs-root{${variables('Light')}}.cs-root[data-mode="dark"]{${variables('Dark')}}`;
  document.head.append(sheet);
  const rows=[['primary','주요 행동'],['secondary','보조 행동'],['neutral','일반 행동'],['ghost','텍스트 행동'],['danger','오류·삭제']];
  const application=document.querySelector('[data-color-system-application]');
  if(application) application.innerHTML=
    section('버튼의 상태','버튼의 색은 할 수 있는 행동과 현재 상태를 알려줘요. 주요 행동에는 보라색을, 삭제처럼 주의가 필요한 행동에는 붉은색을 사용해요. 모드를 바꾸면 밝은 화면과 어두운 화면을 비교할 수 있어요.',`<div class="cs-mode"><button type="button" class="cs-choice" aria-pressed="false" data-cs-mode>다크 모드 보기</button></div><div class="cs-state-scroll"><table class="cs-state-table"><thead><tr><th>역할</th>${['기본','포인터 올림','누르는 중','키보드 포커스','비활성'].map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(([role,title])=>`<tr><th>${title}</th>${['default','hover','pressed','focus','disabled'].map(state=>`<td><button type="button" class="cs-action ${state==='focus'?'is-focus':''}" data-role="${role}" data-state="${state}" ${state==='disabled'?'disabled':''}>${role==='danger'?'삭제하기':'적용하기'}</button></td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="cs-note">밝은 화면과 어두운 화면의 활성 버튼 30개 배색을 확인했어요. 글자와 배경의 최소 대비는 4.95:1이에요.</p><p data-cs-status role="status" class="cs-status">상태를 확인하는 예시 버튼이에요. 실제 정보는 변경되지 않아요.</p>`)+
    section('선택과 포커스는 달라요','선택은 지금 고른 값이에요. 포커스는 키보드로 다음에 조작할 위치예요. 두 표시가 함께 보일 수 있으며, Tab 키로 이동하면 차이를 확인할 수 있어요.',`<div class="cs-focus-grid"><div><h3>기본</h3><button class="cs-choice" type="button" aria-pressed="false" data-cs-select>라이프 컬러 선택</button><p>아직 고르지 않은 상태예요.</p></div><div><h3>선택</h3><button class="cs-choice" type="button" aria-pressed="true" data-cs-select>라이프 컬러 · 보라</button><p>2px 보라색 테두리와 연한 바탕으로 고른 값을 표시해요.</p></div><div><h3>선택 + 키보드 포커스</h3><button class="cs-choice is-focus" type="button" aria-pressed="true" data-cs-select>라이프 컬러 · 보라</button><p>키보드로 이동한 위치에는 테두리에서 2px 떨어진 곳에 2px 두께의 링을 더해요.</p></div></div><p class="cs-note">포커스 링은 키보드로 이동한 위치에 표시해요. 프로필 핸들과 일반 카드에 항상 붙여 두는 테두리는 아니에요.</p>`);
  const brand=document.querySelector('[data-color-system-brand]');
  if(brand){brand.innerHTML=`<div class="cs-intro"><span class="cs-eyebrow">브랜드 배경</span><h2>Fluid 배경</h2><p>Splup의 보라색과 밝은 보조색을 넓고 부드럽게 겹쳐 사용해요. 색이 천천히 퍼지고 모이는 움직임으로 각자의 공간에 따뜻한 분위기를 더해요.</p></div>`+
    section('Fluid · 브랜드의 움직임','Fluid는 세 색이 넓게 겹쳐 천천히 흐르는 배경이에요. 화면의 내용과 위치는 그대로 두고 색의 위치와 크기만 조금씩 바꿔요. 브랜드를 소개하는 배너나 시작 화면에 사용해요.',`<div class="cs-fluid-demo" data-cs-motion>${fluid(D.brand.fluidPalettes[0],'is-wide')}${fluid(D.brand.fluidPalettes[0],'is-square')}${fluid(D.brand.fluidPalettes[0],'is-tall')}</div><button type="button" class="cs-choice" data-cs-motion-toggle aria-pressed="false">모션 일시정지</button><p class="cs-note">한 번의 움직임은 18초 동안 이어져요. 기기의 ‘동작 줄이기’가 켜져 있으면 멈춰요. 글을 읽거나 버튼을 누르는 영역에는 움직이지 않는 배경을 사용해요.</p>`)+
    section('Fluid · 3색 조합 6종','여섯 조합은 각각 세 가지 색으로 구성돼요. 색을 따로 나누어 놓지 않고 넓게 겹쳐 하나의 표면으로 이어지게 해요. 같은 조합을 유지하면서 섞이는 위치와 크기를 조절해요.',`<div class="cs-palette-grid">${D.brand.fluidPalettes.map(g=>`<figure>${fluid(g)}<figcaption>${g.name}<span class="cs-fluid-recipe">${g.colors.map(c=>`<span><i style="background:${c}"></i>${c}</span>`).join('')}</span></figcaption></figure>`).join('')}</div>`)+
    section('앱 아이콘 · 기본 / 유리 마감','앱 아이콘은 부드럽게 번지는 가장자리와 상단의 은은한 빛으로 감싸요. Plain은 또렷한 흰 로고를, Glass는 얕은 반사를 더한 로고를 사용해요. 240px 바탕에 로고를 124 × 120.56px로 비율을 유지해 배치해요.',['Plain','Glass'].map(f=>`<h3>${f === 'Plain' ? '기본 마감' : '유리 마감'}</h3><div class="cs-icon-grid">${D.brand.fluidPalettes.map(g=>`<figure>${appIcon(g,f)}<figcaption>${g.name}</figcaption></figure>`).join('')}</div>`).join('')+'<p class="cs-note">배경색, 가장자리의 빛, 상단의 빛, 로고는 각각 편집할 수 있어요. 두 마감 모두 같은 로고의 모양과 비율을 유지해요.</p>')+
    section('04 위젯 배경 · 레퍼런스 5 + 새로운 컬러 20','위젯 배경은 이미지와 제목을 받쳐 주는 색이에요. 기준 5개에 서로 다른 색상의 20개를 더했어요. 각 배경에서는 하나의 중심색이 밝은 상단에서 짙은 하단으로 자연스럽게 이어져요.',
      '<h3>기준 배경 5종</h3>'+widgetPaletteGrid(D.graphics.slice(0,5))+'<h3>추가 배경 20종</h3>'+widgetPaletteGrid(D.graphics.slice(5))+
      '<p class="cs-note">색 조합을 바꾸어도 이미지와 제목의 자리는 같아요. 배경보다 콘텐츠가 먼저 보이도록 상단의 빛은 은은하게, 제목 뒤의 색은 충분히 짙게 사용해요.</p>','widget-backgrounds')+
    section('05 오브제 소재 샘플','Together는 네컷 사진 키링, ASK는 확정된 은색 우편함을 사용해요. 출시 15종의 선택 타일 규격은 아래 가이드에서 확인할 수 있어요.',
      '<div class="cs-widget-examples">'+D.widgetGraphics.examples.map(e=>{const g=D.graphics.find(g=>g.id===e.palette);return `<figure>${widgetTile(g,e.title,true)}<figcaption>${escape(e.caption)}<span class="cs-widget-caption">${escape(e.note)}</span></figcaption></figure>`;}).join('')+'</div>'+
      '<p class="cs-note">첫 네 소재 샘플: 220px 오브제, 제목 20/28. GIF: 기존 204px 오브제, 제목 24/30. 실제 선택 타일은 아래의 별도 36/44 규격을 사용해요.</p>','widget-artwork')+
    section('06 위젯 선택 오브제 · 출시 15종','최초 그래픽 6종을 유지하고 기능을 보여주는 실물 오브제 9종을 보완했어요.',pickerObjects(),'widget-picker-objects')+
    section('EVENT · 화면 전체에 쓰는 8가지 배경','EVENT는 화면 전체에 은은한 분위기를 더하는 배경이에요. 아래쪽에 색이 모이는 여덟 가지 조합을 사용해요. 긴 글이나 조작 버튼은 단색 카드 안에 배치해 읽고 누르기 쉽게 만들어요.',`<div class="cs-event-grid">${D.events.map(e=>`<figure><div class="cs-event" style="background:${gradient(e.stops)}"></div><figcaption>${e.name}</figcaption></figure>`).join('')}</div>`);
  }
  const action=document.querySelector('[data-color-system-ditto]');
  if(action){action.innerHTML=`<div class="cs-intro"><span class="cs-eyebrow">디토하기</span><h2>3초 동안 눌러서 가져오기</h2><p>Ditto는 다른 사람의 위젯을 내 플래터에 가져오는 행동이에요. 로고와 문구가 있는 긴 버튼을 눌러 실행해요. 작은 아이콘은 이미 가져온 위젯에 붙이는 표시예요.</p></div>`+
    section('바텀시트에는 실제 행동만 남겨요','친구의 위젯을 확인하고 담을 곳을 고른 뒤, 긴 디토 버튼을 눌러 가져와요. 보던 친구의 플래터로 돌아갈 때는 시트를 아래로 내리면 돼요.',`<div class="cs-state-scroll" tabindex="0" role="region" aria-label="디토 시트 상황별 행동"><table class="cs-state-table"><thead><tr><th>상황</th><th>남기는 행동</th><th>보여주는 안내</th></tr></thead><tbody><tr><td>담을 곳을 고른 뒤</td><td>디토 로고 + ‘라이프 플래터에 디토하기’</td><td>3초간 꾸욱 누르세요. 떼면 취소돼요.</td></tr><tr><td>가져오기 완료</td><td>내 플래터 보기</td><td>어느 플래터에 담았는지 짧게 알려줘요.</td></tr><tr><td>디토가 제한되거나 원본이 사라짐</td><td>하단 버튼 없이 안내만 표시</td><td>가져올 수 없는 이유와 기존 플래터가 그대로라는 사실을 알려줘요.</td></tr><tr><td>저장 실패</td><td>다시 디토하기</td><td>선택은 유지하고, 기존 위젯은 바꾸지 않아요.</td></tr></tbody></table></div><p class="cs-note">‘돌아가기’, ‘친구 플래터 계속 보기’, ‘나중에 담기’는 시트를 닫는 동작과 같아서 버튼으로 반복하지 않아요. 상단 닫기와 바깥 영역 탭도 지원해요. 화면 읽기에서는 닫기를 실행할 수 있어야 해요.</p><p class="cs-note">주요 버튼은 높이 60px · 모서리 12px · 흰 로고 27px · 글자 17 Bold를 사용해요. ‘담을 곳 바꾸기’처럼 보조 선택이 필요한 경우에는 배경과 외곽선 없이 글자로 표시하고, 터치 영역은 44px 이상 확보해요. 시트는 내용 높이에 맞추며 좌우 16px, 콘텐츠 사이 16px, 마지막 버튼 아래 24px를 띄워요.</p><a class="cs-link" href="https://www.figma.com/design/XG8Cm5nLScPoNc9NAXX1DD?node-id=1352-144227" target="_blank" rel="noopener noreferrer">Figma에서 디토 화면 흐름 보기 ↗</a>`)+
    section('꾸욱 누르고, 마음이 바뀌면 떼세요','꾸욱 누르면 버튼의 색이 안쪽으로 눌리듯 깊어져요. 3초 동안 가져올지 생각할 수 있도록 시간을 두었어요. 그전에 손을 떼거나 버튼 밖으로 움직이면 취소돼요.',`<div class="cs-hold-demo">${ditto()}<button type="button" class="cs-choice" data-ditto-demo-reset>다시 체험하기</button></div><p class="cs-note">동작을 확인하는 체험용 버튼이에요. 실제 위젯은 저장되지 않아요. 키보드에서는 Space나 Enter를 길게 누르고, Escape로 취소할 수 있어요.</p>`)+
    section('0 → 3초 · 누름부터 가져오기까지','누르는 동안 중앙 색이 깊어지고 가장자리의 빛이 변해요. 진행 막대 대신 버튼 전체의 색으로 시간을 보여줘요. 3초를 채우면 가져오기를 요청하고, 저장에 성공하면 완료를 표시해요.',`<div class="cs-hold-phases">${[[0,'누르기 전 · 원래 표면'],[1/3,'1초 · 색이 안쪽으로 눌려요'],[2/3,'2초 · 색이 더 깊어져요'],[1,'3초 · 가져오기 요청']].map(([p,label])=>`<figure>${ditto(p===1?'pending':p===0?'rest':'holding',D.dittoButton.palettes[0],p)}<figcaption>${label}</figcaption></figure>`).join('')}</div><div class="cs-widget-rules"><div><h3>손을 떼면 취소</h3><p>3초 전에 손을 떼면 가져오지 않아요. 색이 부드럽게 돌아오고, 다시 누르면 처음부터 시작해요.</p></div><div><h3>완료는 저장 성공 뒤에</h3><p>가져오는 중에는 다시 요청하지 않아요. 저장에 실패하면 같은 버튼으로 다시 시도할 수 있어요.</p></div><div><h3>모션을 줄여도 같은 시간</h3><p>‘동작 줄이기’에서는 움직임 대신 눌린 색과 남은 시간을 보여줘요. 화면 읽기를 사용하는 경우 확인 창에서 선택해요.</p></div></div>`)+
    section('Ditto 실행 · 긴 버튼 6색','긴 버튼은 여섯 가지 전용 색과 흰 로고·문구를 사용해요. 어떤 색을 고르더라도 같은 3초 누름 규칙이 적용돼요.',`<div class="cs-button-palettes">${D.dittoButton.palettes.map(p=>`<figure>${ditto('default',p)}<figcaption>${p.name}</figcaption></figure>`).join('')}</div><p class="cs-note">높이 60px · 기준 폭 370px · 최소 폭 280px · R12 · 로고 27px · 간격 10px · 좌우 20px · Pretendard Bold 17/24</p>`)+
    section('작은 아이콘 · 디토된 위젯 표시','작은 아이콘은 ‘다른 사람에게서 가져온 위젯’임을 알려줘요. 위젯 우측 상단에 24px 또는 32px로 배치하며, 누르는 동작은 넣지 않아요.',`<div class="cs-badge-guide"><div class="cs-badge-widget">${badge()}<span>친구에게서 가져온 위젯</span></div><div><div class="cs-badge-palette">${D.dittoButton.palettes.map(p=>`<figure>${badge(p)}<figcaption>${p.name}</figcaption></figure>`).join('')}</div><p class="cs-note">가져오기를 완료해도 긴 버튼은 긴 버튼으로 유지해요. 작은 아이콘은 위젯의 표시로만 사용해요.</p></div></div>`);
  }
  const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  function updateMotionPreference(){
    const b=brand?.querySelector('[data-cs-motion-toggle]');if(!b)return;
    b.disabled=Boolean(reducedMotion?.matches);
    b.textContent=b.disabled?'동작 줄이기 적용 중':b.getAttribute('aria-pressed')==='true'?'모션 재생':'모션 일시정지';
  }
  updateMotionPreference();reducedMotion?.addEventListener('change',updateMotionPreference);
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    const root=b.closest('.cs-root');if(!root)return;
    if(b.hasAttribute('data-cs-mode')){const dark=root.dataset.mode!=='dark';root.dataset.mode=dark?'dark':'light';b.setAttribute('aria-pressed',String(dark));b.textContent=dark?'라이트 모드 보기':'다크 모드 보기';}
    if(b.hasAttribute('data-cs-select')){const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));}
    if(b.hasAttribute('data-cs-motion-toggle')){const paused=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(paused));b.textContent=paused?'모션 재생':'모션 일시정지';root.classList.toggle('is-paused',paused);}
    if(b.classList.contains('cs-action')&&!b.hasAttribute('data-ditto-hold')){const status=root.querySelector('[data-cs-status]');if(status)status.textContent='버튼의 눌림을 확인했어요. 실제 정보는 변경되지 않아요.';}
  });
})();
