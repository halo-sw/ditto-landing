# Splup Profile Avatars — 2026-10-02

10종 선택형 기본 아바타. 기존 프로필 핸들의 10색과 1:1로 연결합니다.

- SVG: 모양이 고정되지 않은 256 viewBox, 1024px 크기. 표시 영역에서 프로필 슬롯의 라운드 사각형으로 잘라 사용합니다. SVG는 preserveAspectRatio="none"으로 가로·세로 독립 변경을 지원합니다.
- PNG: 1024×1024, 사각 full-bleed. 모바일 에셋 또는 서버 썸네일용.
- rounded PNG: 512×512, 모서리 128의 라운드 사각형. 48px로 표시하면 R12.
- 팔레트/핸들 연결: palette.json → palettes[].handlePaletteId.
- 01 퍼플·핑크를 첫 번째 제안으로 사용합니다. 사진과 아바타 모두 미선택이면 기존 #F1F2F4 배경 + #8B9099 아이콘을 유지합니다.
- 라이프/대표 전환으로 아바타를 바꾸지 않습니다. 임의 배정하지 않습니다.
- 기본 48×48 R12, 모서리는 짧은 변의 25%. SVG 크기와 가로/세로 비율을 자유롭게 변경 가능. 테두리·흰 링·외부 그림자·로고·노이즈 없이 사용합니다.
- 핸들과 아바타의 기존 10색을 유지합니다. 피커도 동일한 원본 색과 바깥 stroke를 사용하며 좁은 화면은 가로 스와이프 캐러셀로 표시합니다.
- 가로형 흰 캡슐의 10색 피커는 바깥쪽 1.5px stroke로 선택을 표시합니다.
- 컬러는 핸들 정본의 세 값을 그대로 참조합니다. base=대표 top, shade=대표 bottom, light/accent=라이프 background. 별도의 아바타 보정색은 없습니다. CTA나 상태색을 대체하지 않습니다.
- 프로필 컬러 변경은 핸들에만 적용되며 사진/아바타 선택을 유지합니다. 10색 컬러칩은 라이프 핸들과 같은 원본 값이며 선택 시 기존 핸들 색이 적용됩니다.
- SVG와 Figma는 같은 5개 radial field와 정규화한 위치·크기를 사용합니다. Figma 리뷰: https://www.figma.com/design/XG8Cm5nLScPoNc9NAXX1DD/?node-id=1211-128856
- 토큰 정본: design/tokens/tokens.json → component.profileAvatar.
- 디자인 시스템과 다운로드 에셋에 등록됨. 실제 앱 반영은 별도. Figma 등록 내역은 palette.json의 figma 항목 참조.
