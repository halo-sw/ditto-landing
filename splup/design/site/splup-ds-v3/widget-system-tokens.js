window.SplupWidgetSystem = {
  "version": "2026-10-02-editable-widget-redesign",
  "status": "design-planning-with-visual-examples",
  "source": {
    "grid": "DittoPrototype/Model/GridEngine.swift",
    "responsive": "design/tokens/widget-responsive.json",
    "figmaFrameId": "1227:148069",
    "iconComponentId": "995:288",
    "iconAsset": "design/brand/color-system/appicon-source.svg",
    "guideFrameId": "1241:2758",
    "sizeComponentSetId": "1246:2743",
    "dittoComponentSetId": "1247:2782",
    "badgeComponentSetId": "1247:2764",
    "originalMusic": "1:36928",
    "originalText": "1:36827",
    "originalVideo": "1:36885",
    "originalSocial": "1:37023",
    "establishedWidgets": "803:123820",
    "floating": "design/tokens/widget-floating.json",
    "contextFrameId": "1265:2761",
    "previousImportedExamples": [
      "803:123955",
      "803:124004",
      "803:124021",
      "803:124072",
      "803:124095"
    ],
    "newComponentSets": {
      "mood": "1303:2955",
      "guestbook": "1303:3006",
      "playlist": "1303:3115"
    },
    "externalBadgeComponentSetId": "1305:3229",
    "blueAlbumExampleComponentId": "1305:3058",
    "musicAlbumExamplesFrameId": "1314:3080",
    "musicServicesFrameId": "1314:3085",
    "musicAlbumManifest": "design/tokens/music-album-cases.json"
  },
  "grid": {
    "columns": 8,
    "rows": 16,
    "margin": 16,
    "gap": 8,
    "minViewport": 320,
    "maxViewport": 620,
    "maxSpan": [
      6,
      8
    ],
    "testViewports": [
      320,
      375,
      390,
      402,
      430,
      620
    ]
  },
  "referenceViewport": 402,
  "sizes": [
    {
      "id": "2x2",
      "columns": 2,
      "rows": 2,
      "width402": 86.5,
      "height402": 86.5,
      "radius": 12,
      "usage": "콘텐츠별 허용 목록 확인"
    },
    {
      "id": "4x2",
      "columns": 4,
      "rows": 2,
      "width402": 181,
      "height402": 86.5,
      "radius": 12,
      "usage": "콘텐츠별 허용 목록 확인"
    },
    {
      "id": "6x2",
      "columns": 6,
      "rows": 2,
      "width402": 275.5,
      "height402": 86.5,
      "radius": 12,
      "usage": "콘텐츠별 허용 목록 확인"
    },
    {
      "id": "3x3",
      "columns": 3,
      "rows": 3,
      "width402": 133.75,
      "height402": 133.75,
      "radius": 14,
      "usage": "콘텐츠별 허용 목록 확인"
    },
    {
      "id": "4x3",
      "columns": 4,
      "rows": 3,
      "width402": 181,
      "height402": 133.75,
      "radius": 14,
      "usage": "콘텐츠별 허용 목록 확인"
    },
    {
      "id": "3x4",
      "columns": 3,
      "rows": 4,
      "width402": 133.75,
      "height402": 181,
      "radius": 14,
      "usage": "콘텐츠별 허용 목록 확인"
    },
    {
      "id": "4x4",
      "columns": 4,
      "rows": 4,
      "width402": 181,
      "height402": 181,
      "radius": 16,
      "usage": "콘텐츠별 허용 목록 확인"
    },
    {
      "id": "6x4",
      "columns": 6,
      "rows": 4,
      "width402": 275.5,
      "height402": 181,
      "radius": 16,
      "usage": "콘텐츠별 허용 목록 확인"
    },
    {
      "id": "4x6",
      "columns": 4,
      "rows": 6,
      "width402": 181,
      "height402": 275.5,
      "radius": 16,
      "usage": "콘텐츠별 허용 목록 확인"
    },
    {
      "id": "6x6",
      "columns": 6,
      "rows": 6,
      "width402": 275.5,
      "height402": 275.5,
      "radius": 20,
      "usage": "콘텐츠별 허용 목록 확인"
    },
    {
      "id": "6x8",
      "columns": 6,
      "rows": 8,
      "width402": 275.5,
      "height402": 370,
      "radius": 20,
      "usage": "콘텐츠별 허용 목록 확인"
    },
    {
      "id": "2x6",
      "columns": 2,
      "rows": 6,
      "width402": 86.5,
      "height402": 275.5,
      "radius": 12,
      "usage": "사진 전용 · 본문 생략"
    }
  ],
  "families": [
    {
      "id": "image",
      "name": "사진",
      "profile": "media",
      "sizes": [
        "3x3",
        "4x3",
        "4x4",
        "3x4",
        "6x2",
        "2x6",
        "4x6",
        "6x4",
        "6x6",
        "6x8"
      ],
      "rule": "원본 사진의 크롭과 둥근 모서리를 유지합니다."
    },
    {
      "id": "video",
      "name": "영상",
      "profile": "media",
      "sizes": [
        "2x2",
        "4x2",
        "3x3",
        "4x3",
        "4x4",
        "3x4",
        "6x2",
        "2x6",
        "4x6",
        "6x4",
        "6x6",
        "6x8"
      ],
      "rule": "이미지와 같은 미디어·제목·여백·SoftShell. 반투명 보라색 중앙 재생 표시. YouTube는 지정된 원본 아이콘16px를 오른쪽 아래에 표시하고 직접 업로드는 아이콘 없음. 출처명·시간 배지·버튼 줄 없음.",
      "minContentHeight": 86.5,
      "spec": "design/tokens/video-widget.json",
      "figmaComponentSetId": "1243:129139",
      "delivery": "figma-skeleton; runtime integration pending"
    },
    {
      "id": "music",
      "name": "음악",
      "profile": "music",
      "sizes": [
        "4x2",
        "3x3",
        "4x3",
        "3x4",
        "4x4",
        "6x2",
        "6x4",
        "4x6",
        "2x6"
      ],
      "rule": "6×2 가로 CDP와 2×6 세로 CDP를 지원합니다. 원형 CD는 1:1, 좁은 폭에서는 곡명 2줄·출처 아이콘을 사용합니다.",
      "minContentHeight": 120
    },
    {
      "id": "text",
      "name": "텍스트",
      "profile": "note",
      "sizes": [
        "4x2",
        "4x3",
        "4x4",
        "3x4",
        "6x2",
        "6x4",
        "6x8"
      ],
      "rule": "모든 크기에서 본문 14px·행간 20px 고정. 공간에 맞춰 줄 수만 바꾸고 나머지는 말줄임합니다.",
      "minContentHeight": 68
    },
    {
      "id": "social",
      "name": "SNS",
      "profile": "social",
      "sizes": [
        "2x2",
        "4x2",
        "4x4",
        "6x2",
        "3x3",
        "4x3",
        "3x4",
        "6x4",
        "4x6",
        "6x6",
        "6x8",
        "2x6"
      ],
      "rule": "원본 social_size_variation의 전체 사진·제목·작은 SNS 로고 구성. 이미지 없는 기본형은 기존 링크 위젯의 중성 배경·링크 심볼을 사용합니다. 공통 여백과 제목 규격 유지, 서비스명·화살표 배지 없음. 전체 카드로 연결된 SNS를 엽니다.",
      "minContentHeight": 86.5,
      "spec": "design/tokens/social-widget.json",
      "figmaComponentSetId": "1244:2744",
      "delivery": "figma-skeleton; runtime integration pending"
    },
    {
      "id": "gif",
      "name": "GIF",
      "profile": "expressive",
      "sizes": [
        "2x2",
        "4x2",
        "6x2",
        "3x3",
        "4x3",
        "3x4",
        "4x4",
        "6x4",
        "4x6",
        "6x6",
        "6x8",
        "2x6"
      ],
      "rule": "전체 GIF 미디어와 GIF 라벨만 표시. 제목·출처·재생 버튼·외부 이동 표시 없음.",
      "minContentHeight": 86.5,
      "spec": "design/tokens/gif-widget.json",
      "figmaComponentSetId": "1244:129174"
    },
    {
      "id": "dday",
      "name": "D-day",
      "profile": "badge",
      "sizes": [
        "2x2",
        "4x2"
      ],
      "rule": "차분한 라벤더 표면에 일정 이름·남은 날·날짜를 정렬합니다. 80px 미만 높이에서는 날짜를 생략합니다.",
      "minContentHeight": 66
    },
    {
      "id": "todo",
      "name": "할 일 · 목록",
      "profile": "list",
      "sizes": [
        "3x4",
        "4x3",
        "4x4",
        "4x6",
        "6x4",
        "6x8"
      ],
      "rule": "화이트 표면, 16px 체크박스, 28px 행 간격. 작은 카드에서는 추가 항목 수를 표시합니다.",
      "minContentHeight": 112
    },
    {
      "id": "polaroid",
      "name": "폴라로이드",
      "profile": "album",
      "sizes": [
        "4x3",
        "3x4",
        "4x4",
        "4x6",
        "6x4",
        "6x8"
      ],
      "rule": "즉석 인화지의 얇은 종이 여백 8–10px, 넓은 하단 38px 캡션, 사진 모서리 R3를 사용합니다.",
      "minContentHeight": 100
    },
    {
      "id": "ask",
      "name": "Ask",
      "profile": "ask",
      "sizes": [
        "3x4",
        "4x4",
        "4x6",
        "6x4"
      ],
      "rule": "질문 14/20 최대 3줄, 답변 14/20 최대 6줄. 글자 입력 한도와 카드 표시 줄 수를 구분합니다.",
      "minContentHeight": 160
    },
    {
      "id": "mood",
      "name": "기분",
      "profile": "mood",
      "sizes": [
        "4x2",
        "4x4",
        "6x2"
      ],
      "rule": "신규 구조: 기분 이름과 상태 색, 넓은 크기에서는 짧은 메모와 갱신 시간을 추가합니다.",
      "minContentHeight": 100
    },
    {
      "id": "guestbook",
      "name": "방명록",
      "profile": "guestbook",
      "sizes": [
        "3x4",
        "4x4",
        "4x6",
        "6x4"
      ],
      "rule": "신규 구조: 작성자·시간·메시지를 행으로 묶고, 하단에 안부 남기기를 고정합니다.",
      "minContentHeight": 145
    },
    {
      "id": "playlist",
      "name": "플레이리스트",
      "profile": "playlist",
      "sizes": [
        "3x4",
        "4x4",
        "4x6",
        "6x4"
      ],
      "rule": "신규 구조: 플레이리스트 커버·이름·곡 수, 번호·곡·아티스트 목록과 외부 이동 배지.",
      "minContentHeight": 150
    }
  ],
  "ditto": {
    "sizes": [
      "4x4",
      "6x4",
      "4x6",
      "6x6",
      "6x8"
    ],
    "footerHeight": 52,
    "avatarSize": 28,
    "badgeSize": 32,
    "badgeInset": 12,
    "attributionTextSize": 13,
    "sourceNameMaxLines": 1,
    "sourceVerb": "에게서 가져옴",
    "required": [
      "sourceAvatar",
      "sourceName",
      "attributionVerb",
      "canonicalAppIcon"
    ],
    "minContentHeight": 96,
    "minFrameWidth": 128,
    "layout": "52px footer with avatar and two native text lines. Badge overlays media-only image/GIF; text-rich widgets place it at footer trailing to avoid covering content.",
    "note": "출처는 카드 안에 포함해요. 공간이 부족하면 가능한 다음 크기로 제안하고 사용자 확인 후 적용해요.",
    "sourceVerbSize": 11,
    "minTextFrameWidth": 168
  },
  "delivery": {
    "nativeApp": "not-changed",
    "figma": "updated-native-editable-text",
    "web": "design/site/splup-ds-v3/index.html#widget-system",
    "font": "Pretendard Variable, uploaded with user consent; all 384 guide text layers verified editable.",
    "note": "Web and Figma widget revision complete; 13 content families, Ditto source variants, shared destination labels and artwork-color examples. Native app rollout is separate."
  },
  "counts": {
    "commonSizes": 12,
    "contentFamilies": 13,
    "contentVariants": 91,
    "dittoVariants": 5,
    "badgeVariants": 2,
    "newFamilies": 3,
    "externalBadgeVariants": 4
  },
  "typography": {
    "body": {
      "size": 14,
      "lineHeight": 20
    },
    "title": {
      "size": 14,
      "lineHeight": 20,
      "weight": 600
    },
    "metadata": {
      "size": 11,
      "lineHeight": 16
    },
    "sourceName": {
      "size": 13,
      "lineHeight": 18
    },
    "overflow": "Use the role- and size-specific scale. Clamp overflow with ellipsis; never shrink a title to fit.",
    "titleScale": "design/tokens/widget-title-scale.json"
  },
  "externalBadge": {
    "height": 20,
    "radius": 4,
    "icon": 12,
    "inset": 8,
    "labelSize": 11,
    "labelLine": 15,
    "compactWidth": 24,
    "fullWidth": {
      "YouTube": 71,
      "Instagram": 79
    },
    "fullAtWidth": 175,
    "placement": "bottom trailing in content area, above attribution footer",
    "action": "badge is destination metadata; whole widget handles navigation",
    "gif": "bottom leading, 30x20; format marker only, no external arrow without URL",
    "labelWeight": 700,
    "paddingX": 6,
    "paddingY": 2,
    "gap": 2,
    "spec": "design/tokens/badge-system.json"
  },
  "askLimits": {
    "questionCharacters": 120,
    "answerCharacters": 500,
    "questionLines": {
      "compact": 3,
      "regular": 2
    },
    "answerLinesMax": 6,
    "overflow": "full editable text preserved, truncated preview opens detail"
  },
  "musicArtwork": {
    "method": "32px image sampling; weighted RGB bins, dominant chromatic field, luminance-adjusted white text contrast >= 4.5",
    "api": "Integration contract only: Apple Music artwork.bgColor/textColor1 may replace local extraction; this DS demo reads local images without API calls.",
    "neutralFallback": "#504960",
    "loading": "retain prior colors; do not flash white",
    "uploads": "local browser only; no upload to server",
    "reference": "https://developer.apple.com/documentation/applemusicapi/artwork",
    "samples": 9,
    "sampleSizes": [
      "4x2",
      "4x4",
      "4x6"
    ],
    "extraction": "32px sampling, chromatic hue clusters with neutral fallback, white contrast >= 4.5:1"
  },
  "polaroid": {
    "reference": "https://picocam.app/",
    "paper": "#FAF9F6",
    "padding": {
      "compact": 8,
      "regular": 10
    },
    "captionHeight": 38,
    "imageRadius": 3,
    "note": "Instant photo composition; own assets and app type scale. Website animation visual could not be loaded in current network."
  },
  "badgeSystem": {
    "spec": "design/tokens/badge-system.json",
    "familyId": "2409:110329",
    "reviewId": "2409:110551",
    "componentSetIds": {
      "Medium": "2409:110441",
      "Large": "2409:110550"
    },
    "variantCount": 36,
    "iconsSourceId": "573:3222"
  }
};
