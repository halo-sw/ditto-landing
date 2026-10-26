(() => {
  'use strict';
  const form=document.getElementById('unlock-form'),input=document.getElementById('access-code'),button=document.getElementById('unlock'),message=document.getElementById('access-message'),host=document.getElementById('review-host'),gate=document.getElementById('gate'),lock=document.getElementById('lock');
  let generation=0;
  function reset(){generation++;host.replaceChildren();host.hidden=true;gate.hidden=false;lock.hidden=true;input.value='';message.textContent='';button.disabled=false;button.textContent='검토 화면 열기 →';}
  lock.addEventListener('click',()=>{reset();input.focus();});
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(button.disabled)return;
    if(!/^[0-9]{4}$/.test(input.value)){message.textContent='4자리 코드를 입력해 주세요.';input.focus();return;}
    const run=++generation;button.disabled=true;button.textContent='검토 화면 여는 중…';message.textContent='';
    let secretBytes=new TextEncoder().encode(input.value);input.value='';
    let clear,phase='load';
    try{
      if(!globalThis.crypto?.subtle||!globalThis.DecompressionStream)throw new Error('browser');
      const response=await fetch('bundle.bin',{cache:'no-store'});if(!response.ok)throw new Error('load');
      const encrypted=new Uint8Array(await response.arrayBuffer());
      if(new TextDecoder().decode(encrypted.slice(0,8))!=='DITTOF01')throw new Error('format');
      const rounds=new DataView(encrypted.buffer,encrypted.byteOffset+8,4).getUint32(0,false);
      if(rounds!==600000)throw new Error('format');
      phase='unlock';
      const material=await crypto.subtle.importKey('raw',secretBytes,'PBKDF2',false,['deriveKey']);secretBytes.fill(0);
      const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:encrypted.slice(12,28),iterations:rounds,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
      clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:encrypted.slice(28,40),additionalData:encrypted.slice(0,40),tagLength:128},key,encrypted.slice(40));
      phase='render';
      const html=await new Response(new Blob([clear]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
      if(run!==generation)return;
      const frame=document.createElement('iframe');frame.title='Ditto 앱 흐름 · 코드 대조';frame.setAttribute('sandbox','allow-scripts allow-same-origin');frame.srcdoc=html;
      host.replaceChildren(frame);host.hidden=false;gate.hidden=true;lock.hidden=false;lock.focus();
    }catch(error){
      if(run!==generation)return;
      message.textContent=phase==='unlock'?'코드가 맞지 않아요. 다시 입력해 주세요.':error.message==='browser'?'이 브라우저에서는 열 수 없어요. 최신 Safari나 Chrome에서 다시 열어 주세요.':'검토 자료를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.';
      input.focus();
    }finally{secretBytes.fill(0);if(clear)new Uint8Array(clear).fill(0);if(run===generation){button.disabled=false;button.textContent='검토 화면 열기 →';}}
  });
  window.addEventListener('pagehide',reset);window.addEventListener('pageshow',event=>{if(event.persisted)reset();});
})();
