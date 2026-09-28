# TagGen Orbit 5.0 RC4 · Testbericht

Stand: 22. September 2026. Bogen-Manager-Sprint auf Basis von V5 RC1. Ein deploybarer Single-File-Build; bestehende Architektur und Dateiformate bleiben erhalten.

## Änderungen im RC1

- Experimentellen BLE-Schreibmodus samt Eventhandler, Backup-Schreibworkflow und Bedienelementen entfernt.
- Raw-ISO15693 erlaubt nur Inventory (0x01), Get System Information (0x2b) und Read Single Block (0x20). Andere Tag-Befehle werden vor der Übertragung abgewiesen.
- Tag-Erkennung, Auslesen, Archivzugriff und Übernahme als NFC-Datei bleiben vorhanden. Fehlendes InventoryAll kann durch den vorhandenen Raw-Leseweg ersetzt werden.
- Bluefy-Hinweis für iPhone/iPad sowie Links zu Bluefy und NFC-Archiver ergänzt. Dateiverarbeitung in Safari bleibt unabhängig von BLE.
- App-Anzeige und Projektexport tragen Version 5.0-rc.4. Logoanimation zurückgestellt.

## Erneut ausgeführte Regressionen

Die realen Inline-JavaScripts und Eventhandler laufen in einem Node-VM-Harness. DOM, Netzwerk, GATT und Browserdialoge sind Testdoubles; Canvas rendert echte Pixel. Unabhängige QR-Decodierung mit jsQR 1.4.0.

| Bereich | Geprüft | Ergebnis |
|---|---|---|
| Daten | Start, Online-Katalogantwort, beschädigter Cache, Offline-Cache, Cache erneuern | Bestanden im Harness |
| Suche | Exact/Strong/Fuzzy/Audio-ID, Favoriten, Seitengrößen, Umlautumschreibung, fehlende Dump-Titel | Bestanden im Harness |
| Editor | Form, Bildausschnitt, Text-/Positionszustand, echter PNG-Export, CORS-Verweigerung mit druckbarem Bild | Bestanden im Harness |
| Sammlung | Zwölf Dumps gemeinsam importieren, eindeutige Identitäten, Zuordnung, unsichere Treffer bestätigen, Editor-Rückübernahme, NFC-Übergabe | Bestanden im Harness |
| Sicherung | Sammlung exportieren/importieren mit unveränderten Original-Dumps, Projekt v1/v2, öffentliche Redaktion, fehlerhaftes JSON und Abbruch | Bestanden im Harness |
| Druck | Zehn A4-Raster, Copy/Delete/Undo, Stapel mit zwölf Covern, Formatkonvertierung bestätigen/ablehnen, Kalibrierung, isolierte Druckwurzeln | Bestanden im Harness |
| Duplex | Lange/kurze Wendekante, Rückseitenpositionen, zwei Kalibrierungswurzeln, Rückkehr zu einseitiger Ausgabe | Bestanden im Harness |
| Olchi-Regression | Front platzieren, Rückseite danach aktivieren, explizit aktualisieren ohne Duplikat, automatische zwei Druckwurzeln, QR-Titel decodieren, Abbruch verhindert veralteten Druck | Bestanden im Harness |
| BLE | Connect/Notify/Receive, Raw-Inventar-Fallback, UID-Reihenfolge, Systeminfo und 32 Speicherbytes, NFC-Dateiübernahme, Trennen, fehlende Fähigkeiten | Bestanden mit GATT-Testdouble |
| Schreibschutz | Kein Writer/Schreibbutton vorhanden; Write-Single-Block wird vor GATT abgewiesen; tatsächlich gesendete Raw-Befehle ausschließlich lesend | Bestanden mit GATT-Testdouble |
| NFC-Dateien | 853 vorhandene Repository-Dateien strukturell parsen | Bestanden |

## Grenzen und offene Abnahme

