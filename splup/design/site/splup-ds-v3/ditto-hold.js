(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.SplupDittoHold = api; api.mount(root.document, root); }
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  function createController({ duration = 3000, now, frame, cancelFrame, commit, onChange }) {
    let state = 'idle', started = 0, progress = 0, request = null, generation = 0;
    const emit = () => onChange({ state, progress, remaining: Math.max(0, duration - (now() - started)) });
    const stop = () => { if (request !== null) cancelFrame(request); request = null; };
    function submit() {
      if (state !== 'holding') return;
      stop(); state = 'pending'; progress = 1; emit();
      const ticket = ++generation;
      Promise.resolve().then(commit).then(() => {
        if (ticket !== generation) return;
        state = 'complete'; emit();
      }, () => { if (ticket === generation) { state = 'error'; progress = 0; emit(); } });
    }
    function tick() {
      if (state !== 'holding') return;
      progress = Math.min(1, (now() - started) / duration);
      if (progress >= 1) submit();
      else { emit(); request = frame(tick); }
    }
    function cancel() {
      if (state !== 'holding') return false;
      stop(); state = 'cancelled'; progress = 0; emit(); return true;
    }
    return {
      start() {
        if (!['idle', 'cancelled', 'error'].includes(state)) return false;
        state = 'holding'; started = now(); progress = 0; emit(); request = frame(tick); return true;
      },
      release() {
        if (state !== 'holding') return;
        if (now() - started >= duration) submit(); else cancel();
      },
      cancel,
      confirmAlternative() { if (['idle', 'cancelled', 'error'].includes(state)) { state = 'holding'; submit(); } },
      reset() { if (state === 'pending') return false; stop(); generation++; state = 'idle'; progress = 0; emit(); return true; },
      get state() { return state; },
      get progress() { return progress; }
    };
  }
  function mount(doc, win) {
    const buttons = [...doc.querySelectorAll('[data-ditto-hold]')];
    const controllers = [], inputResets = new Map();
    let active = null;
    const duration = win.SPLUP_COLOR_SYSTEM.dittoButton.hold.durationMs;
    function confirmation(controller) {
      const dialog = doc.createElement('dialog');
      dialog.className = 'cs-ditto-confirm';
      dialog.innerHTML = '<h2>내 플래터에 가져올까요?</h2><p>길게 누르는 대신 여기서 선택할 수 있어요. 이 화면은 체험용이에요.</p><form method="dialog"><button value="cancel" autofocus>취소</button><button value="confirm">디토하기</button></form>';
      doc.body.append(dialog);
      dialog.addEventListener('close', () => { if (dialog.returnValue === 'confirm') controller.confirmAlternative(); dialog.remove(); }, { once: true });
      dialog.showModal();
    }
    buttons.forEach(button => {
      const label = button.querySelector('[data-ditto-label]');
      const status = doc.getElementById(button.getAttribute('aria-describedby'));
      let pointer = null, key = null, origin = null, lastState = '', suppressClickUntil = 0;
      const now = () => win.performance.now();
      const controller = createController({ duration, now,
        frame: fn => win.requestAnimationFrame(fn), cancelFrame: id => win.cancelAnimationFrame(id),
        commit: () => new Promise(resolve => win.setTimeout(resolve, 650)),
        onChange({ state, progress, remaining }) {
          button.dataset.holdState = state;
          // Elapsed time changes the whole material, never a directional fill.
          const eased = progress * progress * (3 - 2 * progress);
          const pressure = state === 'holding' ? .12 + .46 * eased : state === 'pending' ? .58 : 0;
          button.style.setProperty('--pressure', pressure.toFixed(4));
          const busy = state === 'pending', done = state === 'complete';
          button.disabled = busy || done;
          button.setAttribute('aria-busy', String(busy));
          label.textContent = state === 'holding' ? `계속 누르세요 · ${Math.max(1, Math.ceil(remaining / 1000))}초`
            : busy ? '가져오는 중…' : done ? '내 플래터에 담았어요' : state === 'error' ? '다시 시도 · 3초간 누르기' : '내 플래터에 디토하기';
          if (state !== lastState && status) status.textContent = {
            idle: '3초간 꾸욱 누르세요. 떼면 취소돼요.', holding: '떼면 취소돼요.', cancelled: '취소했어요. 다시 3초간 누를 수 있어요.',
            pending: '가져오기를 요청했어요.', complete: '체험 완료! 실제 위젯은 저장되지 않았어요.', error: '가져오지 못했어요. 다시 시도해주세요.'
          }[state];
          lastState = state;
        }
      });
      controllers.push(controller);
      function begin() { if (active && active !== controller) { active.cancel(); inputResets.get(active)?.(); } active = controller; return controller.start(); }
      function clearInput() {
        const old = pointer; pointer = null; key = null; origin = null;
        if (old !== null && button.hasPointerCapture?.(old)) button.releasePointerCapture(old);
      }
      inputResets.set(controller, clearInput);
      button.addEventListener('pointerdown', e => {
        if (!e.isPrimary || e.button !== 0 || pointer !== null || key !== null || button.disabled) return;
        e.preventDefault(); button.focus({ preventScroll: true });
        if (!begin()) return;
        pointer = e.pointerId; origin = { x: e.clientX, y: e.clientY }; suppressClickUntil = now() + duration + 1000;
        button.setPointerCapture?.(pointer);
      });
      button.addEventListener('pointermove', e => {
        if (e.pointerId !== pointer) return;
        const r = button.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom || (e.pointerType === 'touch' && Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>12)) { controller.cancel(); clearInput(); }
      });
      button.addEventListener('pointerup', e => { if (e.pointerId === pointer) { controller.release(); clearInput(); } });
      button.addEventListener('pointerleave', () => { if (pointer !== null) { controller.cancel(); clearInput(); } });
      button.addEventListener('pointercancel', () => { controller.cancel(); clearInput(); });
      button.addEventListener('lostpointercapture', () => { if (pointer !== null) { controller.cancel(); clearInput(); } });
      button.addEventListener('keydown', e => {
        if (e.key === 'Escape') { controller.cancel(); clearInput(); return; }
        if (![' ', 'Enter'].includes(e.key)) return;
        e.preventDefault();
        if (e.repeat || key !== null || pointer !== null || button.disabled) return;
        key = e.key; suppressClickUntil = now() + duration + 1000; begin();
      });
      button.addEventListener('keyup', e => { if (e.key === key) { e.preventDefault(); controller.release(); clearInput(); } });
      button.addEventListener('blur', () => { controller.cancel(); clearInput(); });
      button.addEventListener('contextmenu', e => e.preventDefault());
      button.addEventListener('click', e => {
        e.preventDefault();
        if (e.detail === 0 && now() > suppressClickUntil && !button.disabled) confirmation(controller);
        else if (controller.state === 'idle' && status) status.textContent = '짧게 누르면 가져오지 않아요. 3초간 꾸욱 눌러주세요.';
      });
      controller.reset();
    });
    const cancelAll = () => controllers.forEach(c => { c.cancel(); inputResets.get(c)?.(); });
    doc.addEventListener('visibilitychange', () => { if (doc.hidden) cancelAll(); });
    win.addEventListener('pagehide', cancelAll);
    win.addEventListener('blur', cancelAll);
    doc.querySelector('[data-ditto-demo-reset]')?.addEventListener('click', () => controllers.forEach(c => { if (c.reset()) inputResets.get(c)?.(); }));
    return controllers;
  }
  return { createController, mount };
});
