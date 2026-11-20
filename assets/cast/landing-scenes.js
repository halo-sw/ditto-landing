// Photographs are assigned to a scene and a widget id, independent of layout size.
(function () {
  const scenes = {
  "hero": {
    "bom-friends": {
      "img": "/assets/cast/scenes/rehearsal.webp",
      "title": "연습 시작 전"
    },
    "bom-practice": {
      "img": "/assets/cast/scenes/dance-break.webp",
      "title": "잠깐 바람 쐬러"
    },
    "taeyul-pocket": {
      "img": "/assets/cast/scenes/train.webp",
      "title": "기차에서 꺼낸 첫 롤"
    },
    "taeyul-friends": {
      "img": "/assets/cast/scenes/coast.webp",
      "title": "바다 앞에서 한 컷"
    },
    "taeyul-post": {
      "img": "/assets/cast/scenes/crosswalk.webp"
    },
    "nuri-pocket": {
      "img": "/assets/cast/scenes/book-tabs.webp",
      "title": "읽은 페이지마다 표시"
    },
    "nuri-friends": {
      "img": "/assets/cast/scenes/library-window.webp",
      "title": "창가에 앉아서"
    },
    "nuri-post": {
      "img": "/assets/cast/scenes/bookshop.webp"
    },
    "gyeol-practice": {
      "img": "/assets/cast/scenes/record-shop.webp",
      "title": "가게에서 들은 첫 곡"
    },
    "gyeol-friends": {
      "img": "/assets/cast/scenes/quiet-table.webp",
      "title": "테이블에 남은 소리"
    },
    "gyeol-post": {
      "img": "/assets/cast/scenes/black-shoes.webp"
    },
    "yeoul-pocket": {
      "img": "/assets/cast/scenes/evening-river.webp",
      "title": "강변에서 들은 소리"
    },
    "yeoul-friends": {
      "img": "/assets/cast/scenes/after-hours.webp",
      "title": "합주 끝나고 산책"
    },
    "yeoul-post": {
      "img": "/assets/cast/scenes/sunlit-curtain.webp"
    },
    "ian-pocket": {
      "img": "/assets/cast/scenes/shoe-circle.webp",
      "title": "오늘 모인 운동화"
    },
    "ian-friends": {
      "img": "/assets/cast/scenes/river-run.webp",
      "title": "강변 한 바퀴"
    },
    "ian-post": {
      "img": "/assets/cast/scenes/court-steps.webp"
    },
    "seori-practice": {
      "img": "/assets/cast/scenes/clay-workshop.webp",
      "title": "작업대 앞에서"
    },
    "seori-friends": {
      "img": "/assets/cast/scenes/market.webp",
      "title": "둘이 들른 시장"
    },
    "seori-post": {
      "img": "/assets/cast/scenes/bag-charms.webp"
    },
    "bom-meme": {
      "img": "/assets/cast/scenes/bom-meme-motion.webp",
      "still": "/assets/cast/scenes/bom-reaction-poster.webp",
      "meme": true,
      "fit": "cover",
      "title": "안무를 외운 순간"
    },
    "taeyul-meme": {
      "img": "/assets/cast/scenes/taeyul-meme-motion.webp",
      "still": "/assets/cast/scenes/taeyul-reaction-poster.webp",
      "meme": true,
      "fit": "cover",
      "title": "통학길 이어폰"
    },
    "nuri-meme": {
      "img": "/assets/cast/scenes/nuri-meme-motion.webp",
      "still": "/assets/cast/scenes/nuri-reaction-poster.webp",
      "meme": true,
      "fit": "cover",
      "title": "쉬는 시간"
    },
    "gyeol-meme": {
      "img": "/assets/cast/scenes/gyeol-meme-motion.webp",
      "still": "/assets/cast/scenes/gyeol-reaction-poster.webp",
      "meme": true,
      "fit": "cover",
      "title": "약속 잡혔다"
    },
    "yeoul-meme": {
      "img": "/assets/cast/scenes/yeoul-meme-motion.webp",
      "still": "/assets/cast/scenes/yeoul-reaction-poster.webp",
      "meme": true,
      "fit": "cover",
      "title": "합주 끝난 표정"
    },
    "ian-meme": {
      "img": "/assets/cast/scenes/ian-meme-motion.webp",
      "still": "/assets/cast/scenes/ian-reaction-poster.webp",
      "meme": true,
      "fit": "cover",
      "title": "스트레칭 중"
    },
    "seori-meme": {
      "img": "/assets/cast/scenes/seori-meme-motion.webp",
      "still": "/assets/cast/scenes/seori-reaction-poster.webp",
      "meme": true,
      "fit": "cover",
      "title": "단체 사진 찍는 날"
    },
    "bom-video": {
      "img": "/assets/cast/scenes/bom-clip.webp"
    },
    "taeyul-video": {
      "img": "/assets/cast/scenes/taeyul-clip.webp"
    },
    "nuri-video": {
      "img": "/assets/cast/scenes/nuri-clip.webp"
    },
    "gyeol-video": {
      "img": "/assets/cast/scenes/gyeol-clip.webp"
    },
    "yeoul-video": {
      "img": "/assets/cast/scenes/yeoul-clip.webp"
    },
    "ian-video": {
      "img": "/assets/cast/scenes/ian-clip.webp"
    },
    "seori-video": {
      "img": "/assets/cast/scenes/seori-clip.webp"
    },
    "bom-song": {
      "title": "CRASH",
      "artist": "ALLDAY PROJECT",
      "img": "/assets/cast/scenes/album-07-jiu-r24.webp",
      "url": "https://www.youtube.com/watch?v=lQ-w9M447w0",
      "ytId": "lQ-w9M447w0",
      "provider": "YouTube",
      "playback": "youtube"
    },
    "taeyul-song": {
      "title": "노스탈지아",
      "artist": "BIG Naughty",
      "img": "/assets/cast/scenes/album-04-jaemin-r24.webp",
      "url": "https://www.youtube.com/watch?v=fVI9nKLrbCc",
      "ytId": "fVI9nKLrbCc",
      "provider": "YouTube",
      "playback": "youtube"
    },
    "nuri-song": {
      "title": "이 별로부터",
      "artist": "IU",
      "img": "/assets/cast/scenes/album-01-haeun-r24.webp",
      "url": "https://www.youtube.com/watch?v=nP1xjFX86Po",
      "ytId": "nP1xjFX86Po",
      "provider": "YouTube",
      "playback": "youtube"
    },
    "gyeol-song": {
      "title": "미장센",
      "artist": "EPIK HIGH, DAVICHI",
      "img": "/assets/cast/scenes/album-08-seoyun-r24.webp",
      "url": "https://www.youtube.com/watch?v=F_EGihOgXsg",
      "ytId": "F_EGihOgXsg",
      "provider": "YouTube",
      "playback": "youtube"
    },
    "yeoul-song": {
      "title": "잔불 (Still)",
      "artist": "N.Flying",
      "img": "/assets/cast/scenes/album-02-jun-r24.webp",
      "url": "https://www.youtube.com/watch?v=gYAduKnFHG4",
      "ytId": "gYAduKnFHG4",
      "provider": "YouTube",
      "playback": "youtube"
    },
    "ian-song": {
      "title": "BiiiG",
      "artist": "BIGBANG",
      "img": "/assets/cast/scenes/album-06-dohyun-r24.webp",
      "url": "https://www.youtube.com/watch?v=L8ZnXgbyUuc",
      "ytId": "L8ZnXgbyUuc",
      "provider": "YouTube",
      "playback": "youtube"
    },
    "seori-song": {
      "title": "Pretty Girl",
      "artist": "RESCENE",
      "img": "/assets/cast/scenes/album-03-sora-r24.webp",
      "url": "https://www.youtube.com/watch?v=qZlu2j2SiBA",
      "ytId": "qZlu2j2SiBA",
      "provider": "YouTube",
      "playback": "youtube"
    },
    "yeoul-extra": {
      "title": "돌아가는 길",
      "songs": [
        {
          "title": "seasons",
          "art": "/assets/cast/scenes/album-seasons.webp"
        },
        {
          "title": "주저하는 연인들을 위해",
          "art": "/assets/cast/scenes/album-lovers.webp"
        },
        {
          "title": "Ditto",
          "art": "/assets/cast/scenes/album-ditto.webp"
        }
      ]
    }
  },
  "feed": [
    {
      "img": "/assets/cast/scenes/rain-on-glass.webp",
      "title": "비 오는 날 창가"
    },
    {
      "img": "/assets/cast/scenes/coastal-light.webp",
      "title": "바닷가의 빛"
    },
    {
      "img": "/assets/cast/scenes/subway-platform.webp",
      "title": "기차를 기다리며"
    },
    {
      "img": "/assets/cast/scenes/flower-market.webp",
      "title": "꽃시장 구경"
    },
    {
      "img": "/assets/cast/scenes/pottery.webp",
      "title": "물레 돌리는 손"
    },
    {
      "img": "/assets/cast/scenes/street-night.webp",
      "title": "밤 산책"
    }
  ],
  "draft": {
    "taeyul-pocket": {
      "img": "/assets/cast/scenes/station-film.webp",
      "title": "창가 자리"
    },
    "taeyul-friends": {
      "img": "/assets/cast/scenes/skate-stop.webp",
      "title": "같이 앉아 쉬던 순간"
    },
    "taeyul-meme": {
      "img": "/assets/cast/scenes/typing-loop-v2-motion.webp",
      "still": "/assets/cast/scenes/typing-loop-v2-poster.webp",
      "title": "잠깐 쉬어 가기",
      "fit": "cover",
      "meme": true
    }
  },
  "space": {
    "gyeol-practice": {
      "img": "/assets/cast/scenes/desk-records.webp",
      "title": "밤에 가게 한 바퀴"
    },
    "gyeol-friends": {
      "img": "/assets/cast/scenes/studio-rain.webp",
      "title": "작업대 위에 떨어진 빛"
    },
    "gyeol-meme": {
      "img": "/assets/cast/scenes/reading-loop-v2-motion.webp",
      "still": "/assets/cast/scenes/reading-loop-v2-poster.webp",
      "title": "오늘의 별",
      "fit": "cover",
      "meme": true
    },
    "gyeol-song": {
      "title": "You and I",
      "artist": "HANRORO",
      "img": "/assets/cast/scenes/record-you-and-i.webp",
      "url": "https://www.youtube.com/watch?v=Tos8R9Tcem8",
      "ytId": "Tos8R9Tcem8",
      "provider": "YouTube",
      "playback": "youtube"
    }
  },
  "roll": {
    "image": {
      "img": "/assets/cast/scenes/market-mug.webp",
      "title": "작업 끝나고 커피"
    },
    "together": {
      "frame": "#F6F2F0",
      "shots": [
        "/assets/cast/scenes/roll-studio.webp",
        "/assets/cast/scenes/roll-field.webp",
        "/assets/cast/scenes/roll-flowers.webp",
        "/assets/cast/scenes/roll-school.webp"
      ]
    },
    "video": "/assets/cast/scenes/skate-clip.webp",
    "gif": {
      "img": "/assets/cast/scenes/dance-loop-v2-motion.webp",
      "still": "/assets/cast/scenes/dance-loop-v2-poster.webp",
      "title": "연습실에서",
      "fit": "cover",
      "meme": true
    },
    "music": {
      "title": "You Just Wanna Have Fun",
      "artist": "Silica Gel",
      "img": "/assets/cast/scenes/record-silica.webp",
      "url": "https://www.youtube.com/watch?v=aex2IYM-Hpk",
      "ytId": "aex2IYM-Hpk",
      "provider": "YouTube",
      "playback": "youtube"
    },
    "playlist": {
      "title": "오늘의 두 곡",
      "songs": [
        {
          "title": "1111",
          "art": "/assets/cast/scenes/record-1111.webp"
        },
        {
          "title": "BLACKHOLE",
          "art": "/assets/cast/scenes/record-blackhole.webp"
        }
      ]
    },
    "guestbook": {
      "ownerAvatar": "/assets/cast/scenes/roll-notebook-owner.webp"
    }
  },
  "ditto": {
    "img": "/assets/cast/scenes/alley-mirror-duo.webp",
    "title": "골목 거울에서 둘이"
  },
  "camcorder": {
    "img": "/assets/cast/scenes/sun-through-trees.webp",
    "title": "나무 사이로 들어온 햇살"
  },
  "grid": [
    "/assets/cast/scenes/city-headphones.webp",
    "/assets/cast/scenes/street-green.webp",
    "/assets/cast/scenes/practice-room.webp",
    "/assets/cast/scenes/bakery-window.webp",
    "/assets/cast/scenes/cafe-window.webp",
    "/assets/cast/scenes/hall-mirror.webp"
  ]
};
  function widgets(scene, list) {
    return list.map(function (widget) {
      const chosen = scenes[scene][widget.id];
      if (!chosen) return widget;
      const data = widget.kind === 'music' ? chosen : Object.assign({}, widget.data, chosen);
      return Object.assign({}, widget, {data});
    });
  }
  window.DittoScenes = {widgets, grid:scenes.grid, feed:scenes.feed, roll:scenes.roll, ditto:scenes.ditto, camcorder:scenes.camcorder};
})();
