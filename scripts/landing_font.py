#!/usr/bin/env python3
"""메인 랜딩(index.html)용 Pretendard 서브셋 만들기 → assets/pretendard-ditto.woff2

index.html 문구를 바꿔 새 글자가 생기면 다시 돌린다. 서브셋에 없는 글자는 시스템 글꼴로 보인다.

  npm pack pretendard@1.3.9 && tar xzf pretendard-1.3.9.tgz
  pip install fonttools brotli
  python3 scripts/landing_font.py package/dist/public/variable/PretendardVariable.ttf
"""
import sys
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
src = sys.argv[1]
chars = set(map(chr, range(0x20, 0x7F))) | set("·…—–‘’“”→←↑↓↗✕✓×©®™❚▶•°%₩")
chars |= set((ROOT / "index.html").read_text(encoding="utf-8"))
# 지금 서브셋에 있는 글자는 그대로 품는다 (v5.js 등 스크립트가 넣는 글자 포함)
old = ROOT / "assets/pretendard-ditto.woff2"
if old.exists():
    chars |= set(map(chr, TTFont(old).getBestCmap()))
opts = subset.Options()
opts.flavor = "woff2"
opts.layout_features = ["*"]
opts.notdef_outline = True
font = subset.load_font(src, opts)
sub = subset.Subsetter(opts)
sub.populate(text="".join(sorted(c for c in chars if c >= " ")))
sub.subset(font)
out = ROOT / "assets/pretendard-ditto.woff2"
subset.save_font(font, str(out), opts)
print(out, out.stat().st_size, "bytes ·", len(font.getBestCmap()), "glyphs")
