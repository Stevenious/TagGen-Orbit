#!/usr/bin/env python3
"""Erzeugt die Beispieldateien für das Austauschformat taggen-exchange.

Alle Titel, Serien, Modellkennungen, Audio-IDs, Hashes und UIDs sind frei erfunden.
Die Cover sind einfache, hier erzeugte Grafiken (keine fremden Bilder).

Aufruf:  python3 tools/make-exchange-examples.py
Benötigt: Pillow
"""
from __future__ import annotations

import base64
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "exchange" / "examples"
CREATED = "2026-11-18T12:00:00+01:00"

SERIES = {
    "Mondbär": {"slug": "mondbaer", "bg": (38, 52, 107), "fg": (247, 214, 98), "shape": "moon"},
    "Leuchtturm-Lotte": {"slug": "leuchtturm-lotte", "bg": (21, 109, 128), "fg": (250, 245, 232), "shape": "tower"},
}
EPISODES = {
    "Mondbär": ["baut ein Boot", "und der Nebelfuchs", "zählt die Sterne", "findet einen Schlüssel",
                "auf dem Wolkenmarkt", "und die leise Glocke", "macht Winterpause", "im Spiegelwald"],
    "Leuchtturm-Lotte": ["und das verlorene Licht", "zählt die Möwen", "im großen Sturm",
                         "und der Flaschenbrief", "fährt zur Nachbarinsel", "und die singende Muschel"],
}


def font(size: int):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:  # Pillow < 10.1
        return ImageFont.load_default()


def cover(series: str, number: int, size: int = 320) -> bytes:
    spec = SERIES[series]
    image = Image.new("RGB", (size, size), spec["bg"])
    draw = ImageDraw.Draw(image)
    c = size // 2
    if spec["shape"] == "moon":
        draw.ellipse((c - 70, c - 90, c + 70, c + 50), fill=spec["fg"])
        draw.ellipse((c - 35, c - 110, c + 95, c + 20), fill=spec["bg"])
        for i in range(number % 5 + 3):
            x, y = 40 + (i * 53) % (size - 80), 40 + (i * 37) % 90
            draw.ellipse((x, y, x + 6, y + 6), fill=spec["fg"])
    else:
        draw.polygon([(c - 30, c + 70), (c + 30, c + 70), (c + 18, c - 70), (c - 18, c - 70)], fill=spec["fg"])
        draw.rectangle((c - 24, c - 96, c + 24, c - 70), fill=(242, 92, 84))
        draw.polygon([(c + 24, c - 88), (c + 130, c - 120 + number * 4), (c + 130, c - 60 + number * 4)], fill=(250, 232, 140))
        draw.rectangle((0, c + 70, size, size), fill=(16, 78, 96))
    draw.text((c, size - 40), f"Folge {number}", fill=spec["fg"], anchor="mm", font=font(26))
    buffer = io.BytesIO()
    image.save(buffer, "JPEG", quality=85)
    return buffer.getvalue()


def data_url(raw: bytes) -> str:
    return "data:image/jpeg;base64," + base64.b64encode(raw).decode()


def fake_hash(text: str) -> str:
    return hashlib.sha1(text.encode()).hexdigest()


def ruid_from_uid(uid: str) -> str:
    return "".join(reversed(uid.split())).lower()


def uid_for(n: int) -> str:
    return f"E0 04 03 50 1A 2B {n:02X} {(0x40 + n) & 0xFF:02X}"


