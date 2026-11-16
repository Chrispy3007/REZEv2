const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = __dirname;
const memory = new Map();
const document = {
  querySelector: () => null,
  createElement: () => ({}),
  head: { appendChild() {} },
  body: { appendChild() {} }
};
const localStorage = { getItem: key => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) };
const context = { window: {}, document, localStorage, console, Date, Math, JSON, Promise, Set, Array, Object, String, Number, RegExp, Error, Uint8Array };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'reze-import-engine.js'), 'utf8'), context);
const sample = `JORDAN SAMPLE\nSECURITY ANALYST | APPLICATION SECURITY\njordan@example.com | +1 415 555 0134\nPROFESSIONAL SUMMARY\nSecurity analyst with experience testing web applications and APIs.\nCORE TECHNICAL SKILLS\nPenetration Testing: Burp Suite, OWASP ZAP, Nmap\nAutomation: Python, Bash\nPROFESSIONAL EXPERIENCE\nACME SECURITY LLC | Security Analyst | Jan 2023 – Present\n• Tested web applications and APIs.\n  Identified access-control weaknesses and documented remediation.\n• Automated repetitive validation tasks.\nEDUCATION\nBachelor of Science — Example University | May 2022\nCERTIFICATION\nCertified Ethical Hacker`;
const result = context.window.REZEImportEngine.classify({ text: sample, lines: sample.split(/\r?\n/).map(text => ({ text, page: 1, source: 'fixture' })) }, 'fixture-doc');
assert.equal(result.data.name, 'JORDAN SAMPLE');
assert.equal(result.data.email, 'jordan@example.com');
assert.equal(result.data.experience.length, 1);
assert.equal(result.data.experience[0].company, 'ACME SECURITY LLC');
assert.equal(result.data.experience[0].role, 'Security Analyst');
assert.match(result.data.experience[0].details, /Identified access-control weaknesses/);
assert.equal(result.data.skillsGroups.length, 2);
assert.equal(result.data.education[0].company, 'Example University');
assert.equal(result.data.certifications[0].name, 'Certified Ethical Hacker');
assert.equal(result.data.schemaVersion, 2);
assert.equal(result.data.metadata.professionalContext.industry, 'technology');
const finance = context.window.REZEImportEngine.inferProfessionalContext('Prepared financial reports, reconciliations, tax audits and budget forecasts.');
assert.equal(finance.industry, 'finance');
const general = context.window.REZEImportEngine.inferProfessionalContext('Experienced professional with a varied background.');
assert.equal(general.industry, 'general');
assert.ok(result.data.metadata.professionalContext.responsibilityThemes.includes('analysis'));
console.log('Import engine fixture tests passed.');
