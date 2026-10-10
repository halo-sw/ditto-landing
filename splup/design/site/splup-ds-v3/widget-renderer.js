(function(root){
  'use strict';
  const C=root.SplupWidgetContent;
  const colorRoles={'#FFFFFF':'surface','#FAF9FC':'canvas','#F4EFFA':'paper','#302937':'ink','#77717E':'muted','#AA4AF4':'purple','#6655D2':'deep-purple','#DDD7E5':'line','#F2F1F4':'memo-surface','#F6F4FA':'countdown-surface','#FAF9F6':'instant-paper','#EEE9F8':'question-surface','#F0EBF8':'mood-surface','#F9F7F2':'guestbook-surface','#C6C2CC':'checkbox-line'};
  const color=value=>colorRoles[value.toUpperCase()]?`var(--sw-${colorRoles[value.toUpperCase()]},${value})`:value;
  const el=(tag,cls)=>{const n=document.createElement(tag);n.className=cls;return n;};
  function renderNode(data,top=false){
    const n=el(data.kind==='text'?'span':data.kind==='image'?'img':'div','sw-node sw-node-'+data.kind);
    n.dataset.layer=data.name;n.style.width=data.w+'px';n.style.height=data.h+'px';n.style.flexShrink='0';
    if(top||data.absolute){n.style.position='absolute';n.style.left=(data.x||0)+'px';n.style.top=(data.y||0)+'px';}
    if(data.radius)n.style.borderRadius=data.radius+'px';
    if(data.kind==='text'){
      n.textContent=data.text;n.style.cssText+=`;font-size:${data.size}px;line-height:${data.line}px;font-weight:${data.weight};color:${color(data.color)};-webkit-line-clamp:${data.lines}`;
    }else if(data.kind==='image'){
      n.src=data.asset==='dittoBadge'?'../assets/ditto-attribution/ditto-badge.png':C.assets[data.asset]||data.asset;n.alt='';n.loading='lazy';
    }else{
      if(data.color||data.fill)n.style.background=color(data.color||data.fill);
      if(data.gradient)n.style.background=`linear-gradient(155deg,${data.gradient[0]},${data.gradient[1]})`;
      if(data.stroke)n.style.boxShadow=`inset 0 0 0 1px ${color(data.stroke)}`;
      if(data.check){n.textContent='✓';n.style.cssText+=';color:white;font-size:12px;line-height:16px;text-align:center';}
      if(data.kind==='group'){
        n.style.cssText+=`;display:flex;flex-direction:${data.layout==='HORIZONTAL'?'row':'column'};gap:${data.gap||0}px;padding:${data.padding||0}px ${data.paddingX??data.padding??0}px;align-items:${data.align==='CENTER'?'center':'flex-start'};justify-content:${data.justify==='CENTER'?'center':'flex-start'}`;
        data.children.forEach(child=>n.append(renderNode(child)));
      }
    }
    return n;
  }
  function render(id,w,h,options={}){
    if(id==='music'&&root.SplupMusicPlayer)return root.SplupMusicPlayer.create(w,h,options);
    const plan=C.plan(id,w,h,options),card=el('div','sw-widget');card.dataset.kind=id;card.style.cssText=`width:${w}px;height:${h}px;background:${color(plan.bg)};border-radius:${options.radius||16}px`;
    plan.nodes.forEach(n=>card.append(renderNode(n,true)));return card;
  }
  async function sampleArtwork(src){
    const img=new Image();img.decoding='async';img.src=src;await img.decode();
    const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,32,32);
    return C.paletteFromPixels(ctx.getImageData(0,0,32,32).data);
  }
  root.SplupWidgetRenderer={render,renderNode,sampleArtwork};
})(globalThis);
