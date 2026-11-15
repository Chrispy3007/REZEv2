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
