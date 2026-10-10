(() => {
  const palettes = window.SplupProfileHandles;
  if (!palettes?.length) return;
  document.querySelectorAll('[data-profile-color-editor]').forEach(root => {
    const inputs = [...root.querySelectorAll('input[type="radio"]')];
    const choice = root.querySelector('[data-profile-color-choice]');
    const values = root.querySelector('[data-profile-color-values]');
    const status = root.querySelector('[data-profile-color-status]');
    let applied = inputs.find(input => input.checked)?.value || palettes[0].id;
    let draft = applied;
    const preview = (id, reveal = false) => {
      const palette = palettes.find(item => item.id === id);
      if (!palette) return;
      draft = id;
      root.style.setProperty('--handle-top', palette.representative.top);
      root.style.setProperty('--handle-bottom', palette.representative.bottom);
      root.style.setProperty('--handle-life', palette.life.background);
      inputs.forEach(input => { input.checked = input.value === id; });
      const selectedInput = inputs.find(input => input.value === id);
      const option = selectedInput?.parentElement;
      const scroller = option?.parentElement;
      if (reveal && scroller) {
        const inset = parseFloat(getComputedStyle(scroller).paddingInlineStart) || 0;
        const left = option.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft;
        const right = left + option.offsetWidth;
        if (left < scroller.scrollLeft + inset) scroller.scrollLeft = Math.max(0, left - inset);
        else if (right > scroller.scrollLeft + scroller.clientWidth - inset) scroller.scrollLeft = right - scroller.clientWidth + inset;
      }
      choice.textContent = palette.name;
      values.textContent = `대표 ${palette.representative.top} → ${palette.representative.bottom} · 라이프 ${palette.life.background} · 아바타는 기존 선택 유지`;
    };
    inputs.forEach(input => input.addEventListener('change', () => {
      if (!input.checked) return;
      preview(input.value, true);
      status.textContent = `${choice.textContent} 미리보기예요. 적용하기를 눌러 선택을 확정해보세요.`;
    }));
    root.querySelector('[data-profile-color-apply]').addEventListener('click', () => {
      applied = draft;
      status.textContent = `${choice.textContent} 컬러를 미리보기에 적용했어요. 실제 프로필은 저장되지 않아요.`;
    });
    root.querySelector('[data-profile-color-cancel]').addEventListener('click', () => {
      preview(applied, true);
      status.textContent = '변경을 취소하고 마지막으로 적용한 컬러로 돌아왔어요.';
    });
    preview(applied);
  });
})();
