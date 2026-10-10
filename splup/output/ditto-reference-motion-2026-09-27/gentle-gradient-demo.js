/* Vivid reference palettes, broad fixed blends. Only the shell and neutral material respond to input. */
(() => {
  const palettes = [
    // End in the secondary tone: a third bright stop formed a colored crescent at the corner.
    { id:'purple', name:'퍼플 · 바이올렛', colors:['#AA4AF4','#6655D2'], offsets:[0,.36,1], indices:[0,0,1], from:[0,0], to:[181,181] },
    { id:'lavender', name:'딥 퍼플 · 이클립스', colors:['#6655D2','#2C2F3A'], offsets:[0,.36,1], indices:[0,0,1], from:[10,0], to:[181,181] },
    { id:'coral', name:'핑크 · 코랄', colors:['#FA97E2','#FF2CBF','#FF5488'], offsets:[0,.25,.90,1], indices:[0,0,1,2], from:[0,30], to:[195,151] },
    { id:'peach', name:'피치 · 옐로', colors:['#FF925D','#F9F871'], offsets:[0,.28,1], indices:[0,0,1], from:[0,20], to:[205,170] },
    { id:'sky', name:'시안 · 블루', colors:['#48B5F4','#27E5F2'], offsets:[0,.25,1], indices:[0,0,1], from:[0,20], to:[205,170] },
    { id:'mint', name:'민트 · 라임', colors:['#07E7B4','#F9F871'], offsets:[0,.28,1], indices:[0,0,1], from:[0,20], to:[205,170] }
  ];
  const shape='M49 0 C15 0 0 15 0 49 L0 132 C0 166 15 181 49 181 L132 181 C166 181 181 166 181 132 L181 49 C181 15 166 0 132 0 Z';
  const query=matchMedia('(prefers-reduced-motion: reduce)'),reduce=document.querySelector('#reduce');
  reduce.checked=query.matches;reduce.disabled=query.matches;
  const isReduced=()=>query.matches||reduce.checked;
  if(new URLSearchParams(location.search).has('record'))document.body.classList.add('record');
  const tiles=palettes.map((p,i)=>{
    const figure=document.createElement('figure');
    const stops=p.offsets.map((offset,k)=>`<stop offset="${offset}" stop-color="${p.colors[p.indices[k]]}"/>`).join('');
    figure.innerHTML=`<button class="tile" type="button" aria-label="${p.name} 젤리 눌림 테스트">
      <svg aria-hidden="true" viewBox="0 0 181 181"><defs>
        <clipPath id="clip${i}"><path d="${shape}"/></clipPath>
        <linearGradient id="g${i}" gradientUnits="userSpaceOnUse" x1="${p.from[0]}" y1="${p.from[1]}" x2="${p.to[0]}" y2="${p.to[1]}">${stops}</linearGradient>
        <filter id="soft${i}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>
      </defs><g clip-path="url(#clip${i})">
        <g class="field"><rect width="181" height="181" fill="url(#g${i})"/></g>
        <rect class="surface-coat" width="181" height="181" fill="white" opacity=".09"/>
        <path d="${shape}" fill="none" stroke="white" stroke-width="11" opacity=".72" filter="url(#soft${i})"/>
      </g></svg>
      <img class="logo" alt="" src="../ditto-organic-motion/public/brand/wordmark-black.svg">
    </button><figcaption><h2>${p.name}</h2><p>고정 그라디언트 · 젤리 눌림</p></figcaption>`;
    document.querySelector('.grid').append(figure);
    return {button:figure.querySelector('button'),field:figure.querySelector('.field')};
  });
  const status=document.querySelector('.status');
  const softPress=DittoSoftPress.setup(tiles,{isReduced,onActivate(index){
    status.textContent=isReduced()?'동작 줄이기 · 색은 고정하고 안쪽 음영만 표시합니다.':palettes[index].name+' · 눌림 확인. 색의 위치와 비중은 그대로입니다.';
  }});
  DittoButtonMaterial.comparison(tiles,document.querySelector('.material-pairs'));
  document.querySelector('#all').onclick=()=>{
    tiles.forEach((_,i)=>softPress.pulse(i));
    status.textContent='여섯 버튼의 눌림을 확인했습니다. 그라디언트는 이동하거나 회전하지 않습니다.';
  };
  function stop(){softPress.resetAll();status.textContent=isReduced()?'동작 줄이기 · 색은 고정하고 안쪽 음영만 표시합니다.':'버튼을 꾹 눌러보세요. 모양과 음영만 반응합니다.';}
  reduce.onchange=stop;
  query.addEventListener('change',e=>{reduce.checked=e.matches;reduce.disabled=e.matches;stop();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('pagehide',stop);
  window.motionTest={stop,get state(){return {
    mode:'fixed-vivid-gradient',reduced:isReduced(),press:softPress.getState(),
    palettes:palettes.map(p=>({id:p.id,colors:[...p.colors],offsets:[...p.offsets],indices:[...p.indices],from:[...p.from],to:[...p.to]})),
    gradients:tiles.map(t=>({fieldTransform:t.field.getAttribute('transform'),gradientTransform:t.button.querySelector('linearGradient').getAttribute('gradientTransform')}))
  };}};
})();
