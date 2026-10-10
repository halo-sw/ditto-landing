#!/usr/bin/env python3
"""ditto.at 빌드: 저장소 파일 + 공유한 사용자의 프로필 페이지(ditto.at/{아이디}) + 링크 미리보기 이미지.

프로필 페이지는 프로필 링크를 공유한 사람 것만 만든다. 공유 목록은
  1) Supabase public.profile_shares (앱에서 공유할 때 기록, 테이블이 있으면)
  2) scripts/shared-profiles.txt (한 줄에 아이디 하나, 수동 추가·예시용)

GitHub Actions(.github/workflows/pages.yml)가 주기적으로 실행해 GitHub Pages에 올린다.
프로필 페이지는 git에 커밋하지 않고 배포 산출물에만 들어간다.

  python3 scripts/build_site.py _site            # 전체
  PROFILE_LIMIT=3 python3 scripts/build_site.py _site   # 로컬 확인용
"""
import html, io, json, os, re, shutil, sys, urllib.error, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "_site").resolve()
SITE = "https://ditto.at"
SB = "https://lisqekczixwzshmpewzq.supabase.co"
FONT_URL = "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static/Pretendard-{w}.otf"
HANDLE_RE = re.compile(r"^[a-z0-9_.]{1,30}$")
SKIP = {".git", ".github", "scripts", "_site", ".DS_Store"}


def public_key():
    key = os.environ.get("SUPABASE_PUBLIC_KEY")
    if key:
        return key
    m = re.search(r"eyJ[\w-]+\.[\w-]+\.[\w-]+|sb_publishable_[\w-]+", (ROOT / "download/index.html").read_text())
    if not m:
        sys.exit("Supabase public key not found")
    return m.group(0)


def get(url, headers=None, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": "ditto-site-build", **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def shared_handles(key):
    handles = set()
    listed = ROOT / "scripts/shared-profiles.txt"
    if listed.exists():
        for line in listed.read_text().splitlines():
            line = line.split("#", 1)[0].strip().lstrip("@").lower()
            if line:
                handles.add(line)
    try:
        offset = 0
        while True:
            page = json.loads(get(f"{SB}/rest/v1/profile_shares?select=handle&order=handle&limit=1000&offset={offset}", {"apikey": key}))
            handles |= {(r.get("handle") or "").lower() for r in page}
            if len(page) < 1000:
                break
            offset += 1000
    except urllib.error.HTTPError as e:
        if e.code not in (401, 404):  # 테이블이 아직 없으면 목록 파일만 쓴다
            raise
    return sorted(h for h in handles if HANDLE_RE.match(h))


def profiles(key):
    handles = shared_handles(key)
    rows = []
    for i in range(0, len(handles), 100):
        chunk = ",".join(handles[i:i + 100])
        rows += json.loads(get(f"{SB}/rest/v1/profiles?select=handle,nickname,avatar_url&handle=in.({urllib.parse.quote(chunk)})", {"apikey": key}))
    return rows


def font(weight, size, cache={}):
    path = OUT.parent / f".font-{weight}.otf"
    if weight not in cache:
        if not path.exists():
            path.write_bytes(get(FONT_URL.format(w=weight), timeout=60))
        cache[weight] = str(path)
    return ImageFont.truetype(cache[weight], size)


def fit(draw, text, weight, size, max_w):
    while size > 20:
        f = font(weight, size)
        if draw.textlength(text, font=f) <= max_w:
            return f, text
        size -= 2
    f = font(weight, size)
    while text and draw.textlength(text + "…", font=f) > max_w:
        text = text[:-1]
    return f, text + "…"


def og_image(name, handle, avatar_bytes, wordmark):
    W, H = 1200, 630
    top, bottom = (170, 182, 240), (238, 241, 251)
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / (H - 1)
        d.line([(0, y), (W, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)))
    card = Image.new("RGBA", (W - 120, H - 120), (0, 0, 0, 0))
    ImageDraw.Draw(card).rounded_rectangle([0, 0, card.width - 1, card.height - 1], 56, fill=(255, 255, 255, 236))
    img.paste(card, (60, 60), card)
    # 아바타 (없으면 첫 글자)
    size, ax, ay = 280, 130, (H - 280) // 2
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size - 1, size - 1], fill=255)
    av = None
    if avatar_bytes:
        try:
            av = ImageOps.fit(ImageOps.exif_transpose(Image.open(io.BytesIO(avatar_bytes))).convert("RGB"), (size, size))
        except Exception:
            av = None
    if av is None:
        av = Image.new("RGB", (size, size))
        ad = ImageDraw.Draw(av)
        for i in range(size * 2):
            t = i / (size * 2)
            ad.line([(i, 0), (0, i)], fill=(round(180 + (243 - 180) * t), round(108 + (159 - 108) * t), round(224 + (206 - 224) * t)))
        f = font("Bold", 130)
        ch = (name or handle)[:1].upper()
        ad.text((size / 2, size / 2), ch, font=f, fill="white", anchor="mm")
    ring = Image.new("RGBA", (size + 16, size + 16), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse([0, 0, size + 15, size + 15], fill=(240, 232, 250, 255))
    img.paste(ring, (ax - 8, ay - 8), ring)
    img.paste(av, (ax, ay), mask)
    # 이름 · 아이디 · 설명
    tx, max_w = ax + size + 64, W - (ax + size + 64) - 110
    f_name, shown = fit(d, name or handle, "Bold", 76, max_w)
    d.text((tx, 200), shown, font=f_name, fill=(28, 28, 34))
    f_handle, shown_h = fit(d, "@" + handle, "SemiBold", 40, max_w)
    d.text((tx, 300), shown_h, font=f_handle, fill=(155, 75, 224))
    d.text((tx, 372), "위젯으로 서로의 하루를 주고받는", font=font("SemiBold", 30), fill=(107, 107, 118))
    d.text((tx, 414), "친구들의 공간, ditto!", font=font("SemiBold", 30), fill=(107, 107, 118))
    # 워드마크 (흰색 PNG의 알파를 보라색으로)
    wm_h = 56
    wm = wordmark.resize((round(wordmark.width * wm_h / wordmark.height), wm_h), Image.LANCZOS)
    tint = Image.new("RGB", wm.size, (126, 55, 194))
    img.paste(tint, (W - 110 - wm.width, H - 110 - wm_h + 6), wm.split()[3])
    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True)
    return buf.getvalue()


