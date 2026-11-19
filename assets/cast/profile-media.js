(() => {
  const board = document.getElementById('board');
  const dialog = document.getElementById('clip');
  const screen = dialog.querySelector('.screen');
  const source = dialog.querySelector('footer a');
  const audio = document.querySelector('audio');

  function openVideo(data) {
    audio?.pause();
    const frame = document.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/' + data.ytId + '?playsinline=1&autoplay=1';
    frame.title = data.title;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture';
    frame.allowFullscreen = true;
    const music = data.url?.startsWith('https://music.youtube.com/');
    source.href = music ? data.url : 'https://www.youtube.com/watch?v=' + data.ytId;
    source.textContent = music ? 'YouTube Music에서 듣기' : 'YouTube에서 보기';
    source.hidden = false;
    dialog.classList.remove('reading');
    dialog.setAttribute('aria-label', data.title);
    screen.replaceChildren(frame);
    dialog.showModal();
  }

  function openPost(data) {
    const title = document.createElement('h2');
    const body = document.createElement('p');
    title.textContent = data.title;
    body.textContent = data.text;
    source.hidden = true;
    dialog.classList.add('reading');
    dialog.setAttribute('aria-label', data.title);
    screen.replaceChildren(title, body);
    dialog.showModal();
  }

  for (const widget of profile.widgets) {
    const tile = board.querySelector('[data-id="' + widget.id + '"]');
    if (!tile) continue;
    const {kind, data} = widget;
    let control;
    if ((kind === 'social' && data.url) || data.sourceURL) {
      control = document.createElement('a');
      control.href = data.sourceURL || data.url;
      control.target = '_blank';
      control.rel = 'noopener noreferrer';
      control.setAttribute('aria-label', data.sourceURL ? data.title + ' 원본 보기' : data.label + ' 인스타그램 보기');
    } else if ((kind === 'music' || kind === 'video') && data.ytId) {
      control = document.createElement('button');
      control.type = 'button';
      control.setAttribute('aria-label', data.title + ' 영상 재생');
      control.addEventListener('click', () => openVideo(data));
    } else if (kind === 'block' && data.text) {
      control = document.createElement('button');
      control.type = 'button';
      control.setAttribute('aria-label', data.title + ' 전문 읽기');
      control.addEventListener('click', () => openPost(data));
    } else continue;
    control.className = 'media-hit';
    tile.append(control);
  }
  dialog.querySelector('button').addEventListener('click', () => {
    screen.replaceChildren();
    dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (!dialog.open) screen.replaceChildren();
  });
})();
