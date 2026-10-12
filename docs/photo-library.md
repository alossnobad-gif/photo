# Personal photo library and RAW editor

This release is a personal single-user photography tool, not a multi-tenant commercial service. It reuses the existing cream, forest green, and gold app shell. The sidebar now begins with 图库与修图 and removes 拍照识别; existing collection/landscape upload dialogs remain and can choose existing library photos.

## Workflow

Import JPG/PNG/WebP/TIFF or RAW into the library (multiple selection, max 150 MB each). Original bytes are stored privately in `.data/library-originals/`. RAW decoding uses the system LibRaw shared library through an isolated Python child process, camera white balance, sRGB output, 16-bit intermediate TIFF, one RAW decoder at a time, a 120-second wall-time limit, an 80 MP size limit, and 1.5 GB address-space limit. Intermediate TIFFs are removed after rendering. Images exposed through `/photos/` are rendered JPEG previews; raw original downloads go through the library record endpoint.

Ubuntu 22.04 commonly supplies an older LibRaw that predates the Sony A7R V. Run `bash scripts/install-raw-decoder.sh`: it uses a verified SHA-256 pinned official LibRaw 0.21.4 source archive and builds into `vendor/lib/`, without replacing system libraries. It skips installation when a compatible version is already available. Python prefers that bundled library and reports the version at startup. The app probes decoder availability at startup. Unsupported cameras and malformed files produce an explicit import failure, with temporary/original failed files cleaned up. Nikon D2H NEF and actual Sony ILCE-7RM5/A7R V ARW (medium and full-size compressed, 9600×6376 sensor dimensions) from the CC0 raw.pixls.us corpus were actually decoded and verified. RAW and JPG can be imported together or independently; there is no forced RAW processing for JPG. Other camera formats depend on the installed LibRaw version; do not claim all cameras are supported.

Edit any library photo: move/resize crop selection, maintain original ratio, rotate/flip, exposure, contrast, highlights, shadows, whites/blacks, vibrance, saturation, clarity, temperature, tint, compare original, reset adjustments. Saving makes a separate JPEG version with parent ID and edit recipe, and keeps the exact original bytes and capture date. Downloads of edited versions' original retain the original filename/extension.

Important limit: interactive adjustments run on an 8-bit sRGB JPEG render, not on the original sensor mosaic or a 16-bit scene-linear pipeline. This is basic RAW development plus a photo editor, not a Photoshop replacement; it does not include layers, masks, professional noise reduction, lens profiles, or full sensor highlight recovery. The original RAW remains available for future higher-quality processing.

Select original previews or edited photos in the library and submit them as species or landscapes to the persistent recognition queue. Existing single and batch upload dialogs can select library photos without reuploading. Queue abandonment preserves photographs referenced in `library.json`; it never deletes a library original. Original imported files are never overwritten by editing.

Existing collection and landscape photos are indexed into the library at startup without rewriting/moving them. Library records in `.data/library.json` are updated via serialized atomic writes. A disk free-space check leaves room for RAW intermediate files before decoding.

## Deployment and long-term personal use

Preserve `.data/`, `/etc/nature-photo.env`, the service's `naturephoto` owner, and the current restricted access rules. Set Nginx `client_max_body_size 151m` and `proxy_read_timeout 180s`, then test/reload Nginx and restart nature-photo. Copy individual changed files; never overwrite directory permissions by copying a mode-700 temporary directory over `/opt/photo`.

Back up `.data/` and `/etc/nature-photo.env` to a separate protected location before upgrades and periodically thereafter; RAW and edited photos share the server's disk capacity. This release does not automatically send photos to external backup storage or install a scheduled backup. Do not equate a second folder on the same disk with disaster recovery.

## Design and QA

Concept reference: `/workspace/generated_images/exec-8b5c81b1-f5c1-499b-b4fb-4d33df4d1791.png` (development artifact, not a production asset). Existing palette/type/control families retained; open contact sheet, search/filter/action toolbar, and right photo inspector implemented. Intentional differences: use established app navigation/brand rather than redraw it; omit invented camera-model data; use actual imported images instead of demo photos; open editing in a full modal for a larger working canvas; controls adapt to available width. On mobile the inspector follows the contact sheet.

Browser plugin was unavailable, so Playwright Chromium verifies actual RAW import, exact original download, capture date, separate edit version, selection/queue submission, pickers in existing flows, and responsive layout. No user-facing pretend metrics or sample photographs are injected.

Fidelity checks: ivory/forest/gold palette, existing serif headlines with readable system UI controls, contact-sheet selection outline, inspector media contained rather than portrait clipping, toolbar/filters/actions, sidebar navigation, native 1536×1024 desktop and 390×844 mobile. Above-fold copy remains the requested library workflow; compatibility and size limits are intentional operational labels. Mobile upload action was changed to stay on one line. Final concept and rendered screenshots were visually inspected with view_image.

The contact sheet and inspector use 900-pixel thumbnails to avoid decoding every full-resolution 61 MP image in the browser. Edits default to max edge 4096 pixels, with 2560, 6000, and original crop size available. This does not alter original RAW/JPG files. RAW/JPG formats are explicitly labeled, and the JPG-original filter allows fast everyday selection. RAW+JPG matching is by user selection; the app does not claim automatic camera capture pairing.

Manual deployment is provided by `scripts/deploy-photo-library.sh SOURCE_DIRECTORY [PROJECT_DIRECTORY]`. It copies only runtime files, installs/checks a compatible decoder, raises the existing Nginx size/time limits, builds, reloads Nginx, restarts nature-photo, and checks the actual library endpoint. It never copies `.data`, directory permissions from the download directory, or installs automatic updates. Nginx validation failure restores the previous site config.
