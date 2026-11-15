#!/bin/sh
# 디자인 가이드에 넣을 Stageshow 시연 묶음 만들기. splup-ds-v3 폴더에서: sh stage-src/build.sh
# node_modules 는 설치된 스킬 폴더의 것을 빌려 쓴다 (react · react-dom · lucide-react · esbuild).
set -e
MODS="${STAGESHOW_MODULES:-$HOME/.claude/skills/stageshow/node_modules}"
cd "$(dirname "$0")/.."
NODE_PATH="$MODS" "$MODS/.bin/esbuild" stage-src/entry.tsx --bundle --minify --format=iife \
  --jsx=automatic --target=es2020,chrome100,safari15,firefox100 --define:process.env.NODE_ENV='"production"' \
  --loader:.webp=file --asset-names=stage-[name] --public-path=. --outfile=play-stage.js --log-level=error
ls -la play-stage.js play-stage.css stage-*.webp
