# REZE — Liquid Glass Resume Studio

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
