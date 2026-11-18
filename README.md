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

## REZE AI Assistant and Sample Resume Library

The current feature branch adds two user-facing workspaces while keeping the existing editor and import pipeline in place:

- **AI Assistant:** conversational resume help plus focused tools for rewriting, concise wording, professional summaries, experience, ATS keywords, skills and grammar. Every writing result is shown in a review panel; the user can edit, reject, regenerate, copy or explicitly apply it.
- **Resume context:** disabled by default. The user must enable the resume-context toggle before current resume details are included in an AI request. Job-match analysis runs locally first; a separate unchecked-by-default consent is required before sending the resume and job description to the AI endpoint for tailored suggestions.
- **Job matching:** calculates a local keyword-overlap Job Match Score and a separate local ATS Readiness checklist score. Both are heuristic guidance, not an employer ATS result or interview prediction.
- **Sample Resume Library:** 66 starter examples across 22 industries and three experience levels. Role-specific samples can be generated in the browser without AI. Profiles use fictional example data and are stored separately from imported original files. A sample is previewable with different designs before creating an editable copy.
- **Templates:** 10 original REZE design directions with gallery search, ATS-first/visual classification, guided recommendations, sample preview and new blank-resume creation. Applying a template to an existing resume preserves its content.

### Deploy the AI endpoint

The provider-independent serverless endpoint is `POST /api/ai/assist`. It supports Groq (default), OpenAI and Gemini. The browser stores only the endpoint URL; provider keys are read by the server from Vercel environment variables.

In Vercel → Project → Settings → Environment Variables, configure:

| Variable | Purpose |
| --- | --- |
| `ALLOWED_ORIGINS` | Exact comma-separated frontend origins, e.g. `https://chrispy3007.github.io` (origin only, no path or trailing slash). |
| `AI_PROVIDER` | Optional. `groq` (default), `openai` or `gemini`. |
| `GROQ_API_KEY` | Groq credential. The existing import endpoint also uses this secret. |
| `GROQ_MODEL` | Optional Groq model. Defaults to `openai/gpt-oss-20b`. |
| `OPENAI_API_KEY` | Required when `AI_PROVIDER=openai` or OpenAI is configured as fallback. |
| `OPENAI_MODEL` | Required for OpenAI, e.g. a model enabled for your account. |
| `GEMINI_API_KEY` | Required when `AI_PROVIDER=gemini` or Gemini is configured as fallback. |
| `GEMINI_MODEL` | Required for Gemini, e.g. `gemini-2.5-flash` if enabled for your account. |
| `AI_FALLBACK_PROVIDER` | Optional fallback provider: `groq`, `openai` or `gemini`. Set its own key and model too. |
| `AI_RATE_LIMIT` | Optional requests per IP per in-memory window; defaults to 20. |
| `AI_RATE_WINDOW_MS` | Optional rate window in milliseconds; defaults to 900000 (15 minutes). |

Never add provider API keys to HTML, JavaScript, GitHub or the browser's REZE settings. Set them only as sensitive Vercel environment variables. For a non-Groq provider, configure that provider's model variable. Vercel needs a new deployment after environment-variable changes.

After deploying, open REZE → Settings → REZE AI Assistant, enter the deployed URL ending in `/api/ai/assist`, save it and use **Test connection**. The health test confirms that the endpoint and selected provider configuration are present; it does not guarantee a paid request will succeed.

### AI privacy and production safeguards

- The AI endpoint accepts only configured origins and POST/OPTIONS, disables response caching, limits request size, and applies a basic per-serverless-instance rate limit.
- The in-memory rate limiter can reset across serverless instances and is not an account-based quota. Before opening managed AI to public traffic, add Vercel Firewall or a durable rate-limit/usage store, alerting and a spending cap.
- CORS is not authentication. A public deployment should use suitable edge protection/abuse controls and review provider costs.
- Resume context is not sent by default. Explicitly enabling the assistant context sends relevant resume fields for that AI request. The job-match local comparison stays in the browser; the separate AI recommendations checkbox must be selected before resume details and the job description are sent to the AI endpoint.
- The AI instructions prohibit inventing work history, qualifications, credentials, dates, metrics or skills. Users must review suggestions before applying.
- Providers are third-party processors. Review current provider data handling/retention terms and disclose them to users before enabling the service for public use.
- No AI service is deployed by this repository update. Configure Vercel and the provider environment variables, deploy the project, then enter the actual endpoint URL in REZE Settings. Until configured, the sample library, template gallery and local job/ATS checks remain usable; live AI chat and writing suggestions show a setup message.

## Deploy the editor to GitHub Pages

Deploy the contents of this directory to the repository root. Keep `.github/workflows/pages.yml`. The editor and Groq API are separate deployments: GitHub Pages serves the browser app, while Vercel serves the API.

## Tests

Run from this directory with Node.js:

```bash
node tests/import-engine.test.cjs
node tests/groq-api.test.cjs
node tests/ai-assist-api.test.cjs
node --check reze-import-engine.js
node --check reze-ai-samples.js
node --check api/ai/assist.js
node --check api/resume/classify.js
```

The tests cover the existing import classifier fixture and the API handler's successful mapping, CORS rejection, and text-size limit. They do not test a live Groq account, Vercel deployment, browser CORS behaviour, or end-to-end UI interactions.
