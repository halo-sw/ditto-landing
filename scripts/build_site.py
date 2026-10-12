#!/usr/bin/env python3
"""ditto.place 빌드: 저장소 파일 + 공유한 사용자의 프로필 페이지(ditto.place/{아이디}) + 링크 미리보기 이미지.

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
SITE = "https://ditto.place"
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
        rows += json.loads(get(f"{SB}/rest/v1/profiles?select=handle,nickname,avatar_url,handle_color&handle=in.({urllib.parse.quote(chunk)})", {"apikey": key}))
    return rows


NUNITO_URL = "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nunito/Nunito-Italic%5Bwght%5D.ttf"


def font(weight, size, cache={}):
    """Pretendard {weight} (Bold·SemiBold·Medium·Regular) 또는 "Nunito900" 같은 Nunito Italic 굵기."""
    nunito = weight.startswith("Nunito")
    key = "NunitoItalic" if nunito else weight
    path = OUT.parent / f".font-{key}.otf"
    if key not in cache:
        if not path.exists():
            path.write_bytes(get(NUNITO_URL if nunito else FONT_URL.format(w=weight), timeout=60))
        cache[key] = str(path)
    f = ImageFont.truetype(cache[key], size)
    if nunito:
        f.set_variation_by_axes([int(weight[6:] or 800)])
    return f


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


# ── 링크 미리보기 (OG 1200×630) — 프로필 ──
# Splup 가이드 "OG 이미지" 규격: 핵심 내용은 가운데 1080×560 안전 영역(좌우 60 · 위아래 35) 안에.
# 앱 ProfileHandle 카드(높이 64 · 사방 8 · R16 · 아바타 48 R12 · 이름 16/500 · 아이디 12)를 2.5배로 그리고
# 그 사람의 profiles.handle_color(Profile handle v2) 그라디언트 · "{이름}의 플래터" · 대표 위젯 사진 3장 · 워드마크.
OG_W, OG_H, OG_SS = 1200, 630, 2   # 2배로 그린 뒤 줄여 가장자리를 매끄럽게


def _hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _tint(c, t):   # 화이트 쪽으로 t
    return tuple(round(v + (255 - v) * t) for v in c)


def _vgrad(w, h, top, bottom):
    g = Image.new("RGB", (1, 256))
    for y in range(256):
        g.putpixel((0, y), tuple(round(a + (b - a) * y / 255) for a, b in zip(top, bottom)))
    return g.resize((w, h), Image.BILINEAR)


def _rounded(im, r):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.width - 1, im.height - 1], r, fill=255)
    out = im.convert("RGBA")
    out.putalpha(mask)
    return out


def _shadow(canvas, box, r, blur, dy, alpha):
    from PIL import ImageFilter
    x0, y0, x1, y1 = box
    pad = blur * 3
    sh = Image.new("L", (x1 - x0 + pad * 2, y1 - y0 + pad * 2), 0)
    ImageDraw.Draw(sh).rounded_rectangle([pad, pad, pad + x1 - x0, pad + y1 - y0], r, fill=alpha)
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    canvas.paste(Image.new("RGB", sh.size, (40, 30, 60)), (x0 - pad, y0 - pad + dy), sh)


def _cover(path_or_bytes, size):
    src = io.BytesIO(path_or_bytes) if isinstance(path_or_bytes, bytes) else path_or_bytes
    return ImageOps.fit(ImageOps.exif_transpose(Image.open(src)).convert("RGB"), size, Image.LANCZOS)


def og_image(name, handle, avatar_bytes, wordmark, handle_color=None, thumbs=(), label=None):
    S = OG_SS
    W, H = OG_W * S, OG_H * S
    top, bottom, ink = (_hexrgb(c) for c in platter.handle_tone(handle_color))
    ink_soft = (85, 93, 109)
    # 바탕 — 핸들 색을 아주 옅게 (위 → 아래)
    img = _vgrad(W, H, _tint(top, .86), _tint(bottom, .70))
    d = ImageDraw.Draw(img)

    # 오른쪽: 대표 위젯 사진 3장 (세로 1 + 정사각 2). 모자라면 핸들 색 타일
    gx, gy, gw, gh, gap = 692 * S, 70 * S, 216 * S, 490 * S, 16 * S
    cells = [(gx, gy, gw, gh), (gx + gw + gap, gy, gw, (gh - gap) // 2), (gx + gw + gap, gy + (gh + gap) // 2, gw, (gh - gap) // 2)]
    pics = list(thumbs)[:3]
    for i, (x, y, w, h) in enumerate(cells):
        _shadow(img, (x, y, x + w, y + h), 28 * S, 14 * S, 6 * S, 46)
        tile = None
        if i < len(pics):
            try:
                tile = _cover(pics[i], (w, h))
            except Exception:
                tile = None
        if tile is None:
            tile = _vgrad(w, h, _tint(top, .25 + .2 * i), _tint(bottom, .1 + .2 * i))
            heart = wordmark.crop((round(wordmark.width * .81), 0, wordmark.width, round(wordmark.height * .72)))
            hh = round(w * .32)
            heart = heart.resize((round(heart.width * hh / heart.height), hh), Image.LANCZOS)
            tile.paste(Image.new("RGB", heart.size, (255, 255, 255)), ((w - heart.width) // 2, (h - hh) // 2), heart.split()[3])
        tile = _rounded(tile, 28 * S)
        img.paste(tile, (x, y), tile)

    # 왼쪽: 주소 · "{이름}의 플래터" · 핸들 카드 · 워드마크
    lx, max_w = 72 * S, 568 * S
    eyebrow = label or f"ditto.place/{handle}"
    f_eb, eyebrow = fit(d, eyebrow, "Nunito800", 28 * S, max_w)
    d.text((lx, 74 * S), eyebrow, font=f_eb, fill=ink_soft)
    who = name or handle
    f_t, title = fit(d, f"{who}의 플래터", "Bold", 68 * S, max_w)
    d.text((lx, 118 * S), title, font=f_t, fill=(23, 23, 25))

    # 핸들 카드 — 앱 64pt 카드 × 2.5
    k = 2.5 * S
    cx, cy, cw, ch = lx, 250 * S, max_w, round(64 * k)
    r = round(16 * k)
    _shadow(img, (cx, cy, cx + cw, cy + ch), r, round(8 * k), round(3 * k), 30)
    card = _vgrad(cw, ch, top, bottom).convert("RGBA")
    sheen = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sheen)
    for y in range(round(ch * .22)):
        sd.line([(0, y), (cw, y)], fill=(255, 255, 255, round(46 * (1 - y / (ch * .22)))))
    card = Image.alpha_composite(card, sheen)
    card = _rounded(card.convert("RGB"), r)
    img.paste(card, (cx, cy), card)
    pad, av = round(8 * k), round(48 * k)
    ax, ay = cx + pad, cy + pad
    pic = None
    if avatar_bytes:
        try:
            pic = _cover(avatar_bytes, (av, av))
        except Exception:
            pic = None
    if pic is None:   # 사진이 없으면 앱처럼 #F1F2F4 위 사람 실루엣
        pic = Image.new("RGB", (av, av), (241, 242, 244))
        pd = ImageDraw.Draw(pic)
        pd.ellipse([av * .34, av * .2, av * .66, av * .52], fill=(139, 144, 153))
        pd.rounded_rectangle([av * .18, av * .58, av * .82, av * .9], round(av * .16), fill=(139, 144, 153))
    pic = _rounded(pic, round(12 * k))
    img.paste(pic, (ax, ay), pic)
    # 친구 추가 버튼 44 원 #F0EDFF + 사람＋
    bs = round(44 * k)
    bx, by = cx + cw - pad - bs, cy + (ch - bs) // 2
    d.ellipse([bx, by, bx + bs, by + bs], fill=(240, 237, 255))
    g = (69, 70, 80)
    u = bs / 44
    d.ellipse([bx + 14.5 * u, by + 11 * u, bx + 24.5 * u, by + 21 * u], fill=g)
    d.rounded_rectangle([bx + 11 * u, by + 23 * u, bx + 26 * u, by + 32 * u], round(4.5 * u), fill=g)
    d.rounded_rectangle([bx + 29.6 * u, by + 21.5 * u, bx + 32.1 * u, by + 31.5 * u], round(1.25 * u), fill=g)
    d.rounded_rectangle([bx + 25.85 * u, by + 25.25 * u, bx + 35.85 * u, by + 27.75 * u], round(1.25 * u), fill=g)
    # 이름 16/500 · 아이디 12 (잉크 85%)
    tx = ax + av + round(8 * k)
    tw = bx - round(8 * k) - tx
    ink_rgb = ink
    sub_rgb = tuple(round(c * .85 + b * .15) for c, b in zip(ink_rgb, bottom))
    f_n, shown = fit(d, who, "Medium", round(16 * k), tw)
    f_h, shown_h = fit(d, "@" + handle, "Regular", round(12 * k), tw)
    mid = cy + ch / 2
    d.text((tx, mid - 2 * k), shown, font=f_n, fill=ink_rgb, anchor="ls")
    d.text((tx, mid + 2 * k), shown_h, font=f_h, fill=sub_rgb, anchor="lt")

    # 한 줄 소개 · 워드마크 (잉크)
    d.text((lx, 452 * S), "위젯으로 서로의 하루를 주고받는 친구들의 공간", font=font("SemiBold", 25 * S), fill=ink_soft)
    wm_h = 50 * S
    wm = wordmark.resize((round(wordmark.width * wm_h / wordmark.height), wm_h), Image.LANCZOS)
    img.paste(Image.new("RGB", wm.size, (23, 23, 25)), (lx, 510 * S), wm.split()[3])

    out = img.resize((OG_W, OG_H), Image.LANCZOS)
    # 사진이 들어가므로 JPEG (PNG는 500KB를 넘는다). 300KB 이하가 될 때까지 품질을 낮춘다
    for q in (90, 86, 82, 78):
        buf = io.BytesIO()
        out.save(buf, "JPEG", quality=q, optimize=True, progressive=True, subsampling=0 if q >= 86 else 2)
        if buf.tell() <= 300_000:
            break
    return buf.getvalue()


def og_thumbs(outdir, platter_html, limit=3):
    """대표(또는 시안) 플래터에 그린 순서대로, 빌드 때 받은 위젯 사진 중 충분히 큰 것."""
    out, seen = [], set()
    for name in re.findall(r"media/([0-9a-f]{12}\.(?:jpg|png|webp))", platter_html or ""):
        if name in seen:
            continue
        seen.add(name)
        p = outdir / "media" / name
        try:
            with Image.open(p) as im:
                if min(im.size) < 300:
                    continue
        except Exception:
            continue
        out.append(p)
        if len(out) == limit:
            break
    return out


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
    title = f"{name} (@{handle}) · ditto!"
    outdir.mkdir(parents=True, exist_ok=True)
    platter_html, n_widgets = platter.build(get, handle, outdir, platter_kind)
    og_path.parent.mkdir(parents=True, exist_ok=True)
    og_path.write_bytes(og_image(name, handle, data, wordmark, row.get("handle_color"),
                                 og_thumbs(outdir, platter_html), url.replace("https://", "")))
    page = fill({
        "TITLE": html.escape(title), "URL": url, "OG_IMAGE": og_url,
        "NAME": html.escape(name), "HANDLE": handle, "INITIAL": html.escape(name[:1].upper()),
        "AVATAR": html.escape(avatar) if avatar_ok else "",
        "AVATAR_HIDDEN": "" if avatar_ok else " hidden", "FALLBACK_HIDDEN": " hidden" if avatar_ok else "", "KEY": key,
        "PLATTER": platter_html, "WRAP_CLASS": " has-platter" if platter_html else "",
        "HANDLE_STYLE": platter.handle_style(row.get("handle_color")),   # 앱과 같은 핸들 색 (profiles.handle_color)
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
<meta name="description" content="실제 서버 데이터로 그린 10명의 플래터 — 프로필 시안 모음">
<meta property="og:type" content="website"><meta property="og:site_name" content="ditto!">
<meta property="og:url" content="{SITE}/demo/"><meta property="og:title" content="10명의 플래터 · ditto!">
<meta property="og:description" content="실제 서버 데이터로 그린 10명의 플래터 — 프로필 시안 모음">
<meta property="og:image" content="{SITE}/assets/og/demo-index.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="10명의 플래터 · ditto!">
<meta name="twitter:description" content="실제 서버 데이터로 그린 10명의 플래터 — 프로필 시안 모음"><meta name="twitter:image" content="{SITE}/assets/og/demo-index.jpg">
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
    # /i/{코드} = 초대장 [디토 앱에서 열기]. 앱이 있으면 유니버설 링크로 열려 여기 오지 않으니, 여기 왔다면 앱이 없는 것 →
    # 초대장(i.ditto.place)으로 돌려보내며 '앱 받기' 안내를 켠다.
    invite_redirect = """<script>
