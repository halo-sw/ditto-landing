#!/usr/bin/env python3
"""ditto.at 빌드: 저장소 파일 + 공유한 사용자의 프로필 페이지(ditto.at/{아이디}) + 링크 미리보기 이미지.

프로필 페이지는 프로필 링크를 공유한 사람 것만 만든다. 공유 목록은
  1) Supabase public.profile_shares (앱에서 공유할 때 기록, 테이블이 있으면)
  2) scripts/shared-profiles.txt (한 줄에 아이디 하나, 수동 추가·예시용)

GitHub Actions(.github/workflows/pages.yml)가 주기적으로 실행해 GitHub Pages에 올린다.
프로필 페이지는 git에 커밋하지 않고 배포 산출물에만 들어간다. (예시 @ditto4037은 커밋해 둔다)

대표 플래터: SUPABASE_SERVICE_ROLE_KEY가 있으면 대표(rep) 플래터를 페이지에 그린다 (scripts/platter.py).

시안: scripts/demo-profiles.txt 의 계정(`아이디  platter=life`)은 /demo/{아이디}/ 에 그 플래터를 대표 자리에 그린다.
실제 사용자는 이 목록에 넣지 않는다 — 라이프 플래터는 목록에 적힌 시안 계정에서만 공개된다. /demo/ 는 목록 페이지.
위젯 테이블은 RLS로 막혀 있어 공개 키로는 읽을 수 없다. 키가 없으면 플래터 없이 프로필만 만든다.

  python3 scripts/build_site.py _site            # 전체
  PROFILE_LIMIT=3 python3 scripts/build_site.py _site   # 로컬 확인용
"""
import html, io, json, os, re, shutil, sys, urllib.error, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

sys.path.insert(0, str(Path(__file__).resolve().parent))
import platter  # noqa: E402

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


def listed_handles():
    handles = set()
    listed = ROOT / "scripts/shared-profiles.txt"
    if listed.exists():
        for line in listed.read_text().splitlines():
            line = line.split("#", 1)[0].strip().lstrip("@").lower()
            if line:
                handles.add(line)
    return handles


def demo_profiles():
    """scripts/demo-profiles.txt → [(아이디, 플래터)]. 플래터는 rep 또는 life."""
    out = []
    listed = ROOT / "scripts/demo-profiles.txt"
    if listed.exists():
        for line in listed.read_text().splitlines():
            parts = line.split("#", 1)[0].split()
            if not parts:
                continue
            handle = parts[0].lstrip("@").lower()
            opts = dict(x.split("=", 1) for x in parts[1:] if "=" in x)
            plat = opts.get("platter", "rep")
            if HANDLE_RE.match(handle) and plat in ("rep", "life"):
                out.append((handle, plat))
    return out


def shared_handles(key):
    handles = listed_handles()
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


def profiles(key, handles=None):
    handles = shared_handles(key) if handles is None else handles
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


def profile_page(fill, row, key, wordmark, outdir, url, og_path, og_url, platter_kind="rep"):
    """프로필 한 장 — outdir/index.html (+ media/) 과 og_path 미리보기 이미지. 그린 위젯 수를 돌려준다."""
    handle = row["handle"]
    name = (row.get("nickname") or "").strip() or handle
    avatar = row.get("avatar_url") or ""
    avatar_ok = avatar.startswith(SB + "/storage/")
    data = None
    if avatar_ok:
        try:
            data = get(avatar, timeout=20)
        except Exception:
            avatar_ok = False
    og_path.parent.mkdir(parents=True, exist_ok=True)
    og_path.write_bytes(og_image(name, handle, data, wordmark))
    title = f"{name} (@{handle}) · ditto!"
    outdir.mkdir(parents=True, exist_ok=True)
    platter_html, n_widgets = platter.build(get, handle, outdir, platter_kind)
    page = fill({
        "TITLE": html.escape(title), "URL": url, "OG_IMAGE": og_url,
        "NAME": html.escape(name), "HANDLE": handle, "INITIAL": html.escape(name[:1].upper()),
        "AVATAR": html.escape(avatar) if avatar_ok else "",
        "AVATAR_HIDDEN": "" if avatar_ok else " hidden", "FALLBACK_HIDDEN": " hidden" if avatar_ok else "", "KEY": key,
        "PLATTER": platter_html, "WRAP_CLASS": " has-platter" if platter_html else "",
    })
    (outdir / "index.html").write_text(page)
    return n_widgets


