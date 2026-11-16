# REZE v2 — Premium Resume Builder

A premium, browser-only resume editor built with vanilla HTML, CSS and JavaScript.

## Run locally

Open `index.html` in a modern browser, or serve this folder with any static web server. No npm, build step, Docker or backend is required.

## Deploy to GitHub Pages

Upload the contents of this folder to the repository root. Keep the existing `.github/workflows/pages.yml` workflow and set GitHub Pages source to **GitHub Actions**.

## Features

- Section-based resume editing with live A4 preview
- Modern, Classic and Minimal templates
- Experience, education, skills, projects and certifications
- Browser-local autosave and multiple local resume versions
- ATS completeness checks and keyword comparison against a job description
- Local writing helpers
- JSON, TXT, text-based PDF and DOCX text extraction; JSON export; browser print / Save as PDF
- Liquid-glass visual system, ambient lighting, responsive layout and light/dark themes
- Anime-inspired Reze-style brand artwork included as `reze-logo.png`

## Privacy and limitations

Resume content is stored in browser local storage. No account or server is used. PDF/DOCX import extracts readable text into resume fields using PDF.js and Mammoth loaded from public CDNs. Scanned/image-only PDFs need OCR, and complex layouts may need manual correction. This is text extraction, not faithful editing of the original PDF/DOCX layout; the uploaded original is never overwritten. The logo artwork is an original anime-inspired illustration, not official Chainsaw Man artwork.

## Document library and editing notes (vNext)
- Uploaded originals are stored as separate IndexedDB records with unique IDs; multiple files are retained and listed after refresh.
- Original files are never overwritten by editing. Select a file in the Upload library to download its original or export the current working resume in that file's format.
- The working resume content remains in browser localStorage. Original files remain in this browser's IndexedDB; clearing site data or using another browser/device will not carry them over.
- PDF extraction uses PDF.js and DOCX extraction uses Mammoth from a CDN. Scanned/image-only PDFs require OCR and are not automatically OCR'd.
- PDF/DOCX imports extract text and map common resume headings heuristically. Review the fields after import; complex multi-column layouts and unusual headings may need manual correction.
- Edited PDF/DOCX exports are rebuilt from the editable fields using the selected template. They retain the file extension/format, not the source document's exact layout or formatting.
- Templates include Modern, Classic, Minimal, Executive, Technical, Compact and Creative, with a live scaled preview.


## REZE v2 implementation status

This release is the first integrated v2 foundation:
- Dashboard is the landing screen, with recent resume cards and template discovery.
- My Resumes supports multiple named drafts, search, sorting, open, rename, duplicate and delete.
- New resumes start blank and are stored independently in this browser.
- The existing upload workspace remains available; uploaded originals are stored separately from editable working content.
- Resume editor autosave now waits for one second of inactivity before saving.

### Next implementation stages
1. Expand the editor into the full section-based workspace, including custom sections, richer editing, drag-and-drop ordering and consistent document data.
2. Add continuous and paginated A4 preview modes with robust page-break behavior.
3. Consolidate undo/redo, recovery, independent document versions and template-safe rendering.
4. Test PDF/DOCX import and export with real sample files and document fidelity limitations.

## Browser storage
Resume drafts are stored in localStorage and original uploads in IndexedDB. These records are local to this browser and device. Export backups before clearing site data or changing browsers.


## Phase 2 — Editor workspace
- Section navigation now includes visibility controls and drag-and-drop ordering.
- The editor and resume preview use the same saved section order and visibility settings.
- Added custom resume sections (publications, volunteer work, awards, training, languages, memberships, interests, references, and fully custom titles).
- Custom section content supports basic rich text: bold, italic, underline, ordered and unordered lists.
- Custom rich text is sanitized before rendering in the resume preview.
- Existing structured personal information, summary, experience, education, skills, projects and certifications remain available.
- Custom sections and section configuration are stored with the active resume data.

Note: Rich-text controls are currently implemented in custom sections. The standard structured fields remain plain text/structured inputs. Full document-wide formatting, A4/continuous modes, advanced pagination and full undo/redo are subsequent phases.


