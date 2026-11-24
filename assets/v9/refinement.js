(function(){
'use strict';
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var hero=document.querySelector('#h8HeroPl');
if(hero&&!reduce){
  requestAnimationFrame(function(){
    var cards=Array.from(hero.querySelectorAll('.dpl-item')),cell=hero.clientWidth/3;
    cards.forEach(function(el,i){
      var x=(i%3)*cell,y=Math.floor(i/3)*cell,dx=x-el.offsetLeft,dy=y-el.offsetTop;
      el.animate([{transform:'translate('+dx+'px,'+dy+'px) scale(.84)',opacity:0},{transform:'none',opacity:1}],{duration:820,delay:160+i*45,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
    });
  });
}
var heroButton=document.querySelector('#v9HeroLayout'),heroCount=0;
if(heroButton){heroButton.addEventListener('click',function(){heroCount=(heroCount+1)%3;heroButton.setAttribute('aria-label','나답게 놓아 보기, 현재 '+(heroCount+1)+'번째 배치');heroButton.querySelector('span').textContent=String(heroCount+1).padStart(2,'0')+' / 03';});}
document.querySelectorAll('.v9-scenes .v9-app-slot,.v9-analog-slot').forEach(function(slot){
 var art=document.createElement('div');art.className='v10-field-art';art.setAttribute('aria-hidden','true');
 for(var i=0;i<4;i++)art.appendChild(document.createElement('i'));slot.prepend(art);
 var label=slot.querySelector('.v9-slot-center>span:last-child');if(label)label.textContent='앱 화면을 담을 자리';
});
var nav=document.querySelector('.gnb'),darkAreas=Array.from(document.querySelectorAll('#h8-why,#h8-freq,#get,.foot')),regions=[],pending=0;
function measure(){regions=darkAreas.map(function(el){var r=el.getBoundingClientRect();return[r.top+scrollY,r.bottom+scrollY];});paint();}
function paint(){pending=0;if(!nav)return;var y=scrollY+nav.getBoundingClientRect().top+nav.offsetHeight/2;nav.classList.toggle('v10-nav-dark',regions.some(function(r){return y>=r[0]&&y<r[1];}));}
addEventListener('scroll',function(){if(!pending)pending=requestAnimationFrame(paint);},{passive:true});
addEventListener('resize',measure);if('ResizeObserver' in window)new ResizeObserver(measure).observe(document.body);measure();
})();
