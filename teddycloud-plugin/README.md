# TagGen Orbit als TeddyCloud-Plugin (Prototyp)

Orbit kann zusätzlich als Plugin in [TeddyCloud](https://github.com/toniebox-reverse-engineering/teddycloud) laufen. Dann liest es die Tags, Custom-Tonies und den Katalog direkt aus deiner TeddyCloud – **ausschließlich lesend**. Zuordnungen, Audio und Einstellungen änderst du weiterhin in TeddyCloud.

> Status: Prototyp. Getestet gegen einen nachgebauten TeddyCloud-Server mit den Feldnamen aus dem TeddyCloud-Quellcode (Release `tc_v0.7.1`). Ein Test mit einer echten TeddyCloud steht noch aus.

## Installation

1. Paket bauen: `python3 tools/build-teddycloud-plugin.py` → `dist/taggen-orbit-teddycloud-plugin.zip`
2. Den Inhalt in TeddyClouds Plugin-Ordner entpacken (Standard: `data/www/plugins/`), sodass `plugins/taggen-orbit/plugin.json` existiert.
   Mit Docker zum Beispiel: `docker cp dist/taggen-orbit teddycloud:/teddycloud/data/www/plugins/`
3. TeddyCloud-Oberfläche neu laden. Orbit erscheint unter **Tonies** als „TagGen Orbit“.

## Was Orbit im Plugin-Modus macht

- **Erstellen → „Tags aus TeddyCloud lesen“**: zeigt alle Tags in der bekannten Import-Vorschau (neu, bereits vorhanden, Konflikt, fehlerhaft). System-Tags werden ausgelassen. Erst „Übernehmen“ legt Einträge in Orbit an.
- Jeder Eintrag erhält die Tag-UID im Orbit-Format, Modell, Serie, Titel und das Cover aus TeddyCloud. Schlüssel ist `tag:<RUID>`; ein Tag, den Orbit schon aus einer Flipper-Datei kennt, gilt als „bereits vorhanden“.
- Der **Katalog** kommt aus TeddyCloud (`/api/toniesJson` und Custom-Tonies) statt von GitHub – auch ohne Internet.

## Schutz und Grenzen

- **Nur lesend, im Code erzwungen:** Orbit ruft ausschließlich `GET /api/getTagIndex`, `/api/toniesJson`, `/api/toniesCustomJson` und `/api/auth/status` auf sowie Bilder aus TeddyClouds statischen Ordnern. Jeder andere Pfad wird abgelehnt, bevor eine Anfrage entsteht.
- **Keine Zugangsdaten:** TeddyCloud meldet den Browser per HttpOnly-Cookie an; Orbit sieht kein Passwort und keinen Schlüssel.
- **Vertrauen:** Ein TeddyCloud-Plugin läuft mit den Rechten des angemeldeten Nutzers. Installiere nur Pakete, deren Herkunft du kennst.
- Beim Abruf der Tag-Liste aktualisiert TeddyCloud intern seine Tag-Infos – genauso, wenn man in TeddyCloud selbst die Tonie-Übersicht öffnet.
- **Eigener Speicher:** Unter der TeddyCloud-Adresse hat Orbit einen anderen Browser-Speicher als auf GitHub Pages. Sammlungen mit „Alle Sammlungen sichern“ und „Sammlung oder Bibliothek laden“ übertragen.
- Läuft TeddyCloud nur über `http` (üblich im Heimnetz), stehen **Web Bluetooth** (NFC-Reader) und der **Offline-Start** nicht zur Verfügung. Flipper-Dateien, Cover, Sammlungen und Druck funktionieren.
- In TeddyClouds Rahmen wächst die Seite mit ihrem Inhalt; auf dem Handy ist „Orbit in eigenem Fenster öffnen“ bequemer.
