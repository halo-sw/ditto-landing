/* Token-driven tactile feedback; no layout changes or gradient/color movement. */
window.DittoSoftPress = (() => {
  const spec=DittoDSTokens.motion, ease=v=>'cubic-bezier('+v.join(',')+')';
  const values = Object.freeze({ downMs:spec.press.durationMs, returnMs:spec.release.durationMs, minVisibleMs:spec.press.minVisibleMs,
    scaleX:spec.press.scaleX, scaleY:spec.press.scaleY, sinkPx:spec.press.translateY,
    downEase:ease(spec.press.easing), returnEase:ease(spec.release.easing) });
  const identity = 'translateY(0px) scale(1, 1)';
  function setup(tiles, { isReduced, onActivate }) {
    const entries = tiles.map((tile,index) => {
      const button = tile.button, svg = button.querySelector('svg');
      const surface = document.createElement('span');surface.className = 'soft-surface';
      surface.setAttribute('aria-hidden', 'true');button.insertBefore(surface, svg);
      if(tile.pressureCanvas)surface.append(tile.pressureCanvas);surface.append(svg);
      const material=DittoButtonMaterial.attach(svg,index),light=document.createElement('span');
      light.className='soft-light';surface.append(light);
      return { button, surface, material, light, color:tile.colorPressure, logo: button.querySelector('.logo'),
        animations: new Map(), pointerId: null, key: null, timer: 0, revision: 0,
        downAt: 0, origin: null, cancelled: false, phase: 'idle', activations: 0 };
    });
    function phase(t, value) { t.phase = value;t.button.dataset.softPhase = value; }
    function tween(t, node, property, target, ms, easing, done) {
      const from = getComputedStyle(node)[property];
      const previous = t.animations.get(node);if(previous) previous.cancel();
      if (isReduced() || ms === 0) { node.style[property] = target;t.animations.delete(node);done?.();return; }
      const animation = node.animate([{ [property]: from }, { [property]: target }],
        { duration: ms, easing, fill: 'forwards' });
      t.animations.set(node, animation);
      animation.onfinish = () => {
        if(t.animations.get(node) !== animation) return;
        node.style[property] = target;t.animations.delete(node);animation.cancel();done?.();
      };
    }
    function begin(t, point) {
      const rect=point?t.button.getBoundingClientRect():null;
      const focus=point?{x:(point.x-rect.left)/rect.width,y:(point.y-rect.top)/rect.height}:{x:.5,y:.5};
      clearTimeout(t.timer);t.timer = 0;t.cancelled = false;t.downAt = performance.now();
      const rev = ++t.revision;phase(t, 'pressing');
      if(point) {
        t.button.style.setProperty('--press-x', Math.max(4,Math.min(96,focus.x*100))+'%');
        t.button.style.setProperty('--press-y', Math.max(4,Math.min(96,focus.y*100))+'%');
      } else { t.button.style.setProperty('--press-x','50%');t.button.style.setProperty('--press-y','46%'); }
      tween(t,t.surface,'transform',isReduced()?identity:`translateY(${values.sinkPx}px) scale(${values.scaleX}, ${values.scaleY})`,values.downMs,values.downEase,()=>{if(t.revision===rev&&t.phase==='pressing')phase(t,'held');});
      tween(t,t.logo,'transform',isReduced()?identity:`translateY(${spec.logoPress.translateY}px) scale(${spec.logoPress.uniformScale})`,values.downMs,values.downEase);
      t.material.targets.forEach(layer=>tween(t,layer.node,'opacity',String(layer.pressed),values.downMs,values.downEase));
      tween(t,t.light,'opacity',String(DittoButtonMaterial.values.contactLightPressed),values.downMs,values.downEase);
      t.color?.press(focus);
    }
    function release(t, cancelled = false) {
      clearTimeout(t.timer);const rev = t.revision;
      const wait = cancelled||isReduced()?0:Math.max(0,values.minVisibleMs-(performance.now()-t.downAt));
      const restore = () => {
        t.timer=0;if(t.revision!==rev) return;phase(t,'releasing');
        const ms = cancelled?spec.release.cancelDurationMs:values.returnMs;
        tween(t,t.surface,'transform',identity,ms,values.returnEase,()=>{if(t.revision===rev)phase(t,'idle');});
        tween(t,t.logo,'transform',identity,ms,values.returnEase);
        t.material.targets.forEach(layer=>tween(t,layer.node,'opacity',String(layer.rest),ms,values.returnEase));
        tween(t,t.light,'opacity','0',ms,values.returnEase);
        t.color?.release(cancelled);
      };
      if(wait) t.timer=setTimeout(restore,wait);else restore();
    }
    function inBounds(t, e) {
      const r=t.button.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
    }
    function cancel(t) {
      t.cancelled=true;t.key=null;const id=t.pointerId;t.pointerId=null;
      if(id!==null&&t.button.hasPointerCapture(id))t.button.releasePointerCapture(id);
      release(t,true);
    }
    entries.forEach((t,index) => {
      phase(t,'idle');
      t.button.addEventListener('pointerdown',e=>{
        if(!e.isPrimary||e.button!==0||t.pointerId!==null)return;
        t.pointerId=e.pointerId;t.origin={x:e.clientX,y:e.clientY};begin(t,t.origin);
        t.button.setPointerCapture(e.pointerId);
      });
      t.button.addEventListener('pointermove',e=>{
        if(t.pointerId!==e.pointerId)return;
        const scrollGesture=e.pointerType==='touch'&&Math.hypot(e.clientX-t.origin.x,e.clientY-t.origin.y)>DittoDSTokens.interaction.webTouchMovementCancelPx;
        if(scrollGesture||!inBounds(t,e))cancel(t);
      });
      t.button.addEventListener('pointerup',e=>{
        if(t.pointerId!==e.pointerId)return;
        const valid=inBounds(t,e);const id=t.pointerId;t.pointerId=null;
        if(t.button.hasPointerCapture(id))t.button.releasePointerCapture(id);
        if(!valid)t.cancelled=true;release(t,!valid);
      });
      t.button.addEventListener('pointercancel',e=>{if(t.pointerId===e.pointerId)cancel(t);});
      t.button.addEventListener('lostpointercapture',()=>{if(t.pointerId!==null)cancel(t);});
      t.button.addEventListener('keydown',e=>{
        if(e.key==='Escape'){cancel(t);return;}
        if(e.key!==' '&&e.key!=='Enter')return;
        if(e.repeat){e.preventDefault();return;}
        t.key=e.key;begin(t);
      });
      t.button.addEventListener('keyup',e=>{
        if(t.cancelled&&(e.key===' '||e.key==='Enter')){e.preventDefault();return;}
        if(t.key===e.key){t.key=null;release(t);}
      });
      t.button.addEventListener('blur',()=>{if(t.phase!=='idle')cancel(t);});
      t.button.addEventListener('click',e=>{
        if(t.cancelled&&e.detail!==0){e.preventDefault();return;}
        t.cancelled=false;
        if(t.phase==='idle'){begin(t);release(t);}
        t.activations++;onActivate(index);
      });
    });
    function resetAll() {
      entries.forEach(t=>{
        clearTimeout(t.timer);t.timer=0;t.revision++;t.cancelled=false;t.key=null;
        const id=t.pointerId;t.pointerId=null;
        if(id!==null&&t.button.hasPointerCapture(id))t.button.releasePointerCapture(id);
        t.animations.forEach(a=>a.cancel());t.animations.clear();
        t.surface.style.transform=identity;t.logo.style.transform=identity;
        t.material.reset();t.light.style.opacity='0';phase(t,'idle');
        t.color?.reset();
      });
    }
    window.addEventListener('blur',()=>entries.forEach(t=>{if(t.pointerId!==null||t.key!==null)cancel(t);}));
    return { values, resetAll, pulse(index){const t=entries[index];begin(t);release(t);},
      getState(){return entries.map(t=>({phase:t.phase,pointerId:t.pointerId,activations:t.activations,
        transform:getComputedStyle(t.surface).transform,logoTransform:getComputedStyle(t.logo).transform,
        light:Number(getComputedStyle(t.light).opacity),material:t.material.state(),animations:t.animations.size}));} };
  }
  return { setup, values };
})();
