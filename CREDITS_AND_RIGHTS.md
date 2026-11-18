# Dank, Quellen und Rechte

Danke an die Maintainer und Beitragenden der folgenden Projekte. Die Nennung bedeutet keine Zusammenarbeit, Freigabe oder Unterstützung von TagGen Orbit durch diese Projekte.

| Projekt | Beitrag zu Orbit | Prüfung der Rechte |
| --- | --- | --- |
| [tonies-json](https://github.com/toniebox-reverse-engineering/tonies-json) | Online-Katalog mit Titeln, Metadaten und Bildverweisen | Kein `LICENSE` im Repository-Stamm bei der Prüfung am 28.09.2026 gefunden; Nutzungsrechte an Datensätzen und Bildern gesondert klären. |
| [flipper-zero-tonies](https://github.com/nortakales/flipper-zero-tonies) | Optionale Suche nach öffentlichen NFC-Dumps | Kein `LICENSE` im Repository-Stamm gefunden; Dumps nicht als frei weiterverbreitbar behandeln. |
| [L480/tonies](https://github.com/L480/tonies) | Optionaler UID-Index und einzelner Referenz-Dump für einen lokalen Bytevergleich; Index verweist auf flipper-zero-tonies | Kein `LICENSE` im Repository-Stamm gefunden; Rechte an Index und Dumps gesondert klären. |
| [NFC-Archiver](https://github.com/RFIDfriend/NFC-Archiver) | Dokumentation von Reader, Firmware und BLE-Protokoll; Reader wird optional vom Browser angesprochen | MIT-Lizenz für das externe Repository; in Orbit ist daraus kein Firmware-Quelltext übernommen. |
| [TeddyCloud](https://github.com/toniebox-reverse-engineering/teddycloud) | Referenz für die Zuordnung von Custom Tags. Optionaler Plugin-Modus (Vorschau): Orbit liest Tags, Custom-Tonies und Katalog über die HTTP-Schnittstellen der eigenen TeddyCloud, die auch deren Oberfläche nutzt – ausschließlich lesend. Auf GitHub Pages besteht keine Verbindung. | GPL-2.0 für das externe Repository; kein TeddyCloud-Quelltext in Orbit übernommen. Das Plugin-Paket enthält nur Orbit-Dateien. |
| [TeddyStudio](https://github.com/DKT81/TeddyStudio) | Orbit liest dessen Exporte (Cover-Manifest, Sammlung) und das von Orbit vorgeschlagene Austauschformat `taggen-exchange` | GPL-3.0 für das externe Repository; kein TeddyStudio-Quelltext übernommen, Austausch nur über Dateien. Lizenz der Formatspezifikation noch abzustimmen. |
| [SLI-Writer](https://github.com/Julienbxl/SLI-Writer) | Referenz für einen möglichen späteren Schreib-Workflow; aktuell kein Schreibzugriff | Kein `LICENSE` im Repository-Stamm gefunden; kein Code daraus übernommen. |
| [QR Code Generator](https://github.com/kazuhikoarase/qrcode-generator) von Kazuhiko Arase | QR-Erzeugung im Browser | MIT-lizenzierter Code ist in `index.html` eingebettet, einschließlich Copyright- und Lizenzhinweis. |
| [Color Thief](https://github.com/lokesh/color-thief) von Lokesh Dhakar | „Farben aus Motiv“ im Cover-Studio | MIT. Unveränderte Browser-Fassung v3.5.0 in `vendor/color-thief.js`, einschließlich Copyright- und Lizenzhinweis. Läuft nur im Browser auf dem gewählten Bild. |
| [smartcrop.js](https://github.com/jwagner/smartcrop.js) von Jonas Wagner | „Ausschnitt vorschlagen“ im Cover-Studio | MIT. Unveränderte Datei v2.0.5 in `vendor/smartcrop.js`, einschließlich Copyright- und Lizenzhinweis. Läuft nur im Browser auf dem gewählten Bild. |

„Kein `LICENSE` im Repository-Stamm gefunden“ ist eine Momentaufnahme, keine Feststellung über sämtliche Dateien oder Rechteinhaber. Öffentlich zugängliche Daten, Cover und Dumps erhalten dadurch keine pauschale Lizenz zur Weitergabe.

## Verwendung und Datenfluss

- Verwende eigene Bilder, NFC-Dateien und Audioinhalte nur mit den dafür nötigen Rechten. Ein Katalogtreffer, eine UID oder ein passender Dump belegt weder Urheberschaft noch die Berechtigung zum Kopieren oder Beschreiben eines Tags. Orbit schreibt derzeit keine Tags und ändert keine TeddyCloud-Zuordnungen.
- Sammlungen, Projekte und Kalibrierung liegen im Browser-Speicher; private Exportdateien entstehen erst durch eine Aktion am Gerät. Es gibt keinen Orbit-Account und keinen Upload einer privaten Sammlung an einen eigenen Orbit-Server. Browser-Daten können beim Löschen der Website-Daten verloren gehen.
- Beim Besuch der GitHub-Pages-Seite fallen beim Hoster Verbindungsdaten an. Online-Kataloge, optionale Community-Abfragen und fremd gehostete Cover erzeugen Anfragen an die jeweiligen Anbieter; dabei können etwa IP-Adresse und Browserdaten sichtbar werden. Der optionale BLE-Zugriff verbindet den Browser mit einem ausgewählten Reader in der Nähe. Für die aktuellen Hosting-Datenschutzhinweise siehe [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement) und [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages).
- Tonie, Toniebox und andere genannte Produktnamen gehören ihren jeweiligen Rechteinhabern. TagGen Orbit ist ein unabhängiges Community-Projekt; aus der Erwähnung folgt keine Partnerschaft oder Billigung.
- Im TeddyCloud-Plugin liegen Sammlungen im Browser-Speicher unter der Adresse der eigenen TeddyCloud. Orbit ruft dort nur Tag-Liste, Custom-Tonies, Katalog, Anmeldestatus und Bilder ab und sendet nichts an TeddyCloud. Die Anmeldung erfolgt über TeddyClouds Sitzungs-Cookie; Orbit erhält keine Zugangsdaten. Ein Plugin läuft mit den Rechten des angemeldeten Nutzers – nur Pakete aus vertrauenswürdiger Quelle installieren.

## Nutzung von Orbit und offene Prüfungen

Orbit darf über die veröffentlichte Website genutzt werden. Der Projektbetreiber möchte derzeit keine allgemeine Erlaubnis zur Weitergabe oder Bearbeitung des Orbit-Quellcodes und der Projektgrafiken erteilen. Deshalb gibt es für das Orbit-Repository keine eigene Open-Source-`LICENSE`. Die Lizenz und der enthaltene Hinweis des eingebetteten QR-Code-Generators bleiben davon unberührt. Eine öffentliche GitHub-Ablage erlaubt das Ansehen des Quellcodes, ersetzt aber keine allgemeine Lizenz für seine Weiterverwendung.

Das Orbit-Logo und die zugehörigen Icons wurden nach Angabe des Projektbetreibers beim TagGen-Orbit-Sprint KI-gestützt für das Projekt erstellt. Daraus wird kein ausschließliches Urheberrecht an vollständig KI-erzeugten Bestandteilen behauptet. Die frühere, nicht in Orbit verwendete Datei `image_239928.png` war ein Screenshot mit fremden Tonie-Motiven und wurde aus dem aktuellen Repository-Stand entfernt.

Vor einer Veröffentlichung als verbindlicher Rechtstext sind Betreiber- und Kontaktangaben, Datenschutzhinweise zum tatsächlichen Betrieb und die Nutzungsrechte an fremden Bildern, Metadaten und Dumps fachlich zu prüfen. Diese Übersicht ist eine Bestandsaufnahme und keine rechtliche Freigabe.
