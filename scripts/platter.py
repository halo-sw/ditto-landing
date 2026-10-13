"""공개 프로필 페이지의 대표 플래터 — 앱 GridEngine 규격을 그대로 옮긴 정적 HTML/CSS.

  · 8열 · 셀 = (폭 − 거터 8×7) ÷ 8 · 모서리 = min(20, 12 + (min(w,h) − 2)×2), 음악은 24 (Model/GridEngine.swift)
  · 디자인 기준 = 앱 Grid.width @ 390pt 화면 (390 − 마진 16×2 = 358, 셀 37.75 · 거터 8).
    모든 치수는 플래터 폭 비례(cqw)라 390 폭에서 앱과 1:1, 그 밖의 폭에서는 같은 비율로 늘고 준다.
  · 친구 플래터(Views/FriendPlatterDetail.swift)처럼: 디토 불가 위젯은 1px 테두리(#E7E1EE),
    디토 가능 위젯은 뒤 후광 + 우하단 DittoBadge 24.
  · 대표(rep) 플래터만, priv 위젯은 빼고 그린다. 라이프 플래터는 페이지에도 미디어에도 넣지 않는다.
    예외: scripts/demo-profiles.txt 에 `아이디  platter=life` 로 적은 시안 계정만 /demo/{아이디}/ 에 라이프 플래터를 대표 자리에 그린다.
  · 이미지는 빌드 때 받아 {아이디}/media/ 에 600px 이내로 저장한다 (핫링크 의존 없음, 음악 커버만 실패 시 핫링크).

위젯 테이블은 RLS로 막혀 있어 SUPABASE_SERVICE_ROLE_KEY가 있을 때만 그린다. 없으면 빈 문자열.
"""
import hashlib, html, io, json, os, shutil, urllib.parse
from pathlib import Path
from PIL import Image, ImageOps

SB = "https://lisqekczixwzshmpewzq.supabase.co"
MEDIA = SB + "/storage/v1/object/public/widget-media"
ROOT = Path(__file__).resolve().parent.parent
APP_ASSETS = Path(os.environ.get("DITTO_APP_ASSETS") or ROOT.parent / "prj_Ditto!/DittoPrototype/Assets.xcassets")

DESIGN_W = 358.0          # Grid.width @ 390pt = 8 × 37.75 + 7 × 8
UNIT, GUT = 45.75, 8.0    # 셀 피치 · 거터 (디자인 px)
COLS = 8


def u(n):
    """디자인 px → 플래터 폭 비례 길이 (플래터가 container라 cqw = 플래터 폭의 1%)."""
    return f"{n * 100 / DESIGN_W:.3f}cqw"


esc = lambda s: html.escape(str(s or ""), quote=True)


def radius(w):
    if w["type"] == "music":
        return 24
    return min(20, 12 + (min(w["w"], w["h"]) - 2) * 2)


def size_px(w):
    return w["w"] * UNIT - GUT, w["h"] * UNIT - GUT


# ───────────────────────── 데이터 ─────────────────────────

def fetch_rep(get, handle, key, platter="rep"):
    """플래터 위젯 (priv 제외, 그리드 밖·겹침은 버림). 기본은 대표(rep). 실패하면 예외."""
    if platter not in ("rep", "life"):
        raise ValueError(platter)
    hdr = {"apikey": key, "Authorization": "Bearer " + key}
    rows = json.loads(get(f"{SB}/rest/v1/profiles?select=user_id&handle=eq.{urllib.parse.quote(handle)}", hdr))
    if not rows:
        return None, []
    owner = rows[0]["user_id"]
    ws = json.loads(get(f"{SB}/rest/v1/widgets?select=id,platter,type,data&owner_id=eq.{owner}&platter=eq.{platter}", hdr))
    out, taken = [], set()
    for r in ws:
        d = dict(r.get("data") or {})
        if r.get("platter") != platter or d.get("priv") is True:
            continue
        d["type"] = r.get("type") or d.get("type") or ""
        try:
            c, rw, w, h = (int(d[k]) for k in ("col", "row", "w", "h"))
        except (KeyError, TypeError, ValueError):
            continue
        if w < 1 or h < 1 or c < 0 or rw < 0 or c + w > COLS:
            continue
        cells = {(x, y) for x in range(c, c + w) for y in range(rw, rw + h)}
        if cells & taken:
            continue
        taken |= cells
        d.update(col=c, row=rw, w=w, h=h, id=str(r.get("id") or d.get("id") or ""))
        out.append(d)
    out.sort(key=lambda d: (d["row"], d["col"]))
    attach_guestbook(get, hdr, owner, out)
    return owner, out


def attach_guestbook(get, hdr, owner, widgets):
    """방명록 글 = public.guestbook_entries (owner_id, widget_id) 최신순 → 위젯의 entries [{name, handle, message}].
    위젯 JSON의 옛 data.entries는 쓰지 않는다 (20261010235900_guestbook 에서 테이블로 옮김). 실패하면 빈 목록."""
    gbs = [w for w in widgets if w["type"] == "guestbook"]
    for w in gbs:
        w["entries"] = []
    if not gbs:
        return
    try:
        ids = ",".join(urllib.parse.quote(f'"{w["id"]}"') for w in gbs)
        rows = json.loads(get(f"{SB}/rest/v1/guestbook_entries?select=widget_id,author_name,author_handle,message"
                              f"&owner_id=eq.{owner}&widget_id=in.({ids})&order=created_at.desc&limit=200", hdr))
    except Exception as e:
        print(f"platter: 방명록 글을 읽지 못함 ({type(e).__name__})")
        return
    by_id = {w["id"]: w for w in gbs}
    for r in rows:
        w = by_id.get(r.get("widget_id"))
        if w is not None:
            w["entries"].append({"name": r.get("author_name") or r.get("author_handle") or "",
                                 "handle": r.get("author_handle") or "", "message": r.get("message") or ""})


def fetch_people(get, widgets, key):
    """방명록 글쓴이 아이디 → 프로필 사진 URL. 실패하면 빈 dict."""
    handles = sorted({e["handle"] for w in widgets if w["type"] == "guestbook" for e in gb_entries(w) if e["handle"]})
    if not handles:
        return {}
    hdr = {"apikey": key, "Authorization": "Bearer " + key}
    try:
        q = urllib.parse.quote(",".join(handles))
        rows = json.loads(get(f"{SB}/rest/v1/profiles?select=handle,avatar_url&handle=in.({q})", hdr))
        return {r["handle"].lower(): r["avatar_url"] for r in rows if (r.get("avatar_url") or "").startswith(SB + "/storage/")}
    except Exception as e:
        print(f"platter: 방명록 글쓴이를 읽지 못함 ({type(e).__name__})")
        return {}


