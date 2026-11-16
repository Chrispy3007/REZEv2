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

## Industry-independent classification and optional AI adapter

The classifier now derives a provisional professional-domain profile from terminology across multiple sectors (technology, finance, healthcare, sales/marketing, HR, operations, project management, education, legal, design and customer service). It also tags broad responsibility themes such as leadership, delivery, analysis, operations, customer work, creation, compliance and performance. These are hints for mapping/review, not a restriction on roles; unknown or mixed-domain resumes remain `general` and their text is preserved for review.

### Secure AI backend integration

AI classification is opt-in per import. To enable it, configure `window.REZE_AI_CONFIG = { endpoint: '/api/resume/classify' }` in a deployment-controlled script loaded before `reze-import-engine.js`. The endpoint must be a server-side authenticated proxy; never put provider API keys, bearer tokens or secret headers in this static frontend. The review dialog enables the AI action only when an endpoint is configured and the user checks the consent box. The browser sends extracted text (not the original binary) to that endpoint. The backend should disclose its provider/retention policy, enforce authentication, rate limits, size limits and CSRF protection, and return JSON shaped as `{ "resume": { ...schemaVersion2ResumeFields } }`. The client validates field types and collections, keeps manual approval mandatory, and does not accept arbitrary executable content. AI suggestions remain untrusted and must be reviewed.

For same-origin deployment, implement the endpoint behind your own serverless function/API gateway. GitHub Pages alone cannot host this endpoint. If it is not configured, rules-based classification continues to work without AI.
