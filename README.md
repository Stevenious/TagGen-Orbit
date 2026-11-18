# TagGen Orbit · Universe 6.0 Preview

**Design, organise and print custom tags for your Toniebox workflow.**

[Open the live app](https://stevenious.github.io/TagGen-Orbit/) · [German README](README.de.md) · [Report a bug / suggest an idea](https://github.com/Stevenious/TagGen-Orbit/issues)

TagGen Orbit is a browser-based tool for creating custom cover artwork, organising physical custom tags and preparing A4 print sheets. It brings the cover studio, collection workflow, print layouts and read-only NFC tools together in one app.

> **Project status:** Universe 6.0 Preview. The app is usable, but hardware compatibility, printer alignment and some device-specific workflows still require real-world testing. Feedback is welcome.

## What you can do

### Create and customise covers
- Find catalogue entries and use their available cover artwork as a starting point.
- Create designs from your own images, including batches of up to 12 PNG, JPEG or WebP files.
- Edit round or square designs, adjust the layout and optionally add a reverse side.
- Ambiguous filename matches are suggestions only; uncertain matches require confirmation.

### Organise your physical tags
- Keep multiple named collections. Each collection has up to 12 working positions.
- Keep **content metadata**, **audio ID**, **NFC tag UID** and **physical carrier/format** as separate pieces of information.
- Add, replace, check and move entries without silently changing unrelated cover or tag data.
- Use the Tag Pass to see what is known, what is linked and what still needs attention.

### Prepare print sheets
- Arrange covers on A4 sheets and use the browser print dialog to print or save as PDF.
- Available presets include:
  - 43 mm coin capsule · 12 positions
  - Avery 6223-10 · 30 mm · 48 positions
  - Avery L3415-10 · 40 mm · 24 positions
  - Free round formats: 25 mm, 30 mm and 40 mm
- Optional reverse sides support QR information and tag details.
- Printer calibration and duplex settings are available where supported.

**Printing tip:** Start with a test sheet on ordinary paper. Use 100% / actual size and check the printer's scaling, margins and duplex flip edge before using label stock. Actual alignment depends on the printer and driver.

### Read and verify NFC tags (optional hardware)
- Import existing Flipper NFC files and inspect their parsed information.
- Optionally connect a compatible **ESP32 + PN5180** reader running NFC-Archiver firmware through Web Bluetooth.
- Read tag information and compare it with a known entry; changed or ambiguous data is not silently treated as a match.
- On iPhone/iPad, the BLE reader workflow may require a Web-Bluetooth-capable browser such as [Bluefy](https://apps.apple.com/app/id1492822055). Cover design, collection management, printing and NFC-file import can still be used in Safari without the reader.

**Read-only by design:** Orbit does not write to NFC tags, change UIDs, unlock protected memory or manage tag passwords. A detected UID or matching dump does not prove the audio content or the authenticity of a tag.

## TeddyCloud: works alongside it, not synced

Orbit can help prepare the cover and document which physical tag belongs to an entry. You can then assign the content and image to that custom tag in your own TeddyCloud installation.

There is **no direct TeddyCloud synchronisation or API connection**. Orbit is a static GitHub Pages app and does not receive your TeddyCloud credentials. The physical cover, an Orbit project file or a printed QR code does not automatically change TeddyCloud's configuration.

Useful external documentation:
- [TeddyCloud custom tags guide](https://tonies-wiki.revvox.de/docs/tools/teddycloud/usage/custom-tags/)
- [TeddyCloud custom metadata and images](https://tonies-wiki.revvox.de/docs/tools/teddycloud/tecdoc/tonies-custom-json/)

## Getting started

### Use the hosted app
1. Open [TagGen Orbit](https://stevenious.github.io/TagGen-Orbit/).
2. Search for a catalogue entry or choose your own image.
3. Adjust the cover and add it to a collection.
4. Assign the physical format and, if applicable, link an existing NFC file.
5. Arrange the print sheet and use **Print** in your browser.

No account or installation is required for normal use.

### Install it as an app
On supported browsers, use the browser's **Install app** option. On iPhone/iPad, use **Share → Add to Home Screen** in Safari. The app shell can be cached for offline startup after it has been loaded successfully online.

### Run locally
The project is a static site. Serve the repository root over HTTP, for example:

    git clone https://github.com/Stevenious/TagGen-Orbit.git
    cd TagGen-Orbit
    python3 -m http.server 8000

Then open [http://localhost:8000](http://localhost:8000).

For GitHub Pages, publish the application files together: index.html, universe.js, universe.css, sw.js, manifest.webmanifest and the assets/ directory.

## Your data and privacy

- There is no Orbit account and no central Orbit collection database.
- Collections and project data are stored in your browser (IndexedDB where available, with a local-storage fallback).
- Private backups are created only when you explicitly export them. Keep your own backups; clearing website data can delete locally stored work.
- A private .taggen project can preserve your working project. Collection and library exports use .orbit-collection and .orbit-library.
- The **public cover pack** removes audio IDs and NFC data. Only share images you have permission to redistribute.
- The offline service worker caches the app shell, not private projects, NFC dumps, remote catalogue data or externally hosted cover images.
- Visiting GitHub Pages and requesting external catalogues, community indexes or remote images sends requests to those providers. See [CREDITS_AND_RIGHTS.md](CREDITS_AND_RIGHTS.md) for data-flow and rights notes.

## Catalogue, community data and acknowledgements

Orbit uses or optionally consults external community resources. They remain maintained by their respective authors; their presence does not imply endorsement or a partnership.

- [tonies-json](https://github.com/toniebox-reverse-engineering/tonies-json) · catalogue metadata and image references
- [flipper-zero-tonies](https://github.com/nortakales/flipper-zero-tonies) · optional community NFC dump search
- [L480/tonies](https://github.com/L480/tonies) · optional UID index
- [NFC-Archiver](https://github.com/RFIDfriend/NFC-Archiver) · reader and BLE protocol documentation
- [TeddyCloud](https://github.com/toniebox-reverse-engineering/teddycloud) · custom-tag workflow reference
- [QR Code Generator by Kazuhiko Arase](https://github.com/kazuhikoarase/qrcode-generator) · embedded QR implementation (MIT)

Some external repositories do not declare a licence in their root. Public availability does not automatically grant permission to redistribute their data, images or dumps. More detail: [Credits, sources and rights](CREDITS_AND_RIGHTS.md).

## Testing and known limitations

The repository includes automated checks for collection integrity, import/export, print geometry, browser flows and offline-shell behaviour. The **Universe V6 checks** workflow runs the relevant automated tests.

Automated tests are not a substitute for device testing. The following still need to be checked on the actual target setup:
- Physical printer alignment, label stock and duplex flip edge.
- Real-world reader/firmware combinations and supported tag types.
- Browser-specific BLE behaviour, especially on iOS.
- Offline availability of external catalogue entries and images.

See [UNIVERSE_V6.md](UNIVERSE_V6.md), [CHANGELOG.md](CHANGELOG.md) and [TEST_REPORT.md](TEST_REPORT.md) for implementation notes and test history.

## Feedback and contributions

Found a bug or have an idea? [Open an issue](https://github.com/Stevenious/TagGen-Orbit/issues) and include:
- Browser and version, device and operating system.
- What you expected and what happened.
- Reproduction steps and, if useful, a screenshot with personal data removed.

Please do not upload private NFC dumps, account credentials or personal collection backups to public issues.

TagGen Orbit is currently published without a general open-source licence. The repository is publicly viewable, but that does **not** grant permission to reuse, modify or redistribute the project's source code or project artwork. The embedded QR component retains its own MIT notice. Please open an issue before proposing code reuse or a collaboration.

## Project identity

TagGen Orbit / TagGen Universe is an independent community project. **Tonie** and **Toniebox** are names and marks of their respective owners. This project is not affiliated with, endorsed by or sponsored by tonies GmbH.

---

[Deutsch · Deutsche Dokumentation](README.de.md) · [Live app](https://stevenious.github.io/TagGen-Orbit/) · [Repository](https://github.com/Stevenious/TagGen-Orbit)
