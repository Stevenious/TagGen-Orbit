# TagGen Orbit 5 · Release Candidate 8

**Deine Geschichten. Dein System.**

![TagGen Orbit](assets/orbit-logo.svg)

Ein Cover für einen Tag. Ein dauerhaft zugeordneter Bogen für zwölf Geschichten. Orbit verbindet Tonie-Suche, Gestaltung, private NFC-Dateien und A4-Druck als statische App für GitHub Pages.

## Schnell starten

1. `index.html`, `sw.js`, `manifest.webmanifest` und den Ordner `assets/` gemeinsam in das GitHub-Pages-Verzeichnis legen; bestehende Dateien vorher sichern.
2. Tonie suchen und anklicken. Figurenbilder werden bei gleicher Trefferqualität bevorzugt.
3. Cover anpassen und auf den Druckbogen legen – oder mit **＋ In Sammlung** sammeln.
4. Papierformat wählen und bei **100 % / tatsächliche Größe** drucken.

Die App benötigt keinen Build, Account oder Server. Beide Tonie-Kataloge werden weiterhin asynchron geladen; ein Browser-Cache und optionaler JSON-Import dienen als Ausweichmöglichkeiten. Online-Bilder sind ohne passende CORS-Freigabe sichtbar und druckbar, aber nicht immer als PNG exportierbar.

## Neu: Eine Sammlung für zwölf Custom Tags

Eine benannte Arbeitsliste hält Coverzustand, festen Bogenplatz und optionale NFC-Originaldatei zusammen. Die Sammlung wird im Browser gespeichert; **Sammlung sichern** erzeugt eine private `.orbit-collection`-Datei für Backups oder den Wechsel zwischen iPhone und Desktop. Mehrere Sammlungen können als getrennte Dateien verwaltet werden; im Browser ist jeweils eine aktiv.

### Ich habe zwölf NFC-Dumps

**Sammlung → NFC-Dateien gemeinsam laden → Vorschläge prüfen → Stapel auf Druckbogen.**

- Mehrere Flipper `.nfc`- und Safari `.nfc.txt`-Dateien gemeinsam auswählen.
- Orbit prüft die Dateistruktur und sucht anhand des Dateinamens nach dem Titel.
- Nur ein eindeutiger Titelbezug wird automatisch bestätigt. Mehrdeutige Ergebnisse benötigen eine Auswahl im Studio.
- **Cover** öffnet den Editor; **Motiv wählen** öffnet die Bibliothek. **In Sammlung übernehmen** speichert das Ergebnis zurück.
- Sobald alle Einträge bestätigt sind, können bis zu zwölf Cover gemeinsam auf den Druckbogen gelegt werden.

Die Zuordnung über einen Dateinamen ist keine kryptografische Identifikation des Audioinhalts. Tag-UID und Audio-ID werden getrennt gespeichert.

### Ich starte mit den Covern

**Studio → suchen → Cover gestalten → ＋ In Sammlung.**

Alternativ fügt **Bibliotheksseite übernehmen** die aktuell sichtbaren vier bzw. acht Treffer hinzu. Wiederholte Seitenübernahme erzeugt keine doppelten Katalogeinträge. So lassen sich mehrere Suchen zu einem Stapel kombinieren.

Am Sammlungseintrag öffnet **NFC suchen** die bestehende Dump-Suche mit dem Titel. Eine Datei aus dem Repository auswählen oder eine eigene laden, danach **Geladenen Dump zuordnen**. Die Zuordnung wird ausdrücklich bestätigt. Ein fehlender Dump blockiert den Coverdruck nicht.

### Mein Druckbogen ist schon vorbereitet

**Sammlung → Druckbogen übernehmen** kopiert belegte Cover in freie Sammlungsplätze. Mehrfach vorhandene Cover bleiben einzelne Einträge. Ein Stapel ersetzt einen belegten Druckbogen erst nach Bestätigung; **Rückgängig** stellt den vorherigen Bogen wieder her.

## Dateiformate und Datenschutz

| Datei | Zweck |
| --- | --- |
| `.taggen` | Bestehendes Projektformat für Editor, Druckbogen, Papier und Kalibrierung; ggf. aktuell verknüpfte NFC-Datei |
| `.orbit-collection` | Private Sammlung mit bis zu zwölf Coverzuständen und deren Original-NFC-Dateien |
| Öffentliches Cover-Paket | Bestehender Export ohne Audio-IDs und NFC-Daten |
| `.nfc` | Unverändert gespeicherter Original-Dump aus der Werkstatt/Sammlung |
| `.png` | Gerastertes Einzelcover, sofern die Bildquelle den Export zulässt |