- Kein echter Browserlauf dieses RC: keine installierten Browserdateien. DOM-Tests beweisen weder Layout noch echte Browser-Paginierung. Frühere Nutzerabnahmen gelten für die jeweiligen Vorgängerstände.
- Safari-Duplex und physischer Druck: weiterhin offen. Auf Normalpapier bei 100 % beide Wendekanten passend zur Druckereinstellung prüfen; QR vom Papier scannen. Druckertreiber können Skalierung oder Ränder hinzufügen.
- Kein physischer ESP32-/PN5180-Test. Verfügbare Browser-API und simulierte Protokollantworten garantieren keine reale Firmware-Kompatibilität. Geschützte Speicherbereiche werden nicht entsperrt.
- Runde Avery-Geometrien waren vom Nutzer zuvor abgenommen. Quadrat-Avery-Geometrien beruhen auf gelieferten Stanzkonturen; physische Passung bleibt zu prüfen. HERMA 9642 hat kein ungeprüftes Ersatzpreset.
- Online-Bilder ohne CORS bleiben nur druckbar; PNG-Einbettung und Offline-Verfügbarkeit sind dann eingeschränkt.
- Sammlung aktuell eine aktive Arbeitsliste; weitere Sammlungen als Dateien. Dateinamen-Zuordnung ist keine Inhaltsauthentifizierung.
- Direkte TeddyCloud-Synchronisation ist nicht implementiert; vorhandene Dateiwege bleiben bestehen.

## Gemeinsame Abschlussabnahme

1. Bestehendes privates Projekt laden und zwölf Sammlungspositionen auf den Bogen übernehmen.
2. Olchi oder anderes Quadratcover mit Rückseite: Ausgabe Automatisch, zwei Seiten in der Safari-Druckvorschau; QR und Position auf Papier prüfen.
3. Ausgabe Nur Vorderseiten: genau eine Seite, keine Bedienelemente im Ausdruck.
4. In Bluefy Reader verbinden, einen Tag lesen, in Werkstatt öffnen, Datei sichern und zum Cover übernehmen. Kein Schreibmodus vorhanden.
5. Sammlung/Projekt sichern, erneut laden und Zuordnungen sowie Ausgabeformat vergleichen.

Status: RC4 automatisiert geprüft und zur Geräteabnahme bereit, noch keine finale V5-Freigabe. Nächster Sprint erst nach Abnahme: Sammlungsarbeit beschleunigen; kein Ausbau des Writers.

## RC2 · automatisierter Szenariotest

- Zwölf unterschiedliche gültige Flipper-Dumps auf festen Positionen importiert. Freie Positionen 1–12, Wechsel zwischen zwei belegten Positionen und Sammlungsdatei v2 geprüft. Eine alte v1-Datei erhält bei der Migration die ursprüngliche Reihenfolge. Doppelte Plätze werden abgelehnt.
- NFC-Datei eines bestehenden Eintrags ersetzt: neue UID und unpassender Titel halten den Stapeldruck an; erst manuelle Motivwahl und „In Sammlung übernehmen“ lösen ihn.
- Drei Tags nacheinander ausgetauscht, darunter einer an getauschtem Platz 5. Danach alle zwölf erneut gedruckt; die anderen neun Druckkopien blieben im Zustandsvergleich bytegleich.
- Private `.taggen`-Projektdatei inklusive Sammlung exportiert, gelöscht und über den tatsächlichen Import- und Bestätigungsablauf wieder geladen. Cover, zwölf Plätze und ihre NFC-Daten blieben erhalten.
- Zwölf Vorderseiten und zwölf Rückseiten in getrennten Druckwurzeln mit Ausgabemodus „Automatisch“ erzeugt. Bestehender unabhängiger QR-Decodertest für die Olchi-Rückseite bleibt erfolgreich.
- Vorhandene Regressionen für Katalog, Offline-Cache, Suche, Editor, PNG, Druck, v1/v2-Projekte, Favoriten, Werkstatt und lesendes BLE erneut erfolgreich ausgeführt.

Die DOM-/GATT-Testdoubles beweisen Zustand und ausgeführte Handler, aber keine echte iPhone-Oberfläche, Dateidrop-Geste, Druckertreiber-Wendekante oder reale Reader-Kompatibilität. Diese Abnahme am Gerät ist weiterhin offen. Der RC2 kann als einzelnes `index.html` auf GitHub Pages geprüft werden; die Vorgängerversion sollte vor dem Austausch gesichert werden.

## RC3 · Nutzerfeedback zur automatischen Rückseite

