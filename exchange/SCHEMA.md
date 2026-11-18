# Austauschformat `taggen-exchange` v1

Eine einzelne JSON-Datei, mit der TeddyStudio und TagGen Orbit Hörspiel-Metadaten, Cover und Tag-Zuordnungen austauschen. Beide Programme bleiben eigenständig: Es wird **kein Code** geteilt, nur dieses Datenformat.

- Maschinenlesbares Schema: [`taggen-exchange-1.schema.json`](taggen-exchange-1.schema.json)
- Beispiele: [`examples/`](examples/) (alle Inhalte frei erfunden, erzeugt mit `tools/make-exchange-examples.py`)

> Status: Entwurf für einen Demonstrator. Lizenz der Spezifikation und der Beispieldateien ist mit DKT81 abzustimmen (Vorschlag: CC0).

## Aufbau

```json
{
  "format": "taggen-exchange",
  "version": 1,
  "minor": 0,
  "meta": { "app": "TeddyStudio", "appVersion": "0.5.0", "created": "2026-11-18T12:00:00+01:00", "privacy": "private", "collection": "Mondgeschichten" },
  "images": { "img-mondbaer-001": { "data": "data:image/jpeg;base64,…", "source": "Ordnerbild" } },
  "entries": [
    {
      "key": "model:mondbaer-001",
      "title": "Mondbär baut ein Boot",
      "series": "Mondbär",
      "episode": 1,
      "language": "de",
      "cover": { "imageRef": "img-mondbaer-001", "confirmed": true, "source": "Ordnerbild" },
      "teddycloud": { "model": "mondbaer-001", "audioIds": ["1731900097"], "hashes": ["…40 Hex…"], "category": "audio-play" },
      "tag": { "ruid": "41012b1a500304e0", "nfcUid": "E0 04 03 50 1A 2B 01 41", "assignedModel": "mondbaer-001" },
      "origin": { "teddystudioId": "a1b2c3d4e5f60718293a4b5c", "exportedBy": "TeddyStudio" }
    }
  ]
}
```

## Regeln

1. **Version.** `format` muss `taggen-exchange`, `version` muss `1` sein. Eine andere Hauptversion wird abgelehnt. Neue, optionale Felder erhöhen nur `minor`; unbekannte Felder werden ignoriert und nicht gelöscht.
2. **Schlüssel.** `key` identifiziert einen Eintrag programmübergreifend, in dieser Rangfolge:
   - `model:<Modellkennung>` – TeddyCloud-Modell (z. B. `mondbaer-001`), sobald es existiert
   - `audio:<Audio-ID>:<SHA1-Hash>` – wenn es nur die Audiodatei gibt
   - `local:<TeddyStudio-ID>` – 24 Hex, nur auf dem exportierenden Rechner stabil

   Ein `key` darf in einer Datei nur einmal vorkommen.
3. **Bilder** stehen einmal unter `images` als Data-URL (PNG, JPEG oder WebP, empfohlen ≤ 800 px und ≤ 1 MB) und werden über `cover.imageRef` referenziert. Keine Dateipfade, keine fremd gehosteten URLs.
4. **Tags.** `tag.nfcUid` ist die UID des Chips in Lesereihenfolge (wie in Flipper-Dateien, 8 Bytes, Großbuchstaben, Leerzeichen). `tag.ruid` ist die Kennung, die TeddyCloud verwendet: dieselben 8 Bytes in umgekehrter Reihenfolge, 16 Hex klein. Sind beide gesetzt, müssen sie zueinander passen.
5. **Zuständigkeit.** `teddycloud.*` schreibt nur TeddyStudio; `orbit.*` schreibt nur Orbit. Ein Programm übernimmt beim Import nie Felder, für die das andere zuständig ist, und überschreibt keine Audio- oder TeddyCloud-Daten.
6. **Datenschutz.** Nie enthalten: lokale Dateipfade, Serveradressen, Zugangsdaten, NFC-Speicherinhalte (Dumps), Audiospuren. `meta.privacy = "public"` heißt zusätzlich: keine `tag`-Angaben.

## Verhalten beim Import in Orbit

| Status | Bedingung | Standard |
| --- | --- | --- |
| neu | Schlüssel und Tag-UID sind in keiner Sammlung bekannt | ausgewählt |
| bereits vorhanden | ein Eintrag mit demselben `key` existiert schon | nicht ausgewählt |
| Konflikt | die Tag-UID gehört bereits zu einem anderen Eintrag | nicht ausgewählt; bei Übernahme ohne Tag-UID |
| fehlerhaft | Pflichtfeld fehlt, ungültiger oder doppelter Schlüssel, Bild fehlt/ungültig, RUID passt nicht zur UID | nicht auswählbar |

Orbit zeigt immer erst eine Vorschau. Erst „Übernehmen“ verändert die Bibliothek; mehr als 12 Einträge werden auf mehrere Sammlungen (je ein A4-Bogen) verteilt.

## TeddyStudio-Dateien von heute

Bis TeddyStudio dieses Format selbst schreiben kann, liest Orbit auch die vorhandenen Exporte:

- **Cover-Manifest** (`Manifest exportieren`): Liste aus `id`, `folder`, `title`, `series`, `cover`, `source`. Die Bilder werden zusammen mit dem Manifest ausgewählt und über den Dateinamen zugeordnet. Mehrdeutige Namen (z. B. mehrere `cover.jpg`) werden nicht geraten; der Eintrag kommt dann ohne Cover.
- **Sammlung** (`Sammlung exportieren`, optional dazu): ergänzt Folgenummer, Sprache und Modellkennung (`remote_model`). Dateipfade und Spuren daraus werden nicht übernommen.

Ein TeddyStudio-Export mit eingebetteten Bildern würde die Zuordnung über Dateinamen überflüssig machen – das ist der wichtigste Wunsch an die TeddyStudio-Seite.