def fetch_sources(get, owner, widgets, key):
    """디토 위젯 출처 — {위젯 id: {handle, avatar}}. dittos(placed_widget_id) → 원작자 프로필,
    없으면 내 친구 중 이름(from)이 같은 사람 (앱 DittoWidgetSourceInfo와 같은 규칙). 실패하면 빈 dict."""
    hdr = {"apikey": key, "Authorization": "Bearer " + key}
    dw = [w for w in widgets if w["type"] == "ditto" and w.get("from")]
    if not dw:
        return {}
    out = {}
    try:
        ids = ",".join(urllib.parse.quote(f'"{w["id"]}"') for w in dw)
        links = json.loads(get(f"{SB}/rest/v1/dittos?select=placed_widget_id,source_owner_id&placed_widget_id=in.({ids})", hdr))
        by_owner = {l["placed_widget_id"]: l["source_owner_id"] for l in links if l.get("source_owner_id")}
        friends = json.loads(get(f"{SB}/rest/v1/friendships?select=friend_id,nickname&owner_id=eq.{owner}", hdr)) if owner else []
        uids = sorted(set(by_owner.values()) | {f["friend_id"] for f in friends if f.get("friend_id")})
        profs = {}
        for i in range(0, len(uids), 80):
            q = ",".join(uids[i:i + 80])
            for p in json.loads(get(f"{SB}/rest/v1/profiles?select=user_id,handle,nickname,avatar_url&user_id=in.({q})", hdr)):
                profs[p["user_id"]] = p
        for w in dw:
            p = profs.get(by_owner.get(w["id"]))
            if not p:
                name = w["from"].strip()
                for f in friends:
                    fp = profs.get(f.get("friend_id"))
                    if fp and name in ((f.get("nickname") or "").strip(), (fp.get("nickname") or "").strip()):
                        p = fp
                        break
            if p and p.get("handle"):
                out[w["id"]] = {"handle": p["handle"], "avatar": p.get("avatar_url") or ""}
    except Exception as e:
        print(f"platter: 디토 출처를 읽지 못함 ({type(e).__name__})")
    return out


class Media:
    """위젯 이미지 → {아이디}/media/ 의 로컬 파일 (상대 경로). 못 구하면 None."""

    def __init__(self, get, outdir: Path, owner):
        self.get, self.dir, self.owner, self.cache = get, outdir / "media", owner, {}
        self.sources = {}   # 디토 위젯 id → 원작자 {handle, avatar}
        self.people = {}    # 아이디 → 프로필 사진 URL (방명록 글쓴이)

    def _save(self, data, ref, max_side=600):
        im = ImageOps.exif_transpose(Image.open(io.BytesIO(data)))
        alpha = False
        if im.mode in ("RGBA", "LA", "PA") or "transparency" in im.info:
            im = im.convert("RGBA")
            alpha = im.getchannel("A").getextrema()[0] < 250
        im = im.convert("RGBA" if alpha else "RGB")
        im.thumbnail((max_side, max_side), Image.LANCZOS)
        name = hashlib.sha1(f"{ref}@{max_side}".encode()).hexdigest()[:12] + (".png" if alpha else ".jpg")
        self.dir.mkdir(parents=True, exist_ok=True)
        if alpha:
            im.save(self.dir / name, "PNG", optimize=True)
        else:
            im.save(self.dir / name, "JPEG", quality=82, optimize=True, progressive=True)
        return im, "media/" + name

    def image(self, ref, max_side=600):
        """(상대 경로 또는 핫링크 URL, PIL 이미지 또는 None)"""
        if not ref or not isinstance(ref, str):
            return None, None
        if (ref, max_side) in self.cache:
            return self.cache[(ref, max_side)]
        res = (None, None)
        try:
            if ref.startswith("file:"):
                name = ref[5:]
                if "/" not in name and self.owner:
                    data = self.get(f"{MEDIA}/{self.owner}/{urllib.parse.quote(name)}", timeout=30)
                    im, path = self._save(data, ref, max_side)
                    res = (path, im)
            elif ref.startswith("https://"):
                try:
                    im, path = self._save(self.get(ref, timeout=30), ref, max_side)
                    res = (path, im)
                except Exception:
                    if "mzstatic.com" in ref:   # 음악 커버는 핫링크 허용
                        res = (ref, None)
            else:
                for ext in ("png", "jpg", "jpeg", "webp"):
                    hits = list((APP_ASSETS / f"{ref}.imageset").glob(f"*.{ext}")) if APP_ASSETS.exists() else []
                    if hits:
                        im, path = self._save(hits[0].read_bytes(), ref, max_side)
                        res = (path, im)
                        break
        except Exception:
            res = (None, None)
        self.cache[(ref, max_side)] = res
        return res

    def exists(self, ref):
        """영상 등 원본 그대로 쓸 파일 — 공개 버킷에 있으면 URL."""
        if not (isinstance(ref, str) and ref.startswith("file:") and self.owner):
            return None
        url = f"{MEDIA}/{self.owner}/{urllib.parse.quote(ref[5:])}"
        try:
            self.get(url, {"Range": "bytes=0-0"}, timeout=20)
            return url
        except Exception:
            return None


# ───────────────────────── 음악 커버 자동 컬러 (MusicArtworkPalette 포팅) ─────────────────────────

def _lum(c):
    def lin(v):
        v /= 255
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])


def _contrast(a, b):
    x, y = _lum(a), _lum(b)
    return (max(x, y) + 0.05) / (min(x, y) + 0.05)


def _mix(c, t):
    return tuple(round(v * (1 - t) + 255 * t) for v in c)


# ── 프로필 핸들 색 (Profile handle v2 · iOS DGrad.profileHandlePalettes · profiles.handle_color) ──
# 한 사람 = 한 색. 서버 값(프리셋 키 또는 #RRGGBB)을 앱과 같은 그라디언트로 그린다. 값이 없을 때만 기본(라벤더).
HANDLE_INK = (0x17, 0x17, 0x19)
HANDLE_PALETTES = {   # id: (top, bottom, life) — 이름(잉크 16/500)이 두 스톱 모두에서 ≥ 4.5:1
    "lavender": ("#CAB7F2", "#B092ED", "#C8B3F2"), "slate": ("#A8B3BF", "#79899B", "#A1ADB9"),
    "lime": ("#C5D593", "#A5BE57", "#C0D289"), "teal": ("#8FB2BD", "#5C8F9F", "#8DB0BC"),
    "gold": ("#D5C194", "#BF9F5B", "#D2BC8C"), "coral": ("#EDAE91", "#E07B4C", "#E9A382"),
    "pink": ("#EEAFC7", "#E37CA2", "#EBA3BE"), "sage": ("#B3BDA6", "#85946F", "#AAB49A"),
    "mauve": ("#B5ADBA", "#908498", "#B2A9B7"), "sky": ("#ADD5E5", "#79BBD4", "#A1CFE1"),
}
HANDLE_DEFAULT = "lavender"


def _hex(c):
    return "#%02X%02X%02X" % tuple(c)


def _rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _mixf(c, t):   # 화이트 쪽으로 t (0~1) — 앱 customTone과 같은 실수 블렌드
    return tuple(round((v / 255 + (1 - v / 255) * t) * 255) for v in c)


def handle_tone(value):
    """profiles.handle_color → (top, bottom, ink) hex. 앱 DGrad.profileTone(value:)과 같은 규칙 — 페이지 핸들과 링크 미리보기(OG)가 함께 쓴다."""
    v = (value or "").strip()
    if v.startswith("#") and len(v) == 7 and all(ch in "0123456789abcdefABCDEF" for ch in v[1:]):
        base = _rgb(v)
        white = (255, 255, 255)
        dark = True
        if _contrast(HANDLE_INK, base) < 4.5:
            if _contrast(white, _mixf(base, 0.18)) >= 4.5:
                dark = False
            else:
                t = 0.0
                while _contrast(HANDLE_INK, _mixf(_rgb(v), t)) < 4.5 and t < 1:
                    t += 0.02
                base = _mixf(_rgb(v), t)
        return _hex(_mixf(base, 0.35 if dark else 0.18)), _hex(base), "#171719" if dark else "#FFFFFF"
    top, bottom, _ = HANDLE_PALETTES.get(v, HANDLE_PALETTES[HANDLE_DEFAULT])
    return top, bottom, "#171719"


