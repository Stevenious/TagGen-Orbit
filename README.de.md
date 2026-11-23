# TagGen Orbit · Universe 6.0 Preview

**Custom Tags gestalten, organisieren und für den Druck vorbereiten.**

[Web-App öffnen](https://stevenious.github.io/TagGen-Orbit/) · [English README](README.md) · [Fehler melden / Idee vorschlagen](https://github.com/Stevenious/TagGen-Orbit/issues)

TagGen Orbit ist ein browserbasiertes Werkzeug für individuelle Cover, die Organisation physischer Custom Tags und die Vorbereitung von A4-Druckbögen. Cover-Studio, Sammlung, Drucklayouts und lesende NFC-Werkzeuge sind in einer Anwendung gebündelt.

Orbit funktioniert eigenständig in jedem Browser. Wer [TeddyCloud](#teddycloud-vom-dateiaustausch-zum-lesenden-plugin) nutzt, kann Titel, Cover und Tag-UIDs aus einer Datei oder – als lesendes Plugin – direkt aus seiner TeddyCloud übernehmen.

> **Projektstatus:** Universe 6.0 Preview. Die Anwendung ist nutzbar. Hardware-Kompatibilität, Druckerausrichtung und einzelne geräteabhängige Abläufe müssen weiterhin in der Praxis geprüft werden. Feedback ist willkommen.

## Was du mit Orbit machen kannst

_Die Screenshots zeigen die Anwendung mit erfundenen Demodaten (Titel, Cover und Tag-UIDs)._

### Cover gestalten
- Katalogeinträge suchen und vorhandene Coverbilder als Ausgangspunkt verwenden.
- Eigene Bilder nutzen – einzeln oder als Stapel mit bis zu 12 PNG-, JPEG- oder WebP-Dateien.
- Runde oder quadratische Designs bearbeiten, Layouts anpassen und optional eine Rückseite gestalten.
- Unsichere Dateinamen-Zuordnungen werden nur als Vorschlag angezeigt und müssen bestätigt werden.

![Cover-Studio: runde 43-mm-Covervorschau mit Serie und Titel links, rechts Format, Titel, Serie, eigenes Bild und Layout](assets/screenshots/orbit-cover-studio.png)

### Physische Tags organisieren
- Mehrere benannte Sammlungen verwalten. Jede Sammlung hat bis zu 12 Arbeitsplätze.
- **Inhaltsmetadaten**, **Audio-ID**, **NFC-Tag-UID** und **physischer Träger bzw. Format** bleiben getrennte Angaben.
- Einträge ergänzen, austauschen, prüfen und verschieben, ohne unbeteiligte Cover- oder Tag-Daten stillschweigend zu verändern.
- Einträge aus einer `taggen-exchange`-Datei, aus TeddyStudio-Exporten oder – im TeddyCloud-Plugin – aus deinen TeddyCloud-Tags übernehmen. Erst nach deiner Bestätigung der Vorschau ändert sich etwas.
- Eine Sammlung **für TeddyCloud exportieren**: eine ZIP-Datei mit `tonies.custom.json` und Coverbildern, damit deine eigenen Tags in TeddyCloud Titel und Bild bekommen.
- Der Tag-Pass zeigt, was bekannt und zugeordnet ist und wo noch Angaben fehlen.

![Sammlungsansicht: Sammlungsauswahl, Welten-Filter, Druckstatus und Coverkarten](assets/screenshots/orbit-collection-tagpass.png)

![Tag-Pass eines Eintrags: Stand von Inhalt, Cover, Druckbogen und NFC-UID sowie Welt, physischer Träger und Sammlung](assets/screenshots/orbit-tag-pass.png)

### Druckbögen vorbereiten
- Cover auf A4-Druckbögen anordnen und über den Druckdialog des Browsers drucken oder als PDF speichern.
- Verfügbare Formate:
  - Münzkapsel · 43 mm · 12 Plätze
  - Avery 6223-10 · 30 mm · 48 Plätze
  - Avery L3415-10 · 40 mm · 24 Plätze
  - Freie runde Formate: 25 mm, 30 mm, 38 mm (Tag-Gehäuse), 40 mm und 50 mm (Figurensockel)
- Optionale Rückseiten können QR-Informationen und Tag-Angaben enthalten.
- Druckerkalibrierung und Duplex-Einstellungen sind – soweit unterstützt – vorhanden.

![Druck-Studio: A4-Bogen für 43-mm-Münzkapseln mit 12 belegten Plätzen sowie Papier- und Ausgabeeinstellungen](assets/screenshots/orbit-print-studio.png)

**Drucktipp:** Zuerst einen Probedruck auf normalem Papier machen. Im Druckdialog 100 % / tatsächliche Größe wählen und Skalierung, Ränder sowie Wendekante prüfen, bevor Etikettenpapier verwendet wird. Die tatsächliche Passung hängt von Drucker und Treiber ab.

### NFC-Tags lesen und prüfen (optionale Hardware)
- Vorhandene Flipper-NFC-Dateien importieren und die ausgelesenen Angaben prüfen.
- Optional einen kompatiblen **ESP32 + PN5180** mit NFC-Archiver-Firmware über Web Bluetooth verbinden.
- Tag-Informationen lesen und mit einem bekannten Eintrag vergleichen. Veränderte oder mehrdeutige Daten werden nicht automatisch als Treffer behandelt.
- Auf iPhone/iPad kann der BLE-Reader einen Web-Bluetooth-fähigen Browser wie [Bluefy](https://apps.apple.com/app/id1492822055) benötigen. Covergestaltung, Sammlungen, Druck und NFC-Dateiimport funktionieren auch in Safari ohne Reader.

**Bewusst nur lesend:** Orbit schreibt keine NFC-Tags, ändert keine UIDs, entsperrt keinen geschützten Speicher und verwaltet keine Tag-Passwörter. Eine erkannte UID oder ein passender Dump beweist weder den Audioinhalt noch die Echtheit eines Tags.

## TeddyCloud: vom Dateiaustausch zum lesenden Plugin

Orbit kümmert sich um die physische Seite – Cover, Tags und Druckbögen. [TeddyCloud](https://github.com/toniebox-reverse-engineering/teddycloud) bleibt für Inhalte und Wiedergabe zuständig. Beides lässt sich in drei Stufen verbinden. Jede Stufe ist freiwillig, und in keiner verändert Orbit die TeddyCloud-Konfiguration.

| Stufe | So funktioniert es | Was Orbit erhält |
| --- | --- | --- |
| 1 · Getrennt | Cover gestalten und Tag in Orbit dokumentieren, dann Inhalt und Bild in der TeddyCloud-Oberfläche zuweisen. | Nichts – keine Verbindung. |
| 2 · Dateiaustausch | **Erstellen → „Aus TeddyStudio importieren“** liest eine [`taggen-exchange`](exchange/SCHEMA.md)-Datei oder die heutigen TeddyStudio-Exporte (Cover-Manifest, Sammlung, Bilder). | Titel, Serie, Cover, TeddyCloud-Modell, Audio-ID und Tag-UID – aus einer Datei, die du auswählst. In die andere Richtung: **Sammlung → „Für TeddyCloud exportieren“** erstellt eine `tonies.custom.json` mit Coverbildern, die du selbst in TeddyCloud kopierst. |
| 3 · TeddyCloud-Plugin (Vorschau) | Orbit in den Plugin-Ordner von TeddyCloud legen und **Erstellen → „Tags aus TeddyCloud lesen“** wählen. | Deine Tags, Custom-Tonies und den Katalog – direkt aus deiner eigenen TeddyCloud gelesen. |

Jeder Import beginnt mit einer Vorschau (neu, bereits vorhanden, Konflikt, fehlerhaft). Deine Bibliothek ändert sich erst, wenn du bestätigst.

### Die gehostete Web-App (GitHub Pages)
Die App auf GitHub Pages hat **keine Verbindung zu TeddyCloud**. Sie kann einen privaten Heimserver nicht erreichen und erhält nie TeddyCloud-Zugangsdaten. Ein gedrucktes Cover, eine Orbit-Projektdatei oder ein QR-Code ändert die TeddyCloud-Konfiguration nicht.

### Orbit als TeddyCloud-Plugin (Vorschau)
TeddyCloud kann Web-Plugins aus seinem Plugin-Ordner anzeigen. Von dort ausgeliefert, läuft Orbit unter derselben Adresse wie TeddyCloud und liest:
- deine Tags mit UID/RUID, zugeordnetem Modell und Cover,
- deine Custom-Tonies und den Katalog von TeddyCloud – damit funktioniert der Katalog auch ohne GitHub oder Internet.

**Bewusst nur lesend.** Orbit nutzt eine feste Liste aus vier Leseabrufen (`getTagIndex`, `toniesJson`, `toniesCustomJson`, `auth/status`) sowie Bilder aus TeddyClouds statischen Ordnern. Jede andere Anfrage wird abgelehnt, bevor sie gesendet wird. Orbit ändert keine Tag-Zuordnungen, Audiodateien oder Einstellungen und schreibt keine NFC-Tags. Die Anmeldung erledigt TeddyCloud mit seinem eigenen Sitzungs-Cookie; Orbit sieht weder Passwort noch Schlüssel.

Gut zu wissen:
- **Vorschau:** getestet gegen einen nachgebauten TeddyCloud-Server auf Basis des Quellcodes von TeddyCloud `tc_v0.7.1`; ein breiter Test mit echten Installationen steht noch aus.
- Ein TeddyCloud-Plugin läuft mit den Rechten des angemeldeten Nutzers. Installiere nur Pakete aus einer Quelle, der du vertraust.
- Unter der Adresse deiner TeddyCloud nutzt Orbit einen eigenen Browser-Speicher. Sammlungen ziehst du mit **„Alle Sammlungen sichern“** und **„Sammlung oder Bibliothek laden“** um.
- Läuft TeddyCloud nur über `http`, erlauben Browser kein Web Bluetooth (NFC-Reader) und keinen Offline-Start. NFC-Dateien, Cover, Sammlungen und Druck funktionieren weiterhin.

Installation und Details: [teddycloud-plugin/README.md](teddycloud-plugin/README.md).

Hilfreiche externe Dokumentation:
- [TeddyCloud-Anleitung für Custom Tags](https://tonies-wiki.revvox.de/docs/tools/teddycloud/usage/custom-tags/)
- [TeddyCloud: eigene Metadaten und Bilder](https://tonies-wiki.revvox.de/docs/tools/teddycloud/tecdoc/tonies-custom-json/)

## Schnellstart

### Die gehostete Web-App verwenden
1. [TagGen Orbit öffnen](https://stevenious.github.io/TagGen-Orbit/).
2. Einen Katalogeintrag suchen oder ein eigenes Bild auswählen.
3. Cover anpassen und einer Sammlung hinzufügen.
4. Physisches Format festlegen und bei Bedarf eine vorhandene NFC-Datei zuordnen.
5. Druckbogen vorbereiten und im Browser **Drucken** wählen.

Für die normale Nutzung ist weder ein Konto noch eine Installation erforderlich.

### In TeddyCloud verwenden (Vorschau)
Das Plugin-Paket mit `python3 tools/build-teddycloud-plugin.py` bauen und in den Plugin-Ordner von TeddyCloud entpacken. Orbit erscheint dann unter **Tonies**. Siehe [teddycloud-plugin/README.md](teddycloud-plugin/README.md).

### Als App installieren
In unterstützten Browsern die Funktion **App installieren** verwenden. Auf iPhone/iPad in Safari **Teilen → Zum Home-Bildschirm** wählen. Nach einem erfolgreichen Online-Aufruf kann die Anwendungshülle für einen Offline-Start zwischengespeichert werden.

### Lokal starten
Das Projekt ist eine statische Website. Das Repository-Verzeichnis über HTTP bereitstellen, zum Beispiel:

    git clone https://github.com/Stevenious/TagGen-Orbit.git
    cd TagGen-Orbit
    python3 -m http.server 8000

Danach [http://localhost:8000](http://localhost:8000) öffnen.

Für GitHub Pages müssen die Anwendungsdateien gemeinsam veröffentlicht werden: index.html, universe.js, universe.css, exchange.js, teddycloud.js, sw.js, manifest.webmanifest und das Verzeichnis assets/.

## Daten und Datenschutz

- Es gibt kein Orbit-Konto und keine zentrale Orbit-Sammlungsdatenbank.
- Sammlungen und Projektdaten liegen im Browser (wenn verfügbar in IndexedDB, mit localStorage-Ausweichlösung).
- Private Sicherungen entstehen erst durch einen bewussten Export. Bitte eigene Backups aufbewahren: Beim Löschen der Website-Daten können lokal gespeicherte Arbeiten verloren gehen.
- Eine private .taggen-Projektdatei kann das Arbeitsprojekt sichern. Sammlungs- und Bibliotheksexporte verwenden .orbit-collection und .orbit-library.
- Das **öffentliche Cover-Paket** entfernt Audio-IDs und NFC-Daten. Teile nur Bilder, für die du die nötigen Weitergaberechte hast.
- Der Offline-Service-Worker speichert die Anwendungshülle, nicht private Projekte, NFC-Dumps, externe Katalogdaten oder fremd gehostete Coverbilder.
- Als TeddyCloud-Plugin speichert Orbit seine Daten im Browser unter der Adresse deiner TeddyCloud und liest nur von diesem Server; an TeddyCloud wird nichts gesendet.
- Beim Aufruf von GitHub Pages sowie bei Anfragen an externe Kataloge, Community-Indizes oder Bildquellen werden Verbindungsdaten an die jeweiligen Anbieter übertragen. Details stehen in [CREDITS_AND_RIGHTS.md](CREDITS_AND_RIGHTS.md).

## Kataloge, Community-Daten und Danksagung

Orbit nutzt oder fragt optional externe Community-Ressourcen ab. Diese werden von ihren jeweiligen Maintainerinnen und Maintainer gepflegt; die Nennung bedeutet keine Unterstützung oder Partnerschaft.

- [tonies-json](https://github.com/toniebox-reverse-engineering/tonies-json) · Katalogmetadaten und Bildverweise
- [flipper-zero-tonies](https://github.com/nortakales/flipper-zero-tonies) · optionale Suche nach Community-NFC-Dumps
- [L480/tonies](https://github.com/L480/tonies) · optionaler UID-Index
- [NFC-Archiver](https://github.com/RFIDfriend/NFC-Archiver) · Dokumentation für Reader und BLE-Protokoll
- [TeddyCloud](https://github.com/toniebox-reverse-engineering/teddycloud) · Referenz für den Custom-Tag-Ablauf und der lesende Plugin-Modus
- [TeddyStudio](https://github.com/DKT81/TeddyStudio) · Orbit liest dessen Cover-Manifest- und Sammlungsexporte
- [QR Code Generator von Kazuhiko Arase](https://github.com/kazuhikoarase/qrcode-generator) · eingebettete QR-Implementierung (MIT)
- [Color Thief von Lokesh Dhakar](https://github.com/lokesh/color-thief) · Farben aus dem Motiv im Cover-Studio (MIT, `vendor/`)
- [smartcrop.js von Jonas Wagner](https://github.com/jwagner/smartcrop.js) · Ausschnitt-Vorschlag im Cover-Studio (MIT, `vendor/`)

Einige externe Repositories weisen im Stammverzeichnis keine Lizenz aus. Öffentliche Verfügbarkeit bedeutet nicht automatisch, dass Daten, Bilder oder Dumps weiterverbreitet werden dürfen. Mehr dazu: [Quellen, Danksagung und Rechte](CREDITS_AND_RIGHTS.md).

## Tests und bekannte Grenzen

Das Repository enthält automatisierte Prüfungen für Sammlungsintegrität, Import/Export, Druckgeometrie, Browserabläufe und Offline-Anwendungshülle. Der Workflow **Universe V6 checks** führt die entsprechenden automatisierten Tests aus.

Automatisierte Tests ersetzen keine Geräteprüfung. Folgende Punkte müssen auf dem tatsächlichen Zielsystem geprüft werden:
- Druckerausrichtung, Etikettenmaterial und Duplex-Wendekante.
- Reale Kombinationen aus Reader, Firmware und unterstützten Tagtypen.
- Browserabhängiges BLE-Verhalten, insbesondere unter iOS.
- Offline-Verfügbarkeit externer Katalogeinträge und Bilder.

Weitere Details: [UNIVERSE_V6.md](UNIVERSE_V6.md), [CHANGELOG.md](CHANGELOG.md) und [TEST_REPORT.md](TEST_REPORT.md).

## Feedback und Mitarbeit

Fehler gefunden oder eine Idee? [Issue eröffnen](https://github.com/Stevenious/TagGen-Orbit/issues). Hilfreich sind:
- Browser und Version, Gerät und Betriebssystem.
- Was du erwartet hast und was stattdessen passiert ist.
- Schritte zum Nachstellen und bei Bedarf ein Screenshot ohne persönliche Daten.

Bitte keine privaten NFC-Dumps, Zugangsdaten oder persönlichen Sammlungs-Backups in öffentliche Issues hochladen.

TagGen Orbit wird derzeit ohne allgemeine Open-Source-Lizenz veröffentlicht. Das Repository ist öffentlich einsehbar; daraus entsteht **keine Erlaubnis**, den Projektquellcode oder die Projektgrafiken weiterzuverwenden, zu verändern oder weiterzuverbreiten. Der eingebettete QR-Code-Bestandteil behält seinen eigenen MIT-Hinweis. Bitte vor einer Code-Weiterverwendung oder Kooperation zuerst ein Issue eröffnen.

## Projektidentität

TagGen Orbit / TagGen Universe ist ein unabhängiges Community-Projekt. **Tonie** und **Toniebox** sind Namen und Marken ihrer jeweiligen Rechteinhaber. Dieses Projekt ist nicht mit der tonies GmbH verbunden und wird von ihr weder unterstützt noch gesponsert.

---

[English · English documentation](README.md) · [Web-App öffnen](https://stevenious.github.io/TagGen-Orbit/) · [Repository](https://github.com/Stevenious/TagGen-Orbit)