def build_entries():
    entries, images, books, manifest = [], {}, [], []
    n = 0
    for series, titles in EPISODES.items():
        spec = SERIES[series]
        for index, rest in enumerate(titles, start=1):
            n += 1
            title = f"{series} {rest}"
            model = f"{spec['slug']}-{index:03}"
            audio = str(1731900000 + n * 97)
            local_id = hashlib.sha256(f"demo-{model}".encode()).hexdigest()[:24]
            has_cover = not (series == "Leuchtturm-Lotte" and index == 6)
            entry = {
                "key": f"model:{model}",
                "title": title,
                "series": series,
                "episode": index,
                "language": "de",
                "cover": {"confirmed": has_cover, "source": "Ordnerbild" if index % 2 else "Manuelle Bilddatei"},
                "teddycloud": {"model": model, "audioIds": [audio], "hashes": [fake_hash(model)], "category": "audio-play"},
                "origin": {"teddystudioId": local_id, "exportedBy": "TeddyStudio"},
            }
            raw = cover(series, index) if has_cover else None
            if raw:
                ref = f"img-{model}"
                images[ref] = {"data": data_url(raw), "source": entry["cover"]["source"]}
                entry["cover"]["imageRef"] = ref
            else:
                del entry["cover"]["source"]
            if n % 3 == 1:  # every third title already has a physical tag in TeddyCloud
                uid = uid_for(n)
                entry["tag"] = {"ruid": ruid_from_uid(uid), "nfcUid": uid, "assignedModel": model}
            entries.append(entry)

            # The same works as TeddyStudio would export them today (Cover-Manifest + Sammlung).
            folder = f"C:\\Users\\Demo\\Hoerspiele\\{series}\\Folge {index:02}"
            if not raw:
                cover_path = ""
            elif index % 2:  # Ordnerbild: always called cover.jpg, so the file name alone is ambiguous
                cover_path = folder + "\\cover.jpg"
            else:  # manually assigned covers live in TeddyStudio's data folder under a unique name
                cover_path = f"C:\\Users\\Demo\\AppData\\Local\\TeddyStudio\\covers\\{hashlib.md5(model.encode()).hexdigest()}.jpg"
            manifest.append({"id": local_id, "folder": folder, "title": title, "series": series,
                             "cover": cover_path, "source": entry["cover"].get("source", "")})
            books.append({
                "id": local_id, "folder": folder, "title": title, "series": series, "episode": index,
                "language": "de", "category": "audio-play", "cover": cover_path,
                "cover_source": entry["cover"].get("source", ""), "cover_confirmed": has_cover,
                "remote_model": model if index != 4 else "",  # one title was never sent to TeddyCloud
                "tracks": [{"path": folder + f"\\{i:02}.mp3", "title": f"Kapitel {i}", "track": str(i), "duration": 300.0} for i in (1, 2)],
                "status": "Bestätigt",
            })
            if raw and index % 2 == 0:
                (OUT / "teddystudio" / "bilder" / Path(cover_path.replace("\\", "/")).name).write_bytes(raw)
            elif raw:
                # Only one Ordnerbild is shipped: a user can pick just one "cover.jpg" at a time.
                if series == "Mondbär" and index == 1:
                    (OUT / "teddystudio" / "bilder" / "cover.jpg").write_bytes(raw)
    return entries, images, books, manifest


def write(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    (OUT / "teddystudio" / "bilder").mkdir(parents=True, exist_ok=True)
    for old in (OUT / "teddystudio" / "bilder").glob("*.jpg"):
        old.unlink()
    entries, images, books, manifest = build_entries()
    meta = {"app": "TeddyStudio", "appVersion": "demo", "created": CREATED, "privacy": "private", "collection": "Demo-Hörspiele"}
    write(OUT / "valid.json", {"format": "taggen-exchange", "version": 1, "minor": 0, "meta": meta, "images": images, "entries": entries})

    first, second = entries[0], entries[1]
    conflicts = {
        "format": "taggen-exchange", "version": 1, "minor": 0, "meta": {**meta, "collection": "Demo-Konflikte"},
        "images": {k: images[k] for k in [first["cover"]["imageRef"]]},
        "entries": [
            first,  # same key as in valid.json -> "bereits vorhanden"
            {"key": "model:mondbaer-099", "title": "Mondbär Sonderfolge", "series": "Mondbär",
             "tag": {"nfcUid": entries[3]["tag"]["nfcUid"]}},  # tag already belongs to an imported entry -> conflict
            {"key": "model:mondbaer-100", "title": "Mondbär doppelt", "series": "Mondbär"},
            {"key": "model:mondbaer-100", "title": "Mondbär doppelt (zweimal)", "series": "Mondbär"},  # duplicate key -> broken
            {"key": "model:mondbaer-101", "title": "Mondbär falsche Tag-Nummer", "series": "Mondbär",
             "tag": {"ruid": "0000000000000000", "nfcUid": second.get("tag", {}).get("nfcUid", "E0 04 03 50 1A 2B 02 42")}},  # ruid/nfcUid mismatch
            {"key": "local:zzz", "title": "", "series": "Ohne Titel"},  # invalid key and missing title
            {"key": "model:mondbaer-102", "title": "Mondbär ohne Bild", "series": "Mondbär", "cover": {"imageRef": "img-fehlt"}},  # missing image
        ],
    }
    write(OUT / "conflicts.json", conflicts)
    write(OUT / "broken.json", {"format": "taggen-exchange", "version": 2, "meta": meta, "entries": []})
    write(OUT / "teddystudio" / "Cover-Manifest.json", manifest)
    write(OUT / "teddystudio" / "Sammlung.json", books)


if __name__ == "__main__":
    main()