// 초대장 [디토 앱에서 열기] = ditto.place/i/{코드} — 앱이 있으면 유니버설 링크로 앱이 열려 여기까지 오지 않는다.
// 여기 왔다면 앱이 없는 것: 초대장(i.ditto.place)으로 돌려보내며 '앱 받기' 안내를 켠다.
(function () { var m = location.pathname.match(/^\\/i\\/([A-Za-z0-9]{6})\\/?$/); if (!m) return;
  var q = new URLSearchParams(location.search); q.set("noapp", "1");
  location.replace("https://i.ditto.place/" + m[1].toUpperCase() + "?" + q.toString()); })();
</script>
"""
    page404 = fill({"TITLE": "ditto!", "URL": SITE + "/", "OG_IMAGE": SITE + "/assets/og/brand-404.png",
                    "PROFILE_HIDDEN": " hidden", "AVATAR_HIDDEN": " hidden", "KEY": key, "PLATTER": "",
                    "HANDLE_STYLE": platter.handle_style(None)})
    (OUT / "404.html").write_text(page404.replace("<head>\n", "<head>\n" + invite_redirect, 1))

    wordmark = Image.open(ROOT / "email/wordmark-white.png").convert("RGBA")
    (OUT / "og").mkdir(exist_ok=True)
    built = skipped = 0
    for row in profiles(key):
        handle = (row.get("handle") or "").strip().lower()
        if not HANDLE_RE.match(handle) or handle in reserved:
            skipped += 1
            continue
        row = dict(row, handle=handle)
        n = profile_page(fill, row, key, wordmark, OUT / handle, f"{SITE}/{handle}", OUT / "og" / f"{handle}.jpg", f"{SITE}/og/{handle}.jpg")
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
                             OUT / "demo" / handle / "og.jpg", f"{SITE}/demo/{handle}/og.jpg", kind)
            print(f"demo: @{handle} {kind} 플래터 위젯 {n}개")
            shown.append(row)
        (OUT / "demo").mkdir(exist_ok=True)
        (OUT / "demo" / "index.html").write_text(demo_index(shown))
    print(f"site: {OUT} · profiles built {built} · skipped {skipped} · demo {len(demos)}")


if __name__ == "__main__":
    main()
