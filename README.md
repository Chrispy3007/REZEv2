# REZE — Original concept, rebuilt in vanilla JavaScript

REZE is a browser-first resume workspace, retaining the original purple anime-inspired visual direction and the core idea: edit resume sections beside a live A4 preview, switch templates, tailor content, check ATS completeness, compare a job description, and keep separate resume versions.

## Run locally

Open `index.html` directly, or serve this folder with any static web server. There is no React, TypeScript, Vite, npm install, backend, or Docker requirement.

## GitHub Pages

Upload the **contents** of this folder to the root of your repository (so `index.html`, `app.js`, `enhancements.js`, `editor-pro.js`, and `styles.css` are at repository root). In Settings → Pages, choose **Deploy from a branch**, select `main` and `/(root)`. The included `.nojekyll` file avoids Jekyll processing.

## Editor redesign

The editor uses a focused document-workspace layout: guided section navigation, a resume-completeness meter, live A4 preview, preview zoom controls, a full preview mode, keyboard shortcuts (Ctrl/Cmd+S to save; Ctrl/Cmd+Shift+P to preview), and responsive mobile layout. Existing resume fields, repeatable experience/education/project entries, template switching, local storage and ATS tools remain in place.

## Features

- Starts with a clean blank resume; no personal/reference resume is loaded automatically.
- Section-based resume builder: personal information, summary, work experience, education, skills, projects and certifications.
- Live A4/Letter resume preview and print / Save as PDF.
- Modern, Classic and Minimal resume layouts with accent-colour selection.
- Local writing helpers that improve phrasing without inventing credentials or experience.
- ATS completeness checklist and job-description keyword comparison.
- Multiple named resume versions in a browser-local library, plus JSON import/export.
- Light/dark appearance and configurable insertion-cursor size.
- Browser-local autosave; no account or server required.

## Import/export notes

The current standalone build imports REZE JSON and plain-text files. PDF/DOCX parsing and faithful editing of arbitrary existing PDF/DOCX layouts are not included in this no-dependency version. PDF export uses the browser print dialog. Existing source documents are not modified by REZE. Do not treat a text-only import as a faithful reconstruction of the source layout.

## Privacy and storage

Resume data and saved versions remain in this browser's local storage. Clearing browser site data removes those local copies. Export JSON regularly if you want a portable backup. The writing helper, ATS checklist, and job matching are local heuristics, not a connected AI model or a guarantee of ATS results.