def handle_style(value):
    """profiles.handle_color → .handle 인라인 스타일 (--h-top · --h-bottom · 글자색)."""
    top, bottom, ink = handle_tone(value)
    sub = "rgba(23,23,25,.85)" if ink == "#171719" else "rgba(255,255,255,.85)"
    return f"--h-top:{top};--h-bottom:{bottom};--h-ink:{ink};--h-sub:{sub}"


def music_palette(im):
    keys = [(160, 160, 160)] * 2
    if im is not None:
        px = im.convert("RGB").resize((64, 64), Image.BILINEAR).getdata()
        buckets, ncount, nsum, total, chrom = {}, 0, [0, 0, 0], 0, 0
        for c in px:
            hi, lo = max(c), min(c)
            delta = hi - lo
            total += 1
            if hi < 24 or lo > 244:
                continue
            sat = delta / hi if hi else 0
            if sat < 0.16 or delta < 16:
                ncount += 1
                nsum = [a + b for a, b in zip(nsum, c)]
                continue
            r, g, b = c
            hue = (g - b) / delta if hi == r else (b - r) / delta + 2 if hi == g else (r - g) / delta + 4
            hue = (hue * 60 + 360) % 360
            k = int(hue // 20)
            bk = buckets.setdefault(k, {"n": 0, "sum": [0, 0, 0], "sat": 0, "br": 0, "hue": k * 20 + 10})
            bk["n"] += 1
            bk["sum"] = [a + b for a, b in zip(bk["sum"], c)]
            bk["sat"] += sat
            bk["br"] += hi / 255
            chrom += 1
        cands = sorted(
            ((tuple(round(s / b["n"]) for s in b["sum"]),
              (b["n"] / max(1, total)) ** 0.5 * (0.2 + (b["sat"] / b["n"]) ** 1.5) * (0.25 + 0.75 * b["br"] / b["n"]),
              b["hue"]) for b in buckets.values() if b["n"] >= max(2, total * 0.015)),
            key=lambda t: (-t[1], t[2]))
        if chrom < max(2, total * 0.04) or not cands:
            n = [s / ncount for s in nsum] if ncount else [160] * 3
            g = round(sum(n) / 3)
            keys = [(g, g, g)] * 2
        else:
            first = cands[0]
            second = next((c for c in cands if min(abs(c[2] - first[2]), 360 - abs(c[2] - first[2])) >= 40), None)
            keys = [first[0], second[0] if second else _mix(first[0], 0.22)]
    ink = (0x49, 0x40, 0x4B)

    def readable(k, t):
        c = _mix(k, t)
        while _contrast(c, ink) < 4.8 and t < 1:
            t = min(1, t + 0.02)
            c = _mix(k, t)
        return c
    hexc = lambda c: "#%02x%02x%02x" % c
    return hexc(readable(keys[0], 0.70)), hexc(readable(keys[0], 0.58)), hexc(readable(keys[1], 0.62))


# ───────────────────────── 위젯별 렌더러 ─────────────────────────

ARROW = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M3 7l4-4M4 3h3v3" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>'
CAMERA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.4-2h6.2l1.4 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'
PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>'
YT = ('<svg viewBox="0 0 20 14.4" aria-hidden="true"><rect width="20" height="14.4" rx="5.6" fill="#f00"/>'
      '<path d="M8.4 4.4v5.6l4.6-2.8z" fill="#fff"/></svg>')
BADGE = '<img class="dt-badge" src="/assets/dittobadge-32.svg" alt="" style="{}">'
PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>'


def service_tile(W, H, label, title, subtitle, content):
    """StandardServiceTiles.ServiceTile — 라벨 · 콘텐츠 · 제목 · 부제."""
    small = W < 110 and H < 120
    inset = 7 if small else 8 if W < 110 else 12
    ts = 10 if small else 13 if W < 150 else 17
    if W / max(H, 1) >= 1.7:
        return (f'<div class="st st-w" style="padding:{u(inset)};gap:{u(10)}">'
                f'<div class="st-body" style="flex:none;width:{u(min(H - inset * 2, W * 0.35))}">{content}</div>'
                f'<div class="st-col" style="gap:{u(4)}"><p class="st-label" style="font-size:{u(9)}">{esc(label)}</p>'
                f'<p class="st-title" style="font-size:{u(13)};-webkit-line-clamp:1">{esc(title)}</p>'
                f'<p class="st-sub" style="font-size:{u(10)}">{esc(subtitle)}</p></div></div>')
    parts = [f'<div class="st" style="padding:{u(inset)};gap:{u(3 if small else 6)}">']
    if H >= 160:
        parts.append(f'<div class="st-label" style="font-size:{u(10)}">{esc(label)}{ARROW}</div>')
    parts.append(f'<div class="st-body">{content}</div>')
    parts.append(f'<div class="st-title" style="font-size:{u(ts)};-webkit-line-clamp:{2 if W < 110 and not small else 1}">{esc(label if small else title)}</div>')
    if not small and H >= 160:
        parts.append(f'<div class="st-sub" style="font-size:{u(10)}">{esc(subtitle)}</div>')
    parts.append("</div>")
    return "".join(parts)


def r_block(w, W, H, m):
    tiny = w["w"] <= 2 and w["h"] <= 2
    large = w["w"] >= 6 and w["h"] >= 4
    horizontal = w["h"] <= 2 and not tiny
    compact = w["h"] <= 3
    pad = 8 if tiny else 16 if large else 12
    emoji_h = 24 if (tiny or compact or horizontal) else 32
    emoji_size = 20 if emoji_h == 24 else 24
    big_src = w["w"] >= 4 and w["h"] >= 4
    body_fs, body_lh = (17, 26) if large else (14, 20)
    src_fs, src_lh = (14, 20) if big_src else (12, 16)
    emoji = (w.get("emoji") or "").strip()
    source = (w.get("title") or "").strip() if w.get("title") is not None else "나의 아카이브 함"
    avail = H - 2 * pad - ((8 if not tiny else 4) + src_lh if source else 0)
    lines = max(1, int((avail if horizontal or not emoji else avail - emoji_h - 4) // body_lh))
    e = f'<span class="bl-emoji" style="font-size:{u(emoji_size)};height:{u(emoji_h)}">{esc(emoji)}</span>' if emoji else ""
    body = f'<p class="bl-text" style="font-size:{u(body_fs)};line-height:{u(body_lh)};-webkit-line-clamp:{lines}">{esc(w.get("text"))}</p>'
    src = (f'<p class="bl-src" style="font-size:{u(src_fs)};line-height:{u(src_lh)}"><span>{esc(source)}</span>›</p>' if source else "")
    return "", f'<div class="bl{" bl-h" if horizontal else ""}" style="padding:{u(pad)};gap:{u(4 if tiny else 8)}"><div class="bl-main">{e}{body}</div>{src}</div>', "글", w.get("text")


def r_video(w, W, H, m):
    poster, _ = m.image(w.get("img") or w.get("poster"))
    src = m.exists(w.get("videoPath"))
    title = w.get("title") or ""
    padx, pady = (16, 14) if w["w"] >= 3 else (12, 10)
    img = f'<img class="cover" src="{esc(poster)}" alt="" loading="lazy">' if poster else ""
    vid = (f'<video class="cover vd" src="{esc(src)}" playsinline muted preload="none"'
           f'{f" poster={chr(34)}{esc(poster)}{chr(34)}" if poster else ""}></video>') if src else ""
    inner = (f'{img}{vid}<div class="vd-shade"></div>'
             f'<p class="vd-title" style="font-size:{u(17)};line-height:{u(24)};padding:{u(pady)} {u(padx)} 0">{esc(title)}</p>'
             f'<span class="vd-yt" style="width:{u(20)};height:{u(14.4)};right:{u(14)};bottom:{u(12)}">{YT}</span>')
    attrs = ' data-act="video"' if src else ' data-dl data-msg="video"'
    return attrs, inner, "영상", title


def r_sticker(w, W, H, m):
    dots = w.get("stickers") or []
    out = []
    if dots:
        for i, d in enumerate(dots):
            try:
                x, y = float(d.get("x", 0.5)), float(d.get("y", 0.5))
            except (TypeError, ValueError):
                continue
            s = float(d.get("s") or 1)
            r = float(d["r"]) if d.get("r") is not None else (i * 47) % 36 - 18
            if d.get("img"):
                path, _ = m.image(d["img"], 160)
                if not path:
                    continue   # 그린 스티커 파일이 버킷에 없으면 건너뛴다
                side = (48 if str(d["img"]).startswith("file:") else 34) * s
                flat = ' class="flat"' if path.endswith(".jpg") else ""   # 흰 바탕 에셋은 카드 색에 녹인다
                body = f'<img{flat} src="{esc(path)}" alt="" style="width:{u(side)};height:{u(side)}">'
            elif d.get("e"):
                body = f'<span style="font-size:{u((24 + (i % 3) * 5) * s)}">{esc(d["e"])}</span>'
            else:
                continue
            out.append(f'<i class="sk" style="left:{x * 100:.2f}%;top:{y * 100:.2f}%;--r:{r:.1f}deg;--d:{(i * 0.37) % 2.4:.2f}s">{body}</i>')
    else:
        pos = [(0.25, 0.25), (0.7, 0.2), (0.45, 0.55), (0.8, 0.6), (0.2, 0.75), (0.6, 0.85)]
        for i, e in enumerate(list(w.get("emoji") or "✨💖🌟")[:6]):
            x, y = pos[i % 6]
            out.append(f'<i class="sk" style="left:{x * 100}%;top:{y * 100}%;--r:{(i * 47) % 40 - 20}deg;--d:{(i * 0.37) % 2.4:.2f}s">'
                       f'<span style="font-size:{u(24 + (i % 3) * 6)}">{esc(e)}</span></i>')
    if w.get("text"):
        out.append(f'<p class="sk-text" style="font-size:{u(13)}">{esc(w["text"])}</p>')
    return "", "".join(out), "스티커", ""


def frames_of(w, m):
    refs = []
    for k in ("frames",):
        refs += [r for r in (w.get(k) or []) if isinstance(r, str)]
    for k in ("polImg", "img"):
        if isinstance(w.get(k), str) and w[k] not in refs:
            refs.insert(0, w[k])
    return [p for p in (m.image(r)[0] for r in refs) if p]


def flip_box(frames, cls):
    if not frames:
        return f'<div class="{cls} empty"><i style="width:{u(20)};height:{u(20)}">{CAMERA}</i></div>'
    imgs = "".join(f'<img src="{esc(p)}" alt=""{"" if i == 0 else " hidden"} loading="lazy">' for i, p in enumerate(frames))
    dots = (f'<span class="fl-count">1/{len(frames)}</span>' if len(frames) > 1 else "")
    return f'<div class="{cls}">{imgs}{dots}</div>'


def r_polaroid(w, W, H, m):
    frames = frames_of(w, m)
    cap = (w.get("polCaption") or "").strip()
    title = "폴라로이드" if frames else "첫 장을 남겨봐"
    content = f'<div class="pol">{flip_box(frames, "pol-photo")}<div class="pol-chin"></div></div>'
    attrs = ' data-act="flip"' if len(frames) > 1 else ' data-dl'
    return attrs, service_tile(W, H, "폴라로이드", title, cap or "한 장의 순간", content), "폴라로이드", cap


def r_paparazzi(w, W, H, m):
    frames = frames_of(w, m)
    by = w.get("by")
    content = f'<div class="pap">{flip_box(frames, "pap-photo")}</div>'
    attrs = ' data-act="flip"' if len(frames) > 1 else ' data-dl'
    return attrs, service_tile(W, H, "파파라치", w.get("title") or "친구가 담은 나",
                               f"photo by. {by}" if by else "친구의 시선으로 남은 순간", content), "파파라치", w.get("title")


def r_ask(w, W, H, m):
    title = w.get("text") or "무엇이든 물어봐"
    inset = min(16, max(8, W * 0.065))
    art = '<img class="ask-art" src="/assets/platter/ask-mailbox.png" alt="">'
    preview = (f'<p class="ask-q" style="font-size:{u(11)};padding:{u(6)} {u(7)};border-radius:{u(8)}">첫 질문을 남겨봐</p>')
    if W / max(H, 1) >= 1.7:
        inner = (f'<div class="ask ask-h" style="padding:{u(inset)};gap:{u(8)}">'
                 f'<div style="width:{u(min(H * 0.9, W * 0.3))}">{art}</div><div class="ask-col" style="gap:{u(4)}">'
                 f'<p class="ask-k" style="font-size:{u(9)}">ASK</p><p class="ask-t" style="font-size:{u(min(18, max(12, W * 0.055)))}">{esc(title)}</p>{preview}</div></div>')
    else:
        head = (f'<p class="ask-k" style="font-size:{u(10)}"><span>ASK</span>{ARROW}</p>' if H >= 160 else "")
        inner = (f'<div class="ask" style="padding:{u(inset)};gap:{u(5 if H >= 160 else 3)}">{head}'
                 f'<div class="ask-artbox" style="height:{u(max(35, min(H * 0.38, W * 0.64)))}">{art}</div>'
                 f'<p class="ask-t" style="font-size:{u(min(23, max(13, W * 0.115)))};-webkit-line-clamp:{2 if W < 130 else 1}">{esc(title)}</p>'
                 f'<span class="grow"></span>{preview}'
                 + (f'<p class="ask-a" style="font-size:{u(10)}">익명으로 질문하기</p>' if H >= 220 else "") + '</div>')
    return ' data-dl data-msg="ask"', inner, "Ask", title


def ditto_layout(ww, hh):
    """DittoWidgetLayout.of — (출처 변형, 배지 한 변, 가장자리 여백). Views/DittoWidgetTile.swift"""
    if ww >= 6 and hh >= 6:
        return "caption", 32, 12
    if ww >= 4 and hh >= 4 and max(ww, hh) >= 6:
        return "standard", 32, 12
    if ww >= 4 and hh >= 4:
        return "standard", 24, 8
    if ww <= 2:
        return ("narrow" if hh >= 4 else "none"), 24, 8
    if hh <= 2:
        return ("compact" if ww >= 6 else "text"), 24, 8
    return "compact", 24, 8


def r_ditto(w, W, H, m):
    """DittoWidgetTile — 사진 > 이모지 > 제목, 우상단 DittoBadge(가져온 위젯만), 좌하단 흰 출처 칩(아이디 + 프로필)."""
    ww, hh = w["w"], w["h"]
    kind, badge, inset = ditto_layout(ww, hh)
    src_h = {"text": 24, "compact": 28, "standard": 32, "narrow": 44}.get(kind, 0)
    media_h = H if kind == "none" else max(H * 0.5, H - 96) if kind == "caption" else max(H * 0.55, H - src_h - inset)
    photo, _ = m.image(w.get("img") or w.get("polImg"))
    frm = (w.get("from") or "").strip()
    if photo:
        media = f'<img class="cover" src="{esc(photo)}" alt="" loading="lazy"><span class="soft"></span>'
    elif w.get("emoji"):
        media = f'<span class="dt-emoji" style="height:{u(media_h)};font-size:{u(min(W, H) * 0.42)}">{esc(w["emoji"])}</span>'
    else:
        fs = 17 if min(W, H) >= 120 else 14
        media = (f'<span class="dt-title" style="height:{u(media_h)};font-size:{u(fs)};padding:0 {u(inset + 4)}">'
                 f'{esc(w.get("title") or "디토 위젯")}</span>')
    src = m.sources.get(w.get("id")) or {}
    handle = ("@" + src["handle"]) if src.get("handle") else frm
    av_path = m.image(src.get("avatar"), 96)[0] if src.get("avatar") else None

    def avatar_html(av):
        st = f'width:{u(av)};height:{u(av)};border-radius:{u(av / 3)}'
        if av_path:
            return f'<img class="dt-av" src="{esc(av_path)}" alt="" style="{st}">'
        return f'<i class="dt-av" style="{st}"></i>'
    chip = ""
    if handle and kind in ("text", "compact", "standard", "narrow"):
        std = kind == "standard"
        av = 24 if std else 20
        avatar = avatar_html(av)
        if kind == "text":
            chip = (f'<span class="dt-src" style="left:{u(inset)};bottom:{u(inset)};width:{u(min(70, W - inset * 2))};height:{u(24)};'
                    f'padding:0 {u(6)};border-radius:{u(8)};font-size:{u(12)};line-height:{u(16)}"><b>{esc(handle)}</b></span>')
        elif kind == "narrow":
            chip = (f'<span class="dt-src dt-src-n" style="left:{u(inset)};right:{u(inset)};bottom:{u(inset)};height:{u(44)};'
                    f'padding:0 {u(6)};gap:{u(2)};border-radius:{u(8)};font-size:{u(12)};line-height:{u(16)}">{avatar}<b>{esc(handle)}</b></span>')
        else:
            chip = (f'<span class="dt-src" style="left:{u(inset)};bottom:{u(inset)};width:{u(min(132 if std else 108, W - inset * 2))};'
                    f'height:{u(32 if std else 28)};padding:0 {u(6)};gap:{u(6)};border-radius:{u(8)};'
                    f'font-size:{u(14 if std else 12)};line-height:{u(20 if std else 16)}">{avatar}<b>{esc(handle)}</b></span>')
    elif handle and kind == "caption":
        cap = (w.get("polCaption") or w.get("title") or "").strip()
        chip = (f'<span class="dt-cap{" on" if photo else ""}" style="padding:{u(24)} {u(16)} {u(12)};gap:{u(8)}">'
                + (f'<b style="font-size:{u(17)};line-height:{u(24)}">{esc(cap)}</b>' if cap else "")
                + f'<span style="gap:{u(8)};font-size:{u(14)};line-height:{u(20)}">{avatar_html(24)}{esc(handle)}</span></span>')
    b = BADGE.format(f"top:{u(inset)};right:{u(inset)};width:{u(badge)};height:{u(badge)}") if frm else ""
    return ' data-dl data-msg="ditto"', media + chip + b, "디토 위젯", f"from. {handle}" if handle else ""


def r_music(w, W, H, m):
    cover, im = m.image(w.get("img"))
    top, mid, bot = music_palette(im)
    ww, hh = w["w"], w["h"]
    # MusicCDPLayout — 디자인 좌표 (실제 크기에 비례해 위치만 늘림)
    if ww <= 2 and hh <= 2:
        dw, dh, disc, info, ts, as_ = 86.5, 86.5, (18.5, 8, 49.5), (8, 65.5, 70.5), (10, 13), None
    elif ww <= 2:
        dw, dh, disc, info, ts, as_ = 86.5, 275.5, (12, 16, 62.5), (12, 102, 62.5), (14, 18), (11, 16)
    elif hh <= 2:
        dw, dh, disc, info, ts, as_ = (275.5, 86.5, (205, 16, 54.5), (16, 12, 177), (17, 20), (12, 17)) if ww >= 6 else \
                                      (181, 86.5, (106.5, 12, 62.5), (12, 16.75, 82.5), (14, 18), (10, 14))
    elif ww >= 6 and hh >= 6:
        dw, dh, disc, info, ts, as_ = 275.5, 275.5, (159.5, 16, 100), (16, 128, 243.5), (22, 26), (13, 18)
    elif ww >= 6:
        dw, dh, disc, info, ts, as_ = 275.5, 181, (159.5, 16, 100), (16, 20, 131.5), (20, 24), (12, 17)
    elif hh >= 6:
        dw, dh, disc, info, ts, as_ = 181, 275.5, (26.5, 16, 128), (16, 160, 149), (18, 22), (12, 17)
    elif ww <= 3 and hh <= 3:
        dw, dh, disc, info, ts, as_ = 133.75, 133.75, (33, 12, 67.75), (12, 87.75, 109.75), (12, 18), (10, 14)
    elif hh <= 3:
        dw, dh, disc, info, ts, as_ = 181, 133.75, (56.63, 12, 67.75), (12, 87.75, 157), (14, 18), (10, 14)
    elif ww <= 3:
        dw, dh, disc, info, ts, as_ = 133.75, 181, (18.88, 12, 96), (12, 116, 109.75), (12, 18), (10, 14)
    else:
        dw, dh, disc, info, ts, as_ = 181, 181, (42.5, 12, 96), (28.5, 125, 124), (14, 18), (10, 14)
    sx, sy = W / dw, H / dh
    centered = not (hh <= 2 and ww >= 4) and not (ww >= 6 and hh < 6)
    d = disc[2] * min(sx, sy)
    dx, dy = disc[0] * sx + (disc[2] * sx - d) / 2, disc[1] * sy
    art = f'<img src="{esc(cover)}" alt="" loading="lazy">' if cover else ""
    disc_html = (f'<span class="cd" style="left:{u(dx)};top:{u(dy)};width:{u(d)};height:{u(d)}">'
                 f'<span class="cd-rot">{art}<span class="cd-grooves"></span></span><span class="cd-sheen"></span>'
                 f'<span class="cd-hub"></span><span class="cd-hole"></span></span>')
    title = esc(w.get("title"))
    artist = esc(w.get("artist"))
    info_html = (f'<span class="mu-info{" c" if centered else ""}" style="left:{u(info[0] * sx)};top:{u(info[1] * sy)};width:{u(info[2] * sx)}">'
                 f'<b style="font-size:{u(ts[0])};line-height:{u(ts[1])}">{title}</b>'
                 + (f'<span style="font-size:{u(as_[0])};line-height:{u(as_[1])}">{artist}</span>' if as_ and artist else "")
                 + "</span>")
    audio = w.get("mediaURL") if str(w.get("mediaURL") or "").startswith("https://") else ""
    extra = ""
    attrs = ' data-dl'
    if audio:
        extra = (f'<audio preload="none" src="{esc(audio)}"></audio>'
                 f'<span class="mu-bar" style="left:{u(14)};right:{u(14)};bottom:{u(9)};height:{u(3)}"><i></i></span>')
        attrs = ' data-act="music"'
    style = f"background:linear-gradient(135deg,{top} 0%,{mid} 48%,{bot} 100%)"
    return attrs, disc_html + info_html + extra, "음악", f"{w.get('title') or ''} · {w.get('artist') or ''}", style


def r_image(w, W, H, m):
    path, _ = m.image(w.get("img"))
    title = (w.get("title") or "").strip()
    inner = f'<img class="cover" src="{esc(path)}" alt="" loading="lazy"><span class="soft"></span>' if path else f'<span class="ph">{CAMERA}</span>'
    if title:
        fs = 12 if w["w"] <= 2 else 14 if (w["w"] <= 3 or w["h"] <= 2) else 17
        pad = 8 if w["w"] <= 2 else 12 if w["w"] <= 4 else 16
        inner += f'<p class="im-title" style="font-size:{u(fs)};padding:{u(pad)} {u(pad)} {u(20)}">{esc(title)}</p>'
    return "", inner, "사진", title


def _style(w):
    return w.get("style") if isinstance(w.get("style"), dict) else {}


def _fg(w, default):
    fg = _style(w).get("fg")
    return fg if isinstance(fg, str) and fg.startswith("#") and len(fg) in (4, 7) else default


def r_text(w, W, H, m):
    """WidgetContent.textView — 13 Medium · 줄간 0.55 · 여백 12 · style(fg·굵게·기울임·밑줄·취소선·정렬·위치)."""
    st = _style(w)
    deco = " ".join(x for x, k in (("underline", "underline"), ("line-through", "strike")) if st.get(k))
    pos = {"tl": ("flex-start", "flex-start"), "tc": ("flex-start", "center"), "tr": ("flex-start", "flex-end"),
           "ml": ("center", "flex-start"), "mc": ("center", "center"), "mr": ("center", "flex-end"),
           "bl": ("flex-end", "flex-start"), "bc": ("flex-end", "center"), "br": ("flex-end", "flex-end")}.get(st.get("pos"), ("flex-start", "flex-start"))
    align = {"center": "center", "right": "right"}.get(st.get("align"), "left")
    css = (f"padding:{u(12)};font-size:{u(13)};line-height:{u(20)};color:{_fg(w, 'rgba(18,18,18,.72)')};"
           f"justify-content:{pos[0]};align-items:{pos[1]};text-align:{align};"
           f"font-weight:{700 if st.get('bold') else 500};{'font-style:italic;' if st.get('italic') else ''}"
           f"{'text-decoration:' + deco + ';' if deco else ''}")
    return "", f'<div class="tx" style="{css}"><p>{esc(w.get("text"))}</p></div>', "글", w.get("text")


def r_status(w, W, H, m):
    """WidgetContent.statusView — 넓으면 가로(이모지 22 · 라벨 16 SemiBold), 아니면 세로(이모지 28 · 라벨 13 SemiBold)."""
    e, label = esc(w.get("emoji")), esc(w.get("label") or w.get("text"))
    color = _fg(w, "#171719")
    if w["w"] > w["h"]:
        inner = (f'<div class="ss ss-h" style="padding:0 {u(14)};gap:{u(9)}"><span style="font-size:{u(22)}">{e}</span>'
                 f'<b style="font-size:{u(16)};color:{color}">{label}</b></div>')
    else:
        inner = (f'<div class="ss" style="gap:{u(6)}"><span style="font-size:{u(28)}">{e}</span>'
                 f'<b style="font-size:{u(13)};color:{color}">{label}</b></div>')
    return "", inner, "상태", w.get("label") or w.get("text")


def r_mood(w, W, H, m):
    """WidgetContent.moodView — 이모지 28 · 본문 14 SemiBold(2줄) · '오늘의 기분' 11."""
    text = (w.get("text") or "").strip()
    inner = (f'<div class="md" style="padding:0 {u(14)};gap:{u(10)}"><span class="md-e" style="font-size:{u(28)}">{esc(w.get("emoji") or "😊")}</span>'
             f'<span class="md-col" style="gap:{u(3)}"><b style="font-size:{u(14)};line-height:{u(19)}">{esc(text or "오늘 기분을 남겨보세요")}</b>'
             f'<span style="font-size:{u(11)}">오늘의 기분</span></span></div>')
    return "", inner, "오늘의 기분", text


def r_diary(w, W, H, m):
    """WidgetContent.diaryView — '한줄일기' 11 · 본문 14 기울임(줄간 4). 제목(날짜)이 있으면 오른쪽에."""
    text = (w.get("text") or "").strip()
    date = (w.get("title") or "").strip()
    head = f'<p class="dy-k" style="font-size:{u(11)}"><span>한줄일기</span>{f"<span>{esc(date)}</span>" if date else ""}</p>'
    lines = max(1, int((H - 24 - 20) // 25))
    inner = (f'<div class="dy" style="padding:{u(12)};gap:{u(6)}">{head}'
             f'<p class="dy-t" style="font-size:{u(14)};line-height:{u(25)};-webkit-line-clamp:{lines}">{esc(text or "오늘을 한 줄로 남겨보세요")}</p></div>')
    return "", inner, "한줄일기", text


def _apple_date(v):
    """앱 Date(기준 2001-01-01 UTC 초) → unix ms. 숫자가 아니면 None."""
    try:
        return int((float(v) + 978307200) * 1000)
    except (TypeError, ValueError):
        return None


def r_dday(w, W, H, m):
    """WidgetContent.ddayView — 'D-n' 26 Bold 세리프 이탤릭 #4a3f8f · 제목 11. 날짜 차이는 보는 날 기준으로 다시 센다(data-dday)."""
    ms = _apple_date(w.get("date"))
    label = "D-DAY"
    if ms is not None:
        import datetime
        kst = datetime.timezone(datetime.timedelta(hours=9))
        d = datetime.datetime.fromtimestamp(ms / 1000, kst).date()
        n = (d - datetime.datetime.now(kst).date()).days
        label = f"D-{n}" if n > 0 else "D-DAY" if n == 0 else ("1년+" if n < -365 else f"D+{-n}")
    fs = 26 if len(label) <= 4 else 21   # 'D-DAY'·'D+123'은 2칸 폭에 한 줄로
    attr = f' data-dday="{ms}" data-fs="{26 * 100 / DESIGN_W:.3f}"' if ms is not None else ""
    inner = (f'<div class="dd" style="gap:{u(4)}"><b{attr} style="font-size:{u(fs)}">{label}</b>'
             f'<span style="font-size:{u(11)}">{esc(w.get("title"))}</span></div>')
    return "", inner, "D-Day", f'{w.get("title") or ""} {label}'


def r_place(w, W, H, m):
    """WidgetContent.placeView — 📍 22 · 동네 이름 13 SemiBold #1f5c4d · 아래 줄 11 (제목, 없으면 '동네')."""
    color = _fg(w, "#1f5c4d")
    inner = (f'<div class="ss" style="gap:{u(4)};color:{color}"><span style="font-size:{u(22)}">📍</span>'
             f'<b style="font-size:{u(13)};color:inherit">{esc(w.get("label"))}</b>'
             f'<span class="sub" style="font-size:{u(11)}">{esc(w.get("title") or "동네")}</span></div>')
    return "", inner, "동네", w.get("label")


def r_weather(w, W, H, m):
    """WidgetContent.weatherView — 이모지 28 · 제목 16 SemiBold · 라벨 11."""
    inner = (f'<div class="ss wt" style="gap:{u(3)}"><span style="font-size:{u(28)}">{esc(w.get("emoji") or "☀️")}</span>'
             f'<b style="font-size:{u(16)}">{esc(w.get("title"))}</b>'
             f'<span class="sub" style="font-size:{u(11)}">{esc(w.get("label"))}</span></div>')
    return "", inner, "날씨", f'{w.get("title") or ""} {w.get("label") or ""}'


def r_voice(w, W, H, m):
    """WidgetContent.voiceView — 막대 8개 #c98a2e · ▶ 길이 11 #8a5d16. 녹음 파일은 앱에만 있어 재생은 앱 안내."""
    bars = "".join(f'<i style="height:{u(h)}"></i>' for h in (6, 12, 18, 9, 15, 7, 13, 10))
    inner = (f'<div class="vo" style="gap:{u(8)}"><span class="vo-bars" style="gap:{u(2.5)}">{bars}</span>'
             f'<span class="vo-t" style="font-size:{u(11)};gap:{u(5)}"><i>▶</i>{esc(w.get("label") or "0:12")}</span></div>')
    return ' data-dl data-msg="voice"', inner, "음성 메모", w.get("label")


def r_gif(w, W, H, m):
    """WidgetContent.gifView — 이미지가 있으면 그 이미지, 없으면 이모지 28 + 'GIF' 11."""
    path, _ = m.image(w.get("img"))
    if path:
        return "", f'<img class="cover" src="{esc(path)}" alt="" loading="lazy">', "GIF", w.get("title")
    inner = (f'<div class="ss gf" style="gap:{u(5)}"><span style="font-size:{u(28)}">{esc(w.get("emoji"))}</span>'
             f'<span class="sub" style="font-size:{u(11)}">GIF</span></div>')
    return "", inner, "GIF", w.get("title")


def r_nowplaying(w, W, H, m):
    """WidgetContent.nowplayingView — 보라 막대 4개 · 제목 14 SemiBold 흰색 · '아티스트 · 지금 듣는 중' 11."""
    bars = "".join(f'<i style="height:{u(h)}"></i>' for h in (9, 15, 6, 12))
    inner = (f'<div class="np" style="padding:0 {u(14)};gap:{u(11)}"><span class="np-bars" style="gap:{u(2.5)};height:{u(16)}">{bars}</span>'
             f'<span class="np-col" style="gap:{u(3)}"><b style="font-size:{u(14)};line-height:{u(19)}">{esc(w.get("title"))}</b>'
             f'<span style="font-size:{u(11)}">{esc(w.get("artist"))} · 지금 듣는 중</span></span></div>')
    return "", inner, "지금 듣는 중", f'{w.get("title") or ""} · {w.get("artist") or ""}'


def gb_entries(w):
    """방명록 글 — attach_guestbook이 채운 entries [{name, handle, message}], 앞이 최신 (guestbook_entries.created_at desc)."""
    out = []
    for e in w.get("entries") or []:
        if isinstance(e, dict) and str(e.get("message") or "").strip():
            out.append({"name": str(e.get("name") or e.get("handle") or "").strip(), "handle": str(e.get("handle") or "").strip().lstrip("@").lower(),
                        "message": str(e["message"]).strip()})
    return out


def r_guestbook(w, W, H, m):
    """StandardServiceTiles.SpecialGuestbookTile — 안쪽 카드에 최신 글 + 'from. 이름'(공간이 있으면 프로필), 아래 제목 ·
    'from. 이름 · 안부 남기기'. 글이 없으면 첫 안부 안내."""
    entries = gb_entries(w)
    small = W < 110
    fs = 9 if small else 12
    pad = 6 if small else 10
    title = w.get("title") or "다녀간 마음"
    if not entries:
        content = (f'<p class="gb" style="font-size:{u(fs)};line-height:{u(fs * 1.45)};padding:{u(pad)};border-radius:{u(10)}">'
                   f'첫 안부를 기다려요.<br>짧은 한 줄을 남겨봐.</p>')
        return (' data-dl data-msg="guestbook"', service_tile(W, H, "방명록", title, "첫 안부를 남겨봐", content), "방명록", title)
    e = entries[0]
    lines = 2 if H < 150 else 6 if small else 3
    av_path = m.image(m.people.get(e["handle"]), 96)[0] if e["handle"] and m.people.get(e["handle"]) else None
    av = (f'<img class="gb-av" src="{esc(av_path)}" alt="" style="width:{u(16)};height:{u(16)};border-radius:{u(5)}">'
          if av_path and not small and H >= 160 else "")
    who = (f'<span class="gb-from" style="font-size:{u(10 if small else 11)};gap:{u(4)}">{av}from. {esc(e["name"])}</span>'
           if H >= 150 else "")
    content = (f'<div class="gb gb-on" style="padding:{u(pad)};border-radius:{u(10)};gap:{u(4)}">'
               f'<p style="font-size:{u(fs)};line-height:{u(fs * 1.45)};-webkit-line-clamp:{lines}">{esc(e["message"])}</p>{who}</div>')
    sub = f'from. {e["name"]} · 안부 남기기'
    label = f'{title}, {e["name"]}: {e["message"]}'
    return (' data-dl data-msg="guestbook"', service_tile(W, H, "방명록", title, sub, content), "방명록", label)


def r_collection(w, W, H, m):
    """WidgetContent.collectionView — 제목 11 · 3열 카드(이모지 + 이름)."""
    titles = [t for t in (w.get("text") or "").split("\n") if t.strip()][:6]
    emojis = ["🎬", "📀", "📚", "🍿", "🎞", "📖"]
    cards = "".join(f'<span class="cl-c" style="border-radius:{u(7)};gap:{u(2)}"><i style="font-size:{u(17)}">{emojis[i % 6]}</i>'
                    f'<b style="font-size:{u(11)}">{esc(t)}</b></span>' for i, t in enumerate(titles))
    inner = (f'<div class="cl" style="padding:{u(12)};gap:{u(7)}"><p style="font-size:{u(11)}">{esc(w.get("title") or "취향 콜렉션")}</p>'
             f'<div class="cl-g" style="gap:{u(5)}">{cards}</div></div>')
    return "", inner, "취향 콜렉션", w.get("title")


def r_playlist(w, W, H, m):
    """WidgetContent.playlistView — 보라 막대 + 제목 13 SemiBold · 번호 곡 3개 11 · '탭해서 듣기'."""
    songs = [t for t in (w.get("text") or "").split("\n") if t.strip()][:3]
    bars = "".join(f'<i style="height:{u(h)}"></i>' for h in (8, 13, 6))
    rows = "".join(f'<p class="pls-r" style="font-size:{u(11)};gap:{u(7)}"><span>{i + 1}</span><b>{esc(t)}</b></p>' for i, t in enumerate(songs))
    inner = (f'<div class="pls" style="padding:{u(12)};gap:{u(8)}"><p class="pls-h" style="gap:{u(5)};font-size:{u(13)}">'
             f'<span class="np-bars" style="gap:{u(2)};height:{u(13)}">{bars}</span><b>{esc(w.get("title") or "플레이리스트")}</b></p>'
             f'{rows}<span class="grow"></span><p class="pls-f" style="font-size:{u(11)}">탭해서 듣기</p></div>')
    return ' data-dl', inner, "플레이리스트", w.get("title")


TYPE_NAMES = {"gif": "GIF", "social": "소셜", "guestbook": "방명록", "diary": "일기", "dday": "디데이", "nowplaying": "지금 듣는 곡",
              "place": "장소", "weather": "날씨", "steps": "걸음 수", "qna": "오늘의 질문", "ghost": "고스트", "voice": "음성",
              "bucket": "버킷리스트", "todo": "To-do", "collection": "컬렉션", "playlist": "플레이리스트", "poke": "콕 찌르기",
              "secret": "비밀", "together": "같이 있었어", "vintageCamera": "빈티지 카메라"}


def r_generic(w, W, H, m):
    path, _ = m.image(w.get("img"))
    name = TYPE_NAMES.get(w["type"], "위젯")
    if path:
        return " data-dl", f'<img class="cover" src="{esc(path)}" alt="" loading="lazy"><span class="soft"></span>', name, w.get("title")
    e = esc(w.get("emoji") or "✨")
    t = esc(w.get("title") or w.get("text") or w.get("label") or name)
    return " data-dl", f'<div class="ss" style="gap:{u(6)}"><span style="font-size:{u(30)}">{e}</span><b style="font-size:{u(13)}">{t}</b></div>', name, w.get("title")


RENDER = {"block": r_block, "video": r_video, "sticker": r_sticker, "polaroid": r_polaroid, "paparazzi": r_paparazzi,
          "ask": r_ask, "ditto": r_ditto, "music": r_music, "image": r_image, "status": r_status, "mood": r_mood, "text": r_text,
          "diary": r_diary, "dday": r_dday, "place": r_place, "weather": r_weather, "voice": r_voice, "gif": r_gif,
          "nowplaying": r_nowplaying, "guestbook": r_guestbook, "collection": r_collection, "playlist": r_playlist}
# 기본 바탕 (AppState.widgetBg) — style.bg가 있으면 그것이 먼저
BG = {"block": "rgba(112,115,124,.08)", "video": "linear-gradient(225deg,#3a4a63,#24304a 50%,#161d2e)", "sticker": "#fef4f7",
      "polaroid": "#fff", "paparazzi": "#fff", "ask": "#fff", "ditto": "#e9d8f5", "image": "#e7e4ee", "status": "#fff",
      "mood": "#f1e3a7", "text": "#f3eefb", "guestbook": "#fff", "qna": "#fff", "diary": "#d7e39d", "dday": "#d9d4f9",
      "nowplaying": "#141317", "place": "#b8e9df", "weather": "linear-gradient(#d7effe,#d1e2fd 33%,#bfcdf6 68%,#a0c6f1 84%,#d8e7f9)",
      "voice": "#fdf1d7", "gif": "#f1e3a7", "collection": "#1d1e24", "playlist": "#17181d"}


def render(widgets, media):
    """대표 플래터 → HTML. 위젯이 없으면 빈 문자열."""
    if not widgets:
        return ""
    rows = max(w["row"] + w["h"] for w in widgets)
    grid_h = rows * UNIT - GUT
    tiles = []
    for w in widgets:
        W, H = size_px(w)
        try:
            res = RENDER.get(w["type"], r_generic)(w, W, H, media)
        except Exception:
            res = r_generic(w, W, H, media)
        attrs, inner, kind, label = res[:4]
        style = res[4] if len(res) > 4 else None
        st = w.get("style") if isinstance(w.get("style"), dict) else {}
        custom = st.get("bg") if isinstance(st.get("bg"), str) and st["bg"].startswith("#") and len(st["bg"]) in (4, 7) else None
        bg = style or "background:" + (custom or BG.get(w["type"], "#f1eaff"))
        # 디토 가능 상태 (DittoAvailability.of — allow이고 디토 위젯 자체가 아닐 것)
        available = w.get("allow") is True and w["type"] != "ditto"
        if available and " data-act" not in attrs:
            attrs = ' data-dl data-msg="ditto"'
        # 가능 = 뒤 후광만 · 불가 = 1px 테두리 (음악은 자체 테두리)
        # DittoBadge(디토 마크)는 디토해 온 위젯의 표시라 가능 상태에는 붙이지 않는다 (Figma 1247:2764 'Ditto widget / shared source and badge')
        state = " glow" if available else (" hl" if w["type"] != "music" else "")
        name = f"{kind}{', ' + str(label) if label else ''}"
        interactive = bool(attrs)
        role = f' role="button" tabindex="0" aria-label="{esc(name)}"' if interactive else f' role="img" aria-label="{esc(name)}"'
        pos = (f"left:{w['col'] * UNIT / DESIGN_W * 100:.3f}%;top:{w['row'] * UNIT / grid_h * 100:.3f}%;"
               f"width:{W / DESIGN_W * 100:.3f}%;height:{H / grid_h * 100:.3f}%;border-radius:{u(radius(w))};{bg}")
        live = " np-live" if w["type"] == "nowplaying" else ""
        tiles.append(f'<div class="w w-{esc(w["type"])}{state}{live}" style="{pos}"{role}{attrs}>{inner}</div>')
    # 앱 친구 플래터처럼 바탕(DT.backgroundNormal) 위에 바로 놓는다 — 별도 컨테이너·제목 없음
    return (f'<section class="platter" id="platter" aria-label="대표 플래터">'
            f'<div class="pl" style="aspect-ratio:{DESIGN_W} / {grid_h:.2f}">{"".join(tiles)}</div></section>'
            f'<div id="platterEnd" aria-hidden="true"></div>')


def build(get, handle, outdir: Path, platter="rep"):
    """빌드 진입점 — (html, 그린 위젯 수). 서비스 키가 없거나 실패하면 ("", 0).
    platter="life"는 scripts/demo-profiles.txt 시안 계정에만 쓴다 (build_site.py가 목록으로 제한)."""
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        return "", 0
    try:
        owner, widgets = fetch_rep(get, handle, key, platter)
    except Exception as e:
        print(f"platter: {handle} 위젯을 읽지 못함 ({type(e).__name__})")
        return "", 0
    if (outdir / "media").exists():
        shutil.rmtree(outdir / "media")
    media = Media(get, outdir, owner)
    media.sources = fetch_sources(get, owner, widgets, key)
    media.people = fetch_people(get, widgets, key)
    return render(widgets, media), len(widgets)
