# REZE — Resume Editor

Vanilla HTML/CSS/JavaScript application for GitHub Pages. Deploy the contents of this directory to the repository root. Keep `.github/workflows/pages.yml`.

## Resume import improvements

The browser-local Resume Understanding Engine now:
- extracts PDF text with page-aware line grouping and a two-column reading-order heuristic;
- falls back to English OCR for scanned PDFs when the OCR library can be loaded;
- extracts DOCX paragraphs, headings, list items and table rows through Mammoth;
- classifies contact details, summary, experience, education, skill heading/description pairs, certifications and projects;
- groups experience headers with their following bullet points and joins wrapped continuation lines;
- records field-level confidence and source evidence;
- preserves unclassified content under Additional Information;
- shows an import-quality summary and requires approval before applying the structured data;
- supports create-new and merge workflows, with direct-field conflict choices;
- keeps the uploaded original in IndexedDB separate from the editable resume;
- maps the canonical data model to the Modern, Classic, Minimal, Technical, Executive, Compact and Creative template registries.

External AI classification remains disabled. This is a static GitHub Pages application and must not expose an AI API key in client-side code. A secure backend and explicit per-import consent are required before enabling a provider.

## Local checks

Run the import classifier fixture test with Node.js:

```bash
node tests/import-engine.test.cjs
```

The fixture checks contact extraction, experience grouping, wrapped bullet continuation, skills groups, education, certification mapping and schema versioning. It is a regression fixture, not a claim of broad accuracy across arbitrary resumes.

## Deployment

Commit and push the contents of this directory to the configured GitHub Pages repository. The script query versions in `index.html` have been bumped to invalidate older cached JavaScript. After deployment, hard-refresh the site.