def main():
    key = public_key()
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    reserved = set()
    for p in ROOT.iterdir():
        if p.name in SKIP:
            continue
        reserved.add(p.name.lower())
        (shutil.copytree if p.is_dir() else shutil.copy2)(p, OUT / p.name)
    reserved |= {"u", "og", "404.html", "index.html", "robots.txt", "sitemap.xml", "favicon.ico"}

    template = (ROOT / "scripts/profile.html").read_text()
    fill = lambda values: re.sub(r"\{\{(\w+)\}\}", lambda m: values.get(m.group(1), ""), template)
    # 404: 아직 빌드되지 않은 새 아이디 · /u/{아이디} 옛 주소 · 없는 페이지
    (OUT / "404.html").write_text(fill({"TITLE": "ditto!", "URL": SITE + "/", "OG_IMAGE": SITE + "/assets/og-landing.png",
                                         "PROFILE_HIDDEN": " hidden", "AVATAR_HIDDEN": " hidden", "KEY": key}))

    wordmark = Image.open(ROOT / "email/wordmark-white.png").convert("RGBA")
    (OUT / "og").mkdir()
    built = skipped = 0
    for row in profiles(key):
        handle = (row.get("handle") or "").strip().lower()
        if not HANDLE_RE.match(handle) or handle in reserved:
            skipped += 1
            continue
        name = (row.get("nickname") or "").strip() or handle
        avatar = row.get("avatar_url") or ""
        avatar_ok = avatar.startswith(SB + "/storage/")
        data = None
        if avatar_ok:
            try:
                data = get(avatar, timeout=20)
            except Exception:
                avatar_ok = False
        (OUT / "og" / f"{handle}.png").write_bytes(og_image(name, handle, data, wordmark))
        title = f"{name} (@{handle}) · ditto!"
        page = fill({
            "TITLE": html.escape(title), "URL": f"{SITE}/{handle}", "OG_IMAGE": f"{SITE}/og/{handle}.png",
            "NAME": html.escape(name), "HANDLE": handle, "INITIAL": html.escape(name[:1].upper()),
            "AVATAR": html.escape(avatar) if avatar_ok else "",
            "AVATAR_HIDDEN": "" if avatar_ok else " hidden", "FALLBACK_HIDDEN": " hidden" if avatar_ok else "", "KEY": key,
        })
        (OUT / handle).mkdir()
        (OUT / handle / "index.html").write_text(page)
        built += 1
    print(f"site: {OUT} · profiles built {built} · skipped {skipped}")


if __name__ == "__main__":
    main()
