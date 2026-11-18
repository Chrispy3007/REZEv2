'use strict';

const assert = require('node:assert/strict');
const handler = require('../api/ai/assist.js');

const ORIGIN = 'https://chrispy3007.github.io';

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    ended: false,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { this.ended = true; return this; }
  };
}

async function request(body, options = {}) {
  const req = {
    method: options.method || 'POST',
    headers: { origin: options.origin || ORIGIN, ...(options.headers || {}) },
    socket: { remoteAddress: options.ip || '127.0.0.1' },
    body
  };
  const res = createResponse();
  await handler(req, res);
  return res;
}

async function main() {
  process.env.ALLOWED_ORIGINS = ORIGIN;
  process.env.AI_PROVIDER = 'groq';
  process.env.GROQ_API_KEY = 'test-only-key';
  process.env.GROQ_MODEL = 'openai/gpt-oss-20b';
  process.env.AI_RATE_LIMIT = '20';
  process.env.AI_RATE_WINDOW_MS = '900000';
  delete process.env.AI_FALLBACK_PROVIDER;

  let providerRequest = null;
  const originalFetch = global.fetch;
  global.fetch = async (_url, options) => {
    providerRequest = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: 'A factual, polished suggestion.' } }] })
    };
  };

  try {
    const health = await request({ action: 'health' });
    assert.equal(health.statusCode, 200);
    assert.equal(health.body.configured, true);
    assert.equal(health.body.provider, 'groq');

    const suggestion = await request({
      action: 'suggestion',
      tool: 'rewrite',
      instruction: 'Improve clarity without changing facts.',
      sourceText: 'Supported routine application security testing.'
    });
    assert.equal(suggestion.statusCode, 200);
    assert.equal(suggestion.body.suggestion, 'A factual, polished suggestion.');
    assert.ok(providerRequest.messages.some(x => x.role === 'system'));

    const chat = await request({
      action: 'chat',
      message: 'How can I improve this summary?',
      history: [{ role: 'user', content: 'How can I improve this summary?' }]
    });
    assert.equal(chat.statusCode, 200);
    const duplicateUserMessages = providerRequest.messages.filter(
      x => x.role === 'user' && x.content === 'How can I improve this summary?'
    );
    assert.equal(duplicateUserMessages.length, 1, 'The newest chat message should not be duplicated.');

    const blocked = await request({ action: 'health' }, { origin: 'https://attacker.invalid' });
    assert.equal(blocked.statusCode, 403);

    const method = await request({}, { method: 'GET' });
    assert.equal(method.statusCode, 405);

    const oversized = await request({ action: 'chat', message: 'x'.repeat(100001) });
    assert.equal(oversized.statusCode, 413);

    const preflight = await request({}, { method: 'OPTIONS' });
    assert.equal(preflight.statusCode, 204);
    assert.equal(preflight.headers['access-control-allow-origin'], ORIGIN);

    console.log('AI assistant API tests passed.');
  } finally {
    global.fetch = originalFetch;
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
