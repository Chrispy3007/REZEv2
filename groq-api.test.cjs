const assert = require('node:assert/strict');
const handler = require('./api/resume/classify.js');

function response() {
  return {
    headers: {}, statusCode: 200, body: null,
    setHeader(k, v) { this.headers[k] = v; return this; },
    status(n) { this.statusCode = n; return this; },
    json(v) { this.body = v; return this; },
    end() { return this; }
  };
}
(async () => {
  process.env.ALLOWED_ORIGINS = 'https://chrispy3007.github.io';
  process.env.GROQ_API_KEY = 'test-secret';
  process.env.GROQ_MODEL = 'test-model';
  const oldFetch = global.fetch;
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
    assert.equal(options.headers.Authorization, 'Bearer test-secret');
    const sent = JSON.parse(options.body);
    assert.equal(sent.model, 'test-model');
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ resume: { name: 'Test Person', links: { linkedin: 'https://linkedin.com/in/test', github: 'https://github.com/test' }, skillsGroups: [{ heading: 'Security', description: 'VAPT' }], experience: [{ company: 'Example', role: 'Analyst', responsibilities: ['Tested applications'] }] } }) } }] }) };
  };
  try {
    const req = { method: 'POST', headers: { origin: 'https://chrispy3007.github.io', 'x-forwarded-for': '192.0.2.1' }, body: { task: 'classify_resume', sourceText: 'Test Person\nSecurity: VAPT' } };
    const res = response(); await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.resume.name, 'Test Person');
    assert.equal(typeof res.body.resume.links, 'string');
    assert.match(res.body.resume.links, /LinkedIn|linkedin/i);
    assert.match(res.body.resume.links, /https:\/\/github.com\/test/);
    assert.equal(res.body.resume.experience[0].responsibilities[0], 'Tested applications');
    assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://chrispy3007.github.io');

    const blocked = response(); await handler({ ...req, headers: { origin: 'https://evil.example' } }, blocked);
    assert.equal(blocked.statusCode, 403);

    const tooLarge = response(); await handler({ ...req, body: { sourceText: 'x'.repeat(90001) } }, tooLarge);
    assert.equal(tooLarge.statusCode, 413);
    console.log('Groq API handler tests passed.');
  } finally { global.fetch = oldFetch; }
})().catch(err => { console.error(err); process.exit(1); });
