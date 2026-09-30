#!/usr/bin/env python3
"""TagGen Orbit V6 · Stufe 1 / Universe-Integrationsprüfung.
Aufruf im Repo-Ordner: python3 apply-v6.py
Ändert nur Texte, Versionsangaben und fügt ein Dark-Mode-Stylesheet hinzu.
Auf Universe prüft dieses Skript die vorhandene Integration, ohne sie zu überschreiben.
Die JavaScript-Logik bleibt unverändert. Bricht ab, ohne etwas zu schreiben,
wenn ein erwartetes Muster nicht genau so oft vorkommt wie erwartet."""
import sys
from pathlib import Path

DARK = """<style>
/* Orbit 6.0 · Dark Mode (folgt der Systemeinstellung) */
@media(prefers-color-scheme:dark){
:root{color-scheme:dark;--ink:#e8ecf4;--muted:#9aa6bb;--line:#2e384b;--soft:#3a1f2b;--blue:#7fa6ff;--canvas:#0f141d;--shadow:0 12px 36px rgba(0,0,0,.35);background:#0f141d;color:var(--ink)}
body{background:#0f141d}
.app-header,.mobile-action-bar,.slot-bar{background:rgba(21,27,39,.94)}
.panel,.card,.collection-item,.print-more,.dialog{background:#151b27}
button,input,select,textarea,input[type=search]{background:#1b2332;color:var(--ink)}
button:hover:not(:disabled){background:#243049}
button.primary{background:var(--rose);color:#fff}
.main-nav button[aria-current=page]{background:var(--soft)}
.card-picture,.collection-thumb,.bridge-cover{background:#1f2839}
.card-open:hover:not(:disabled),.card.selected .card-open{background:transparent}
.card.selected{background:var(--soft)}
.code,.collection-empty,.batch-dropzone,.collection-flow div{background:#1b2332}
.preview-stage{background:linear-gradient(145deg,#1a2231,#151b27)}
.batch-place{background:#1b2332;border-color:#3a465c}
.batch-place.ready{background:#173325}.batch-place.review{background:#3a2f15}
.alert{background:#33290f;color:#e8cf9a;border-color:#5a4a1e}
.favorite{background:#1b2332e6;color:#9aa6bb}
.match-label{background:#1b2332;color:#c5d0e3}
.sheet{background:#fff}.slot{background:#fafbfc;color:#a2adbd}
}
</style>
</head>"""

# (alt, neu, erwartete Anzahl)
INDEX = [
 ("Orbit 5.0 Release Candidate 8", "Orbit 6.0", 2),          # <title>, Kopfzeile
 ("Orbit 5.0.0 Release Candidate 8", "Orbit 6.0.0", 2),       # Footer, Systeminfo
 ("appVersion:'5.0-rc.8'", "appVersion:'6.0.0'", 1),
 ('<option value="auto">Beste Treffer</option>', '<option value="auto">Automatisch (empfohlen)</option>', 1),
 ('<option value="exact">Exakt</option>', '<option value="exact">Nur exakte Treffer</option>', 1),
 ('<option value="strong">Exakt + Strong</option>', '<option value="strong">Alle Suchwörter enthalten</option>', 1),
 ('<option value="fuzzy">Mit Fuzzy</option>', '<option value="fuzzy">Auch ähnliche Schreibweisen</option>', 1),
 ('<button id="flow-check" class="quiet">Flow prüfen</button>', '<button id="flow-check" class="quiet">Selbsttest ausführen</button>', 1),
 ("<p>Motiv auswählen, Titel anpassen und direkt für den Druck vorbereiten.</p>",
  "<p>① Motiv wählen · ② Cover anpassen · ③ „Auf den Druckbogen“ und drucken.</p>", 1),
 ('<label>Audio-ID<input id="audio-id" type="text" maxlength="80" placeholder="Optional · keine Tag-UID"></label>',
  '<label>Audio-ID<input id="audio-id" type="text" maxlength="80" placeholder="Optional · keine Tag-UID"></label>'
  '<small class="muted">Audio-ID = Inhalt des Tonies (aus dem Katalog). Tag-UID = Seriennummer des NFC-Chips. Beides ist nicht dasselbe.</small>', 1),
 ("</head>", DARK, 1),
]
SW = [("taggen-orbit-shell-5-rc8-restored-graphics", "taggen-orbit-shell-6-0-0", 1)]

CHANGELOG = """# Changelog

## 6.0.0
- Version 6.0; neuer Service-Worker-Cache (Nutzer erhalten die Aktualisierung automatisch)
- Dark Mode nach Systemeinstellung (Druckausgabe und Bogenvorschau bleiben weiß)
- Verständlichere Bezeichnungen für die Suchgenauigkeit und den Selbsttest
- Hinweis zu Audio-ID und Tag-UID im Editor, klarere Kurzanleitung im Studio
- JavaScript-Logik unverändert gegenüber 5.0 RC 8

## 5.0 RC 8
- Wiederhergestellter, getesteter Stand
"""

def patch(path, rules):
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    for old, new, count in rules:
        found = text.count(old)
        if found != count:
            sys.exit(f"ABBRUCH {path}: Muster {old[:50]!r} {found}× gefunden, erwartet {count}×. Nichts geschrieben.")
        text = text.replace(old, new)
    return p, text

def check_universe():
    """Die Universe-Dateien wurden bereits separat integriert: nur prüfen."""
    index = Path("index.html").read_text(encoding="utf-8")
    if "<title>TagGen Universe 6" not in index:
        return False
    checks = {
        "index.html": [
            "Automatisch (empfohlen)", "Nur exakte Treffer",
            "Alle Suchwörter enthalten", "Auch ähnliche Schreibweisen",
            "Selbsttest ausführen", 'id="audio-id-help"',
            "appVersion:'6.0.0-preview'",
        ],
        "universe.css": [
            "Universe system theme", "@media screen and (prefers-color-scheme:dark)",
        ],
        "sw.js": ["taggen-orbit-shell-6-universe-system-theme"],
    }
    for filename, required in checks.items():
        path = Path(filename)
        text = path.read_text(encoding="utf-8") if path.is_file() else ""
        missing = [value for value in required if value not in text]
        if missing:
            sys.exit(f"ABBRUCH {filename}: Universe-Ergänzungen fehlen: {missing}. Nichts geschrieben.")
    print("OK Universe V6: Dark Mode, Suchtexte, ID-Hinweis und Cache integriert. Nichts geschrieben.")
    return True


if __name__ == "__main__":
    if check_universe():
        sys.exit(0)
    jobs = [patch("index.html", INDEX), patch("sw.js", SW)]
    for p, text in jobs:
        p.write_text(text, encoding="utf-8")
        print("OK", p)
    Path("CHANGELOG.md").write_text(CHANGELOG, encoding="utf-8")
    print("OK CHANGELOG.md\nFertig. Jetzt: node flow-integrity-test.cjs, dann im Browser prüfen.")
