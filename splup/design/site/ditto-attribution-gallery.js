/* Live design-system examples; these controls never update an account or a widget. */
(() => {
  const T=DittoAttributionTokens,A=DittoAttribution,P=T.presentation,section=document.querySelector('#ditto-widget');
  const css={ 'font-size':P.fontSize,'line-height':P.lineHeight,'footer-height':P.footerMinHeight,'avatar-size':P.avatarSize,'avatar-radius':P.avatarRadius,gap:P.gap,padding:P.paddingX,'logo-size':P.logoSize,'logo-inset':P.logoInset};
  for(const [k,v] of Object.entries(css))document.documentElement.style.setProperty('--dw-'+k,v+'px');
  for(const [k,v] of Object.entries({'source-surface':P.sourceSurface,'source-text':P.sourceText,inner:P.innerShadow}))document.documentElement.style.setProperty('--dw-'+k,v);
  const source={userId:'sample-jimin',widgetId:'sample-original-photo',viewerNickname:'지미니',publicDisplayName:'지민',avatar:'../../'+T.assets.avatar};
  const g=DittoGrid.geometry(390),$=s=>section.querySelector(s);
  const reference=A.createCard({source,reference:true});$('#dw-reference').append(reference);
  const dialog=$('#dw-detail');let trigger=null;
  function showSource(info){trigger=document.activeElement;$('#dw-detail-name').textContent=info.name;$('#dw-detail-copy').textContent=info.name+'에게서 가져옴';dialog.showModal();$('#dw-detail-close').focus();}
  $('#dw-detail-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>trigger?.isConnected&&trigger.focus({preventScroll:true}));
  function sized(variant,props){const wrap=document.createElement('div');wrap.className='dw-fixed-example';const w=g.pw(variant.columns),h=g.pw(variant.rows);wrap.style.width=w+'px';wrap.style.height=h+'px';wrap.style.setProperty('--dw-radius',DittoGrid.radius(variant.columns,variant.rows)+'px');const card=A.createCard({kind:variant.kind,...props});card.style.setProperty('--dw-radius',DittoGrid.radius(variant.columns,variant.rows)+'px');wrap.append(card);return wrap;}
  for(const v of T.variants){const figure=document.createElement('figure'),stage=document.createElement('div');stage.className='dw-catalogue-stage';stage.append(sized(v,{source:{...source,widgetId:'sample-'+v.id},onSourceOpen:showSource}));const caption=document.createElement('figcaption');caption.textContent=v.name;const meta=document.createElement('small');meta.textContent=`${v.columns} × ${v.rows}칸 · ${g.pw(v.columns)} × ${g.pw(v.rows)} / 출처 영역 포함`;caption.append(meta);figure.append(stage,caption);$('#dw-catalogue').append(figure);const option=new Option(v.name,v.id);$('#dw-variant').add(option);}
  function draw(){const v=T.variants.find(v=>v.id===$('#dw-variant').value)||T.variants[0];const current={...source,viewerNickname:$('#dw-nickname').value,avatar:$('#dw-no-avatar').checked?'':source.avatar};$('#dw-live').replaceChildren(sized(v,{source:current,onSourceOpen:showSource}));$('#dw-preview-note').textContent=A.attributionFor(current)+' · 애칭은 이 미리보기에만 반영됩니다.';}
  $('#dw-nickname').addEventListener('input',draw);$('#dw-variant').addEventListener('change',draw);$('#dw-no-avatar').addEventListener('change',draw);
  $('#dw-long-name').onclick=()=>{$('#dw-nickname').value='함께 있으면 언제나 마음이 편해지는 지미니';draw();};draw();
  const edgecases=[
    ['긴 애칭','함께 있으면 언제나 마음이 편해지는 지미니',source.avatar,false,'애칭만 말줄임. 눌러서 전체 이름을 확인합니다.'],
    ['애칭 미설정','',source.avatar,false,'공개 프로필 이름으로 표시하는 보완안입니다.'],
    ['프로필 이미지 없음','지미니','',false,'기본 프로필 자리를 유지합니다. 다른 사람 사진으로 대체하지 않습니다.']
  ];
  for(const [title,nickname,avatar,unavailable,note] of edgecases){const article=document.createElement('article'),h=document.createElement('h4'),p=document.createElement('p');h.textContent=title;p.textContent=note;p.className='ds-muted';const example=sized(T.variants[0],{source:{...source,viewerNickname:nickname,avatar,unavailable},onSourceOpen:showSource});article.append(h,example,p);$('#dw-edgecases').append(article);}
  const entry=document.createElement('article');entry.innerHTML='<h3>디토해 온 위젯</h3><p>출처 프로필·Ditto 로고·애칭 문구를 함께 유지하는 콘텐츠 카드입니다.</p><span class="ds-pill">6가지 변형 · 출처 표시 원칙</span><p><a href="#ditto-widget">그래픽과 노출 정책 확인하기</a></p>';document.querySelector('#component-inventory').prepend(entry);
  window.DittoAttributionPreview={source,draw};
})();
