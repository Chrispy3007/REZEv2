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

const modelResume = {
  name: 'Test Person',
  title: 'Security Analyst',
  email: 'test@example.com',
  phone: '+1 555 0100',
  location: 'Remote',
  links: { linkedin: 'https://linkedin.com/in/test', github: 'https://github.com/test' },
  summary: 'Security analyst with application testing experience.',
  skills: { heading: 'Security', skills: ['VAPT', 'Burp Suite'], description: 'Web application testing' },
  experience: [{
    company: 'Example',
    role: 'Analyst',
    location: 'Remote',
    startDate: 'Jan 2024',
    endDate: 'Present',
    responsibilities: ['Tested applications'],
    achievements: ['Reported validated findings'],
    details: ''
  }],
  education: [{
    institution: 'Example University',
    degree: 'BSc',
    field: 'Computer Science',
    startDate: '2020',
    endDate: '2023',
    details: ''
  }],
  skillsGroups: [{ heading: 'Security', description: 'VAPT, Burp Suite' }],
  projects: [{ name: 'Lab', description: 'Security lab', technologies: ['Nmap'], details: '' }],
  certifications: [{ name: 'CEH', issuer: 'EC-Council', date: '2024', details: '' }],
  additionalInformation: [{ title: 'Languages', content: 'English', sourcePage: 0 }],
  customSections: [{ title: 'Community', body: 'Volunteer work', visible: true }]
};

(async () => {
  process.env.ALLOWED_ORIGINS = 'https://chrispy3007.github.io';
  process.env.GROQ_API_KEY = 'test-secret';
  // An unsupported configured model must be replaced with the strict-output default.
  process.env.GROQ_MODEL = 'test-model';
  const oldFetch = global.fetch;
  let sentRequest = null;
  let nextResponse = {
    ok: true,
    json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ resume: modelResume }) } }] })
  };
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
    assert.equal(options.headers.Authorization, 'Bearer test-secret');
    sentRequest = JSON.parse(options.body);
    return nextResponse;
  };
  try {
    const req = { method: 'POST', headers: { origin: 'https://chrispy3007.github.io', 'x-forwarded-for': '192.0.2.1' }, body: { task: 'classify_resume', sourceText: 'Test Person\nSecurity: VAPT' } };
    const res = response(); await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.resume.name, 'Test Person');
    assert.equal(res.body.resume.experience[0].responsibilities[0], 'Tested applications');
    assert.equal(res.body.resume.education[0].institution, 'Example University');
    assert.equal(res.body.resume.skillsGroups[0].heading, 'Security');
    assert.equal(res.body.resume.projects[0].technologies[0], 'Nmap');
    assert.equal(res.body.resume.certifications[0].name, 'CEH');
    assert.equal(typeof res.body.resume.links, 'string');
    assert.match(res.body.resume.links, /linkedin/i);
    assert.match(res.body.resume.links, /https:\/\/github.com\/test/);
    assert.equal(typeof res.body.resume.skills, 'string');
    assert.match(res.body.resume.skills, /Security/);
    assert.match(res.body.resume.skills, /VAPT/);
    assert.match(res.body.resume.skills, /Burp Suite/);
    assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://chrispy3007.github.io');

    assert.equal(sentRequest.model, 'openai/gpt-oss-20b');
    assert.equal(sentRequest.max_completion_tokens, 16000);
    assert.equal(sentRequest.response_format.type, 'json_schema');
    assert.equal(sentRequest.response_format.json_schema.strict, true);
    assert.equal(sentRequest.response_format.json_schema.name, 'reze_resume');
    const schema = sentRequest.response_format.json_schema.schema;
    assert.deepEqual(schema.required, ['resume']);
    assert.equal(schema.additionalProperties, false);
    assert.deepEqual(schema.properties.resume.required, Object.keys(modelResume));
    assert.equal(schema.properties.resume.additionalProperties, false);
    assert.match(sentRequest.messages[0].content, /untrusted resume text/i);
    assert.match(sentRequest.messages[1].content, /\n\n<resume_source>\n/);

    const blocked = response();
    await handler({ ...req, headers: { origin: 'https://evil.example' } }, blocked);
    assert.equal(blocked.statusCode, 403);

    const tooLarge = response();
    await handler({ ...req, body: { sourceText: 'x'.repeat(90001) } }, tooLarge);
    assert.equal(tooLarge.statusCode, 413);

    nextResponse = {
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'Failed to generate JSON. Please adjust your prompt.' } })
    };
    const groqRejected = response();
    await handler({ ...req, headers: { ...req.headers, 'x-forwarded-for': '192.0.2.2' } }, groqRejected);
    assert.equal(groqRejected.statusCode, 502);
    assert.match(groqRejected.body.error, /Groq rejected the structured-output request/);
    assert.match(groqRejected.body.error, /Failed to generate JSON/);
    console.log('Groq API handler tests passed (strict schema, field mapping, CORS, size limits, and provider errors).');
  } finally { global.fetch = oldFetch; }
})().catch(err => { console.error(err); process.exit(1); });