Auf Basis eines mobilen Druckbogens mit acht Covern ergänzt. Der Sammlungsdruck erzwingt für bestätigte Cover eine QR-Rückseite, selbst wenn keine NFC-Datei und keine UID zugeordnet sind. Die Ausgabe „Automatisch“ wählt dafür Duplex. Vorhandene Titel, Serie und Audio-ID bilden die QR-Daten; eine UID wird nur mit zugeordnetem Dump eingefügt. Die ausdrücklich gewählte Ausgabe „Nur Vorderseiten“ bleibt im Druckstudio erhalten, bis der Stapel erneut übernommen wird.

Der Regressionstest lädt acht Cover aus zwei Bibliotheksseiten ohne Dumps über die tatsächlichen Sammlungsaktionen. Ergebnis: acht Front- und acht Back-Canvas, zwei Druckwurzeln, Status „2 A4-Seiten“. Der unabhängige QR-Decoder liest den erwarteten Titel und findet keine erfundene UID. Alle bisherigen Regressionen für NFC-Stapel, drei ausgetauschte Tags, Projektimport, Duplex und BLE laufen weiterhin erfolgreich.

Offen: echte iPhone-Safari-Druckvorschau mit acht QR-Rückseiten und Papierkontrolle der Wendekante.

## RC4 · PWA und Bedienbarkeit

- GitHub-Pages-Pfad in Manifest und Service-Worker-Scope relativ gehalten. HTTPS-Registrierung reagiert auf Fehler mit sichtbarem Status. Installationspaket umfasst HTML, Manifest und zwei PNG-Icons.
- Separater Service-Worker-Test mit kontrolliertem Netzwerk und CacheStorage: Installation legt die Shell ab; Aktivierung entfernt alte Orbit-Shell-Caches; Offline-Navigation liefert die gespeicherte Seite; Online-Anforderung aktualisiert sie; private `.taggen`-Dateien und fremde Cover-URLs werden nicht abgefangen.
- Tatsächliche Sammlungs-Eventhandler und Druckbogen-Button werden im DOM-Harness betätigt. Test bestätigt, dass der Tastaturfokus nach Neuaufbau des Bogens auf derselben Position bleibt und eine per Select getauschte Sammlungsposition ihren Fokus behält.
- Gesamte vorherige Regression weiterhin erfolgreich: Datenbank/Cache, Suche, Sammlung mit 12 Tags, 8 Front-/8 QR-Rückseiten ohne NFC-Datei, Duplex, Druck, Projektmigration und lesendes BLE.

### Nicht automatisch abgenommen

Kein physischer iPhone-/Desktop-Browserlauf und kein Screenreader in dieser Umgebung. „Fehlerfreie Barrierefreiheit“ und vollständige PWA-Installierbarkeit können daraus nicht abgeleitet werden. Zu prüfen: VoiceOver-Ansagen/Fokus und Tastatur auf echten Geräten, Home-Screen-Installation, Offline-Neustart nach einmaligem Online-Laden, Bildverfügbarkeit im Offline-Katalog und die zweitseitige Safari-Druckausgabe. Externe Cover mit blockierter CORS-Einbettung benötigen für eine Offline-Projektkopie weiterhin eine eigene Bilddatei.

## RC5 · Druckseiten

Safari-Screenshot: vier Seiten mit leerer Seite 2 und 4 bei Duplex. Print-CSS reservierte zuvor 296,5 mm und setzte `break-before` auf die Rückseite. Die Druckhöhe wird jetzt aus den tatsächlich belegten Positionen berechnet; nur Vorderseite erhält einen expliziten Seitenwechsel, wenn Duplex gewählt ist. Fokussierter Node-Test für zwei Motive und CSS-Umbruch bestanden. Die umfassende Regression konnte in dieser Sitzung nicht erneut laufen, weil `/tmp/orbit-jsqr.js` als Testabhängigkeit fehlt. Reale Safari-Abnahme steht noch aus.

## RC6 · Flow Lock / BLE Read Lock

