# TagGen Universe – Changelog

## Universe 6.0 Preview · Katalog lädt zuverlässig auf dem iPhone
- Der Katalog-Cache liegt jetzt in IndexedDB. Safari begrenzt `localStorage` auf etwa 5 MB, die beiden Kataloge (je rund 3,8 MB) passten dort nicht hinein; ohne Cache blieb die Bibliothek bei schwachem Netz leer.
- Ein vorhandener alter Cache in `localStorage` wird weiter genutzt und beim nächsten erfolgreichen Laden nach IndexedDB verschoben; danach wird der Platz in `localStorage` frei.
- Die beiden Katalog-Downloads dürfen 45 statt 14 Sekunden dauern.
- Ohne IndexedDB bleibt das bisherige Verhalten erhalten. „Cache löschen“ entfernt beide Kopien.
- Neuer Regressionstest `tests/catalog-cache.cjs`.

## Universe 6.0 Preview · Suche über alle Sammlungen
- Ein gelesener Tag (Flipper-Datei oder BLE-Reader) wird in allen Sammlungen gesucht und in seiner Sammlung geöffnet; die Prüfanzeige nennt die Sammlung.
- Welten zeigen Tags aus der ganzen Bibliothek, Karten nennen ihre Sammlung und öffnen sie beim Antippen.
- Startseite: Welten-Zähler und „Als Nächstes“ über alle Sammlungen.
- „Gedruckte Tags bestätigen“ erreicht auch Einträge aus anderen Sammlungen.

## Universe 6.0 Preview · Bibliothek & sicherer Speicher
- Beliebig viele Sammlungen (je ein A4-Bogen mit bis zu 12 Einträgen) mit Umschalter, „Neue Sammlung“ ohne Datenverlust und „Sammlung löschen“ mit Rückfrage.
- Einträge lassen sich in der Tag-Karte und in der Sammlungsliste in eine andere Sammlung verschieben.
- Speicherung in IndexedDB statt nur `localStorage`; die aktive Sammlung bleibt zusätzlich im bisherigen Schlüssel, damit ältere Versionen sie weiter lesen können.
- Automatische Übernahme der bisherigen Sammlung; Änderungen aus einer älteren Orbit-Version werden als eigene Sammlung erhalten.
- Der Browser wird um dauerhaften Speicher gebeten (`navigator.storage.persist`), sobald die erste Sammlung Einträge hat.
- Sicherungshinweis bei nie gesicherten Sammlungen oder Änderungen nach über 14 Tagen; neue Sicherung „Alle Sammlungen sichern“ (`.orbit-library`) samt Import als zusätzliche Sammlungen.
- Ohne IndexedDB (z. B. eingeschränkte Browser) weiter mit `localStorage`, inklusive mehrerer Sammlungen.
- Neuer Regressionstest `tests/library-storage.cjs`.

## Universe 6.0 Preview · robuster Start und Offline-Hülle
- Startseite bleibt auch ohne Universe-JavaScript sichtbar; direkter Zugang zum Cover-Studio.
- Shell-Cache `taggen-universe-shell-6-0-0` enthält beide Universe-Dateien.
- Präfix `taggen-` entfernt auch die alten Orbit-Shell-Caches.
- README beschreibt den aktuellen Universe-Aufbau und seine Grenzen.
- Regression für fehlendes Universe-JavaScript und Offline-Cache ergänzt.

## Universe 6.0 Preview · Systemeinstellung & verständliche Bedienung
- Automatischer Dark Mode für die Universe-Oberfläche nach Systemeinstellung.
- A4-Bogenvorschau und Druck/PDF behalten weißen Papierhintergrund; Coverfarben bleiben unverändert.
- Verständliche Suchfilter und „Selbsttest ausführen“.
- Schrittfolge für Inhalt → Cover → Druck/Sammlung sowie Audio-ID/Tag-UID-Hinweis im Pro-Editor.
- Systeminfo und Projektmetadaten auf Universe 6.0 Preview korrigiert.
- Neuer Service-Worker-Cache für die aktualisierte Oberfläche.
- apply-v6.py erkennt die vorhandene Universe-Integration und überschreibt sie nicht.
- Such-, Canvas-, NFC- und Drucklogik gegenüber der ersten Universe-Integration unverändert.

## Universe 6.0 Preview · erste Integration
- Sammlung als Startseite, geführtes Erstellen und visuelle Welten.
- Tag-Pass mit unabhängigen Inhalts-, Tag- und Trägerangaben.
- Vereinfachter Editor mit optionaler Feinabstimmung.
- Bildstapel bis zwölf Einträge, optionale Rückseiten und bewusste Druckbestätigung.
- Bestehende Orbit-Sammlungs- und Projektdateien weiterhin lesbar.

## Orbit 5.0 RC 8
- Wiederhergestellter, getesteter Cover- und Druckablauf.