**Private Sammlungen können Passwörter und Speicherinhalte enthalten.** Sie sind kein öffentliches Community-Paket. Es erfolgt kein Upload der Sammlung an einen Orbit-Server. Falls der Browser-Speicher voll oder gesperrt ist, weist Orbit auf die Dateisicherung hin. Online-Bildverweise bleiben netzabhängig, wenn die Quelle keine Einbettung erlaubt.

## Formate

| Format | Raster / Plätze |
| --- | --- |
| Frei Ø25 mm | 7 × 10 / 70 |
| Frei Ø30 mm | 6 × 8 / 48 |
| Frei Ø40 mm | 3 × 4 / 12 oder 4 × 6 / 24 |
| Münzkapsel Ø43 mm | 3 × 4 / 12 |
| Avery Zweckform 6223-10, Ø30 mm | 6 × 8 / 48 |
| Avery Zweckform L3415-10, Ø40 mm | 4 × 6 / 24 |

Die beiden runden Avery-Geometrien und die Kalibrierung wurden aus der zuvor vom Nutzer am Drucker abgenommenen Version übernommen. A4-Vorschau und Druck-CSS bleiben getrennt. Die Druckausgabe enthält nur Cover, keine Menüleiste oder Sammlung.

**Quadratische Kapseln – aktualisierte Recherche:** Im [RevvoX-Thread „Square Custom Tags“](https://forum.revvox.de/t/square-custom-tags/1703) verwenden mehrere Nutzer QUADRUM-Kapseln. Genannt werden 43 × 43 mm (max. 43,5 mm) für den Papiereinleger; gedruckt wird auf Normalpapier, 24 Cover pro A4-Blatt, anschließend ausgeschnitten. Das [Hersteller-Außenmaß](https://www.leuchtturm.de/quadrum-muenzkapseln.html) beträgt 50 × 50 × 6,25 mm und ist nicht das Covermaß. Das ist ein konkreter Bedarf für ein freies Quadratformat; eine Häufigkeitsverteilung oder ein bevorzugtes quadratisches Avery-Produkt ist daraus nicht ableitbar. Der Editor unterstützt jetzt runde und quadratische Cover; 43 × 43 mm ist als freies 24er-A4-Raster enthalten.

## Was die Community-Recherche nahelegt

Die folgenden Primärquellen beschreiben konkrete Wünsche, aber keine repräsentative Erhebung der gesamten Community:

- [TeddyCloud #157 – Labels und Gruppierung](https://github.com/toniebox-reverse-engineering/teddycloud/issues/157): unterschiedliche Tag-Arten sollen leichter unterscheidbar und gruppierbar werden. Orbit greift dies mit einer benannten privaten Arbeitsliste auf.
- [TeddyCloud #156 – Bild für Custom Tags](https://github.com/toniebox-reverse-engineering/teddycloud/issues/156): eigene Bilder sollen die Identifikation erleichtern. Orbit hält Bild und Titel beim Sammlungseintrag zusammen.
- [RFIDfriend NFC Archiver](https://github.com/RFIDfriend/NFC-Archiver): ESP32/PN5180, ISO15693, BLE-Protokoll und eigene App-/Hardwarepfade. Die Hardware bleibt ein optionaler Werkstattbereich.
- [Tonie-Kataloge](https://github.com/toniebox-reverse-engineering/tonies-json): Metadatenquelle für die vorhandene Suche.
- [Flipper-Tonie-Dateien](https://github.com/nortakales/flipper-zero-tonies): bestehende Suchquelle für NFC-Dumps; nicht jeder Katalogeintrag hat dort eine Datei.

Daraus folgt für Orbit: **weniger wiederholte Eingaben, sichtbare Zuordnungen, korrigierbare Vorschläge und ein wiederverwendbarer Druckstapel.** Eine tiefere TeddyCloud-Integration ist für diesen Nutzen nicht erforderlich.

## Brand

TagGen Orbit behält das bekannte Orbit-T-Zeichen. Das SVG ist als `assets/orbit-logo.svg` beigefügt; das App-Logo ist direkt in der HTML eingebettet, sodass `index.html` alleine deploybar bleibt.

- Rose `#DA2355`: Hauptaktion
- Tinte `#172033`: Text
- Blau `#2863DC`: Links
- Helles Glas, klare Flächen, Systemschrift
- Claim: **Deine Geschichten. Dein System.**

## Tests und Grenzen

Siehe [TEST_REPORT.md](TEST_REPORT.md). Die tatsächlichen JavaScript-Eventhandler und Zustandsänderungen wurden automatisiert mit DOM-/Netzwerk-Testdoubles und einem Canvas-Renderer geprüft. Das ist **keine neue Safari-/Desktop-Browser-Abnahme**: Ein echter Browserlauf war in dieser Umgebung wegen fehlender Browserdateien und fehlgeschlagenem Download nicht möglich. Die bisherigen Nutzerabnahmen betreffen die Ausgangsversion.

UID-/Passwortänderungen, direkte TeddyCloud-Synchronisation und browserinterne Verwaltung beliebig vieler Sammlungen sind nicht Teil dieses Prereleases. BLE-Speicherzugriffe sind experimentell und benötigen eine passende Firmware; physische Hardwaretests stehen aus.

## Nächster Schritt zur V5-Freigabe

Eine Geräteabnahme mit dem fertigen Build: zwölf Einträge sammeln, einen Vorschlag ändern, Sammlung sichern/laden und einen Bogen drucken. Danach anhand realer Nutzung entscheiden, ob mehrere Sammlungen im Browser oder ein verifiziertes Quadratformat den größeren Nutzen bringen.


## Prerelease 2 · Rückmeldung aus der Geräteabnahme

- „Weiteres Motiv“ und „Bibliothek“ öffnen explizit die Bibliothek, auch wenn vorher der Editor aktiv war.
- Dump-Suche gleicht ä/ae, ö/oe, ü/ue und ß/ss an; Repository-Pfade bleiben unverändert.
- Mobil stehen Format und Druckaktion vor der Vorschau. Projekte, Kalibrierung und Hinweise sind unter der Vorschau gebündelt. Zwei Sprungbuttons machen Bogen und weitere Optionen direkt erreichbar.
- „Das versunkene Schiff“ ist im am 22.09.2026 geprüften Fuenf-Freunde-Ordner nicht enthalten. Die App ersetzt einen fehlenden Dump nicht durch eine andere Folge.


## Neu in Prerelease 4: Form, Rückseite und Reader

### Quadratische Cover

Im Editor unter **Coverform → Quadratisch** wählen. Gerade Serie-/Titelzeilen ersetzen den Kreistext. „Ganzes Bild“ zeigt das Motiv vollständig; „Flächig“ füllt den Ausschnitt. Zoom und X/Y bleiben verfügbar. Leere Textfelder ergeben ein reines Bildcover. Form und Bildmodus bleiben in Projekten und Sammlungen erhalten.

| Quadratisches Papier | Raster | Linker Rand | Oberer Rand | Abstand X/Y |
| --- | --- | --- | --- | --- |
| Frei 43 × 43 mm | 4 × 6 = 24 | 13 mm | 9,5 mm | 4 / 4 mm |
| Avery Vorlage 40×40-S | 4 × 6 = 24 | 19 mm | 18,46628 mm | 4 / 4 mm |
| Avery Vorlage 45×45-S | 4 × 6 = 24 | 12 mm | 8,46628 mm | 2 / 2 mm |

Die Avery-Koordinaten stammen aus den expliziten, seitenbezogenen Stanzkonturen der bereitgestellten DOCX-Dateien, nicht aus den Text-/Zellrändern. Die Konturen haben abgerundete Ecken; das Motiv wird vollquadratisch ausgegeben, wichtige Texte liegen innen. Die neuen Quadratvorlagen benötigen noch einen Kontrollausdruck. HERMA 9642 wird nicht ohne eigene Geometrieprüfung mit der Avery-Vorlage gleichgesetzt.

Ein Formwechsel auf einem belegten Bogen fragt vor der Anpassung der Druckkopien nach. Gespeicherte Sammlungseinträge bleiben erhalten. Rückgängig stellt den vorherigen Bogen wieder her.

### Rückseite & QR

Im eingeklappten Editorbereich Rückseite aktivieren. Titel und Serie kommen aus dem Cover; Audio-ID und optional Tag-UID stehen auch ausgeschrieben darauf. QR kann ausgeschaltet werden. Der Sammlungs-QR enthält Titel, Serie, Audio-ID und Notiz; im NFC-Modus zusätzlich Dateiname und Status. „Metadaten aus geladenem NFC-Dump“ übernimmt UID/Dateiname aus der Werkstatt. Die UID erscheint nur mit aktiviertem Schalter. Es werden keine Passwörter oder Speicherblöcke im QR hinterlegt. Ein normaler QR-Scanner kann den JSON-Text lesen; automatischer Orbit-Import aus QR ist noch nicht enthalten.

QR-Erzeugung läuft vollständig lokal. PNG-Export der Rückseite benötigt keine externen Coverbilder. Nach Änderungen das Cover erneut auf den Druckbogen legen bzw. in der Sammlung übernehmen: Bereits platzierte Cover sind eigenständige Kopien.

Druckausgabe: Vorderseiten, nur Rückseiten oder Duplex. Duplex erzeugt absichtlich zwei A4-Seiten. Die Wendekante im Druckdialog muss der Einstellung in Orbit entsprechen. Lange Kante spiegelt die X-Positionen, kurze Kante die Y-Positionen — niemals den QR oder die Schrift. Nicht aktivierte Rückseiten bleiben leer. Kalibrierungsdruck im Duplexmodus erzeugt zwei passende Kontrollbögen. Für Duplex Normalpapier verwenden; Klebeetiketten werden einseitig bedruckt. QR-Rückseiten ab 40 mm empfohlen; bei viel Text/kleinen Formaten reale Scanbarkeit prüfen.

Private .taggen-Projekte speichern Rückseitendesign und Druckmodus. Öffentliche Cover-Pakete entfernen Audio-IDs, Tag-UID, NFC-Dateiname/-Status und Rückseitennotizen.

### BLE · experimentelles Auslesen

Orbit verbindet sich mit einem externen ESP32 + PN5180 mit NFC-Archiver-Firmware. Gerätefähigkeiten entscheiden, ob Erkennen, Speicherlesen und Archivzugriff verfügbar sind. Bei fehlendem InventoryAll nutzt Orbit den vorhandenen Raw-ISO15693-Leseweg.

1. Auf iPhone/iPad Orbit in [Bluefy](https://apps.apple.com/app/id1492822055) öffnen und den Reader verbinden.
2. Einen Tag auflegen, erkennen und Speicher lesen.
3. **Gelesenen Tag öffnen** übernimmt ihn als NFC-Datei in die Werkstatt; dort sichern oder einem Cover zuordnen.

Safari bleibt für Bibliothek, Cover, Sammlung, Druck und Dateiimport nutzbar. Bluefy steuert den externen Reader; der eingebaute iPhone-NFC-Leser wird nicht angesprochen. Safari und Bluefy teilen ihren lokalen Browser-Speicher nicht: Projekte beziehungsweise Sammlungen über die vorhandenen Export-/Importdateien übertragen.

Der Schreibmodus wurde vollständig entfernt. Der Raw-Adapter erlaubt ausschließlich Inventory, Get System Information und Read Single Block; andere Tag-Befehle werden vor dem BLE-Versand abgewiesen. Speicher, UID, Passwörter und Sperren werden nicht verändert. Geschützte Speicherbereiche können nicht automatisch entsperrt werden. Ausgelesene Speicherdateien enthalten keine ausgelesenen Geheimnisse, die das Gerät nicht liefert, und sind kein garantiert vollständiges Backup aller Tag-Eigenschaften.

Hardware, Installation und Protokolldokumentation: [NFC-Archiver](https://github.com/RFIDfriend/NFC-Archiver). Physische Reader-Abnahme offen. Die App benötigt für Cover und Druck keine BLE-Hardware.

### Drittsoftware

QR Code Generator von Kazuhiko Arase, Copyright 2009, MIT-Lizenz: https://github.com/kazuhikoarase/qrcode-generator. Quelltext und vollständiger Lizenzhinweis sind in index.html eingebettet. Keine CDN-Abhängigkeit.


## Prerelease 5 — Duplex-Korrektur nach mobiler Abnahme

Quadratische Cover wurden vom Nutzer mobil abgenommen. Neu ist die Standardausgabe **Automatisch**: Sobald mindestens eine platzierte Rückseite aktiv ist, erstellt Orbit zwei Seiten. „Nur Vorderseiten“ bleibt ausdrücklich wählbar. Das Druckstudio zeigt die erwartete Seitenzahl und einen eigenen Rückseitenbogen vor dem Öffnen des Druckdialogs.

Wurde das Cover bereits platziert, erscheint nach einer Rückseitenänderung **Rückseite an Position … aktualisieren**. Dies ersetzt die Rückseite der passenden ausgewählten Position und fügt kein zweites Cover hinzu. Die Zuordnung erfordert ein identisches Vorderseitendesign. Bei mehreren gleichen Vorderseiten zunächst die gewünschte Position wählen. Beim Drucken fragt Orbit nach, falls diese Übernahme noch aussteht; ein Abbruch verhindert das Drucken der alten Rückseite.

Bestehende Projekte mit ausdrücklich gespeichertem Modus „Vorderseiten“ behalten ihn. Für Duplex dort einmal „Automatisch“ oder „Duplex“ wählen. Bei richtig vorbereitetem Olchi-Bogen muss die Druckvorschau **Seite 1 von 2** zeigen. Als Duplex-Hilfe wurde zusätzlich `page-break-before: always` zur modernen Umbruchregel ergänzt.

Im RC1 ersetzt der ausschließlich lesende Adapter den früheren experimentellen Schreibmodus.

## RC1 · Sprint 1–2

Ein gemeinsamer Release Candidate: ausschließlich lesendes BLE, klare Bluefy-Hilfe, unveränderte Duplex-Korrektur und erneute Regression des Sammlungs-/Druckworkflows. Eine Logoanimation bleibt zurückgestellt. Keine neuen Sammlungsfunktionen, kein Schemawechsel.

Zur finalen Freigabe bleiben reale Safari-Duplexausgabe, QR-Scan vom Papier und der konkrete BLE-Reader zu prüfen. Der RC ist keine Behauptung einer abgeschlossenen Hardwareabnahme.

## RC2 · Bogen-Manager für zwölf feste Tags

**Sammlung → bis zu zwölf Dateien ablegen → gelbe Einträge prüfen → Stapel auf Druckbogen → Ausgabe „Automatisch“ drucken.** Auf dem Desktop können `.nfc`- und `.nfc.txt`-Dateien gesammelt auf das Dropfeld gezogen werden; auf dem iPhone steht die Dateiauswahl bereit. Ein Ordner klappt nur, wenn der Browser dessen Dateien als abgelegte Dateien bereitstellt. Der vorhandene Katalog wird für Vorschläge genutzt. Dateinamen sind Hinweise, keine sichere Audioidentifikation; Audio-IDs aus beliebigen NFC-Speicherblöcken werden nicht behauptet.

Jeder Sammlungseintrag erhält einen stabilen Platz von 1–12. Im Raster Plätze per Maus ziehen oder nacheinander antippen; auf Mobil den Platz am Eintrag auswählen. Ein Tausch mit belegtem Platz vertauscht die Positionen. Grün bedeutet bestätigtes Cover mit NFC-Datei; Gelb zeigt fehlendes Cover, unbestätigte Zuordnung oder einen Covereintrag ohne NFC-Datei. Eintrag „NFC austauschen“ wählt den vorhandenen Platz. Ändert sich die Datei oder UID, muss das Cover ausdrücklich bestätigt werden. Unveränderte Einträge bleiben auf ihren Plätzen.

„Stapel auf Druckbogen“ erzeugt Vorderseiten und immer automatisch die zugehörigen QR-Rückseiten. Ohne NFC-Datei enthält der QR-Code Titel und Serie sowie eine vorhandene Audio-ID; mit NFC-Datei kommen Dateiname, Status und Tag-UID hinzu. Bei gleichem Papierformat werden nur Sammlungseinträge neu übernommen; fremde belegte Positionen erfordern Zustimmung. Mit anderer Vorlage fragt Orbit vor dem Ersetzen des Bogens. Die private `.taggen`-Projektdatei sichert zusätzlich die komplette Sammlung samt Positionsnummern und NFC-Originaldateien; das eigenständige `.orbit-collection`-Format wurde auf Version 2 angehoben und liest Version 1 weiter (alte Reihenfolge wird zu Plätzen 1–12). Öffentliche Cover-Pakete enthalten keine Sammlung und keine Positions-IDs.

Duplex erzeugt bei aktivierten Rückseiten zwei A4-Seiten: auf Seite 2 wandern die **Positionen** passend zur eingestellten langen oder kurzen Wendekante. Text und QR-Code bleiben lesbar. Die printerabhängige Wendekante und QR-Scanbarkeit am Papier vor dem Einsatz mit Etiketten prüfen.

## RC3 · Rückseiten ohne Studio-Schritt

Sammlungsdruck aktiviert die Rückseite für **jedes** bestätigte Cover. Auch ein reiner Coverstapel ohne NFC-Dateien erzeugt bei Ausgabe „Automatisch“ zwei A4-Seiten. Für acht ausgewählte Cover gibt es acht QR-Rückseiten an den passenden Positionen. Eine UID wird nur ergänzt, wenn sie aus einer zugeordneten NFC-Datei stammt. Eine ausdrücklich gewählte Ausgabe „Nur Vorderseiten“ bleibt auch nach erneuter Übernahme aus der Sammlung erhalten.

Die bestehende private Projektdatei und die Sammlung bleiben lesbar. Vor einer physischen Etikettenausgabe sind QR-Scan und Wendekante auf Normalpapier zu prüfen.

## RC4 · Offline-Start und bedienbarer Druckbogen

GitHub Pages veröffentlicht jetzt **`index.html`, `sw.js`, `manifest.webmanifest` und `assets/orbit-icon-192.png`/`orbit-icon-512.png` zusammen im selben Verzeichnisbaum**. Nur `index.html` zu aktualisieren aktiviert den Offline-Start nicht. Das Manifest verwendet relative URLs, damit Orbit auch unter dem GitHub-Pages-Projektpfad funktioniert. Nach dem ersten vollständigen Online-Laden speichert der Service Worker App-Seite, Manifest und Icons. Bei weiterer Verbindung lädt er aktuelle Oberflächenversionen; alte eigene Shell-Caches werden nach Aktivierung entfernt. Installiere Orbit auf unterstützten Geräten über „Zum Home-Bildschirm“/„App installieren“, falls der Browser es anbietet.

Der vorhandene Katalog-Cache bleibt separat: Beim Offline-Start greift die bestehende Anwendung auf zuvor gespeicherte Katalogdaten zurück. **Externe Coverbilder sind dadurch nicht automatisch offline.** Private `.taggen`-, `.orbit-collection`- und `.nfc`-Dateien werden nicht vom Service Worker abgefangen oder in dessen Cache geschrieben. Sichere deine Sammlung weiterhin als private Datei, insbesondere beim Gerätewechsel oder wenn der Browser Daten löscht. NFC-Hardware und Bluefy benötigen weiterhin ihre passende Browser-/Geräteumgebung.

Druckpositionen sind native Buttons mit Position und Cover im zugänglichen Namen. Mit Tab zu einem Platz, Enter/Leertaste zum Wählen, dann „Verschieben“ und Zielplatz mit Tab und Enter wählen. „Kopieren“ und „Löschen“ sind ebenfalls Buttons mit Positionsbeschriftung. Nach einer Positionsänderung bleibt der Fokus beim neuen Platz; die Sammlung hat eine Positionsauswahl für Tastatur und Touch. Änderungen werden als Status angesagt. Drag & Drop bleibt eine zusätzliche Mausbedienung.

Automatisierte Tests prüfen Zustandsaktionen, Fokus nach Neuaufbau und den simulierten Service-Worker-Zyklus mit Offline-Navigation. Offene Geräteabnahme: Safari zum Home-Bildschirm hinzufügen, Offline-Neustart nach erfolgtem Online-Laden und VoiceOver/Tastatur durch alle Druckaktionen. Ein automatisierter Test ist keine WCAG-Konformitätsprüfung.

## RC5 · Safari-Duplexdruck

Der Druckbereich endet jetzt hinter dem letzten belegten Motiv und der Seitenwechsel erfolgt einmal zwischen Vorder- und Rückseite. Das verhindert die zusätzliche Leerseite, die Safari bei einer fast A4-hohen Druckfläche vor dem erzwungenen Umbruch erzeugt hat. Nach dem Upload `index.html` einmal neu laden; bei installierter PWA gegebenenfalls die Seite schließen und erneut öffnen. Physische Safari-Druckabnahme steht aus.

## RC6 · Flow Lock und BLE Read Lock

Die Bibliothek zeigt während des ersten Ladevorgangs „Kataloge werden geladen …“ statt „0 Treffer“. Nach Abschluss unterscheidet sie Treffer und Ladefehler. JSON-Importe bleiben beim nachfolgenden Online-Abgleich erhalten. Der Filter „Verlauf/Eigene“ wird nicht durch einen zweiten Eventhandler überschrieben. Wiederholtes Tippen auf „Auf den Druckbogen“ während des Coverladens erzeugt nur einen Slot.

Unter „System & Verbindungen → Flow prüfen“ führt Orbit sechs lesende Laufzeitprüfungen aus: Katalog, Suchtreffer, Cover, Sammlungs-Roundtrip, verknüpfter Druckslot und Druckdaten. Ohne den vollständigen Ablauf sind weniger als 6/6 korrekt. Das ersetzt keinen physischen Drucktest.

Beim BLE-Lesezugriff bleibt der Reader ausschließlich lesend. „Gelesenen Tag öffnen“ zeigt bei einer eindeutig bereits in der Sammlung gespeicherten UID das zugehörige Cover im Studio. Bei unbekannter UID bleibt die Werkstatt offen; das Motiv muss bewusst zugeordnet werden. Die bestehende Sammlung und ihre gespeicherten Dumps werden durch Lesen nicht geändert. UID allein beweist keinen Audioinhalt.


## RC7 · Tag Identity

Jeder Sammlungseintrag speichert nun drei getrennte Bereiche: `content` (Titel, Serie, Cover/Editorzustand und Inhalts-Audio-ID), `tag` (UID und private originale .nfc-Datei) und `physical` (43-mm-Kapsel, Custom Tag, Kreativ-Tonie, Original-Tonie oder Custom-Figur). Der Träger wird direkt am Sammlungseintrag gewählt. Eine neue NFC-Datei ändert Cover und Titel nicht; ein neues Cover lässt Tag-UID und Datei unverändert. Die private Sammlung nutzt Formatversion 3; ältere Versionen 1 und 2 werden beim Laden migriert. Die .taggen-Projektdatei enthält und lädt diese Sammlung ebenfalls. Exportiere vor einem Gerätewechsel eine private Sicherung.

In der Werkstatt findest du „TeddyCloud nutzen · Dateien & Zuordnung“ mit der Reihenfolge Orbit-Cover/PNG, .nfc-Dokumentation und Zuordnung in TeddyCloud. Orbit ist eine statische GitHub-Pages-App, besitzt keine TeddyCloud-Authentifizierung und synchronisiert keine privaten NFC-Dumps oder Tag-UIDs mit einem Server. Orbit-Backups steuern die Wiedergabe der Toniebox nicht.

## RC8 · NFC Read & Verify

Beim Öffnen eines gelesenen Tags zeigt die Werkstatt UID, Speichergröße und die erkennbare ISO15693-/SLIX-L-UID-Kennung. Ein eindeutiger Treffer in der eigenen Sammlung kann das bekannte Cover öffnen. Weichen die gelesenen Speicherbytes von der gespeicherten NFC-Datei ab, ist dieselbe UID mehrfach gespeichert oder ist die UID unbekannt, erfolgt keine automatische Cover-Übernahme. Ein generierter Dateiname `Tag-<UID>.nfc` gilt nicht als Hörspieltitel.

Bei unbekannter UID kann man **„Community-Dumps prüfen“** wählen. Orbit lädt dazu erst auf Knopfdruck den öffentlichen [Index von L480](https://github.com/L480/tonies), der aus den [Flipper-Zero-Tonie-Dumps von nortakales](https://github.com/nortakales/flipper-zero-tonies) erzeugt wird. Die UID wird im Browser verglichen. Ein einzelner Index-Treffer wird anschließend mit dem zugehörigen öffentlichen Dump byteweise abgeglichen. Selbst bei Übereinstimmung erscheint nur ein Cover-Vorschlag, den man in der Bibliothek bewusst auswählt. Kein Treffer und abweichende Bytes bleiben ungeklärt. Die UID-Kennung und ein Dump-Abgleich beweisen weder einen Originalchip noch den tatsächlichen Audioinhalt. Reader-Schreibbefehle sind weiterhin gesperrt.
