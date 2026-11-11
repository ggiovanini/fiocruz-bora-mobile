const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const model = new Module('legalDocuments');
model.require = name => { if (name === './config') return { getApiBaseUrl: () => process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '' }; throw new Error(name); };
model._compile(ts.transpileModule(readFileSync('src/api/legalDocuments.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, 'legalDocuments.cjs');

test('public documents are read without authentication and preserve the server version', async t => {
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(url, 'https://bora.example/api/v1/legal-documents/termos-de-uso');
    assert.deepEqual(init.headers, { Accept: 'application/json' });
    return { ok: true, status: 200, json: async () => ({ data: { title: 'Termos', content: 'Linha 1\n\nLinha 2', version: 3 } }) };
  });
  const previous = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = 'https://bora.example/api/v1/';
  t.after(() => { if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = previous; });
  const document = await model.exports.fetchLegalDocuments('termos-de-uso');
  assert.equal(document.version, 3);
  assert.equal(document.content, 'Linha 1\n\nLinha 2');
});

test('missing publication is shown as unavailable rather than a substitute consent text', async t => {
  const previous = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = 'https://bora.example/api/v1';
  t.after(() => { if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = previous; });
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 404 }));
  await assert.rejects(model.exports.fetchLegalDocuments('termos-de-uso'), /ainda não foi publicado/);
});
