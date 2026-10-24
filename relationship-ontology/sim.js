/* Ditto relationship simulation — two personas, 180 days.
   Closeness = shared hours that fade without contact (Hall 2018 thresholds: 50h casual friend · 90h friend · 200h close friend).
   Frequency = policy v2 (21-day window, caps, decay, three gates) between the persona and friends of friends. */
(function (root) {
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  const TYPES = {
    invite:   { kr: '친구 맺기', en: 'Befriend', c: '#07E7B4', pts: 0, min: 0 },
    ditto:    { kr: '디토', en: 'Ditto!', c: '#AA4AF4', pts: 3, min: 15 },
    group:    { kr: '그룹 대화', en: 'Group chat', c: '#48B5F4', pts: 2, min: 20 },
    comment:  { kr: '댓글', en: 'Comment', c: '#FF2CBF', pts: 1.5, min: 6 },
    guest:    { kr: '방명록', en: 'Guestbook', c: '#F9F871', pts: 1.5, min: 8 },
    reaction: { kr: '댓글 리액션', en: 'Reaction', c: '#FF925D', pts: .5, min: 1 },
    visit:    { kr: '방문', en: 'Visit', c: '#D9D2E6', pts: .3, min: 2 }
  };
  const CAP = { visit: 2, reaction: 2, comment: 6, group: 8 };
  const LEVELS = [
    { k: 'none', kr: '모르는 사이', min: -1 },
    { k: 'acq', kr: '아는 사이', min: 0 },
    { k: 'casual', kr: '가벼운 친구', min: 50 },
    { k: 'friend', kr: '친구', min: 90 },
    { k: 'close', kr: '가까운 친구', min: 200 }
  ];
  const level = (H, met) => !met ? 0 : H >= 200 ? 4 : H >= 90 ? 3 : H >= 50 ? 2 : 1;
  const DECAY = .0012; // per day: closeness fades slowly without contact (about a quarter a year)

  // 이/가, 과/와, 을/를 after a Korean name
  const jong = w => { const c = w.charCodeAt(w.length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };
  const J = (w, a, b) => w + (jong(w) ? a : b);
  const AV = ['purple-pink', 'deep-purple', 'pink-coral', 'peach-yellow', 'cyan-blue', 'mint-lime', 'coral-red', 'gold-yellow', 'lime-green', 'neutral-gray'];

  /* ---------------- personas ----------------
     person: [id, name, ctx, H0, offline h/week (semester), inviteDay | null, affinity, extra]
     fof:    [id, name, via[], taste, age, widget] */
  const PERSONAS = {
    uni: {
      key: 'uni', label: '대학교 1학년', me: { n: '채원', h: 'chaewon.frame', av: 'purple-pink', age: 19 },
      bio: '19 · 시각디자인과 26학번 · 대전에서 올라와 기숙사 2인실',
      type: 'Curator · 취향이 분명한 사람',
      start: '2026-03-03',
      before: '고등학교 친구들은 다른 지역 대학으로 흩어졌고 카톡만 가끔 해요. 과 단톡방 52명 중 이름을 아는 사람은 OT 조 여섯 명뿐이고, 인스타 맞팔 37명과는 DM을 해 본 적이 없어요.',
      pain: '“단톡방은 공지만 오가고 인스타는 보여 주기라, 누가 나랑 맞는지 알 계기가 없어요.”',
      habit: '하루 두세 번 앱을 열고, 일주일에 두세 번 필름 사진·전시 티켓·플레이리스트를 바꿔 붙여요.',
      widgets: ['🎞 첫 롤 36컷', '🎧 기숙사 새벽 플리', '🎫 이번 주 전시', '☕ 학관 2층 창가'],
      phases: [[0, 41, '개강', 'sem'], [42, 53, '중간고사', 'exam'], [54, 69, '봄 학기', 'sem'], [70, 72, '축제', 'fest'], [73, 97, '봄 학기', 'sem'], [98, 109, '기말고사', 'exam'], [110, 180, '여름방학', 'vac']],
      groups: { dept: '26학번 시각디자인', club: '사진 동아리 빛틈', course: '교양 ‘영화의 이해’ 3조', home: '대전 고교 친구들' },
      ctx: {
        home:   { kr: '고등학교 친구', sem: 1, vac: 1, group: 'home' },
        dorm:   { kr: '룸메이트', sem: 1, vac: 0, group: null },
        ot:     { kr: 'OT 조 동기', sem: 1, vac: .1, group: 'dept' },
        dept:   { kr: '과 동기', sem: 1, vac: .05, group: 'dept' },
        club:   { kr: '동아리 빛틈', sem: 1, vac: .35, group: 'club', from: 10 },
        course: { kr: '교양 조별 과제', sem: 1, vac: 0, group: 'course', from: 20, until: 62 }
      },
      vacHome: 3, // hours a week with home friends once she goes back to 대전 for the summer
      people: [
        ['yuna', '유나', 'home', 260, 0.5, 1, .9, { note: '고등학교 3년 단짝. 지금은 대전에 남아 다른 대학에 다녀요.' }],
        ['jihyun', '지현', 'home', 120, .2, 2, .6],
        ['soyun', '소윤', 'home', 110, .2, 4, .55],
        ['taeo', '태오', 'home', 90, .15, 9, .45],
        ['daeun', '다은', 'dorm', 2, 9, 3, .7, { note: '타과 룸메이트. 처음엔 인사만 하는 사이였어요.' }],
        ['seojin', '서진', 'ot', 4, 6, 0, .85, { note: 'OT 조에서 만난 동기. 채원에게 첫 초대장을 보낸 사람이에요.' }],
        ['minho', '민호', 'ot', 3, 4, 6, .6],
        ['gaeun', '가은', 'ot', 3, 5, 7, .75],
        ['junhyuk', '준혁', 'ot', 3, 3, 15, .5],
        ['yerin', '예린', 'dept', 1, 2, 21, .55],
        ['dokyung', '도경', 'dept', 1, 1.5, 28, .5],
        ['sua', '수아', 'dept', 1, 2.5, 36, .6],
        ['hyunwoo', '현우', 'dept', 1, 1.5, 71, .45],
        ['jiho', '지호', 'dept', 1, 3.5, 99, .55, { note: '기말 스터디에서 처음 제대로 이야기했어요.' }],
        ['nayeon', '나연', 'dept', 1, .8, null, .3],
        ['haram', '하람', 'dept', 1, .6, null, .3],
        ['eunchae', '은채', 'club', 0, 3, 14, .8, { note: '동아리 3학년 선배.' }],
        ['woojin', '우진', 'club', 0, 4, 18, .7],
        ['sieun', '시은', 'club', 0, 4.5, 24, .75],
        ['taerin', '태린', 'club', 0, 3, 31, .6],
        ['mingyeol', '민결', 'club', 0, 2.5, 128, .5, { note: '방학 출사에서 친해졌어요.' }],
        ['jungwon', '정원', 'course', 0, 4, 38, .6],
        ['bomi', '보미', 'course', 0, 4, 55, .65]
      ],
      fof: [
        ['hayul', '하율', ['seojin'], .97, 19, '📖 오늘 밑줄 친 문장', { note: '서진의 고등학교 친구, 국문과. 채원과는 한 번도 만난 적 없어요.' }],
        ['chaerin', '채린', ['eunchae'], .9, 21, '🖼 암실 테스트 컷'],
        ['yunseul', '윤슬', ['gaeun'], .85, 19, '🌊 한강 산책 기록'],
        ['raon', '라온', ['taerin'], .8, 20, '🎹 연습실 녹음'],
        ['ria', '리아', ['yuna'], .78, 19, '🍰 대전 빵집 지도'],
        ['jian', '지안', ['woojin', 'sieun'], .75, 20, '📷 필름 스캔 실패작', { grp: '동아리 연합 출사 모임', note: '다른 학교 사진 동아리. 연합 출사 그룹에서 같이 대화해요.' }],
        ['soi', '소이', ['jungwon'], .7, 20, '🎬 이번 주 본 영화'],
        ['dain', '다인', ['sieun'], .68, 19, '🌱 창틀 화분'],
        ['hajin', '하진', ['seojin', 'minho'], .62, 19, '🏸 배드민턴 동호회', { grp: '서진이 만든 배드민턴 그룹' }],
        ['yeonwoo', '연우', ['bomi'], .6, 21, '📐 모형 만드는 밤'],
        ['sungmin', '성민', ['daeun'], .55, 19, '🎮 오늘의 랭크'],
        ['yejun', '예준', ['jihyun'], .52, 19, '⚽ 조기축구'],
        ['juwon', '주원', ['woojin'], .5, 22, '🍜 학식 리뷰'],
        ['doha', '도하', ['minho'], .45, 19, '💪 헬스 기록'],
        ['seunga', '승아', ['yerin'], .45, 19, '💅 네일 아카이브'],
        ['hyunseo', '현서', ['soyun'], .4, 19, '📝 토익 D-30']
      ]
    },
    high: {
      key: 'high', label: '고등학교 1학년', me: { n: '시우', h: 'siwoo.on.air', av: 'cyan-blue', age: 16 },
      bio: '16 · 경기 ○○고 1학년 4반 · 방송부',
      type: 'Observer · 말수가 적고 오래 보는 사람',
      start: '2026-03-03',
      before: '중학교 친구 여섯 명 중 같은 고등학교에 온 건 두 명이고 둘 다 다른 반이에요. 반 단톡방 28명은 이름만 알고, 학원 친구 세 명은 학원에서만 봐요.',
      pain: '“새 반에서 먼저 말 거는 게 어려워요. 단톡에 말하면 다 읽고 아무도 답 안 할까 봐 부담돼요.”',
      habit: '쉬는 시간과 학원 끝나고 앱을 열어요. 방송부 BGM, 편집 중인 브이로그, 점심시간 농구 사진을 붙여요.',
      widgets: ['🎚 방송부 오프닝 BGM', '📼 편집 중인 브이로그', '🏀 점심시간 농구', '🍜 학원 끝나고 컵라면'],
      phases: [[0, 49, '새 학기', 'sem'], [50, 56, '중간고사', 'exam'], [57, 71, '1학기', 'sem'], [72, 72, '체육대회', 'fest'], [73, 111, '1학기', 'sem'], [112, 119, '기말고사', 'exam'], [120, 138, '1학기 끝', 'sem'], [139, 166, '여름방학', 'vac'], [167, 180, '2학기 개학', 'sem']],
      groups: { cls: '1학년 4반', club: '방송부', academy: '수학 학원 B반', middle: '○○중 친구들' },
      ctx: {
        middle:  { kr: '중학교 친구', sem: 1, vac: 1.6, group: 'middle' },
        mid_same:{ kr: '중학교 친구 · 같은 고등학교', sem: 1, vac: .8, group: 'middle' },
        cls:     { kr: '같은 반', sem: 1, vac: .08, group: 'cls' },
        club:    { kr: '방송부', sem: 1, vac: .3, group: 'club', from: 9 },
        academy: { kr: '학원 친구', sem: 1, vac: 1.5, group: 'academy' }
      },
      vacHome: 0,
      people: [
        ['doyoon', '도윤', 'mid_same', 230, 4, 1, .9, { note: '중학교 3년 단짝. 같은 고등학교 다른 반. 시우에게 초대장을 보냈어요.' }],
        ['gunwoo', '건우', 'mid_same', 120, 2.5, 3, .6],
        ['seojun', '서준', 'middle', 150, .3, 5, .75, { note: '다른 고등학교로 간 중학교 친구.' }],
        ['minjae', '민재', 'middle', 100, .2, 8, .5],
        ['harin', '하린', 'middle', 90, .2, 12, .6],
        ['jiyu', '지유', 'middle', 70, .15, 20, .55],
        ['taemin', '태민', 'cls', 0, 8, 9, .75, { note: '짝꿍. 처음 2주는 필기 빌려준 게 전부였어요.' }],
        ['eunho', '은호', 'cls', 0, 5, 15, .6],
        ['yujin', '유진', 'cls', 0, 4, 18, .65],
        ['sihyun', '시현', 'cls', 0, 3.5, 25, .55],
        ['daon', '다온', 'cls', 0, 3, 33, .55],
        ['jaehee', '재희', 'cls', 0, 2.5, 47, .5],
        ['subin', '수빈', 'cls', 0, 2.5, 73, .5, { note: '체육대회 계주에서 같은 조였어요.' }],
        ['yechan', '예찬', 'cls', 0, 2, 121, .45],
        ['hayoon', '하윤', 'cls', 0, 2, 150, .55, { note: '방학 중 반 단체 봉사활동에서 같은 조였어요.' }],
        ['nayun', '나윤', 'cls', 0, 1.5, null, .3],
        ['junseo', '준서', 'cls', 0, 1.5, null, .3],
        ['jiwon', '지원', 'club', 0, 3, 16, .8, { note: '방송부 2학년 선배.' }],
        ['haneul', '하늘', 'club', 0, 4, 21, .7],
        ['seoa', '서아', 'club', 0, 4, 27, .7],
        ['ijun', '이준', 'club', 0, 3, 44, .55],
        ['minseo', '민서', 'academy', 20, 3, 6, .7, { note: '중3 때부터 같은 학원. 다른 고등학교.' }],
        ['roun', '로운', 'academy', 0, 3, 26, .6],
        ['chaea', '채아', 'academy', 0, 3, 140, .55, { note: '방학 특강 반에서 옆자리.' }]
      ],
      fof: [
        ['harang', '하랑', ['seojun'], .97, 16, '🎛 새벽 비트 작업', { note: '서준의 새 고등학교 친구. 시우와는 학교도 동네도 달라요.' }],
        ['yuha', '유하', ['minseo'], .88, 16, '🎨 아이패드 낙서'],
        ['sea', '세아', ['jiwon'], .82, 17, '🎙 라디오 원고'],
        ['gaon', '가온', ['jiyu'], .78, 16, '📸 등굣길 하늘'],
        ['arin', '아린', ['harin'], .75, 16, '🎧 요즘 반복 재생'],
        ['yuna2', '윤아', ['haneul'], .7, 16, '🧁 베이킹 실패작', { grp: '하늘이 만든 주말 베이킹 그룹' }],
        ['jihu', '지후', ['taemin'], .68, 16, '🏀 3대3 농구'],
        ['taeha', '태하', ['roun'], .62, 16, '🎮 오늘 판'],
        ['sion', '시온', ['doyoon'], .58, 16, '🚲 자전거 코스'],
        ['soyul', '소율', ['yujin', 'sihyun'], .55, 16, '📒 다꾸 페이지', { grp: '유진이 만든 스터디 그룹', note: '옆 반. 유진·시현과 같은 스터디 그룹이에요.' }],
        ['danwoo', '단우', ['minjae'], .5, 16, '⚾ 야구 직관'],
        ['junyoung', '준영', ['gunwoo'], .45, 16, '🍕 급식 별점'],
        ['jeonghoon', '정훈', ['doyoon'], .5, 20, '🎓 대학 과제', { adult: true, note: '도윤의 형. 대학생.' }],
        ['suhyun', '수현', ['minseo', 'roun'], .4, 22, '📝 조교 공지', { adult: true, note: '학원 조교. 학생들과 앱 친구예요.' }]
      ]
    }
  };

  const ACT = { light: .55, normal: .8, active: 1 };

  function simulate(pk, opt) {
    opt = Object.assign({ activity: 'active', gate: 'v2', protect: true, conv: 1, days: 180, seed: 0 }, opt || {});
    const P = PERSONAS[pk], R = rng((pk === 'uni' ? 2603 : 2611) + (opt.seed || 0) * 7919), A = ACT[opt.activity];
    const phaseOf = d => P.phases.find(p => d >= p[0] && d <= p[1]) || P.phases[P.phases.length - 1];
    const people = {};
    const me = { id: 'me', n: P.me.n, h: P.me.h, av: P.me.av, me: true };
    P.people.forEach(([id, n, ctx, H0, hw, inv, aff, extra], i) => {
      people[id] = Object.assign({ id, n, ctx, H0, hw, inv, aff, kind: 'known', av: AV[(i * 3 + 1) % 10], met: H0 > 0 || P.ctx[ctx].from === undefined || false, widget: null }, extra || {});
    });
    P.fof.forEach(([id, n, via, taste, age, widget, extra], i) => {
      people[id] = Object.assign({ id, n, via, taste, age, widget, kind: 'fof', av: AV[(i * 7 + 4) % 10], H0: 0, hw: 0, aff: taste }, extra || {});
    });
    const ids = Object.keys(people);
    const dateOf = d => { const t = new Date(P.start + 'T00:00:00'); t.setDate(t.getDate() + d); return t; };

    // state
    ids.forEach(id => { const p = people[id]; Object.assign(p, { Hw: p.H0, Ho: p.H0, friend: false, fd: null, path: null, visible: false, vd: null, open: null, sent: null, firstDitto: null, meets: 0, firstMeet: null, hidden: !!(p.adult && opt.protect) }); });
    const EV = [], NOTE = [], MS = [];
    const snap = [];
    const PE = {}; ids.forEach(id => { PE[id] = []; });
    const add = (t, a, b, d, extra) => { const e = Object.assign({ t, a, b, d: d + R() * .9 }, extra || {}); EV.push(e); const o = a === 'me' ? b : a; if (PE[o]) PE[o].push(e); return e; };
    const ownWidget = id => id === 'me' ? P.widgets[Math.floor(R() * P.widgets.length)] : people[id].widget || P.widgets[Math.floor(R() * P.widgets.length)].replace(/^\S+/, '🖼');
    const note = (d, kind, text, who) => NOTE.push({ d, kind, text, who });
    const ms = (d, text, who) => { if (!MS.some(m => m.text === text)) MS.push({ d, text, who }); };
    const isFriend = (id, d) => people[id].friend && people[id].fd <= d;
    const nFriends = () => ids.filter(id => people[id].friend).length;

    function befriend(id, d, path) {
      const p = people[id]; p.friend = true; p.fd = d; p.path = path; p.visible = true; if (p.vd === null) p.vd = d;
      add('invite', path === 'invite' && p.inv === 0 ? id : 'me', path === 'invite' && p.inv === 0 ? 'me' : id, d, { how: path });
      const n = nFriends();
      if (path === 'invite') note(d, 'invite', p.inv === 0 ? `${p.n}님이 보낸 초대장으로 디토를 시작했어요` : `${p.n}님이 초대장을 받고 친구가 됐어요`, id);
      else note(d, 'accept', `${p.n}님과 친구가 됐어요. 디토로 처음 알게 된 사이예요`, id);
      if (path === 'freq' && !MS.some(m => m.k === 'firstFof')) MS.push({ d, k: 'firstFof', text: `친구의 친구였던 ${J(p.n, '과', '와')} 첫 친구가 됐어요`, who: id });
      [1, 5, 10, 15, 20, 25, 30].forEach(k => { if (n === k) MS.push({ d, k: 'n' + k, text: k === 1 ? `첫 친구 ${p.n}` : `친구 ${k}명`, who: id }); });
    }

    // frequency v2 for a friend of a friend, from the events between them and me
    function freq(id, d) {
      let score = 0; const by = {}, days = new Set(); let dIn = false, dOut = false, together = false, any = false;
      const L = PE[id];
      for (let i = L.length - 1; i >= 0; i--) {
        const e = L[i]; if (e.d > d + 1 || e.t === 'invite') continue;
        const age = d + 1 - e.d;
        if (e.t === 'ditto') { if (e.a === 'me') dOut = true; else dIn = true; any = true; }
        if (age >= 21 && e.t !== 'ditto') continue;
        const w = age < 7 ? 1 : age < 14 ? .6 : .3;
        by[e.t] = (by[e.t] || 0) + TYPES[e.t].pts * w;
        if (age < 21) days.add(Math.floor(e.d));
        if (age < 21 && (e.t === 'comment' || e.t === 'group')) together = true;
      }
      Object.keys(by).forEach(t => { if (CAP[t]) by[t] = Math.min(CAP[t], by[t]); score += by[t]; });
      if (dIn && dOut) { by.mutual = 2; score += 2; together = true; }
      if (Object.keys(by).filter(k => k !== 'mutual').length >= 3) { by.kinds = 1; score += 1; }
      const g = [score >= 10, days.size >= 4, together]; if (opt.gate === 'ditto') g.push(any);
      const left = g.filter(x => !x).length;
      const st = !left ? 'open' : left === 1 && together && ((!g[0] && 10 - score <= 2) || (!g[1] && days.size === 3)) ? 'near' : score >= 4 ? 'clear' : 'calm';
      return { score, days: days.size, together, ditto: any, mutual: dIn && dOut, g, st, by };
    }

    const lastSt = {};
    for (let d = 0; d <= opt.days; d++) {
      const ph = phaseOf(d), vac = ph[3] === 'vac', exam = ph[3] === 'exam', fest = ph[3] === 'fest';
      // invites from people met offline
      ids.forEach(id => { const p = people[id]; if (p.kind === 'known' && p.inv === d && !p.friend) befriend(id, d, 'invite'); });
      // friends of friends become visible once a friend links to them
      ids.forEach(id => { const p = people[id]; if (p.kind !== 'fof' || p.visible || p.hidden) return; if (p.via.some(v => isFriend(v, d))) { p.visible = true; p.vd = d; } });

      ids.forEach(id => {
        const p = people[id], c = p.kind === 'known' ? P.ctx[p.ctx] : null;
        // offline hours this day (same in both worlds)
        let off = 0;
        if (c) {
          const active = (c.from === undefined || d >= c.from) && (c.until === undefined || d <= c.until);
          if (active) { off = p.hw / 7 * (vac ? c.vac : exam ? .7 : fest ? 1.6 : c.sem); if (!p.met) p.met = true; }
          if (vac && P.vacHome && p.ctx === 'home' && d >= 112 && d <= 160) off = P.vacHome / 7;
        }
        let app = 0;
        const fr = isFriend(id, d);
        if (fr) {
          // daily life between friends on Ditto
          const k = A * (.35 + .65 * p.aff) * (vac ? .85 : exam ? .6 : 1);
          const roll = (pr, t, a, b, extra) => { if (R() < pr * k) { const e = add(t, a, b, d, extra); app += TYPES[t].min / 60; return e; } return null; };
          roll(.3, 'visit', 'me', id); roll(.3, 'visit', id, 'me');
          roll(.2, 'reaction', id, 'me'); roll(.14, 'reaction', 'me', id);
          const cm = roll(.12, 'comment', id, 'me', { title: ownWidget('me') }); roll(.1, 'comment', 'me', id, { title: ownWidget(id) });
          if (cm && R() < .25) note(d, 'comment', `${p.n}님이 ‘${cm.title}’에 댓글을 남겼어요`, id);
          const gb = roll(.035, 'guest', id, 'me'); if (gb && R() < .5) note(d, 'guest', `${p.n}님이 방명록에 글을 남겼어요`, id);
          if (c && c.group && (!vac || c.vac > .3)) roll(.26, 'group', 'me', id);
          // Ditto! is scarce: three slots, so a few a month across everyone
          const din = roll(.012 * (.5 + p.aff), 'ditto', id, 'me', { title: ownWidget('me') });
          if (din) note(d, 'dittoIn', `${p.n}님이 내 ‘${din.title}’ 위젯을 디토했어요`, id);
          roll(.009 * (.5 + p.aff), 'ditto', 'me', id, { title: ownWidget(id) });
          // friends who first met through Ditto start meeting in person
          if (p.path === 'freq') { const pm = (p.firstMeet ? (vac ? .05 : .1) : (vac ? .02 : .05)) * (.4 + p.aff) * Math.min(1, (d - p.fd + 3) / 14); if (R() < pm) { off += 2.5; p.meets++; if (!p.firstMeet) { p.firstMeet = d; note(d, 'meet', `디토로 알게 된 ${p.n}님과 처음 만났어요`, id); if (!MS.some(m => m.k === 'firstMeet')) MS.push({ d, k: 'firstMeet', text: `디토로 알게 된 ${J(p.n, '과', '와')} 처음 직접 만났어요`, who: id }); } } }
        } else if (p.kind === 'fof' && p.visible) {
          // strangers who share a friend: signals from the frequency policy, and Ditto as the door
          const sinceD = PE[id].filter(e => e.t === 'ditto').reduce((m, e) => Math.max(m, e.d), -99);
          const warm = d - sinceD < 21 ? 2.6 : 1, k = A * p.taste * warm * (vac ? .8 : 1);
          const roll = (pr, t, a, b, extra) => R() < pr * k ? add(t, a, b, d, extra) : null;
          roll(.1, 'visit', 'me', id); roll(.1, 'visit', id, 'me');
          roll(.05, 'reaction', 'me', id);
          roll(.035, 'comment', 'me', id, { co: p.via[0] });
          const dIn = roll(.011 * p.taste, 'ditto', id, 'me', { title: ownWidget('me') });
          if (dIn) { if (!p.firstDitto) p.firstDitto = d; note(d, 'dittoIn', `${p.n}님이 내 ‘${dIn.title}’ 위젯을 디토했어요 · ${p.via.map(v => people[v].n).join('·')}님의 친구`, id); if (!MS.some(m => m.k === 'firstFofDitto')) MS.push({ d, k: 'firstFofDitto', text: `처음 보는 ${J(p.n, '이', '가')} 내 위젯을 디토했어요`, who: id }); }
          const recip = sinceD > -99 && d - sinceD < 10 ? .09 : .006 * p.taste;
          const dOut = R() < recip * A ? add('ditto', 'me', id, d, { title: p.widget }) : null;
          if (dOut) { if (!p.firstDitto) p.firstDitto = d; note(d, 'dittoOut', `${p.n}님의 ‘${p.widget}’ 위젯을 디토했어요`, id); }
          // they may share a group chat when a mutual friend makes one
          if (p.grp && !vac && R() < .3 * A) add('group', 'me', id, d); else if (R() < .012 * k) add('group', 'me', id, d);
          app = 0;
          const f = freq(id, d); p.f = f;
          if (lastSt[id] !== f.st) {
            if (f.st === 'near') note(d, 'near', `${p.n}님과 곧 친구 신청이 열려요`, id);
            if (f.st === 'open' && !p.open) { p.open = d; note(d, 'open', `${p.n}님과 친구 신청이 열렸어요`, id); if (!MS.some(m => m.k === 'firstOpen')) MS.push({ d, k: 'firstOpen', text: `${J(p.n, '과', '와')} 주파수가 열렸어요`, who: id }); }
            lastSt[id] = f.st;
          }
          if (f.st === 'open' && !p.friend) {
            if (p.sent === null && R() < .45) { p.sent = d; note(d, 'sent', `${p.n}님에게 편지를 붙여 친구 신청을 보냈어요`, id); }
            if (p.sent !== null && d - p.sent >= 1 && R() < .6) befriend(id, d, 'freq');
          }
        }
        // closeness: with Ditto the app adds minutes; without it only offline hours count, and Ditto-only friends never meet
        const offW = off * opt.conv >= 0 ? off : 0;
        p.Hw = p.Hw * (1 - DECAY) + offW + app * opt.conv;
        p.Ho = p.Ho * (1 - DECAY) + (p.kind === 'known' ? (p.path === 'freq' ? 0 : off) : 0) - (p.meets && p.kind === 'fof' ? 0 : 0);
        if (p.kind === 'fof') p.Ho = 0;
      });

      // snapshot
      const friends = ids.filter(id => isFriend(id, d));
      const byH = friends.slice().sort((a, b) => people[b].Hw - people[a].Hw);
      const close15 = new Set(byH.slice(0, 15));
      const s = { d, phase: ph[2], p: {} };
      ids.forEach(id => { const p = people[id]; s.p[id] = { fr: isFriend(id, d), vis: p.visible && !p.hidden, cl: close15.has(id), Hw: p.Hw, Ho: p.Ho, lw: level(p.Hw, p.kind === 'fof' ? (p.Hw > .3 || isFriend(id, d)) : p.met), lo: level(p.Ho, p.kind === 'known' && p.met), st: p.f && !isFriend(id, d) ? p.f.st : null, sc: p.f && !isFriend(id, d) ? p.f.score : null }; });
      s.nFriends = friends.length; s.nInvite = friends.filter(id => people[id].path === 'invite').length; s.nFof = friends.length - s.nInvite;
      const lv = (key, k) => ids.filter(id => s.p[id][key] >= k).length;
      s.w = { casual: lv('lw', 2), friend: lv('lw', 3), close: lv('lw', 4) };
      s.o = { casual: lv('lo', 2), friend: lv('lo', 3), close: lv('lo', 4) };
      s.nVisibleFof = ids.filter(id => people[id].kind === 'fof' && s.p[id].vis && !s.p[id].fr).length;
      snap.push(s);
    }
    EV.sort((x, y) => x.d - y.d);
    NOTE.sort((x, y) => x.d - y.d);
    MS.sort((x, y) => x.d - y.d);
    // how each Ditto-made friendship happened
    const opened = ids.filter(id => people[id].open !== null);
    const stats = {
      opened: opened.length,
      openedWithDitto: opened.filter(id => EV.some(e => e.t === 'ditto' && e.d <= people[id].open + 1 && ((e.a === id && e.b === 'me') || (e.b === id && e.a === 'me')))).length,
      fofFriends: ids.filter(id => people[id].path === 'freq').length,
      hiddenAdults: ids.filter(id => people[id].hidden).length,
      dittos: EV.filter(e => e.t === 'ditto').length
    };
    return { P, me, people, ids, EV, NOTE, MS, snap, stats, dateOf, opt, TYPES, LEVELS };
  }

  root.DittoSim = { simulate, PERSONAS, TYPES, LEVELS, ACT, J };
})(typeof window !== 'undefined' ? window : globalThis);
