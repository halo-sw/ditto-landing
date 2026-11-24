"""Check the seven published platter previews. Run with Python 3 and Pillow."""
import json
from pathlib import Path

from PIL import Image, ImageOps


SITE = Path(__file__).resolve().parents[1]


def thumbnail_fingerprint(url):
    with Image.open(SITE / url.lstrip("/")) as original:
        thumb = ImageOps.fit(original.convert("L"), (17, 16)).getdata()
        return sum(
            (thumb[row * 17 + col] > thumb[row * 17 + col + 1]) << (row * 16 + col)
            for row in range(16) for col in range(16)
        )


def main():
    script = (SITE / "assets/v8/platters.js").read_text()
    people = json.loads(script.split("window.DITTO_PLATTERS =", 1)[1].strip().removesuffix(";"))
    fingerprints = {}
    compositions = set()
    for handle, person in people.items():
        cells = set()
        first_rows = []
        for widget in person["widgets"]:
            x, y, w, h = (widget[key] for key in ("x", "y", "w", "h"))
            assert 0 <= x and x + w <= 8 and 0 <= y and y + h <= 48, widget["id"]
            rect = {(col, row) for col in range(x, x + w) for row in range(y, y + h)}
            assert cells.isdisjoint(rect), f"Overlapping tiles in {handle}"
            cells.update(rect)
            if y < 4:
                first_rows.append((x, y, w, h))
            data = widget["data"]
            url = data.get("poster") or data.get("img")
            if not url:
                continue
            fingerprint = thumbnail_fingerprint(url)
            for other, prior in fingerprints.items():
                assert bin(fingerprint ^ prior).count("1") > 5, f"Repeated artwork: {other}, {widget['id']}"
            fingerprints[widget["id"]] = fingerprint
        shape = tuple(sorted(first_rows))
        assert shape not in compositions, f"Repeated first-screen layout in {handle}"
        compositions.add(shape)
    print(f"{len(compositions)} distinct layouts, {len(fingerprints)} distinct cover images")


if __name__ == "__main__":
    main()
