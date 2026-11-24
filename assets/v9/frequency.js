/* A pair of ASCII signals becomes a Ditto mark. No network calls or automatic friendship. */
(function () {
  'use strict';
  var wrap = document.getElementById('h8-freq');
  var box = document.getElementById('h8Fq');
  var canvas = document.getElementById('h8FqC');
  if (!wrap || !box || !canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  var $ = function (id) { return document.getElementById(id); };
  var media = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = media.matches;
  var progress = reduced ? .98 : 0, eased = progress, visible = false, frameId = 0;
  var width = 0, height = 0, dpr = 1, cellX = 10, cellY = 13, fontSize = 11, columns = 0;
  var markCells = [], lastTime = 0, phase = 0, lastPaint = 0, activeStage = -1, lastEvent = -1, lastDay = -1;
  var cursor = { x: -1000, y: -1000 }, friendState = 'ready', lastOpen = false;
  var editing = false, panelMix = 0, acceptedAt = -1, sourceMap = Object.create(null), ribbonA = [], ribbonB = [];
  var clock = 0, markWidth = 0, markHeight = 0, markColumns = 0, markRows = 0;
  var stages = ['잔잔', '선명', '곧 열림', '열림'];
  var headlines = ['아직은, 서로 다른 신호.', '취향이 닿고, 이야기가 쌓여요.', '어느새, 같은 리듬으로.', '우리 사이, 친구 신청이 열렸어요.'];
  var palette = [[142,145,158], [43,196,168], [90,91,242], [170,74,244]];
  var color = palette[0].slice();
  var targets = [.035, .365, .665, .985];
  var buttons = Array.prototype.slice.call(document.querySelectorAll('#h8FqSt button'));
  var log = $('h8FqLog'), day = $('h8FqDay'), name = $('h8FqName'), say = $('h8FqSay');
  var request = $('h8FqEnd'), form = $('fq9Request'), sent = $('fq9Sent'), accepted = $('fq9Accepted');
  // Keep the mark dominant; the detailed request is opened intentionally.
  var launcher = document.createElement('div'); launcher.className = 'fq9-launcher';
  launcher.innerHTML = '<p>우리 사이, 마음을 전할 준비가 됐어요.</p><button type="button" id="fq9Begin">소라에게 친구 신청하기 <span aria-hidden="true">↗</span></button>';
  if (request && form) { request.insertBefore(launcher,form); form.hidden = true; }
  var events = [
    { at: 0, text: '지우라는 친구를 사이에 두고 처음 닿았어요.' },
    { at: .07, text: '하은이 그룹 대화에서 소라의 위젯을 디토했어요.' },
    { at: .23, text: '같은 방에서 좋아하는 음악 이야기를 나눴어요.' },
    { at: .39, text: '지우의 위젯에 나란히 댓글을 남겼어요.' },
    { at: .55, text: '서로의 말에 답하고, 반응을 주고받았어요.' },
    { at: .70, text: '지우의 생일에 만나 이야기를 이어 갔어요.' },
    { at: .84, text: '이제 애칭과 편지로 친구 신청을 보낼 수 있어요.' }
  ];
  var clamp = function (n, lo, hi) { return Math.max(lo == null ? 0 : lo, Math.min(hi == null ? 1 : hi, n)); };
  var smooth = function (a, b, x) { x = clamp((x - a) / (b - a)); return x * x * (3 - 2 * x); };
  var lerp = function (a, b, n) { return a + (b - a) * n; };
  var hex = function (c) { return 'rgb(' + c.map(function (n) { return Math.round(n); }).join(',') + ')'; };
  var LETTERS = 'ditto!';
  var MARK = ['M176.502 20.1889C176.502 20.1889 151.492 0.354846 97.6641 0C94.3642 19.1617 88.339 51.3127 81.3034 89.5053C79.088 54.665 59.1585 48.6326 48.2761 50.8924C21.3295 56.5046 -9.02822 106.398 2.52162 142.172C14.1642 178.236 66.5 169.869 87.9867 165.452C87.9497 165.34 87.9219 165.228 87.8848 165.125C87.4862 128.819 92.0468 78.7012 124.629 47.6988C139.08 33.9532 161.782 21.2254 176.511 20.1982L176.502 20.1889ZM67.0839 146.169C62.5604 151.146 52.4473 144.413 43.4095 132.572C24.8334 108.209 25.7047 80.905 39.1641 80.7369C46.45 80.6435 53.6153 86.1997 61.2256 109.106C65.7121 122.618 69.7906 143.181 67.0747 146.169H67.0839Z',
    'M153.996 156.046C151.332 158.734 147.415 158.93 145.465 153.751C144.379 150.849 141.687 144.093 134.633 134.976C130.845 130.077 123.716 122.659 119.186 114.046C114.332 104.817 113.375 99.5919 114.146 91.7629C115.158 81.6385 125.257 69.1251 139.33 69.993C164.012 71.514 162.165 103.922 162.165 103.922C162.165 103.922 176.803 73.0536 200.279 83.1595C213.209 88.7303 215.892 105.275 212.875 114.046C206.953 131.253 185 138.009 176.608 142.068C163.965 148.171 160.494 149.496 153.987 156.046H153.996Z'];

  function buildMark() {
    markCells = []; sourceMap = Object.create(null);
    var mobile = width <= 800;
    markHeight = mobile ? Math.min(width * .72, height * .34) : Math.min(480,height * .50);
    markWidth = markHeight * 214 / 204;
    markColumns = Math.round(markWidth / cellX); markRows = Math.round(markHeight / cellY);
    var stencil = document.createElement('canvas');
    stencil.width = markColumns * 4; stencil.height = markRows * 4;
    var sc = stencil.getContext('2d');
    sc.scale(stencil.width / 214, stencil.height / 204); sc.fillStyle = '#000';
    if (window.Path2D) MARK.forEach(function (path) { sc.fill(new Path2D(path)); });
    sc.beginPath(); sc.arc(141.594,187.204,16.75,0,Math.PI * 2); sc.fill();
    var pixels = sc.getImageData(0,0,stencil.width,stencil.height).data;
    for (var row = 0; row < markRows; row++) for (var col = 0; col < markColumns; col++) {
      var coverage = 0;
      for (var yy = 0; yy < 4; yy++) for (var xx = 0; xx < 4; xx++) coverage += pixels[((row * 4 + yy) * stencil.width + col * 4 + xx) * 4 + 3];
      if (coverage / (16 * 255) > .38) markCells.push({ x: (col - markColumns / 2 + .5) * cellX, y: (row - markRows / 2 + .5) * cellY, row: row, col: col });
    }
    // A bijective assignment makes each symbol letter an existing letter in a ribbon.
    // No randomly appearing points: the source cell is removed only when it travels.
    var total = columns * 14, occupied = Object.create(null);
    var ordered = markCells.slice().sort(function(a,b) { return a.col - b.col || a.row - b.row; });
    ordered.forEach(function (cell,i) {
      var side = cell.row < markRows * .5 ? 0 : 1;
      var source = side * columns * 7 + (cell.row % 7) * columns + Math.floor(i / ordered.length * columns);
      while (occupied[source]) source = (source + 1) % total;
      occupied[source] = true;
      cell.source = source; cell.side = source >= columns * 7 ? 1 : 0;
      cell.column = source % columns; cell.band = Math.floor(source / columns) % 7 - 3;
      cell.letter = LETTERS[(cell.row + cell.col) % 6];
      cell.delay = (Math.abs(cell.column / columns - .5) * .12) + (cell.row / markRows) * .08;
      sourceMap[source] = cell;
    });
  }

  function resize() {
    var rect = box.getBoundingClientRect();
    width = rect.width; height = rect.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cellX = width <= 800 ? 6.5 : 9; cellY = width <= 800 ? 9 : 12; fontSize = width <= 800 ? 9 : 12;
    columns = Math.ceil(width / cellX);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    buildMark(); readScroll(); draw(performance.now());
  }

  function readScroll() {
    if (!reduced) {
      var rect = wrap.getBoundingClientRect();
      var distance = Math.max(1, wrap.offsetHeight - box.offsetHeight);
      progress = clamp(-rect.top / distance);
    }
    if (!frameId && visible && !reduced) frameId = requestAnimationFrame(tick);
  }

  function updateContent(p) {
    var stage = p < .25 ? 0 : p < .52 ? 1 : p < .82 ? 2 : 3;
    if (stage !== activeStage) {
      activeStage = stage;
      box.style.setProperty('--fq9-color', hex(palette[stage]));
      if (name) name.textContent = stages[stage];
      if (say) say.textContent = headlines[stage];
      buttons.forEach(function (button, i) { button.setAttribute('aria-pressed', String(i === stage)); });
    }
    var n = 1 + Math.round(p * 20);
    if (n !== lastDay) { lastDay = n; if (day) day.textContent = n + '일째'; }
    var event = 0;
    events.forEach(function (e, i) { if (p >= e.at) event = i; });
    if (event !== lastEvent) {
      lastEvent = event;
      if (log && log.firstElementChild) log.firstElementChild.textContent = events[event].text;
    }
    var open = p >= .945;
    if (open !== lastOpen) {
      lastOpen = open;
      box.classList.toggle('is-open', open);
      if (request) request.hidden = !open;
      if (!open) box.classList.remove('has-accepted');
      else box.classList.toggle('has-accepted',friendState === 'accepted');
    }
  }

  function waveY(x, second, sync) {
    var mobile = width <= 800;
    var center = height * (mobile ? .435 : .43);
    var separation = height * (mobile ? .108 : .122) * (1 - sync);
    var frequency = lerp(second ? 1.48 : .92, 1.16, sync);
    var angle = x / width * Math.PI * 2 * frequency - phase + (second ? (1 - sync) * 1.45 : 0);
    var amplitude = height * (mobile ? .066 : .082);
    var y = center + (second ? separation : -separation) + Math.sin(angle) * amplitude;
    y += Math.sin(angle * 2 + (second ? 1.2 : 0)) * amplitude * .16 * (1 - sync);
    if (!reduced && cursor.x > -500) {
      var distance = (x - cursor.x) / (mobile ? 85 : 160);
      y += clamp(cursor.y - y,-70,70) * Math.exp(-distance * distance) * .26;
    }
    return y;
  }
  function pulseAt(u, second) {
    var head = reduced ? (second ? .58 : .42) : (phase * .15 + (second ? .42 : 0)) % 1;
    if (second) head = 1 - head;
    var distance = u - head;
    var front = Math.exp(-Math.pow(distance / .038,2));
    var trail = Math.exp(-Math.pow((distance + (second ? -.065 : .065)) / .09,2)) * .34;
    return Math.min(1,front + trail);
  }
  function pointOnRibbon(column,side,band,sync) {
    var x = (column + .5) * cellX;
    var angle = column / columns * Math.PI * 2 - phase * .55;
    var thickness = .82 + .24 * Math.cos(angle + (side ? Math.PI : 0));
    var y = (side ? ribbonB[column] : ribbonA[column]) + band * cellY * thickness;
    return {x:x,y:y};
  }
  function draw(now) {
    if (!width || !height) return;
    var delta = clamp((now - lastTime) / 1000,0,.045); lastTime = now;
    if (!reduced) { phase += delta * .72; clock += delta; }
    var ease = reduced ? 1 : 1 - Math.exp(-delta * 13);
    eased += (progress - eased) * ease;
    if (Math.abs(eased - progress) < .0001) eased = progress;
    panelMix += ((editing ? 1 : 0) - panelMix) * (reduced ? 1 : 1 - Math.exp(-delta * 8));
    var p = eased;
    updateContent(p);
    color = color.map(function (c,i) { return lerp(c,palette[activeStage][i],reduced ? 1 : .10); });
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,width,height);
    ctx.font = '600 ' + fontSize + 'px ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var mobile = width <= 800, sync = smooth(.035,.69,p), transport = smooth(.68,.945,p);
    var waveAlpha = 1 - smooth(.72,.92,p);
    for (var c = 0; c < columns; c++) {
      var x = (c + .5) * cellX;
      ribbonA[c] = waveY(x,false,sync); ribbonB[c] = waveY(x,true,sync);
    }
    // Only the shared coordinate field stays still; the message travels inside each ribbon.
    ctx.fillStyle = '#65546F'; ctx.globalAlpha = .16;
    for (var gy = height * .20; gy < height * .66; gy += cellY * 4) {
      for (var gx = cellX * 2; gx < width; gx += cellX * 5) ctx.fillRect(gx,gy,1,1);
    }
    var ribbonColors = [hex(color.map(function (c) { return lerp(c,245,.14); })),hex(color.map(function (c) { return lerp(c,245,.43); }))];
    if (waveAlpha > .001) {
      for (var side = 0; side < 2; side++) for (c = 0; c < columns; c++) {
        var u = c / columns, edge = smooth(0,.045,u) * (1 - smooth(.955,1,u)), pulse = pulseAt(u,side);
        for (var band = -3; band <= 3; band++) {
          var source = side * columns * 7 + (band + 3) * columns + c;
          if (sourceMap[source]) continue;
          var dist = Math.abs(band), point = pointOnRibbon(c,side,band,sync);
          var letter = dist < 2 ? LETTERS[(c + band + 12) % 6] : dist === 2 ? (c % 2 ? '+' : ':') : '.';
          ctx.fillStyle = pulse > .48 && dist < 2 ? '#F3F3F3' : ribbonColors[side];
          ctx.globalAlpha = [1,.75,.40,.18][dist] * edge * waveAlpha * (.78 + pulse * .22);
          ctx.fillText(letter,point.x,point.y);
        }
      }
    }
    // All symbol letters retain a persistent source in one of the two signal ribbons.
    // Their curved paths first converge, then settle into the exact Ditto silhouette.
    var centerX = width * (mobile ? .5 : lerp(.5,.335,panelMix));
    var centerY = height * (mobile ? lerp(.39,height < 760 ? .31 : .295,panelMix) : .42);
    var finalScale = mobile ? lerp(1,height < 760 ? .54 : .70,panelMix) : lerp(1,.91,panelMix);
    var age = friendState === 'accepted' ? (reduced ? 10 : clock - acceptedAt) : -1;
    var gesture = age >= 0 && age < 1.3 ? Math.sin(Math.PI * age / 1.3) : 0;
    var acceptedMix = friendState === 'accepted' ? (reduced ? 1 : smooth(0,.8,age)) : 0;
    var scale = finalScale * (1 + gesture * .045);
    var markGradient = ctx.createLinearGradient(centerX - markWidth * .5,centerY - markHeight * .5,centerX + markWidth * .5,centerY + markHeight * .5);
    markGradient.addColorStop(0,hex([170,74,244].map(function(c,i) { return lerp(c,[250,151,226][i],acceptedMix * .3); })));
    markGradient.addColorStop(1,'#FA97E2');
    ctx.font = '600 ' + (fontSize * lerp(1,scale,transport)) + 'px ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';
    markCells.forEach(function (cell) {
      var sourcePoint = pointOnRibbon(cell.column,cell.side,cell.band,sync);
      var moving = smooth(cell.delay,Math.min(1,cell.delay + .81),transport);
      var targetX = centerX + cell.x * scale, targetY = centerY + cell.y * scale;
      var controlX = lerp(sourcePoint.x,centerX,.64);
      var controlY = lerp(sourcePoint.y,centerY,.55) + (cell.side ? 1 : -1) * height * .10;
      var t = moving, it = 1 - t;
      var px = it * it * sourcePoint.x + 2 * it * t * controlX + t * t * targetX;
      var py = it * it * sourcePoint.y + 2 * it * t * controlY + t * t * targetY;
      var pulse = pulseAt(cell.column / columns,cell.side);
      var edge = smooth(0,.045,cell.column / columns) * (1 - smooth(.955,1,cell.column / columns));
      ctx.fillStyle = moving > .12 ? markGradient : (pulse > .5 ? '#F3F3F3' : ribbonColors[cell.side]);
      var sourceAlpha = [1,.75,.40,.18][Math.abs(cell.band)] * edge;
      ctx.globalAlpha = lerp(sourceAlpha,.94,moving);
      if (age >= 0 && age < 1.2 && moving > .95) {
        var sweep = Math.exp(-Math.pow((cell.col / markColumns - age / 1.2) / .13,2));
        if (sweep > .48) ctx.fillStyle = '#FBE5F6';
      }
      ctx.fillText(cell.letter,px,py);
    });
    // An exchange reaches the meeting point. This connector becomes quiet after acceptance.
    if (sync > .4 && transport < .5) {
      var meetAlpha = smooth(.4,.82,sync) * (1 - smooth(.1,.5,transport));
      ctx.fillStyle = '#F3F3F3';
      for(c = 0; c < columns; c++) {
        var proximity = Math.abs(ribbonA[c] - ribbonB[c]);
        var both = Math.min(pulseAt(c / columns,0),pulseAt(c / columns,1));
        if (proximity > cellY * 2 || both < .12) continue;
        ctx.globalAlpha = (1 - proximity / (cellY * 2)) * meetAlpha * (.4 + both * .6);
        ctx.fillText(LETTERS[c % 6],(c + .5) * cellX,(ribbonA[c] + ribbonB[c]) / 2);
      }
    }
    if (transport > .97) {
      var captionY = centerY + markHeight * scale * .5 + (mobile ? 22 : 28);
      ctx.fillStyle = friendState === 'accepted' ? '#FA97E2' : '#D8C8E4'; ctx.globalAlpha = smooth(.97,1,transport);
      ctx.font = '500 ' + (mobile ? 10 : 12) + 'px "Pretendard Variable", Pretendard, sans-serif';
      ctx.fillText(friendState === 'accepted' ? '소라 + 하은  /  이제 서로 친구예요' : '소라 + 하은  /  같은 리듬이 되었어요',centerX,captionY);
    }
    ctx.globalAlpha = 1;
  }

  function tick(now) {
    frameId = 0;
    if (!visible || reduced || document.hidden) return;
    if (now - lastPaint >= 15) { draw(now); lastPaint = now; }
    frameId = requestAnimationFrame(tick);
  }

  function selectStage(index) {
    if (reduced) { progress = targets[index]; eased = progress; draw(performance.now()); return; }
    var top = wrap.getBoundingClientRect().top + window.scrollY;
    var distance = Math.max(1,wrap.offsetHeight - box.offsetHeight);
    window.scrollTo({ top: top + distance * targets[index], behavior: 'smooth' });
  }
  buttons.forEach(function (button,index) {
    button.addEventListener('click',function () { selectStage(index); });
    button.addEventListener('keydown',function (event) {
      var next;
      if (event.key === 'ArrowRight') next = (index + 1) % 4;
      if (event.key === 'ArrowLeft') next = (index + 3) % 4;
      if (next == null) return;
      event.preventDefault(); buttons[next].focus(); selectStage(next);
    });
  });
  if ($('fq9Begin')) $('fq9Begin').addEventListener('click',function () {
    editing = true; request.classList.add('is-editing'); box.classList.add('is-editing');
    launcher.hidden = true; form.hidden = false;
    $('fq9Nickname').focus({preventScroll:true}); draw(performance.now());
  });
  if (form) form.addEventListener('submit',function (event) {
    event.preventDefault(); friendState = 'sent';
    var nickname = $('fq9Nickname').value.trim(), letter = $('fq9Letter').value.trim();
    $('fq9SentLetter').textContent = (nickname ? '“' + nickname + '”라고 부르고 싶어요. ' : '') + (letter || '앞으로 더 자주 이야기해요.');
    form.hidden = true; sent.hidden = false; accepted.hidden = true; $('fq9Reset').hidden = false;
    $('fq9Accept').focus({preventScroll:true}); draw(performance.now());
  });
  if ($('fq9Accept')) $('fq9Accept').addEventListener('click',function () {
    friendState = 'accepted'; acceptedAt = clock; sent.hidden = true; accepted.hidden = false;
    box.classList.add('has-accepted');
    accepted.setAttribute('role','status'); $('fq9Reset').focus({preventScroll:true}); draw(performance.now());
  });
  if ($('fq9Reset')) $('fq9Reset').addEventListener('click',function () {
    friendState = 'ready'; editing = false; acceptedAt = -1; form.hidden = true; sent.hidden = true; accepted.hidden = true; this.hidden = true;
    launcher.hidden = false; request.classList.remove('is-editing'); box.classList.remove('is-editing','has-accepted');
    $('fq9Begin').focus({preventScroll:true}); draw(performance.now());
  });
  box.addEventListener('pointermove',function (event) {
    if (event.pointerType !== 'mouse') return;
    var rect = box.getBoundingClientRect(); cursor.x = event.clientX - rect.left; cursor.y = event.clientY - rect.top;
  });
  box.addEventListener('pointerleave',function () { cursor.x = cursor.y = -1000; });
  window.addEventListener('scroll',readScroll,{passive:true});
  window.addEventListener('resize',resize);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible) { lastTime = performance.now(); readScroll(); draw(lastTime); if (!reduced && !frameId) frameId = requestAnimationFrame(tick); }
    else if (frameId) { cancelAnimationFrame(frameId); frameId = 0; }
  },{threshold:0}).observe(box);
  else { visible = true; frameId = requestAnimationFrame(tick); }
  document.addEventListener('visibilitychange',function () {
    if (document.hidden) { cancelAnimationFrame(frameId); frameId = 0; }
    else if (visible) { lastTime = performance.now(); if (!reduced && !frameId) frameId = requestAnimationFrame(tick); }
  });
  function motionPreference(event) {
    reduced = event.matches; cancelAnimationFrame(frameId); frameId = 0;
    if (reduced) progress = .985;
    resize();
    if (!reduced && visible) frameId = requestAnimationFrame(tick);
  }
  if (media.addEventListener) media.addEventListener('change',motionPreference);
  else if (media.addListener) media.addListener(motionPreference);
  resize();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { draw(performance.now()); });
})();
