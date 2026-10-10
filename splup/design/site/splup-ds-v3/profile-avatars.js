(() => {
  const recipes = window.SplupProfileAvatars;
  if (!recipes) return;
  document.querySelectorAll('[data-avatar-demo]').forEach(root => {
    const sizeControl = root.querySelector('[data-avatar-size]');
    const ratioControl = root.querySelector('[data-avatar-ratio]');
    const resize = () => {
      if (!sizeControl || !ratioControl) return;
      const width = Number(sizeControl.value);
      const height = Math.round(width * Number(ratioControl.value));
      const radius = Math.min(width, height) / 4;
      root.style.setProperty('--avatar-preview-width', width + 'px');
      root.style.setProperty('--avatar-preview-height', height + 'px');
      root.style.setProperty('--avatar-preview-radius', radius + 'px');
      root.querySelector('[data-avatar-size-value]').textContent = width + 'px';
      root.querySelector('.avatar-resize-status').textContent = `${width} × ${height} · 모서리 ${radius}`;
    };
    sizeControl?.addEventListener('input', resize);
    ratioControl?.addEventListener('change', resize);
    const paint = id => {
      const recipe = recipes.find(item => item.id === id);
      if (!recipe) return;
      const handle = recipe.handle;
      root.style.setProperty('--handle-top', handle.representative.top);
      root.style.setProperty('--handle-bottom', handle.representative.bottom);
      root.style.setProperty('--handle-life', handle.life.background);
      root.querySelectorAll('[data-avatar-live]').forEach(image => {
        image.src = '../../../' + recipe.assets.svg;
        image.alt = recipe.name + ' 기본 아바타';
      });
      root.querySelectorAll('[data-avatar-choice]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.avatarChoice === id));
      });
      root.querySelector('.avatar-choice-status').textContent = `${recipe.number} · ${recipe.name} — 같은 아바타를 대표·라이프에 적용한 48px 예시`;
    };
    root.addEventListener('click', event => {
      const button = event.target.closest('[data-avatar-choice]');
      if (button && root.contains(button)) paint(button.dataset.avatarChoice);
    });
    paint(recipes[0].id);
    resize();
  });
})();
