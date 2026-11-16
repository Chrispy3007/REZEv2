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

## Free local AI (optional)

REZE continues to work with its browser-based rules engine without any AI service. An optional Ollama connector is available for users who want local model-assisted classification without per-token API charges.

1. Install Ollama from https://ollama.com/ on the same computer running the browser.
2. Download a model, for example: `ollama pull llama3.2`.
3. Start Ollama. For a website hosted on GitHub Pages, configure Ollama's allowed origins (`OLLAMA_ORIGINS`) to include the exact REZE site origin, then restart Ollama. Do not use a wildcard on an internet-exposed service and do not expose the Ollama port publicly.
4. In REZE, open Settings → Free local AI, enter `http://localhost:11434` and the installed model name, save, then test the connection.
5. During an import, explicitly tick the local-AI consent checkbox and choose **Analyse with free local AI**. Only extracted text is sent to the configured local Ollama endpoint. The original uploaded file is not sent.

Local model quality and speed depend on the user's hardware and selected model. Browser-to-localhost requests may be blocked by browser security/CORS settings; rules-based parsing remains available if that happens. No model is bundled with REZE and no AI API key is required.

## Premium feature menu
The sidebar includes a Premium features dropdown showing planned optional upgrades. These are informational placeholders only: no checkout, subscription, payment processing, or paid cloud AI is enabled in this build.

## REZE Intelligence Core — local AI options

The import engine remains an independent vanilla-JavaScript module (`reze-import-engine.js`) and the resume editor is unchanged.

### Free rules-based mode
Works without AI, an API key, or a local model. This remains the fallback if either AI option is unavailable.

### Browser AI (WebGPU)
- Uses WebLLM from `https://esm.run/@mlc-ai/web-llm` and the `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` model.
- Requires a compatible browser/device with WebGPU (recent Chrome/Edge are the intended targets).
- The model is downloaded on first use and cached by the browser. It may use substantial storage and memory; the small model is a compatibility-oriented starting point, not a guarantee of high extraction accuracy.
- Resume text is processed locally in the browser after the user checks the per-import consent box. No REZE server receives the resume text through this option. Model assets are fetched from the configured public CDN.

### Ollama mode
- Install Ollama locally and pull a model, for example `ollama pull llama3.2`.
- In REZE Settings, configure `http://localhost:11434` and the exact installed model name.
- Use Ollama's allowed-origin configuration for the REZE website origin. Do not expose the Ollama port to the public internet.
- Resume text is sent to the local Ollama service only after per-import consent.

### Import workflow
In the import review dialog, select Browser AI or Ollama, explicitly consent, and run analysis. AI output is only a suggestion: inspect the structured data and approve it manually. If WebGPU/Ollama fails, the rules-based extraction already prepared in the review remains available. The original document is retained separately.

### Limitations
This does not train a new model or guarantee parsing of every resume. Browser model compatibility, download size, device memory, layout extraction quality, and model output quality vary. The browser AI integration is opt-in and should be benchmarked on a diverse resume corpus before production claims.

### Tests
Run `node tests/import-engine.test.cjs` for the existing import-engine fixture tests. Browser WebGPU inference and live Ollama connectivity require manual testing on supported hardware.


## Automatic Browser AI model preparation (trial)

When the REZE page loads on a WebGPU-capable browser, it schedules preparation of the configured WebLLM model in the background during browser idle time. This downloads the model assets from the model distribution host used by WebLLM; the weights are **not** committed to the GitHub repository or served by GitHub Pages. The browser runtime caches model assets where storage permits, and REZE requests persistent browser storage where supported. Browser storage may still be cleared or evicted by the browser or user.

Users can disable automatic preparation in Settings → Free browser AI, or manually prepare/retry it there. The download can consume hundreds of MB or more and uses the user's internet connection. If WebGPU is unavailable, model preparation fails, or the cache is unavailable, the rules-based parser remains available and Ollama can still be configured. Model preparation does not send resume contents; resume text is sent to local AI inference only after the user explicitly consents during that import.

This is a trial configuration: actual download size, first-load time, caching behaviour and inference performance must be measured on real devices before a public performance claim is made.
