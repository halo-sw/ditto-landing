(() => {
 document.querySelectorAll('.demo-replay').forEach(button => {
  let timer;
  button.addEventListener('click', () => {
   const track=button.previousElementSibling;
   clearTimeout(timer);track.classList.add('pressed');button.textContent='눌림';
   timer=setTimeout(()=>{track.classList.remove('pressed');button.textContent='눌림·복원 재생'},160);
  });
 });
 document.querySelectorAll('.spec-cta:not([disabled])').forEach(button=>button.addEventListener('click',()=>{button.parentElement.querySelector('.spec-feedback').textContent='선택했어요. 기본 상태로 돌아가요.'}));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.getElementById('sidebar')?.classList.remove('open');document.getElementById('menuBtn')?.setAttribute('aria-expanded','false')}});
})();
// Keep the selected category visible in the mobile horizontal menu.
(() => {
 const reveal = () => requestAnimationFrame(() => {
  const nav=document.getElementById('topNav');
  const active=nav.querySelector('.active');
  if(active){const box=active.getBoundingClientRect(),parent=nav.getBoundingClientRect();nav.scrollTo({left:nav.scrollLeft+box.left-parent.left-(nav.clientWidth-box.width)/2,behavior:'auto'});}
 });
 window.addEventListener('hashchange',reveal);
 window.addEventListener('resize',reveal);
 reveal();
})();
document.querySelectorAll('[data-guide-target]').forEach(button=>button.addEventListener('click',()=>{const target=document.getElementById(button.dataset.guideTarget);target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});}));
