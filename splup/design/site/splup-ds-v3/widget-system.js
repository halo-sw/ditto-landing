(function (root, factory) {
  const spec = typeof module === 'object' && module.exports ? require('../../tokens/widget-system.json') : root.SplupWidgetSystem;
  const api = factory(spec);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.SplupWidgets = api; api.mount(); }
})(globalThis, function (spec) {
  'use strict';
  function measure(size, viewport = 402) {
    if (!spec.sizes.some(item => item.id === size) || !Number.isFinite(viewport)) throw new RangeError('Unsupported widget size or viewport');
    const v = Math.max(spec.grid.minViewport, Math.min(spec.grid.maxViewport, viewport));
    const [columns, rows] = size.split('x').map(Number);
    const pitch = (v - spec.grid.margin * 2 - spec.grid.gap * (spec.grid.columns - 1)) / spec.grid.columns + spec.grid.gap;
    return { width: columns * pitch - spec.grid.gap, height: rows * pitch - spec.grid.gap, columns, rows, radius: Math.min(20, 12 + (Math.min(columns, rows) - 2) * 2) };
  }
  function allowed(familyId, viewport, ditto = false) {
    const family = spec.families.find(item => item.id === familyId);
    if (!family) throw new RangeError('Unknown widget family');
    return family.sizes.filter(size => {
      const m = measure(size, viewport);
      return !ditto || (spec.ditto.sizes.includes(size) && m.width >= (['image','gif'].includes(familyId)?spec.ditto.minFrameWidth:spec.ditto.minTextFrameWidth) && m.height - spec.ditto.footerHeight >= Math.max(spec.ditto.minContentHeight, family.minContentHeight || 0));
    });
  }
  function mount() {
    const host = document.getElementById('page-widget-system'); if (!host) return;
    const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
    let albumAsset = globalThis.SplupMusicAlbums?.[0]?.asset||'./widget-assets/album-rose.png';
    let albumMetadata=globalThis.SplupMusicAlbums?.[0]||null;
    let albumPalette = globalThis.SplupWidgetContent.albumPalettes[albumAsset];
    let longText = false;
    function widget(id, size, viewport, ditto) {
      const m = measure(size, viewport);
      return globalThis.SplupWidgetRenderer.render(id, m.width, m.height, {ditto, radius:m.radius,albumAsset,albumPalette,longText,...(albumMetadata?{trackTitle:albumMetadata.track,artist:albumMetadata.artist,musicService:'YouTube Music'}:albumAsset.includes('album-blue')?{trackTitle:'Blue hour',artist:'Splup demo'}:albumAsset.startsWith('blob:')?{trackTitle:'나의 음악',artist:'아티스트'}:{})});
    }
    const family = host.querySelector('#sw-family'), viewport = host.querySelector('#sw-viewport'), ditto = host.querySelector('#sw-ditto'), gallery = host.querySelector('.sw-gallery');
    spec.families.forEach(item => { const option = make('option', '', item.name); option.value = item.id; family.append(option); });
    function render() {
      const id = family.value, width = Number(viewport.value), sourced = ditto.checked;
      const selected = spec.families.find(item => item.id === id), sizes = allowed(id, width, sourced);
      host.querySelector('#sw-viewport-value').textContent = width + 'px'; gallery.replaceChildren();
      sizes.forEach(size => { const m = measure(size, width), figure = make('figure'), frame = make('div', 'sw-preview'); frame.append(widget(id, size, width, sourced));
        const caption = make('figcaption'); caption.append(make('strong', '', size.replace('x', ' × ') + '칸'), make('span', '', `${+m.width.toFixed(2)} × ${+m.height.toFixed(2)} · R${m.radius}`)); figure.append(frame, caption); gallery.append(figure); });
      host.querySelector('#sw-rule').textContent = selected.rule;
      host.querySelector('#sw-result').textContent = sizes.length ? `${sizes.length}개 크기${sourced ? ' · 하단 출처 52px 포함' : ''} · 사진과 문구는 적용 예시입니다.` : '이 유형은 출처가 들어가는 크기를 제공하지 않아요. 원본 위젯으로 보거나 사진·음악·텍스트 유형을 선택하세요.';
    }
    [family, viewport, ditto].forEach(control => control.addEventListener('input', render));
    const tbody = host.querySelector('.sw-matrix tbody');
    spec.families.forEach(item => { const row = make('tr'), label = make('th', '', item.name); label.scope = 'row'; row.append(label, make('td', '', item.sizes.map(s => s.replace('x', '×')).join(' · ')), make('td', '', item.rule)); tbody.append(row); });
    const atlas = host.querySelector('.sw-atlas');
    spec.sizes.forEach(size => { const cell = make('div', 'sw-atlas-item'), shape = make('div', 'sw-atlas-shape'); shape.style.cssText = `width:${size.width402 * .35}px;height:${size.height402 * .35}px;border-radius:${size.radius * .35}px`; shape.textContent = size.id.replace('x', '×'); cell.append(shape, make('b', '', size.id.replace('x', ' × ') + '칸'), make('small', '', `${size.width402} × ${size.height402}`)); atlas.append(cell); });
    const contexts=host.querySelector('.sw-contexts');
    function renderContexts(){
      const newWidgets=host.querySelector('.sw-new-widgets');if(newWidgets){newWidgets.replaceChildren();[['mood','4x4','기분'],['guestbook','4x6','방명록'],['playlist','4x6','플레이리스트']].forEach(([id,size,name])=>{const f=make('figure');f.append(make('figcaption','',name),widget(id,size,402,false));newWidgets.append(f);});}
      if(contexts){contexts.replaceChildren();
      const fixtures=[['대표 플래터',[['image','4x4',0,0],['music','4x4',4,0],['text','6x2',0,4],['gif','2x2',6,4],['video','4x3',0,6],['social','4x4',4,6]]],['라이프 플래터',[['mood','4x2',0,0],['dday','2x2',4,0],['gif','2x2',6,0],['polaroid','3x4',0,2],['ask','3x4',3,2],['todo','4x3',0,6],['guestbook','4x4',4,6]]]];
      fixtures.forEach(([name,items])=>{const scroll=make('div','sw-context-scroll'),board=make('section','sw-platter');board.append(make('h3','',name));items.forEach(([id,size,x,y])=>{const item=widget(id,size,402,false);item.style.position='absolute';item.style.left=(16+x*47.25)+'px';item.style.top=(58+y*47.25)+'px';board.append(item);});scroll.append(board);contexts.append(scroll);});
    }
    }
    const badgeExamples=host.querySelector('.sw-badge-examples');
    [['video',181,'YouTube · 기본'],['social',181,'Instagram · 기본'],['video',86.5,'작은 크기'],['gif',86.5,'GIF · 형식 표시']].forEach(([id,w,label])=>{const p=globalThis.SplupWidgetContent.plan(id,w,181),b=p.nodes.at(-1),f=make('figure');f.append(globalThis.SplupWidgetRenderer.renderNode(b),make('figcaption','',label));badgeExamples?.append(f);});
    const albumInput=host.querySelector('#sw-album-upload');
    const musicStatus=host.querySelector('#sw-album-status');
    let objectUrl=null;
    let artworkRequest=0;
    async function useArtwork(src){
      const request=++artworkRequest;
      try{const selected=globalThis.SplupMusicAlbums?.find(a=>a.asset===src);let colors=selected?.palette;try{if(!colors)colors=await globalThis.SplupWidgetRenderer.sampleArtwork(src);}catch(error){colors=globalThis.SplupWidgetContent.albumPalettes[src];if(!colors)throw error;}if(request!==artworkRequest){if(src.startsWith('blob:'))URL.revokeObjectURL(src);return;}const previousUrl=objectUrl;objectUrl=src.startsWith('blob:')?src:null;albumAsset=src;albumPalette=colors;albumMetadata=selected||null;host.querySelectorAll('[data-sw-album]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.swAlbum===src)));const surface=globalThis.SplupMusicPlayerModel.colors(colors);musicStatus.textContent=`앨범 커버 CD · 커버의 주요 색을 본체에 적용했어요`;render();renderContexts();if(previousUrl&&previousUrl!==src)URL.revokeObjectURL(previousUrl);}
      catch{if(src.startsWith('blob:')&&src!==objectUrl)URL.revokeObjectURL(src);if(request!==artworkRequest)return;musicStatus.textContent='이미지를 읽지 못했어요. 기존 앨범과 색상을 유지해요.';}
    }
    host.querySelectorAll('[data-sw-album]').forEach(b=>b.addEventListener('click',()=>{family.value='music';useArtwork(b.dataset.swAlbum);}));
    albumInput?.addEventListener('change',()=>{const file=albumInput.files[0];if(!file)return;if(!file.type.startsWith('image/')){musicStatus.textContent='이미지 파일을 선택해주세요.';return;}const candidate=URL.createObjectURL(file);family.value='music';useArtwork(candidate);});
    host.querySelector('#sw-long-text')?.addEventListener('change',e=>{longText=e.target.checked;family.value='ask';render();renderContexts();});
    render();renderContexts();useArtwork(albumAsset);
  }
  return { spec, measure, allowed, mount };
});
