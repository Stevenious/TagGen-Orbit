# TagGen Orbit – Wiederherstellung mit Grafikideen

Diese Fassung stellt die funktionierende Orbit-5-RC8-Logik aus dem lokalen Repository-Stand `4e81329` wieder her. Die angehängte Canva-Datei und die am 30.09.2026 abgerufene GitHub-Index waren vereinfachte Demos. Die Ersatzdatei übernimmt das Erscheinungsbild behutsam in den ursprünglichen DOM; alle fünf JavaScript-Blöcke des funktionierenden Stands sind unverändert.

## Einsetzen

1. Den aktuellen Stand deiner Website vorher sichern.
2. `index.html`, `sw.js`, `manifest.webmanifest` und `assets/` aus diesem Paket gemeinsam in das Repository **TagGen-Orbit** übernehmen. Die `.cjs`-Dateien und `visual-refinements.css` sind Entwicklungsdateien; die Gestaltung ist bereits in der Index eingebettet.
3. `CREDITS_AND_RIGHTS.md` enthält die bisher abgestimmten Quellen- und Nutzungshinweise. Vorhandene eigene Betreiberangaben auf der Website beibehalten.
4. Nach GitHub-Pages-Veröffentlichung die Seite neu laden, die installierte PWA gegebenenfalls schließen und wieder öffnen. Der Service Worker hat einen neuen Cache-Namen. Private Browserdaten nicht zum Aktualisieren löschen.
5. Kurz prüfen: Motiv suchen, Cover gestalten, PNG speichern, in Sammlung übernehmen, Projekt sichern/laden und einen Kontrollbogen bei 100 % drucken. BLE in Bluefy beziehungsweise einem kompatiblen Browser prüfen.

## Wiederhergestellt

- Asynchroner V1-/V2-Katalog, Cache und JSON-Import, Suche, Favoriten und Pagination.
- Echter Bildimport und PNG-Export über Canvas; runde und quadratische Cover.
- Druckplätze, Kopieren/Verschieben/Löschen, Kalibrierung, originale A4-Geometrien und Duplex-Rückseiten mit QR.
- Private Sammlung, Projekte, Migration älterer Dateien und getrennte Audio-ID/Tag-UID.
- Lesender NFC-Archiver-BLE-Zugriff und optionaler Community-Dump-Abgleich mit anschließendem Cover-Vorschlag.
- Orbit-Logo, PWA, Quellen- und Nutzungshinweise; Links auf das umbenannte Repository angepasst.

## Übernommene Grafikideen

Dezente Orbit-Kreise im Hintergrund und an der Vorschau, klarere Überschrift, ruhige weiße Karten, rosa aktive Navigation und Auswahl, Live-Kennzeichnung der echten Vorschau sowie ein Orbit-Zeichen im leeren Sammlungsbereich. Systemschriften halten die Darstellung offline nutzbar. Die bestehende Zwei-Spalten-Bibliothek auf Mobil, acht Treffer am Desktop und die mobile Schrittführung bleiben erhalten.

Canva-SDKs, Tailwind-/Icon-CDNs, nicht im Browser ladbare `canva://`-Bilder und Demo-Handler sind nicht enthalten. Die stilisierte rechteckige Demo-Vorschau wird durch die echte runde/quadratische Canvas-Ausgabe ersetzt.

## Prüfung am 30.09.2026

`node flow-integrity-test.cjs` besteht: Migration, Inhalt/Tag-Trennung, Bearbeitung, Export/Import, Frontseitenübernahme, UID-Zuordnung, abweichende Dumps, Community-Abgleich und BLE-Schreibsperre.

`node recovery-smoke-test.cjs` besteht mit dem nativen Canvas-Paket: tatsächlicher Bildimport, runde/quadratische Ausgabe, echte PNG-Dateisignatur, Platzierung, einseitiger und zweiseitiger Druckaufruf sowie privater Projekt-Export. Der DOM und Reader sind dabei simuliert. Für den Canvas-Test wird `@napi-rs/canvas` benötigt; der Workflow-Test läuft mit Node allein.

Alle 183 ursprünglichen HTML-IDs sind eindeutig und vorhanden; die fünf JavaScript-Blöcke stimmen mit der funktionierenden Ausgangsfassung überein. Es gibt keine externen Script-/Schriftabhängigkeiten. Kataloge, Online-Cover und optionale Community-Dumps werden wie im ursprünglichen Orbit über die dokumentierten Anbieter geladen.

Ein vollständiger Browserlauf, eine neue Safari-/Druckerabnahme und ein physischer BLE-Test wurden hier nicht durchgeführt. Es ist kein Browserprogramm in der Umgebung installiert. Die Dateien sind vorbereitet, noch nicht veröffentlicht.
