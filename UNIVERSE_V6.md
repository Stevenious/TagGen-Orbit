# TagGen Universe 6 — erste Integration

Die Startseite öffnet die persönliche Sammlung. Erstellen führt zur Suche oder zum eigenen Cover; die Bibliothek und der Editor werden als getrennte Schritte angezeigt. Die Werkstatt befindet sich unter Mehr → Expertenmodus.

## Enthalten
- Universe-Startseite mit gespeicherten Coverkarten, Welten und offenen Aufgaben.
- Visuelle Sammlung und Tag-Pass mit getrennten Angaben zu Inhalt, NFC und Träger.
- Geführter Editor mit Format, Titel, Bild, Stil und optionaler Rückseite; technische Regler bleiben unter Feinabstimmung.
- Smart Create für 1–12 PNG/JPG/WebP-Bilder; eindeutige Dateinamen erhalten Kataloghinweise, unsichere Vorschläge brauchen eine bewusste Auswahl.
- Druck über den bewährten A4-Kern; PDF über den Druckdialog. Kein eigener PDF-Renderer.
- Explizite Druckbestätigung statt automatischer Erfolgsmeldung beim Öffnen des Druckdialogs.
- Bestehende Sammlung v1/v2/v3 und Projektdateien bleiben lesbar. Neue v3-Felder sind optional: universe.world, universe.printedAt und physical.preset.
- NFC-Daten werden nicht aus Cover- oder Dateinamen erfunden. Bildimport bleibt im Browser.

## Grenzen dieser ersten Integration
Die Sammlung bleibt vorerst der bestehende Arbeitsstapel mit maximal zwölf Einträgen. Welten sind Kategorien innerhalb dieses Stapels, noch keine unabhängig gespeicherten Sammlungen. Tracklisten-Rückseiten, freie Ebenen, TeddyCloud-Sync und eine unbegrenzte Bibliothek folgen separat. Stilvorlagen verwenden den bestehenden Canvas-Renderer. Das PWA-Update speichert die Anwendungshülle, keine beliebigen Online-Cover.

## Abnahme
CI führt die bestehenden Tests aus und prüft neue Wege mit Chromium und WebKit in Desktop-/Mobilgrößen. Katalog und Cover sind deterministische Testdaten; echte Geräte, iPhone-Druckdialog, BLE und Drucker brauchen anschließend eine manuelle Abnahme. Screenshots werden als CI-Artefakt gespeichert.

1. Leerer Browser: Universe öffnet ohne Beispiel-Sammlung.
2. Erstellen → Suche → Cover: 8 Desktop-Karten bzw. 2 mobile Spalten.
3. Format/Titel ändern → Sammlung: NFC bleibt leer; Tag-Pass zeigt den gewählten Träger.
4. Welt und Druckstatus ändern → Neuladen: Angaben erhalten.
5. Cover bearbeiten → Drucken: Zuordnung und tatsächliche A4-Abmessungen bleiben erhalten.
6. Rückseite aus: eine Druckseite; Rückseite an: bisheriger Duplex-Ablauf.
7. Mehr → Werkstatt: bisherige NFC-, BLE-, Export- und Diagnosetools erreichbar.
8. Stapelimport: unsichere Dateinamen ändern weder UID noch vermeintliche Audioquelle.

Bildstapel werden lokal auf maximal 600 px pro Kante und WebP komprimiert (etwa 380 dpi bei 40 mm). Der Browser-Speicherstatus steht sichtbar über den Sammlungskarten; bei vollem Speicher muss die Sammlung als Datei gesichert werden.
