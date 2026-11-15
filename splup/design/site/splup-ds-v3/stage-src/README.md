# stage-src — 디자인 가이드 처음 화면의 시연(Stageshow)

처음 화면 "핵심 컴포넌트"의 큰 타일에 들어가는 디토하기 시연의 원본이에요.
[Stageshow](https://github.com/benjitaylor/skills) 스킬(MIT, `STAGESHOW-LICENSE` · `STAGESHOW-NOTICE.md`)의 부품(`kit/`)으로 만들었어요.

- `ditto/index.tsx` · `ditto/ditto.css` — 시연 장면. 소라의 플래터 → 사진 위젯을 열기 → 디토하기 버튼을 3초 누르기 → 담김 → 닫기.
- `entry.tsx` — 가이드의 `#xkStage`에 장면을 올려요.
- `kit/` — Stageshow 부품 사본. 장면은 `kit/index.ts`를 거치지 않고 부품 파일을 직접 불러와요(거치면 쓰지 않는 브랜드 로고 코드가 묶여 오류가 나요).

## 묶는 법

React · esbuild가 깔린 `node_modules`가 필요해요. 이 폴더에는 두지 않고, 설치된 스킬 폴더의 것을 빌려 써요.

```sh
sh stage-src/build.sh        # splup-ds-v3 폴더에서
```

결과물은 `play-stage.js` · `play-stage.css` · `stage-picnic.webp` · `stage-sora.webp` 네 개이고 `index.html`이 이 파일들을 불러와요.

## 가이드와 주고받는 것

- 장면 → 가이드: 단계가 바뀔 때 `window`에 `splup-ditto-demo` 이벤트(`closed` · `idle` · `holding` · `pending` · `complete`)를 보내요. 가이드는 왼쪽 아래 단계 표시를 여기에 맞춰요.
- 가이드 → 장면: `#xkStage`에 `--splup-demo-a` · `--splup-demo-b`를 넣으면 버튼 색이 바뀌어요(핸들 색 점).

## 고칠 때

장면은 스킬의 미리보기에서 고치고 촬영 검수를 통과시킨 뒤 이 폴더로 옮겨요.

```sh
# ~/.claude/skills/stageshow 에서 (examples/ditto 가 같은 원본)
npm run dev
node scripts/film.mjs "http://127.0.0.1:<포트>/?capture=ditto" --out shots/loop.png --every 1000 --count 12 --gate
node scripts/film.mjs "http://127.0.0.1:<포트>/?capture=ditto" --out shots/phone.png --width 390 --every 2500 --count 5 --gate
```
