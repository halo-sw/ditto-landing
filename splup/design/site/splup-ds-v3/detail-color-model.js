(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./detail-color-tokens.js'));
  else root.SplupDetailColorModel=factory(root.SplupDetailColors);
})(typeof globalThis!=='undefined'?globalThis:this,function(data){
  'use strict';
  const all=[...data.neutrals,...data.colors,...data.gradients];
  const hex=/^#[0-9a-f]{6}$/i;
  const find=id=>all.find(p=>p.id===id)||(hex.test(id)?{id:id.toUpperCase(),name:'직접 고른 색',value:id.toUpperCase(),group:'custom'}:null);
  const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
  const luminance=c=>c.map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[0.2126,0.7152,0.0722][i],0);
  function contrast(background,text){
    const b=find(background),t=find(text); if(!b||!t?.value)return 0;
    const fg=luminance(rgb(t.value));
    const samples=b.value?[rgb(b.value)]:Array.from({length:257},(_,i)=>{
      const p=i/256,stops=b.stops;const right=stops.findIndex(s=>s.position>=p);
      if(right<=0)return rgb(stops[0].color);
      const a=stops[right-1],z=stops[right],f=(p-a.position)/(z.position-a.position);
      return rgb(a.color).map((v,k)=>v+(rgb(z.color)[k]-v)*f);
    });
    return Math.min(...samples.map(s=>{const bg=luminance(s);return (Math.max(bg,fg)+0.05)/(Math.min(bg,fg)+0.05);}));
  }
  function css(id){const p=find(id);if(!p)return '';return p.value||`linear-gradient(${p.angle}deg in srgb, ${p.stops.map(s=>`${s.color} ${s.position*100}%`).join(', ')})`;}
  function recommend(background){return ['neutral-950','neutral-white'].map(text=>({text,ratio:contrast(background,text)})).sort((a,b)=>b.ratio-a.ratio)[0];}
  const valid=(field,id)=>!!find(id)&&(field==='background'||(field==='text'&&!!find(id).value));
  function create(initial=data.initial){
    if(!valid('background',initial.background)||!valid('text',initial.text))throw Error('Invalid initial colors');
    return {draft:{...initial},applied:{...initial}};
  }
  function reduce(state,action){
    if(action.type==='select'&&valid(action.field,action.id))return {...state,draft:{...state.draft,[action.field]:find(action.id).id}};
    if(action.type==='reset'&&['background','text'].includes(action.field))return {...state,draft:{...state.draft,[action.field]:data.defaults[action.field]}};
    if(action.type==='apply')return {draft:{...state.draft},applied:{...state.draft}};
    if(action.type==='cancel')return {...state,draft:{...state.applied}};
    return state;
  }
  // One compact palette is shared by the screen and its custom-color popover.
  const paletteRows=[
    ['custom','neutral-white','yellow-100','lime-100','cyan-100','purple-100','pink-100'],
    data.colors.filter(p=>p.level==='500').map(p=>p.id),
    data.colors.filter(p=>p.level==='700').map(p=>p.id),
    [...data.colors.filter(p=>p.level==='900').slice(0,6).map(p=>p.id),'neutral-950'],
    data.gradients.map(p=>p.id)
  ];
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function fromHSV(h,s,v){
    h=((h%360)+360)%360;s=clamp(s,0,1);v=clamp(v,0,1);
    const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;
    const channels=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
    return '#'+channels.map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('').toUpperCase();
  }
  function toHSV(value){
    if(!hex.test(value))return null;
    const [r,g,b]=rgb(value),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
    let h=!d?0:max===r?60*(((g-b)/d)%6):max===g?60*((b-r)/d+2):60*((r-g)/d+4);
    return {h:(h+360)%360,s:max?d/max:0,v:max};
  }
  function hueAt(x,y){return ((Math.atan2(y,x)*180/Math.PI+90)%360+360)%360;}
  return {all,find,css,contrast,recommend,create,reduce,paletteRows,fromHSV,toHSV,hueAt};
});
