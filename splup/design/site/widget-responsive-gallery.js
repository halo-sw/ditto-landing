(function () {
  'use strict';
  const host = document.querySelector('#widget-responsive');
  if (!host) return;
  const api = window.DittoResponsive, spec = api.spec;
  const art = '../../DittoPrototype/Assets.xcassets/ob-album.imageset/ob-album.png';
  const fmt = n => Number(n.toFixed(2)).toString();
  const sizeText = s => s.map(v => v.join('×')).join(' · ');
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const controls = host.querySelector('.wr-controls');
  function render() {
    const viewport = Number(host.querySelector('#wr-width').value);
    const scale = Number(host.querySelector('#wr-scale').value);
    const title = host.querySelector('#wr-title').value || '곡명을 입력해 주세요';
    const attributed = host.querySelector('#wr-attributed').checked;
    const footer = attributed ? (scale > 1 ? spec.attribution.largeFooterHeight : spec.attribution.footerHeight) : 0;
    const sizes = api.allowedSizes('music', viewport, attributed, scale);
    const gallery = host.querySelector('.wr-examples'); gallery.replaceChildren();
    for (const [w, h] of sizes) {
      const W = api.spanSize(w, viewport), H = api.spanSize(h, viewport);
      const plan = api.musicLayout(W, H - footer, scale);
      const figure = el('figure'), card = el('div', 'wr-preview-card'), body = el('div', 'wr-music');
      card.style.cssText = `width:${W}px;height:${H}px;border-radius:${Math.min(20, 12 + (Math.min(w, h) - 2) * 2)}px`;
      card.dataset.span = `${w},${h}`;
      body.dataset.mode = plan.mode;
      body.style.cssText = `width:${W}px;height:${H-footer}px;padding:${plan.padding}px;gap:${plan.gap}px`;
      const artwork = el('img', 'wr-art'); artwork.src = art; artwork.alt = ''; artwork.width = plan.artwork; artwork.height = plan.artwork;
      artwork.style.cssText = `width:${plan.artwork}px;height:${plan.artwork}px`;
      if (plan.artwork) body.append(artwork);
      const meta = el('div', 'wr-meta'); meta.style.width = `${plan.textWidth}px`;
      const song = el('p', 'wr-title', title); song.style.cssText = `font-size:${plan.titleSize}px;line-height:${plan.titleLineHeight}px;-webkit-line-clamp:${Math.max(1,plan.titleLines)};max-height:${plan.titleLines*plan.titleLineHeight}px`;
      meta.append(song);
      if (plan.showArtist) { const artist = el('span', 'wr-artist', 'ROSÉ'); artist.style.cssText = `font-size:${plan.artistSize}px;line-height:${plan.artistLineHeight}px`; meta.append(artist); }
      body.append(meta); card.append(body);
      card.setAttribute('role', 'img'); card.setAttribute('aria-label', `음악 위젯 크기 예시 ${w}칸 × ${h}칸. ${title}, ROSÉ${attributed ? '. 지미니에게서 가져옴' : ''}`);
      body.setAttribute('aria-hidden', 'true');
      if (attributed) {
        const source = el('div','wr-source'); source.style.height = `${footer}px`; source.setAttribute('aria-hidden','true');
        const avatar=el('img'); avatar.src='assets/ditto-attribution/source-avatar.jpg';avatar.alt='';
        const logo=el('img','wr-source-logo');logo.src='assets/ditto-attribution/ditto-badge.png';logo.alt='';
        const name=el('span');name.append(el('b','', '지미니'),document.createTextNode('에게서 가져옴'));source.append(avatar,logo,name);card.append(source);
      }
      const scroll = el('div','wr-viewport'); scroll.append(card);
      const caption=el('figcaption','', `${w}×${h}칸 · ${fmt(W)}×${fmt(H)}pt`);
      const labels={row:'가로 배치',square:'정사각 오버레이',column:'세로 배치',rail:'좁은 세로 배치'};
      caption.append(el('small','', `${labels[plan.mode]} · 제목 ${plan.titleLines}줄${plan.showArtist ? ' + 아티스트' : ' · 아티스트는 상세에서'}${footer ? ` · 출처 ${footer}pt` : ''}`));
      figure.append(scroll,caption);gallery.append(figure);
    }
    host.querySelector('#wr-result').textContent = `${viewport}pt 화면 · ${sizes.length}개 허용 크기${attributed ? ' · 출처를 제외한 내용 높이 96pt 이상만 표시' : ''}. 색·사진은 기존 에셋, 크기와 재배치 규칙은 제안입니다.`;
  }
  controls.addEventListener('input',render);
  controls.addEventListener('change',render);
  const tbody = host.querySelector('#wr-size-table');
  for (const n of [2,3,4,6,8]) {
    const row=el('tr');const th=el('th','',`${n}칸`);th.scope='row';row.append(th);
    for(const vw of [320,375,390,402,430])row.append(el('td','',`${fmt(api.spanSize(n,vw))}pt`));
    tbody.append(row);
  }
  const matrix=host.querySelector('#wr-widget-table');
  for(const w of spec.widgets){
    const profile=spec.profiles[w.profile], ext=api.extrema(profile.sizes), row=el('tr');
    const name=el('th','',w.name);name.scope='row';name.append(el('small','',w.status==='planned'?'신규 기획 · 앱 타입 없음':'앱 코드 존재 · 반응형 검수 전'));
    const range=el('td');range.append(el('div','',`최소 ${sizeText(ext.min)}`),el('div','',`기본 ${sizeText([w.defaultSize])}`),el('div','',`최대 ${sizeText(ext.max)}`));
    const allowed=el('td','wr-size-list',sizeText(profile.sizes));allowed.append(el('small','',`${profile.layouts}개 배치 규칙 · ${profile.sizes.length}개 크기`));
    row.append(name,range,allowed,el('td','',profile.priority));matrix.append(row);
  }
  render();
})();
