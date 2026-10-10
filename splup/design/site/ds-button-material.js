/* Token-driven material preview. Historic reference files are deliberately left unchanged. */
window.DittoButtonMaterial = (() => {
  const spec=DittoDSTokens.material;
  const values=Object.freeze({ toneOpacity:spec.neutralTone.pressedOpacity, rimRest:spec.rim.restOpacity, rimPressed:spec.rim.pressedOpacity,
    restHighlightPressed:spec.restInner.pressedOpacity, contactLightPressed:spec.contactLightOpacity });
  const shadow=s=>({dy:s.dy,blur:s.stdDeviation,color:s.color,alpha:s.alpha});
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
    add(rest,'rest-top',shadow(spec.restInner.top));
    add(rest,'rest-bottom',shadow(spec.restInner.bottom));
    add(pressed,'pressed-top',shadow(spec.pressedInner.top));
    add(pressed,'pressed-contact',shadow(spec.pressedInner.contact));
    add(pressed,'pressed-bottom',shadow(spec.pressedInner.bottom));
    // Tone sits above the white coat but below edge lighting; the logo stays outside.
    parent.insertBefore(tone,rim);parent.append(rest,pressed);
    const targets=states(svg);targets.forEach(t=>t.node.style.opacity=t.rest);
    return {targets,reset(){targets.forEach(t=>t.node.style.opacity=t.rest);},
      state(){return Object.fromEntries(targets.map(t=>[t.node.getAttribute('class'),Number(getComputedStyle(t.node).opacity)]));}};
  }
  return {values,attach};
})();
