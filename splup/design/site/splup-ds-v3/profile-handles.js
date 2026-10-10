const profileHandleRecipes = window.SplupProfileHandles || window.SplupProfileAvatars.map(item => item.handle);
(() => {
 const root = document.getElementById('page-profile-handles');
 if (!root) return;
 const fallbackToggle = root.querySelector('[data-avatar-fallback]');
 let selected = 0;
 let fallback = false;
 const paintAvatar = () => {
   const palette = profileHandleRecipes[selected];
   const avatar = window.SplupProfileAvatars?.find(recipe => recipe.handlePaletteId === palette.id);
   if (!avatar) return;
   root.querySelectorAll('[data-handle-avatar]').forEach(image => {
     image.src = fallback ? '../../brand/color-system/profile-person-fallback.svg' : '../../../' + avatar.assets.svg;
     image.alt = fallback ? '사진과 기본 아바타를 선택하지 않은 프로필' : palette.name + ' 기본 아바타';
     image.parentElement.classList.toggle('avatar-art', !fallback);
   });
   fallbackToggle?.setAttribute('aria-pressed', String(fallback));
   if (fallbackToggle) fallbackToggle.textContent = fallback ? '선택한 기본 아바타 보기' : '사진 미등록 상태 보기';
 };
 const paint = index => {
   selected = index;
   const palette = profileHandleRecipes[index];
   root.style.setProperty('--handle-top', palette.representative.top);
   root.style.setProperty('--handle-bottom', palette.representative.bottom);
   root.style.setProperty('--handle-life', palette.life.background);
   root.querySelector('.handle-recipe').textContent = `${palette.name} · 대표 ${palette.representative.top} → ${palette.representative.bottom} / 라이프 ${palette.life.background}`;
   root.querySelectorAll('[data-handle-palette]').forEach((button,i) => button.setAttribute('aria-pressed', String(i === index)));
   paintAvatar();
 };
 root.querySelectorAll('[data-handle-palette]').forEach((button,index) => button.addEventListener('click', () => paint(index)));
 fallbackToggle?.addEventListener('click', () => { fallback = !fallback; paintAvatar(); });
 paint(0);
})();
(()=>{const root=document.getElementById('page-profile-handles');const feedback=root.querySelector('.ph-feedback');root.addEventListener('click',e=>{const edit=e.target.closest('[data-profile-edit]'),done=e.target.closest('[data-profile-done]'),settings=e.target.closest('[data-profile-settings]'),add=e.target.closest('[data-profile-add]');if(edit){const actions=edit.parentElement;actions.dataset.previous=actions.innerHTML;actions.innerHTML='<button class="ph-primary" data-profile-done>수정완료</button>';actions.querySelector('button').focus();feedback.textContent='프로필 수정 중이에요. 수정완료를 누르면 기본 상태로 돌아가요.';}if(done){const actions=done.parentElement;actions.innerHTML=actions.dataset.previous||'<button aria-label="프로필 수정" data-profile-edit><img src="../../brand/color-system/profile-pencil.svg" alt=""></button><button aria-label="설정" data-profile-settings><img src="../../brand/color-system/profile-gear.svg" alt=""></button>';actions.querySelector('button').focus();feedback.textContent='수정완료 상태를 확인했어요. 데모에서는 실제 저장하지 않아요.';}if(settings)feedback.textContent='앱에서는 계정 설정 화면으로 이동해요.';if(add){add.innerHTML='<span aria-hidden="true">…</span>';add.setAttribute('aria-label','친구 요청됨');add.title='친구 요청됨';add.disabled=true;add.className='ph-circle ph-disabled';feedback.textContent='친구 요청 후에는 요청됨으로 표시하고 중복 요청을 막아요. 이 데모는 요청을 전송하지 않아요.';}});})();
