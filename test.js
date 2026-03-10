#!/usr/bin/env node
const http = require('http');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_KEY  = process.env.API_KEY  || 'maim12345';
let passed = 0, failed = 0;

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: url.hostname, port: url.port || 80,
      path: url.pathname + url.search, method,
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, ...headers,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}) },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function test(name, fn) {
  try { await fn(); console.log(`  ✅ PASS: ${name}`); passed++; }
  catch (err) { console.log(`  ❌ FAIL: ${name}\n         ${err.message}`); failed++; }
}

function assert(condition, msg) { if (!condition) throw new Error(msg || 'Assertion failed'); }

async function runTests() {
  console.log('\n🧪 Universal Media Downloader API — Test Suite\n================================================\n');
  await test('GET /api/health returns 200', async () => {
    const r = await request('GET', '/api/health');
    assert(r.status === 200); assert(r.body.success === true);
  });
  await test('GET / returns API info', async () => {
    const r = await request('GET', '/'); assert(r.status === 200); assert(r.body.name);
  });
  await test('Rejects wrong API key', async () => {
    const r = await request('POST', '/api/extract', { url: 'https://youtube.com/watch?v=x' }, { 'x-api-key': 'bad' });
    assert(r.status === 401);
  });
  await test('Rejects missing url', async () => {
    const r = await request('POST', '/api/extract', {}); assert(r.status === 400);
  });
  await test('Rejects unsupported platform', async () => {
    const r = await request('POST', '/api/extract', { url: 'https://example.com/video' });
    assert(r.status === 400); assert(r.body.success === false);
  });
  await test('GET /api/thumbnail rejects missing url', async () => {
    const r = await request('GET', '/api/thumbnail'); assert(r.status === 400);
  });
  await test('Unknown route returns 404', async () => {
    const r = await request('GET', '/api/unknown'); assert(r.status === 404);
  });
  console.log(`\n================================================\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}
runTests().catch(err => { console.error(err); process.exit(1); });
