# REZE — Resume Editor

Vanilla HTML/CSS/JavaScript resume editor. The browser editor, resume library, preview, templates, and export workflows remain client-side. Deploy the contents of this directory to the GitHub Pages repository root and keep `.github/workflows/pages.yml`.

## Resume import

- PDF extraction uses PDF.js with page-aware line grouping and a two-column reading-order heuristic.
- Scanned PDFs can fall back to English OCR with Tesseract.js when the OCR library is reachable.
- DOCX extraction uses Mammoth and preserves paragraph, heading, list, and table-row text where available.
- Browser-side rules classify contact details, summary, experience, education, skill heading/description pairs, certifications, and projects.
- Field evidence and confidence are retained; unknown material is preserved in Additional Information.
- Import review is mandatory. Users can create a new resume or merge into the current one, resolve top-level conflicts, choose a template, and approve before anything is applied.
- Original uploaded documents remain separate from editable resume data in the browser's existing file store.

## Hybrid Groq AI architecture

Rules-based extraction and classification run first in the browser. During the import review, the user may explicitly consent to send extracted text (not the original PDF/DOCX binary) to a separate Vercel serverless API. That API calls Groq using a server-side secret and returns a structured suggestion. The browser validates the response and keeps the manual review/approval step. If the endpoint or Groq is unavailable, the rules-based draft remains available.

The vanilla JavaScript editor and local resume storage are unchanged. No Groq SDK or API key is included in frontend code.

## Deploy the Groq API to Vercel

1. Create/import a Vercel project from this source repository. The Vercel project Root Directory must be the directory that directly contains `api/`, `vercel.json`, and the frontend files. The `api/` folder must be at that directory root (not nested one level deeper). Vercel auto-discovers functions in the root `api/` directory; no per-function glob override is needed. It hosts the API separately; GitHub Pages continues to host the static REZE editor.
2. In Vercel → Project → Settings → Environment Variables, configure:
   - `GROQ_API_KEY` — your Groq API key. Mark it sensitive. Never commit it or paste it into REZE Settings.
   - `GROQ_MODEL` — optional. Strict structured output is used for `openai/gpt-oss-20b` and `openai/gpt-oss-120b`. If another model is configured, the API automatically falls back to `openai/gpt-oss-20b` so the required resume schema can be enforced.
   - `ALLOWED_ORIGINS` — exact comma-separated frontend origins, e.g. `https://chrispy3007.github.io`. Use the origin only (scheme + host), without a path or trailing slash.
3. Deploy the Vercel project. Your API URL will be `https://YOUR-PROJECT.vercel.app/api/resume/classify`.
4. Open REZE → Settings → Groq AI, paste the actual API URL, save, and test the endpoint.
5. During an import, tick the explicit Groq consent checkbox before choosing **Analyse with Groq AI**. Review the suggestion and approve manually.

If the API is deployed from a monorepo/subdirectory, set the Vercel project Root Directory to the directory containing `api/` and `vercel.json`.

## Security and privacy

- The Groq API key is read only by the Vercel function from `process.env.GROQ_API_KEY`; it is never returned to the browser.
- CORS permits only origins listed in `ALLOWED_ORIGINS`. The endpoint accepts POST/OPTIONS, rejects other origins, limits extracted text to 90,000 characters and request bodies to 400 KB, disables response caching, validates the returned fields, and includes a basic per-serverless-instance rate limit.
- CORS is not authentication. The included in-memory rate limit can reset across serverless instances. Enable Vercel Firewall/rate limiting or add a durable rate-limit store before exposing the API to high-volume public traffic.
- The browser sends extracted text only after per-import consent. The original binary file stays in the browser's existing original-file store.
- The Groq endpoint uses strict JSON Schema output with every resume field explicitly typed; the API normalizes text-like values and returns distinct errors for connectivity, provider rejection, output limits, and resume validation.
- Groq is a third-party processor. Review Groq's current data handling and retention terms and disclose them to users before enabling this feature publicly.
- No Vercel service is deployed by this ZIP. Configure the environment variables and use your actual Vercel deployment URL. Until then, local rules-based parsing continues to work.

## Deploy the editor to GitHub Pages

Deploy the contents of this directory to the repository root. Keep `.github/workflows/pages.yml`. The editor and Groq API are separate deployments: GitHub Pages serves the browser app, while Vercel serves the API.

## Tests

Run from this directory with Node.js:

```bash
node tests/import-engine.test.cjs
node tests/groq-api.test.cjs
node --check reze-import-engine.js
node --check api/resume/classify.js
```

The tests cover the existing import classifier fixture and the API handler's successful mapping, CORS rejection, and text-size limit. They do not test a live Groq account, Vercel deployment, browser CORS behaviour, or end-to-end UI interactions.
