# TagGen Universe 6.0 Preview

TagGen Universe gestaltet Cover für Hörspiel-Tags und bereitet sie für den Druck vor. Die neue Oberfläche baut auf der bestehenden Orbit-Logik für Suche, Canvas, Sammlung, Druck und lesenden NFC-Zugriff auf.

## Funktionen

- Sammlung als Startseite, Welten als Kategorien und geführtes Erstellen.
- Katalogsuche, eigenes Cover oder Bildstapel mit bis zu zwölf PNG-, JPEG- oder WebP-Dateien (je maximal 10 MB).
- Dateinamen helfen bei der Inhaltssuche. Nur eindeutig exakte Titel werden automatisch zugeordnet; unsichere Treffer müssen bestätigt werden.
- Runder oder quadratischer Cover-Editor mit Vorlagen und optionaler Feinabstimmung.
- Tag-Pass mit getrennten Angaben zu Inhalt, Audio-ID, NFC-UID, Welt, Druckdatum und physischem Format.
- A4-Druckbogen mit optionalen Rückseiten; PDF über den Druckdialog des Browsers.
- Automatischer heller/dunkler Bildschirmmodus; Papier und Coverfarben bleiben unverändert.
- Private Projektdateien und bestehende Orbit-Sammlungsdateien weiterhin lesbar.

Die Sammlung ist derzeit ein Arbeitsstapel mit zwölf Plätzen. Welten sind Kategorien, keine unbegrenzten Bibliotheken. Druckdatum wird bewusst bestätigt. NFC wird lesend verwendet; die App erfindet keine UID.

## Betrieb und Aktualisierung

Für GitHub Pages gemeinsam veröffentlichen: `index.html`, `universe.js`, `universe.css`, `sw.js`, `manifest.webmanifest` und `assets/`. Lokal über einen HTTP-Server öffnen, zum Beispiel `python3 -m http.server 8000`.

Die Offline-Hülle enthält die Oberfläche einschließlich Universe-CSS und -JavaScript. Nach einer erfolgreichen Online-Installation ist sie offline verfügbar. Externe Kataloge und Cover sind nicht Bestandteil des Shell-Caches. Private Daten bleiben im Browser beziehungsweise in selbst exportierten Projektdateien; es gibt keine Cloud-Synchronisierung.

Nach einer Aktualisierung die Seite neu laden und eine installierte PWA gegebenenfalls schließen und wieder öffnen. Private Browserdaten nicht zum Aktualisieren löschen. Ohne `universe.js` bleibt die Startseite sichtbar und bietet einen direkten Zugang zum bestehenden Cover-Studio.

`apply-v6.py` ist für die aktuelle Universe-Version nicht erforderlich. Es bleibt als historische Upgrade-Hilfe erhalten und prüft eine vorhandene Universe-Integration ohne Änderungen.

## Entwicklung und Prüfung

`flow-integrity-test.cjs` prüft Migration, Inhalts-/Tag-Trennung, Projekt-Rundlauf und NFC-Schutz. `recovery-smoke-test.cjs` prüft tatsächlichen Canvas-Import und Druckgeometrien mit `@napi-rs/canvas`. `universe-browser-test.cjs` prüft Desktop- und Mobilabläufe in Chromium und WebKit sowie hellen/dunklen Modus und den Start ohne Universe-JavaScript. `universe-offline-test.cjs` prüft Shell-Installation, alte Cache-Bereinigung und Offline-Antworten.

Die automatisierten Prüfungen laufen im Workflow **Universe V6 checks**. Physische NFC-Hardware, reale Drucker und Gerätekalibrierung müssen zusätzlich am Zielgerät geprüft werden.

Details zur V6: [UNIVERSE_V6.md](UNIVERSE_V6.md). Änderungen: [CHANGELOG.md](CHANGELOG.md). Quellen und Nutzungshinweise: [CREDITS_AND_RIGHTS.md](CREDITS_AND_RIGHTS.md).
