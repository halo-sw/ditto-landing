/* ditto.place v8 — the ten demo platters as data for DittoWidgets (assets/v8/platter-render.js).
 *
 * GENERATED — do not edit by hand. Source: demo/<handle>/index.html (scripts/platter.py output) plus, for the fields the
 * demo HTML does not carry (To-do items, post count, video ytId, music album/ytId, older guestbook entries),
 * the seed those demo accounts were made from. Positions and sizes are grid cells (8 columns, pitch 45.75 at 358).
 * Media stay where the demo pages keep them: /demo/<handle>/media/<file>. music.palette = the three stops the
 * Python renderer computed from the cover (no image analysis in the browser).
 *
 * window.DITTO_PLATTERS = { <handle>: { name, handle, avatar, handleStyle:{top,bottom,ink,sub}, rows, widgets:[…] } }
 */
(function () {
  'use strict';
  window.DITTO_PLATTERS = {
    "dohyunlinks": {
      "name": "도현",
      "handle": "dohyunlinks",
      "avatar": "/assets/rooms/rav-dohyun.webp",
      "handleStyle": {"top": "#EDAE91", "bottom": "#E07B4C", "ink": "#171719", "sub": "rgba(23,23,25,.85)"},
      "rows": 16,
      "widgets": [
        {"id": "fs-06-dohyun-invite", "kind": "text", "x": 0, "y": 0, "w": 6, "h": 2, "data": {"text": "🍕 늦어도 와, 자리 비워둘게", "style": {"bg": "#EFEFF1"}}},
        {"id": "fs-06-dohyun-status", "kind": "status", "x": 6, "y": 0, "w": 2, "h": 2, "data": {"emoji": "🍕📸🪩", "style": {"bg": "#4B1A7E"}}},
        {"id": "fs-06-dohyun-group", "kind": "image", "x": 0, "y": 2, "w": 3, "h": 4, "ditto": true, "data": {"img": "/demo/dohyunlinks/media/af6cb80d8a86.jpg", "title": "📸 금요일 한 컷"}},
        {"id": "fs-06-dohyun-party", "kind": "image", "x": 3, "y": 2, "w": 3, "h": 4, "data": {"img": "/demo/dohyunlinks/media/dda0cd0a1688.jpg", "title": "🎂 생일 기록"}},
        {"id": "fs-06-dohyun-guestbook", "kind": "guestbook", "x": 0, "y": 6, "w": 4, "h": 4, "data": {"title": "방명록", "entries": [{"name": "준", "message": "퇴근하고 바로 갈게, 7시 반 🙌", "avatar": "/demo/dohyunlinks/media/35f6d18d2833.jpg", "handle": "junishere"}, {"name": "재민", "handle": "jaeminarchive", "message": "준도 불렀어! 둘이 같이 감 👋"}]}},
        {"id": "fs-06-dohyun-cafe", "kind": "image", "x": 4, "y": 6, "w": 4, "h": 6, "ditto": true, "data": {"img": "/demo/dohyunlinks/media/564d9a5e499d.jpg"}},
        {"id": "fs-06-dohyun-run", "kind": "image", "x": 0, "y": 10, "w": 4, "h": 6, "ditto": true, "data": {"img": "/demo/dohyunlinks/media/214527ca2339.jpg"}},
        {"id": "fs-06-dohyun-from-jaemin", "kind": "music", "x": 4, "y": 12, "w": 4, "h": 3, "data": {"title": "I Just Might", "artist": "Bruno Mars", "img": "/demo/dohyunlinks/media/941e84938b7e.jpg", "palette": ["#e2e2e2", "#d6d6d6", "#dadada"], "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/86/ef/58/86ef584b-cb46-43df-12e3-fce4b436688c/mzaf_10081886156675578892.plus.aac.p.m4a", "album": "The Romantic", "ytId": "mrV8kK5t0V8"}}
      ]
    },
    "haeunzip": {
      "name": "하은",
      "handle": "haeunzip",
      "avatar": "/assets/rooms/rav-haeun.webp",
      "handleStyle": {"top": "#CAB7F2", "bottom": "#B092ED", "ink": "#171719", "sub": "rgba(23,23,25,.85)"},
      "rows": 14,
      "widgets": [
        {"id": "fs-01-haeun-library", "kind": "image", "x": 0, "y": 0, "w": 4, "h": 6, "ditto": true, "data": {"img": "/demo/haeunzip/media/d7bf6148069f.jpg"}},
        {"id": "fs-01-haeun-welcome", "kind": "text", "x": 4, "y": 0, "w": 4, "h": 2, "data": {"text": "🫧 여긴 조금 천천히 채울래", "style": {"bg": "#EFEFF1"}}},
        {"id": "fs-01-haeun-video", "kind": "video", "x": 4, "y": 2, "w": 4, "h": 3, "data": {"img": "/demo/haeunzip/media/11e796c2fa3d.jpg", "letterbox": true, "title": "🍮 책 덮고 한 편", "ytId": "pbQQAwSQUX4"}},
        {"id": "fs-01-haeun-today", "kind": "music", "x": 4, "y": 5, "w": 4, "h": 3, "data": {"title": "1111", "artist": "HANRORO", "img": "/demo/haeunzip/media/cd2471a3e72a.jpg", "palette": ["#f3e2e5", "#eed6da", "#b4b9bc"], "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e3/53/56/e35356dc-1230-65e1-7600-cd2d112610d8/mzaf_12660985028670842405.plus.aac.p.m4a", "album": "LOVE&HATE - Single", "ytId": "Gofn_ULNd5Q"}},
        {"id": "fs-01-haeun-from-nari", "kind": "text", "x": 0, "y": 6, "w": 4, "h": 2, "data": {"text": "☕ 삐뚤어도 손에 맞는 내 컵", "style": {"bg": "#EFEFF1"}}},
        {"id": "fs-01-haeun-night", "kind": "image", "x": 0, "y": 8, "w": 4, "h": 6, "ditto": true, "data": {"img": "/demo/haeunzip/media/19fc3a761d37.jpg"}},
        {"id": "fs-01-haeun-small-plans", "kind": "todo", "x": 4, "y": 8, "w": 4, "h": 3, "data": {"title": "📚 이번 주 작은 일", "cats": [{"id": "c-haeun-small-plans", "name": "일상", "color": "purple"}], "items": [{"text": "📖 책 반납 연장하기", "done": true, "cat": "c-haeun-small-plans"}, {"text": "🌙 산책 사진 골라 두기", "done": false, "cat": "c-haeun-small-plans"}], "week": [[], ["purple"], [], [], [], [], []]}}
      ]
    },
    "jaeminarchive": {
      "name": "재민",
      "handle": "jaeminarchive",
      "avatar": "/assets/rooms/rav-jaemin.webp",
      "handleStyle": {"top": "#8FB2BD", "bottom": "#5C8F9F", "ink": "#171719", "sub": "rgba(23,23,25,.85)"},
      "rows": 16,
      "widgets": [
        {"id": "fs-04-jaemin-train", "kind": "image", "x": 0, "y": 0, "w": 4, "h": 4, "ditto": true, "data": {"img": "/demo/jaeminarchive/media/9d0cb2748182.jpg", "title": "🚃 창밖 저장"}},
        {"id": "fs-04-jaemin-voice", "kind": "text", "x": 4, "y": 0, "w": 4, "h": 2, "data": {"text": "📸 흔들린 컷도 보내 줄게", "style": {"bg": "#EFEFF1"}}},
        {"id": "fs-04-jaemin-song", "kind": "music", "x": 4, "y": 2, "w": 4, "h": 3, "data": {"title": "You and I", "artist": "HANRORO", "img": "/demo/jaeminarchive/media/ff1893474315.jpg", "palette": ["#c8d2e0", "#b3c0d4", "#fffce1"], "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e9/7c/54/e97c549b-ddc0-ef3a-20cf-056b0023ac69/mzaf_3451991796087699892.plus.aac.p.m4a", "album": "You and I - Single", "ytId": "Tos8R9Tcem8"}},
        {"id": "fs-04-jaemin-post", "kind": "block", "x": 0, "y": 5, "w": 6, "h": 4, "data": {"text": "바다 사진보다 오래 남은 건 돌아오는 길의 대화였다. 도현이 먼저 잠들고 나서야 오늘을 적었다 🌊", "title": "돌아오는 기차에서 🚃", "count": "글 3개"}},
        {"id": "fs-04-jaemin-guestbook", "kind": "guestbook", "x": 0, "y": 9, "w": 4, "h": 3, "data": {"title": "방명록", "entries": [{"name": "도현", "message": "바람에 머리 날린 컷도 보내줘 📸", "handle": "dohyunlinks"}, {"name": "준", "handle": "junishere", "message": "다음엔 첫 기차 같이 타자 🚃"}]}},
        {"id": "fs-04-jaemin-coast", "kind": "image", "x": 0, "y": 12, "w": 6, "h": 4, "ditto": true, "data": {"img": "/demo/jaeminarchive/media/ba44fc7d6a58.jpg", "title": "🌊 다시 바다"}}
      ]
    },
    "jiuallday": {
      "name": "지우",
      "handle": "jiuallday",
      "avatar": "/assets/rooms/rav-jiu.webp",
      "handleStyle": {"top": "#EEAFC7", "bottom": "#E37CA2", "ink": "#171719", "sub": "rgba(23,23,25,.85)"},
      "rows": 16,
      "widgets": [
        {"id": "fs-07-jiu-birthday", "kind": "image", "x": 0, "y": 0, "w": 6, "h": 4, "ditto": true, "data": {"img": "/demo/jiuallday/media/8be73b82fef7.jpg", "title": "🎂 초는 내가"}},
        {"id": "fs-07-jiu-day", "kind": "text", "x": 6, "y": 0, "w": 2, "h": 2, "data": {"text": "🪩 목 20시", "style": {"bg": "#EFEFF1"}}},
        {"id": "fs-07-jiu-status", "kind": "status", "x": 6, "y": 2, "w": 2, "h": 2, "data": {"emoji": "🎀🪩💿", "style": {"bg": "#4B1A7E"}}},
        {"id": "fs-07-jiu-dance", "kind": "image", "x": 0, "y": 4, "w": 3, "h": 4, "ditto": true, "data": {"img": "/demo/jiuallday/media/85cb664eedb9.jpg", "title": "🩰 한 번 더"}},
        {"id": "fs-07-jiu-song", "kind": "music", "x": 3, "y": 4, "w": 4, "h": 3, "data": {"title": "GO", "artist": "BLACKPINK", "img": "/demo/jiuallday/media/d1d8aa62a816.jpg", "palette": ["#ccc4c6", "#bfb5b7", "#cdc5c7"], "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/10/28/c5/1028c5af-5993-d213-56e8-9341bbb39cf8/mzaf_7572164484388504824.plus.aac.p.m4a", "album": "DEADLINE - EP", "ytId": "2GJfWMYCWY0"}},
        {"id": "fs-07-jiu-flash", "kind": "image", "x": 3, "y": 7, "w": 3, "h": 4, "ditto": true, "data": {"img": "/demo/jiuallday/media/7df2d7589f14.jpg"}},
        {"id": "fs-07-jiu-flowers", "kind": "image", "x": 0, "y": 8, "w": 3, "h": 4, "data": {"img": "/demo/jiuallday/media/ab220d8a9375.jpg"}},
        {"id": "fs-07-jiu-from-sora", "kind": "text", "x": 4, "y": 11, "w": 4, "h": 2, "data": {"text": "🧺 각자 좋아하는 간식 하나", "style": {"bg": "#EFEFF1"}}},
        {"id": "fs-07-jiu-video", "kind": "video", "x": 0, "y": 12, "w": 4, "h": 3, "data": {"img": "/demo/jiuallday/media/3456485062e4.jpg", "letterbox": true, "title": "🪩 GO · 연출 참고", "ytId": "2GJfWMYCWY0"}},
        {"id": "fs-07-jiu-stickers", "kind": "guestbook", "x": 4, "y": 13, "w": 4, "h": 3, "data": {"title": "방명록", "entries": [{"name": "소라", "message": "마지막 테이크 진짜 좋았어 💃", "handle": "soramaybe"}, {"name": "나리", "handle": "nariday", "message": "생일 사진 원본 보내줘 🎂"}, {"name": "도현", "handle": "dohyunlinks", "message": "이 장면 내 폰에도 저장함 📸"}]}}
      ]
    },
    "junishere": {
      "name": "준",
      "handle": "junishere",
      "avatar": "/assets/rooms/rav-jun.webp",
      "handleStyle": {"top": "#A8B3BF", "bottom": "#79899B", "ink": "#171719", "sub": "rgba(23,23,25,.85)"},
      "rows": 15,
      "widgets": [
        {"id": "fs-02-jun-campus", "kind": "image", "x": 0, "y": 0, "w": 4, "h": 6, "ditto": true, "data": {"img": "/demo/junishere/media/cd554719826e.jpg"}},
        {"id": "fs-02-jun-hello", "kind": "text", "x": 4, "y": 0, "w": 4, "h": 2, "data": {"text": "🥐 공강 한 시간은 커피로", "style": {"bg": "#EFEFF1"}}},
        {"id": "fs-02-jun-headphones", "kind": "image", "x": 4, "y": 2, "w": 4, "h": 6, "ditto": true, "data": {"img": "/demo/junishere/media/362f2275c7f1.jpg"}},
        {"id": "fs-02-jun-song", "kind": "music", "x": 0, "y": 6, "w": 4, "h": 3, "data": {"title": "You Just Wanna Have Fun", "artist": "Silica Gel", "img": "/demo/junishere/media/dbdd2a78adea.jpg", "palette": ["#eebbbb", "#e8a5a4", "#eebcbb"], "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/91/48/56/91485602-684a-18f9-4a39-1427b4751578/mzaf_7353260142060911185.plus.aac.p.m4a", "album": "Ballad of You", "ytId": "aex2IYM-Hpk"}},
        {"id": "fs-02-jun-from-jaemin", "kind": "text", "x": 4, "y": 8, "w": 4, "h": 2, "data": {"text": "📸 흔들린 컷도 보내 줄게", "style": {"bg": "#EFEFF1"}}},
        {"id": "fs-02-jun-cafe", "kind": "image", "x": 0, "y": 9, "w": 4, "h": 6, "ditto": true, "data": {"img": "/demo/junishere/media/1d54d0d4d5a7.jpg"}},
        {"id": "fs-02-jun-status", "kind": "status", "x": 4, "y": 10, "w": 2, "h": 2, "data": {"emoji": "🥐🎧", "style": {"bg": "#DCD8F5"}}}
      ]
    },
    "nariday": {
      "name": "나리",
      "handle": "nariday",
      "avatar": "/assets/rooms/rav-nari.webp",
      "handleStyle": {"top": "#D5C194", "bottom": "#BF9F5B", "ink": "#171719", "sub": "rgba(23,23,25,.85)"},
      "rows": 14,
      "widgets": [
        {"id": "fs-05-nari-pottery", "kind": "image", "x": 0, "y": 0, "w": 3, "h": 4, "ditto": true, "data": {"img": "/demo/nariday/media/a342f8a931db.jpg"}},
        {"id": "fs-05-nari-title", "kind": "text", "x": 3, "y": 0, "w": 4, "h": 2, "data": {"text": "☕ 삐뚤어도 손에 맞는 내 컵", "style": {"bg": "#EFEFF1"}}},
        {"id": "fs-05-nari-video", "kind": "video", "x": 3, "y": 2, "w": 4, "h": 3, "data": {"img": "/demo/nariday/media/1a0f80472142.jpg", "letterbox": true, "title": "🥐 쉬는 날 빵집 투어", "ytId": "yIX4mTfXl4k"}},
        {"id": "fs-05-nari-workshop", "kind": "image", "x": 0, "y": 4, "w": 3, "h": 4, "ditto": true, "data": {"img": "/demo/nariday/media/869b09ef4ea4.jpg", "title": "🫖 내 첫 컵"}},
        {"id": "fs-05-nari-bakery", "kind": "image", "x": 4, "y": 5, "w": 4, "h": 6, "ditto": true, "data": {"img": "/demo/nariday/media/582494f90b38.jpg"}},
        {"id": "fs-05-nari-slow", "kind": "music", "x": 0, "y": 8, "w": 4, "h": 3, "data": {"title": "Memories", "artist": "beabadoobee", "img": "/demo/nariday/media/5ba3e1e10c95.jpg", "palette": ["#dfd9d3", "#d2c9c1", "#c6d3d4"], "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/a7/e1/8d/a7e18df1-42e7-5564-cb63-b5881599af25/mzaf_5819465525511501769.plus.aac.p.m4a", "album": "Memories - Single", "ytId": "Hphaxxjz2Wc"}},
        {"id": "fs-05-nari-room", "kind": "image", "x": 0, "y": 11, "w": 4, "h": 3, "data": {"img": "/demo/nariday/media/aa5dfb30bde0.jpg"}},
        {"id": "fs-05-nari-from-haeun", "kind": "text", "x": 4, "y": 11, "w": 4, "h": 2, "data": {"text": "🫧 여긴 조금 천천히 채울래", "style": {"bg": "#EFEFF1"}}}
      ]
    },
    "rianafterdark": {
      "name": "리안",
      "handle": "rianafterdark",
      "avatar": "https://lisqekczixwzshmpewzq.supabase.co/storage/v1/object/public/avatars/6b3651f6-54c3-4795-afd5-a109df8f6449/avatar-r23.jpg",
      "handleStyle": {"top": "#B5ADBA", "bottom": "#908498", "ink": "#171719", "sub": "rgba(23,23,25,.85)"},
      "rows": 13,
      "widgets": [
        {"id": "fs-09-rian-song", "kind": "music", "x": 0, "y": 0, "w": 4, "h": 3, "data": {"title": "Aperture", "artist": "Harry Styles", "img": "/demo/rianafterdark/media/d069462fe67f.jpg", "palette": ["#c6cace", "#b3b8be", "#c7cacf"], "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/46/f9/0e/46f90e9b-0d1a-b986-c3f9-0e690e79c79b/mzaf_8629808582610321991.plus.aac.p.m4a", "album": "Kiss All The Time. Disco, Occasionally.", "ytId": "7sxVHYZ_PnA"}},
        {"id": "fs-09-rian-from-seoyun", "kind": "text", "x": 4, "y": 0, "w": 4, "h": 2, "data": {"text": "🪞 여백까지 마음에 들어", "style": {"bg": "#EFEFF1"}}},
        {"id": "fs-09-rian-night", "kind": "image", "x": 4, "y": 2, "w": 4, "h": 6, "ditto": true, "data": {"img": "/demo/rianafterdark/media/033a4ccdab72.jpg", "title": "🌙 밤의 골목"}},
        {"id": "fs-09-rian-record", "kind": "image", "x": 0, "y": 3, "w": 4, "h": 6, "ditto": true, "data": {"img": "/demo/rianafterdark/media/bfa68316394b.jpg"}},
        {"id": "fs-09-rian-listening", "kind": "image", "x": 4, "y": 8, "w": 4, "h": 4, "ditto": true, "data": {"img": "/demo/rianafterdark/media/8df582837abf.jpg"}},
        {"id": "fs-09-rian-post", "kind": "block", "x": 0, "y": 9, "w": 4, "h": 4, "data": {"text": "마지막 곡이 끝나도 바로 다음 곡을 틀지는 않는다. 잠깐 남는 조용함까지 좋으니까 🌙", "title": "곡이 끝난 뒤 🌙", "count": "글 2개"}}
      ]
    },
    "seoyunpalette": {
      "name": "서윤",
      "handle": "seoyunpalette",
      "avatar": "https://lisqekczixwzshmpewzq.supabase.co/storage/v1/object/public/avatars/4baa3b04-8a6f-4576-af3c-9cff8e4d5943/avatar-r23.jpg",
      "handleStyle": {"top": "#B3BDA6", "bottom": "#85946F", "ink": "#171719", "sub": "rgba(23,23,25,.85)"},
      "rows": 15,
      "widgets": [
        {"id": "fs-08-seoyun-gallery", "kind": "image", "x": 0, "y": 0, "w": 4, "h": 4, "ditto": true, "data": {"img": "/demo/seoyunpalette/media/b34e34a33a19.jpg"}},
        {"id": "fs-08-seoyun-note", "kind": "text", "x": 4, "y": 0, "w": 4, "h": 2, "data": {"text": "🌿 이 초록은 저장", "style": {"bg": "#EFEFF1"}}},
        {"id": "fs-08-seoyun-palette", "kind": "text", "x": 4, "y": 2, "w": 4, "h": 2, "data": {"text": "🪞 여백까지 마음에 들어", "style": {"bg": "#EFEFF1"}}},
        {"id": "fs-08-seoyun-record", "kind": "image", "x": 0, "y": 4, "w": 3, "h": 3, "ditto": true, "data": {"img": "/demo/seoyunpalette/media/a57c2a60f371.jpg"}},
        {"id": "fs-08-seoyun-camera", "kind": "image", "x": 4, "y": 4, "w": 4, "h": 6, "ditto": true, "data": {"img": "/demo/seoyunpalette/media/ae8b18400349.jpg"}},
        {"id": "fs-08-seoyun-post", "kind": "block", "x": 0, "y": 7, "w": 4, "h": 6, "data": {"text": "작품보다 빈 벽 앞에 오래 서 있었다. 아무것도 없는 쪽이 오늘은 더 마음에 남았다 🪞", "title": "안 걸린 벽도 🪞", "count": "글 2개"}},
        {"id": "fs-08-seoyun-playlist", "kind": "music", "x": 4, "y": 10, "w": 4, "h": 3, "data": {"title": "How I Get", "artist": "Laufey", "img": "/demo/seoyunpalette/media/f2cca055c4b0.jpg", "palette": ["#c8c3bd", "#bcb7b0", "#c8c3be"], "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/16/b9/ae/16b9aeed-cf5e-4f55-ea1f-6ae64ca39647/mzaf_694859355810114488.plus.aac.p.m4a", "album": "A Matter of Time: The Final Hour", "ytId": "ZtRNT-JYg1w"}},
        {"id": "fs-08-seoyun-from-yeseo", "kind": "text", "x": 4, "y": 13, "w": 4, "h": 2, "data": {"text": "📷 오늘 빛은 조금 흐린 쪽", "style": {"bg": "#EFEFF1"}}}
      ]
    },
    "soramaybe": {
      "name": "소라",
      "handle": "soramaybe",
      "avatar": "/assets/rooms/rav-sora.webp",
      "handleStyle": {"top": "#C5D593", "bottom": "#A5BE57", "ink": "#171719", "sub": "rgba(23,23,25,.85)"},
      "rows": 14,
      "widgets": [
        {"id": "fs-03-sora-green", "kind": "image", "x": 0, "y": 0, "w": 4, "h": 3, "ditto": true, "data": {"img": "/demo/soramaybe/media/ffc92106444c.jpg"}},
        {"id": "fs-03-sora-quote", "kind": "text", "x": 4, "y": 0, "w": 4, "h": 2, "data": {"text": "🧺 각자 좋아하는 간식 하나", "style": {"bg": "#EFEFF1"}}},
        {"id": "fs-03-sora-mood", "kind": "status", "x": 4, "y": 2, "w": 4, "h": 2, "data": {"emoji": "🍒", "label": "돗자리 챙겨 둠", "style": {"bg": "#FFFFFF"}}},
        {"id": "fs-03-sora-picnic", "kind": "image", "x": 0, "y": 3, "w": 3, "h": 4, "ditto": true, "data": {"img": "/demo/soramaybe/media/7967a115a085.jpg", "title": "🧺 간식 부자"}},
        {"id": "fs-03-sora-market", "kind": "image", "x": 3, "y": 4, "w": 3, "h": 4, "data": {"img": "/demo/soramaybe/media/6f2cbdf508df.jpg"}},
        {"id": "fs-03-sora-mirror", "kind": "image", "x": 0, "y": 7, "w": 3, "h": 4, "ditto": true, "data": {"img": "/demo/soramaybe/media/b609b814c41a.jpg", "title": "🫶 같은 표정"}},
        {"id": "fs-03-sora-video", "kind": "video", "x": 4, "y": 8, "w": 4, "h": 3, "data": {"img": "/demo/soramaybe/media/84bea0828ed5.jpg", "letterbox": true, "title": "🛍️ 다음엔 이 마켓 가자", "ytId": "2ksz4dGPTf0"}},
        {"id": "fs-03-sora-guestbook", "kind": "guestbook", "x": 0, "y": 11, "w": 4, "h": 3, "data": {"title": "방명록", "entries": [{"name": "지우", "message": "딸기는 내가 씻어 갈게 🍓", "handle": "jiuallday"}, {"name": "나리", "handle": "nariday", "message": "돗자리 챙겼어, 토요일에 봐 🧺"}]}},
        {"id": "fs-03-sora-from-jiu", "kind": "music", "x": 4, "y": 11, "w": 4, "h": 3, "data": {"title": "BLACKHOLE", "artist": "IVE", "img": "/demo/soramaybe/media/d60458187c85.jpg", "palette": ["#b4bbcc", "#afb6c8", "#b5bbcc"], "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/31/be/41/31be4175-cc94-399c-5094-744c85e2c217/mzaf_5693297935994016807.plus.aac.p.m4a", "album": "REVIVE+", "ytId": "1Lmy7qwmSMc"}}
      ]
    },
    "yeseofilm": {
      "name": "예서",
      "handle": "yeseofilm",
      "avatar": "https://lisqekczixwzshmpewzq.supabase.co/storage/v1/object/public/avatars/e7cdcf38-735a-4a31-8703-e6e00b9b6a51/avatar-r23.jpg",
      "handleStyle": {"top": "#ADD5E5", "bottom": "#79BBD4", "ink": "#171719", "sub": "rgba(23,23,25,.85)"},
      "rows": 16,
      "widgets": [
        {"id": "fs-10-yeseo-camera", "kind": "image", "x": 0, "y": 0, "w": 4, "h": 6, "ditto": true, "data": {"img": "/demo/yeseofilm/media/1e43b866eea1.jpg", "title": "📷 흐린 날"}},
        {"id": "fs-10-yeseo-light", "kind": "text", "x": 4, "y": 0, "w": 4, "h": 2, "data": {"text": "📷 오늘 빛은 조금 흐린 쪽", "style": {"bg": "#EFEFF1"}}},
        {"id": "fs-10-yeseo-from-rian", "kind": "music", "x": 4, "y": 2, "w": 4, "h": 3, "data": {"title": "All I Did Was Dream of You (feat. The Marías)", "artist": "beabadoobee", "img": "/demo/yeseofilm/media/d892ed3d87db.jpg", "palette": ["#d6dee9", "#c5d1e0", "#d6dee9"], "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e1/b0/8b/e1b08be3-25de-0c42-6ee3-c29bc111d66f/mzaf_14078666469678526928.plus.aac.p.m4a", "album": "All I Did Was Dream of You (feat. The Marías) - Single", "ytId": "lJOpjWnSnqg"}},
        {"id": "fs-10-yeseo-rain", "kind": "image", "x": 0, "y": 6, "w": 3, "h": 4, "ditto": true, "data": {"img": "/demo/yeseofilm/media/454ab0719588.jpg"}},
        {"id": "fs-10-yeseo-ask", "kind": "todo", "x": 3, "y": 6, "w": 3, "h": 4, "data": {"title": "🎞️ 이번 주", "cats": [{"id": "c-yeseo-ask", "name": "취향", "color": "purple"}], "items": [{"text": "📌 필름 두 롤 맡기기", "done": true, "cat": "c-yeseo-ask"}, {"text": "💌 서윤에게 전시 링크", "done": false, "cat": "c-yeseo-ask"}, {"text": "🫧 꽃집 문 닫는 시간 확인", "done": false, "cat": "c-yeseo-ask"}], "week": [[], ["purple"], [], [], [], [], []]}},
        {"id": "fs-10-yeseo-bookstore", "kind": "image", "x": 0, "y": 10, "w": 3, "h": 4, "data": {"img": "/demo/yeseofilm/media/10e60b99bf5d.jpg"}},
        {"id": "fs-10-yeseo-friend", "kind": "image", "x": 3, "y": 10, "w": 4, "h": 3, "ditto": true, "data": {"img": "/demo/yeseofilm/media/282bb528e2e9.jpg", "title": "🫧 같이 본 빛"}},
        {"id": "fs-10-yeseo-stickers", "kind": "guestbook", "x": 3, "y": 13, "w": 4, "h": 3, "data": {"title": "방명록", "entries": [{"name": "서윤", "message": "그 흐린 날 색감 나도 좋아해 ☁️", "handle": "seoyunpalette"}, {"name": "리안", "handle": "rianafterdark", "message": "우산 같이 쓴 컷 보내줘 ☔"}]}}
      ]
    }
  };
})();