`node flow-lock-test.cjs` besteht mit kontrollierten Katalog- und NFC-Fixtures: Laden → Cache bei Netzwerkfehler, Lade-Platzhalter statt falschem 0-Treffer, Suche, Bild und Audio-ID beim Öffnen, doppelter Hinzufügen-Klick → ein Slot, Kopieren → ein zusätzlicher identischer Slot, Löschen → nur der gewählte Slot, Print-Root nur Vorderseite bzw. Front und Back im Duplex, Diagnose 5/5, UID-Treffer öffnet bekanntes Cover, unbekannte UID verändert die Sammlung nicht, und BLE-Write-Opcode wird abgewiesen. Diese Prüfungen laufen mit simuliertem DOM und Canvas; echter Bluetooth-Reader, iPhone VoiceOver und physischer Druck wurden in dieser Sitzung nicht erneut geprüft. Die Safari-Druckabnahme von RC5 stammt vom Nutzer.


## RC7 · Sammlung und TeddyCloud-Hilfe

`node flow-lock-test.cjs` prüft zusätzlich: Import einer alten Sammlung V2 mit Standardträger, V3-Export mit `content`/`tag`/`physical`, unabhängige Änderung der verschachtelten Inhalt/Tag-Felder, UI-Dateitausch per `NFC austauschen` bei unverändertem Cover/Titel, UI-Covertausch bei unveränderter Tag-UID, privaten `.taggen`-Projektexport mit Sammlung und Import-Wiederherstellung. Der Test verwendet simulierte Datei-Eingaben; echter TeddyCloud-Abgleich wird bewusst nicht behauptet. Ein echter Gerätewechsel mit großen Bildern und reale Safari-Abnahme stehen noch aus.

## RC8 · NFC Read & Verify

`node flow-integrity-test.cjs` prüft zusätzlich die SLIX-L-UID-Kennung, bekannte UID mit identischem Dump, geänderte Speicherbytes bei gleicher UID, unbekannte UID, doppelte UID, Community-Index-Treffer und den ausführbaren BLE-Opcode-Filter. Ein abweichender oder mehrfach zugeordneter Tag öffnet kein gespeichertes Cover automatisch. Der generierte BLE-Dateiname `Tag-<UID>.nfc` wird nicht als Tonie-Titel behandelt; bei Dateinamen werden nur eindeutige Exact-Treffer automatisch übernommen, Strong/Fuzzy benötigen die bewusste Auswahl.

Unbekannte UIDs lassen sich auf Knopfdruck mit dem von L480 aus `nortakales/flipper-zero-tonies` erzeugten öffentlichen Index vergleichen. Nur ein einzelner UID-Treffer mit byteweise identischem Repo-Dump ergibt einen Cover-Vorschlag; die Bibliotheksauswahl erfolgt weiterhin bewusst. Der Index wird im Browser geladen und nicht als private Sammlung gespeichert. Kein kompletter Community-Dump-Katalog wird in Orbit ausgeliefert.

Die Kennung `E0 04 03` folgt dem NXP-Datenblatt für ICODE SLIX-L. Sie beweist weder einen Originalchip noch den Audioinhalt; eine gleiche UID mit identischem gespeichertem Dump bestätigt nur die gelesenen Speicherbytes. Reale PN5180/BLE-Verbindung, Trennen/Neuverbinden, wechselnde Lesestärke und iPhone/Bluefy bleiben für die Geräteabnahme offen. Der Workflow sendet keine Schreibkommandos.

## RC8 · Nutzerabnahme und BLE-Wegführung

Am 28. September 2026 hat der Nutzer im BLE-Browser den NFC-Archiver verbunden, eine UID erkannt, den Tag gelesen und über den Community-Dump das passende Cover gefunden. Diese Abnahme deckt Erkennen → Lesen → Community-Vorschlag → Cover-Zuordnung am verwendeten Gerät ab; sie belegt weder sämtliche Tagtypen noch einen physischen Schreibtest.

Die Oberfläche zeigt jetzt nach der Inventur ausdrücklich „Tag-Speicher lesen“ und nach erfolgreichem Auslesen „Gelesenen Tag öffnen“ als nächsten Schritt. Verbindungsstatus, mehrere oder keine Tags sowie Reader-Fehler erhalten passende Hinweise. Der vorhandene Node-Test führt die echten Inventur- und Lesehandler mit Reader-Doubles aus und prüft die Hinweise. Weitere Gerätefälle (Disconnect/Reconnect, abweichender Speicher, kein Community-Treffer) bleiben zur Abnahme offen.