def demo_index(rows):
    """/demo/ — 시안 프로필 목록 (noindex)."""
    items = []
    for r in rows:
        av = r.get("avatar_url") or ""
        style = f' style="background-image:url({html.escape(av)})"' if av.startswith(SB + "/storage/") else ""
        name = html.escape((r.get("nickname") or r["handle"]).strip())
        items.append(f'<li><a href="/demo/{r["handle"]}/"><span class="av"{style}></span>'
                     f'<span class="t"><b>{name}</b><i>@{r["handle"]}</i></span><em>›</em></a></li>')
    items = "".join(items)
    return f"""<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>프로필 시안 · ditto!</title><meta name="robots" content="noindex, nofollow, noimageindex">
<link rel="icon" href="/favicon.ico" sizes="any">
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:"Pretendard Variable",Pretendard,-apple-system,sans-serif;background:#F3F0F7;color:#1C1722;-webkit-font-smoothing:antialiased}}
main{{max-width:430px;margin:0 auto;padding:32px 16px 48px}}
h1{{font-size:22px;font-weight:700;letter-spacing:-.02em}}
p{{margin-top:6px;font-size:14px;line-height:1.5;color:#6D5F7D;word-break:keep-all}}
ul{{list-style:none;margin-top:20px;display:flex;flex-direction:column;gap:8px}}
a{{display:flex;align-items:center;gap:12px;padding:10px 14px 10px 10px;border-radius:16px;background:#fff;text-decoration:none;color:inherit;box-shadow:0 1px 1.5px rgba(0,0,0,.06)}}
.av{{flex:none;width:48px;height:48px;border-radius:12px;background:#E7E1EE center/cover no-repeat}}
.t{{flex:1;display:flex;flex-direction:column;gap:2px}} .t b{{font-size:16px;font-weight:600}} .t i{{font-style:normal;font-size:12px;color:#6D5F7D}}
em{{font-style:normal;color:#6D5F7D;font-size:18px}}
</style></head><body><main>
<h1>프로필 시안</h1>
<p>실제 서버 데이터로 그린 프로필 페이지예요. 시안 계정의 플래터를 대표 플래터 자리에 보여 줘요.</p>
<ul>{items}</ul>
</main></body></html>
"""


def main():
    key = public_key()
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    reserved = set()
    # 목록 파일에 있는 아이디 폴더(커밋해 둔 예시 프로필)와 /demo/ 는 저장소 경로가 아니라 다시 만드는 산출물이다.
    generated = {h for h in listed_handles() if (ROOT / h / "index.html").exists()} | {"demo"}
    for p in ROOT.iterdir():
        if p.name in SKIP or p.name in generated:
            continue
        reserved.add(p.name.lower())
        (shutil.copytree if p.is_dir() else shutil.copy2)(p, OUT / p.name)
    reserved |= {"u", "og", "demo", "404.html", "index.html", "robots.txt", "sitemap.xml", "favicon.ico"}

    template = (ROOT / "scripts/profile.html").read_text()
    fill = lambda values: re.sub(r"\{\{(\w+)\}\}", lambda m: values.get(m.group(1), ""), template)
    # 404: 아직 빌드되지 않은 새 아이디 · /u/{아이디} 옛 주소 · 없는 페이지
    (OUT / "404.html").write_text(fill({"TITLE": "ditto!", "URL": SITE + "/", "OG_IMAGE": SITE + "/assets/og-landing.png",
                                         "PROFILE_HIDDEN": " hidden", "AVATAR_HIDDEN": " hidden", "KEY": key, "PLATTER": ""}))

    wordmark = Image.open(ROOT / "email/wordmark-white.png").convert("RGBA")
    (OUT / "og").mkdir(exist_ok=True)
    built = skipped = 0
    for row in profiles(key):
        handle = (row.get("handle") or "").strip().lower()
        if not HANDLE_RE.match(handle) or handle in reserved:
            skipped += 1
            continue
        row = dict(row, handle=handle)
        n = profile_page(fill, row, key, wordmark, OUT / handle, f"{SITE}/{handle}", OUT / "og" / f"{handle}.png", f"{SITE}/og/{handle}.png")
        if n:
            print(f"platter: @{handle} 대표 플래터 위젯 {n}개")
        built += 1

    # 시안 — 목록에 적힌 계정만, 적힌 플래터로
    demos = demo_profiles()
    if demos:
        plat = dict(demos)
        rows = {(r.get("handle") or "").lower(): r for r in profiles(key, sorted(plat))}
        shown = []
        for handle, kind in demos:
            row = rows.get(handle)
            if not row:
                print(f"demo: @{handle} 프로필 없음")
                continue
            row = dict(row, handle=handle)
            n = profile_page(fill, row, key, wordmark, OUT / "demo" / handle, f"{SITE}/demo/{handle}",
                             OUT / "demo" / handle / "og.png", f"{SITE}/demo/{handle}/og.png", kind)
            print(f"demo: @{handle} {kind} 플래터 위젯 {n}개")
            shown.append(row)
        (OUT / "demo").mkdir(exist_ok=True)
        (OUT / "demo" / "index.html").write_text(demo_index(shown))
    print(f"site: {OUT} · profiles built {built} · skipped {skipped} · demo {len(demos)}")


if __name__ == "__main__":
    main()
