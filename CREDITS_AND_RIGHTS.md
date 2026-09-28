# Dank, Quellen und Rechte

Danke an die Maintainer und Beitragenden der folgenden Projekte. Die Nennung bedeutet keine Zusammenarbeit, Freigabe oder Unterstützung von TagGen Orbit durch diese Projekte.

| Projekt | Beitrag zu Orbit | Prüfung der Rechte |
| --- | --- | --- |
| [tonies-json](https://github.com/toniebox-reverse-engineering/tonies-json) | Online-Katalog mit Titeln, Metadaten und Bildverweisen | Kein `LICENSE` im Repository-Stamm bei der Prüfung am 28.09.2026 gefunden; Nutzungsrechte an Datensätzen und Bildern gesondert klären. |
| [flipper-zero-tonies](https://github.com/nortakales/flipper-zero-tonies) | Optionale Suche nach öffentlichen NFC-Dumps | Kein `LICENSE` im Repository-Stamm gefunden; Dumps nicht als frei weiterverbreitbar behandeln. |
| [L480/tonies](https://github.com/L480/tonies) | Optionaler UID-Index und einzelner Referenz-Dump für einen lokalen Bytevergleich; Index verweist auf flipper-zero-tonies | Kein `LICENSE` im Repository-Stamm gefunden; Rechte an Index und Dumps gesondert klären. |
| [NFC-Archiver](https://github.com/RFIDfriend/NFC-Archiver) | Dokumentation von Reader, Firmware und BLE-Protokoll; Reader wird optional vom Browser angesprochen | MIT-Lizenz für das externe Repository; in Orbit ist daraus kein Firmware-Quelltext übernommen. |
| [TeddyCloud](https://github.com/toniebox-reverse-engineering/teddycloud) | Externe Anleitung für manuelle Zuordnung von Custom Tags; keine direkte Integration | GPL-2.0 für das externe Repository; kein TeddyCloud-Quelltext in Orbit übernommen. |
| [SLI-Writer](https://github.com/Julienbxl/SLI-Writer) | Referenz für einen möglichen späteren Schreib-Workflow; aktuell kein Schreibzugriff | Kein `LICENSE` im Repository-Stamm gefunden; kein Code daraus übernommen. |
| [QR Code Generator](https://github.com/kazuhikoarase/qrcode-generator) von Kazuhiko Arase | QR-Erzeugung im Browser | MIT-lizenzierter Code ist in `index.html` eingebettet, einschließlich Copyright- und Lizenzhinweis. |

„Kein `LICENSE` im Repository-Stamm gefunden“ ist eine Momentaufnahme, keine Feststellung über sämtliche Dateien oder Rechteinhaber. Öffentlich zugängliche Daten, Cover und Dumps erhalten dadurch keine pauschale Lizenz zur Weitergabe.

## Verwendung und Datenfluss

- Verwende eigene Bilder, NFC-Dateien und Audioinhalte nur mit den dafür nötigen Rechten. Ein Katalogtreffer, eine UID oder ein passender Dump belegt weder Urheberschaft noch die Berechtigung zum Kopieren oder Beschreiben eines Tags. Orbit schreibt derzeit keine Tags.
- Sammlungen, Projekte und Kalibrierung liegen im Browser-Speicher; private Exportdateien entstehen erst durch eine Aktion am Gerät. Es gibt keinen Orbit-Account und keinen Upload einer privaten Sammlung an einen eigenen Orbit-Server. Browser-Daten können beim Löschen der Website-Daten verloren gehen.
- Beim Besuch der GitHub-Pages-Seite fallen beim Hoster Verbindungsdaten an. Online-Kataloge, optionale Community-Abfragen und fremd gehostete Cover erzeugen Anfragen an die jeweiligen Anbieter; dabei können etwa IP-Adresse und Browserdaten sichtbar werden. Der optionale BLE-Zugriff verbindet den Browser mit einem ausgewählten Reader in der Nähe. Für die aktuellen Hosting-Datenschutzhinweise siehe [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement) und [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages).
- Tonie, Toniebox und andere genannte Produktnamen gehören ihren jeweiligen Rechteinhabern. TagGen Orbit ist ein unabhängiges Community-Projekt; aus der Erwähnung folgt keine Partnerschaft oder Billigung.

## Vor einer verbindlichen Veröffentlichung prüfen

Für das Orbit-Repository ist aktuell keine eigene `LICENSE` hinterlegt. Die Projektverantwortlichen sollten eine Lizenzentscheidung treffen und die Herkunft beziehungsweise Nutzungsrechte der Orbit-Logos, Icons und der nicht eingebundenen Datei `image_239928.png` dokumentieren. Vor einer Veröffentlichung als verbindlicher Rechtstext sind Verantwortlichkeit, Kontaktangaben, Datenschutzhinweise zum konkreten Betrieb und die Nutzungsrechte an Bildern, Metadaten und Dumps fachlich zu prüfen. Diese Übersicht ist eine Bestandsaufnahme und keine rechtliche Freigabe.
