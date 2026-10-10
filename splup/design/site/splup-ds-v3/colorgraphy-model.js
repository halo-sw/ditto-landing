(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SplupColorgraphy=api;})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  function rgba(hex){if(!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex))throw new Error('Invalid color: '+hex);const v=hex.slice(1).match(/../g).map(x=>parseInt(x,16));return [v[0],v[1],v[2],v.length===4?v[3]/255:1];}
  function composite(front,back){const a=front[3]+back[3]*(1-front[3]);return [0,1,2].map(i=>(front[i]*front[3]+back[i]*back[3]*(1-front[3]))/a).concat(a);}
  function luminance(c){return c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);}
  function contrast(fg,bg,canvas='#FFFFFF'){const b=composite(rgba(bg),rgba(canvas)),f=composite(rgba(fg),b),ls=[luminance(f),luminance(b)].sort((a,b)=>b-a);return (ls[0]+.05)/(ls[1]+.05);}
  function resolve(system,catalog,name,mode='Light'){const token=catalog.tokens.find(t=>t.name===name||t.source===name);if(!token||!['Light','Dark'].includes(mode))throw new Error('Unknown token or mode: '+name);return system.semantic[token.source][mode];}
  function reference(system,color){for(const [family,steps] of Object.entries(system.primitive))for(const [step,value] of Object.entries(steps))if(value.toUpperCase()===color.toUpperCase())return family+'/'+step;const upper=color.toUpperCase();if(upper==='#FFFFFF')return 'static/white';if(upper.length===9){const base=reference(system,upper.slice(0,7));return base+' · '+Math.round(parseInt(upper.slice(7),16)/255*100)+'%';}return color+' · status';}
  function filter(catalog,query='',property='all',role='all'){query=query.trim().toLowerCase();return catalog.tokens.filter(t=>(property==='all'||t.property===property)&&(role==='all'||t.role===role)&&[t.name,t.source,t.usage,t.role,t.variant,t.state].join(' ').toLowerCase().includes(query));}
  return {rgba,composite,contrast,resolve,reference,filter};
});