## Phase 3 — Clean page preview and upload parsing
- Removed the Upload/Import item from the left navigation; the dashboard Import action still opens the file picker.
- Page Preview now displays a vertical stack of individual A4 pages with page numbering and a live page count.
- Added A4 / Letter preview sizing and zoom controls.
- Export PDF uses the paginated preview layout when printing.
- Existing PDF/DOCX extraction and heuristic resume parser populate structured fields (name, title, contact details, summary, experience, education, skills, projects/certifications). Parser now recognizes additional heading variants and labeled location/profile links.
- Original uploaded files remain stored separately and unchanged.

Parsing is heuristic: resume layouts vary widely. Review the imported fields and correct any misclassified text. Scanned/image-only PDFs still need OCR. PDF export uses the browser print dialog and depends on its print settings.


## Preview refinement
- The same pagination engine now renders the page stack in both the editor's right-hand preview and the separate Page Preview workspace.
- The editor's right panel uses scaled A4/Letter sheet thumbnails with an overflow scroll area and page count.
- The separate Page Preview displays full-size pages, zoom and page count.
- The custom-section editor panel and custom-section navigation entries are removed from the interface. Previously saved custom-section data is retained in stored resume records and is not deleted.


## Pagination and preview layout repair
- Rebuilt the page flow to move a section heading together with the first content block when a page break is required.
- Normalized cloned content to the printable page's inner width, including wrapping for long names, subtitles, paragraphs and experience/date rows.
- Added word-boundary splitting for paragraphs and unusually long bullet items so a single oversized block cannot silently overflow a sheet.
- Kept the editor mini-page stack and full Page Preview generated from the same page set.
- Added Letter page dimensions and refreshed asset cache keys so browsers fetch the updated preview engine and styles.
- Fixed print layout positioning so the page stack is printed as separate sheets instead of screen-positioned overlays.

The pagination was exercised in Chromium with long summaries and multi-page experience lists. A4 screen pagination and A4 PDF output were checked against the generated page count.


## REZE Resume Understanding & Mapping Engine

The import workflow is review-first. PDF, DOCX, TXT and JSON imports are extracted locally in the browser, classified with deterministic rules, normalised into the version-2 resume model, and shown in a mandatory review dialog before applying. The uploaded original remains a separate immutable IndexedDB record.

- PDF extraction tracks page numbers and reconstructs text lines using PDF coordinates. If the PDF has no usable text layer, the browser attempts English OCR with Tesseract.js.
- DOCX extraction uses Mammoth raw text plus its HTML conversion to retain paragraph, heading, list and table-derived text order where available.
- The classifier recognises common resume headings, contact details, experience, education, skills, projects and certifications. Low-confidence or ambiguous content is surfaced for review rather than silently discarded.
- The review dialog allows JSON-level correction, template selection, create-new or merge-into-current workflows, and field-level choices for conflicting personal/summary fields. Repeating groups are appended as separate entries; potential duplicates are not silently combined.
- The template registry declares supported placeholder groups for Modern, Classic, Minimal and Technical layouts. Empty fields remain empty.
- Schema migration adds stable IDs, provenance, separate project/certification collections and an additional-information bucket. Before migration, original localStorage payloads are backed up under `reze-schema-v2-backup-current` and `reze-schema-v2-backup-library`.
- AI classification is not connected in this static GitHub Pages build. No resume data is sent to an external AI provider. The opt-in control is intentionally disabled until a secure authenticated backend/proxy and provider disclosure are configured.

### Import-engine limitations and verification

This is client-side extraction and structured mapping, not exact reproduction of a source document's visual layout. Multi-column PDF reading order can still need manual correction; DOCX tables may be flattened into text; OCR currently uses English; and extraction confidence is a heuristic review aid, not a measured accuracy guarantee. The uploaded ZIP did not include a representative test corpus, so extraction accuracy across the ten proposed document categories has not been benchmarked. A secure AI service cannot be deployed solely in static GitHub Pages without a backend.


Upload hotfix v2: exposes `window.REZEFormatBytes` as an explicit shared helper, updates the document-library renderer to call it directly, and bumps local asset query versions to invalidate stale browser caches.
