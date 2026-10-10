/* Hue-neutral material feedback. Exact SVG silhouette; only layer opacity is animated. */
window.DittoButtonMaterial = (() => {
  const values=Object.freeze({ toneOpacity:.025, rimRest:.72, rimPressed:.30,
    restHighlightPressed:.20, contactLightPressed:0 });
  const ns='http://www.w3.org/2000/svg';
  const make=(tag,attrs={})=>{const node=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));return node;};
  function inner(defs,id,{dy,blur,color,alpha}){
    const filter=make('filter',{id,x:'-20%',y:'-20%',width:'140%',height:'140%','color-interpolation-filters':'sRGB'});
    filter.append(make('feGaussianBlur',{in:'SourceAlpha',stdDeviation:blur,result:'blur'}),
      make('feOffset',{in:'blur',dy,result:'offset'}),
      make('feComposite',{in:'SourceAlpha',in2:'offset',operator:'out',result:'inside'}),
      make('feFlood',{'flood-color':color,'flood-opacity':alpha}),
      make('feComposite',{in2:'inside',operator:'in'}));
    defs.append(filter);return id;
  }
  function states(root){
    return [
      {node:root.querySelector('.material-glass-rim'),rest:values.rimRest,pressed:values.rimPressed},
      {node:root.querySelector('.material-rest'),rest:1,pressed:values.restHighlightPressed},
      {node:root.querySelector('.material-pressed'),rest:0,pressed:1},
      {node:root.querySelector('.material-tone'),rest:0,pressed:values.toneOpacity}
    ];
  }
  function attach(svg,index){
    const defs=svg.querySelector('defs'),shape=svg.querySelector('clipPath path').getAttribute('d');
    const rim=svg.querySelector('path[filter]');rim.classList.add('material-glass-rim');
    const parent=rim.parentNode,prefix='material-'+index;
    const tone=make('path',{d:shape,fill:'#000',class:'material-tone'});
    const rest=make('g',{class:'material-rest'}),pressed=make('g',{class:'material-pressed'});
    const add=(group,name,settings)=>{
      const id=inner(defs,prefix+'-'+name,settings);
      group.append(make('path',{d:shape,fill:'#fff',filter:'url(#'+id+')'}));
    };
    add(rest,'rest-top',{dy:.8,blur:.7,color:'#fff',alpha:.42});
    add(rest,'rest-bottom',{dy:-.8,blur:1.2,color:'#000',alpha:.08});
    add(pressed,'pressed-top',{dy:3.2,blur:3,color:'#000',alpha:.22});
    add(pressed,'pressed-contact',{dy:1,blur:.9,color:'#000',alpha:.10});
    add(pressed,'pressed-bottom',{dy:-.8,blur:1,color:'#fff',alpha:.13});
    // Tone sits above the white coat but below edge lighting; the logo stays outside.
    parent.insertBefore(tone,rim);parent.append(rest,pressed);
    const targets=states(svg);targets.forEach(t=>t.node.style.opacity=t.rest);
    return {targets,reset(){targets.forEach(t=>t.node.style.opacity=t.rest);},
      state(){return Object.fromEntries(targets.map(t=>[t.node.getAttribute('class'),Number(getComputedStyle(t.node).opacity)]));}};
  }
  function comparison(tiles,container){
    tiles.forEach((tile,index)=>{
      const pair=document.createElement('div');pair.className='material-pair';
      const title=document.createElement('h3');title.textContent=tile.button.closest('figure').querySelector('h2').textContent;
      pair.append(title);
      [false,true].forEach((pressed,side)=>{
        const figure=document.createElement('figure'),sample=document.createElement('div'),copy=tile.button.cloneNode(true);
        sample.className='tile material-sample';sample.setAttribute('role','img');
        sample.setAttribute('aria-label',title.textContent+' '+(pressed?'눌림':'기본')+' 상태');
        sample.dataset.materialState=pressed?'pressed':'rest';
        // The exact same fixed gradient is used for both material states.
        copy.querySelectorAll('canvas').forEach(c=>c.remove());
        const field=copy.querySelector('.field');field.style.visibility='visible';
        field.removeAttribute('transform');
        copy.querySelector('.soft-surface').style.transform='none';copy.querySelector('.logo').style.transform='none';
        copy.querySelector('.soft-light').style.opacity='0';
        const ids=new Map();copy.querySelectorAll('[id]').forEach(n=>{const old=n.id;const next='comparison-'+index+'-'+side+'-'+old;ids.set(old,next);n.id=next;});
        copy.querySelectorAll('*').forEach(n=>{for(const attribute of [...n.attributes]){
          let value=attribute.value;for(const [old,next] of ids)value=value.replaceAll('url(#'+old+')','url(#'+next+')');
          if(value!==attribute.value)n.setAttribute(attribute.name,value);
        }});
        states(copy).forEach(t=>t.node.style.opacity=pressed?t.pressed:t.rest);
        sample.append(...copy.childNodes);
        const caption=document.createElement('figcaption');caption.textContent=pressed?'눌림 · 음영 + 깊이':'기본 · 얕은 반사';
        figure.append(sample,caption);pair.append(figure);
      });
      container.append(pair);
    });
  }
  return {values,attach,comparison};
})();
