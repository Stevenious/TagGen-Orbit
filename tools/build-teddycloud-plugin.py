#!/usr/bin/env python3
"""Baut das TeddyCloud-Plugin-Paket von TagGen Orbit (Prototyp).

Ergebnis: dist/taggen-orbit-teddycloud-plugin.zip mit dem Ordner taggen-orbit/.
Installation: ZIP in den TeddyCloud-Ordner plugins/ entpacken, sodass
plugins/taggen-orbit/plugin.json existiert, dann TeddyCloud neu laden.
Es werden nur die App-Dateien übernommen, keine Tests, Beispiele oder Screenshots.
"""
from __future__ import annotations

import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FOLDER = "taggen-orbit"
FILES = ["index.html", "universe.js", "universe.css", "exchange.js", "teddycloud.js", "sw.js",
         "manifest.webmanifest", "orbit-logo.svg", "assets/orbit-icon-192.png", "assets/orbit-icon-512.png",
         "CREDITS_AND_RIGHTS.md"]


def build(out_dir: Path = ROOT / "dist") -> Path:
    meta = json.loads((ROOT / "teddycloud-plugin" / "plugin.json").read_text(encoding="utf-8"))
    out_dir.mkdir(parents=True, exist_ok=True)
    target = out_dir / "taggen-orbit-teddycloud-plugin.zip"
    unpacked = out_dir / FOLDER
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(f"{FOLDER}/plugin.json", json.dumps(meta, ensure_ascii=False, indent=2) + "\n")
        # TeddyCloud shows preview.png on the plugin card.
        archive.write(ROOT / "assets" / "orbit-icon-512.png", f"{FOLDER}/preview.png")
        for name in FILES:
            archive.write(ROOT / name, f"{FOLDER}/{name}")
    # An unpacked copy makes local testing easy (serve dist/ as TeddyCloud's www folder).
    with zipfile.ZipFile(target) as archive:
        for info in archive.infolist():
            path = out_dir / info.filename
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(archive.read(info))
    print(f"{target.relative_to(ROOT)} · Version {meta['version']} · {len(FILES) + 2} Dateien · unpacked: {unpacked.relative_to(ROOT)}")
    return target


if __name__ == "__main__":
    build()
