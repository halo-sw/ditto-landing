(function(){
  'use strict';
  const host=document.getElementById('page-widget-system'),albums=window.SplupMusicAlbums,R=window.SplupWidgetRenderer,S=window.SplupMusicServices;
  if(!host||!albums||!R||!S)return;
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const sizes={'6x2':[275.5,86.5,20],'2x6':[86.5,275.5,20],'4x2':[181,86.5,12],'4x4':[181,181,16],'4x6':[181,275.5,16],'6x6':[275.5,275.5,24],'6x8':[275.5,370,24]};
  const render=(a,size,service='YouTube',external=false,href=null)=>{const [w,h,radius]=sizes[size];const n=R.render('music',w,h,{radius,external,href,albumAsset:a.asset,albumPalette:a.palette,trackTitle:a.track,artist:a.artist,musicService:service,youtubeId:a.video?.youtubeId,videoPoster:a.video?.poster});n.setAttribute('role','group');n.setAttribute('aria-label',`${a.track}, ${a.artist}, ${service} 위젯 적용 예시`);n.title=`${a.track} · ${a.artist}`;return n;};
  const grid=host.querySelector('.sw-album-cases');
  for(const [index,a] of albums.entries()){
    const section=el('section','sw-album-case');section.append(el('p','sw-case-number',String(index+1).padStart(2,'0')),el('h3','',a.album),el('p','sw-case-artist',a.artist));
    const examples=el('div','sw-case-layout'),left=el('div','sw-case-stack');
    for(const size of ['4x4','4x2']){const f=el('figure');f.append(render(a,size),el('figcaption','',size.replace('x',' × ')));left.append(f);}
    const tall=el('figure');tall.append(render(a,'4x6'),el('figcaption','','4 × 6'));examples.append(left,tall);section.append(examples);
    const recipe=el('div','sw-color-recipe');const colors=a.cdp||window.SplupMusicPlayerModel.cdpColors(a.palette);for(const key of ['top','middle','bottom']){const chip=el('i');chip.style.background=colors[key];recipe.append(chip,el('code','',colors[key].toUpperCase()));}section.append(recipe,el('p','sw-case-note','앨범 대표 색 + 흰색 94% / 81% / 70% · 중성 회색 지원'));grid.append(section);
  }
  const mv=host.querySelector('.sw-music-video-cases');if(mv)for(const [id,size]of [['how-sweet','6x6'],['ruby','6x8']]){const a=albums.find(a=>a.id===id),f=el('figure');f.append(render(a,size),el('figcaption','',size.replace('x',' × ')+' · '+a.track));mv.append(f);}
  const selector=host.querySelector('.sw-album-selector');
  for(const a of albums){const button=el('button');button.type='button';button.dataset.swAlbum=a.asset;button.setAttribute('aria-pressed','false');const image=el('img');image.src=a.asset;image.alt='';button.append(image,el('span','',a.album));selector.append(button);}
  const badges=host.querySelector('.mp-service-badge-examples');
  for(const p of Object.values(S.providers)){const f=el('figure'),b=el('div','mp-guide-badge'),icon=el('img');icon.src='./widget-assets/'+p.icon+'.svg';icon.alt='';b.append(icon,el('span','',p.name),el('span','','↗'));f.append(b,el('figcaption','',p.name+' · 외부에서 열기'));badges?.append(f);}
  const tabs=host.querySelector('.sw-service-tabs'),stage=host.querySelector('.sw-service-stage'),states=host.querySelector('#sw-service-state');let current='spotify';
  function display(){
    const provider=S.providers[current],fixture=window.SplupMusicAPIFixtures,record=S[current](fixture[current]),a={...albums.find(x=>x.id==='how-sweet'),track:record.title,artist:record.creator};stage.replaceChildren();
    const preview=el('div','sw-service-preview'),details=el('div','sw-service-details');
    if(states.value==='ready'){
      for(const size of ['6x2','2x6','4x4','4x6']){const f=el('figure');f.append(render(a,size,provider.name,true,current==='youtube'?fixture.youtubeMusicSearch:record.href),el('figcaption','',size.replace('x',' × ')));preview.append(f);}
      details.append(el('h3','',`${provider.name}에서 가져온 음악`),el('p','',provider.behavior));
      const button=el('a','sw-service-open',current==='youtube'?'YouTube Music에서 찾기 ↗':`${provider.name}에서 열기 ↗`);button.href=current==='youtube'?fixture.youtubeMusicSearch:record.href;button.target='_blank';button.rel='noopener';details.append(button);
      details.append(el('p','sw-case-note','API 응답 구조를 적용한 예시입니다. 커버는 제공 이미지로 대체했으며 계정 연결·재생 가능 여부는 확인하지 않았어요.'));

    }else{
      const labels={loading:['음악 정보를 가져오는 중','곡 정보가 도착하면 커버와 색상을 함께 표시해요.'],auth:['서비스 연결이 필요해요','권한을 확인한 뒤 연결을 다시 시도해요.'],unavailable:['이 음악을 표시할 수 없어요','삭제·비공개·지역 제한일 수 있어요. 다른 곡을 선택해요.']},[title,body]=labels[states.value];
      const card=el('div','sw-service-state-card');card.append(el('strong','',title),el('p','',body));if(states.value!=='loading'){const retry=el('button','',states.value==='auth'?'연결하기':'다른 곡 선택');retry.type='button';retry.addEventListener('click',()=>{states.value='ready';display();host.querySelector('.sw-service-feedback').textContent='연결 성공 화면의 예시로 돌아왔어요. 실제 계정 연결은 하지 않았어요.';});card.append(retry);}preview.append(card);details.append(el('h3','',provider.name),el('p','',body));
    }
    const integration=el('details'),summary=el('summary','','개발 연동 기준');integration.append(summary,el('p','',provider.auth),el('code','',provider.endpoint),el('p','',provider.fields));const link=el('a','','공식 API 문서 ↗');link.href=provider.docs;link.target='_blank';link.rel='noopener';integration.append(link);const response=el('details'),resSummary=el('summary','','API 응답 → 위젯 데이터 예시'),pre=el('pre','sw-api-json',JSON.stringify({response:fixture[current],widget:record},null,2));response.append(resSummary,pre);integration.append(response);details.append(integration);stage.append(preview,details);
    tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.provider===current)));
  }
  for(const [id,p] of Object.entries(S.providers)){const b=el('button');b.type='button';b.dataset.provider=id;const img=el('img');img.src='./widget-assets/'+p.icon+'.svg';img.alt='';b.append(img,el('span','',p.name));b.addEventListener('click',()=>{current=id;host.querySelector('.sw-service-feedback').textContent='';display();});tabs.append(b);}
  states.addEventListener('change',display);display();
})();
