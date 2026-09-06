// Run: node scripts/serve.test.cjs [http://127.0.0.1:PORT]
const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const path = require('node:path');

async function main() {
  let server;
  let base = process.argv[2];
  if (!base) {
    server = spawn(process.execPath, [path.join(__dirname, 'serve.cjs'), '0', path.join(__dirname, '..')]);
    const [output] = await once(server.stdout, 'data');
    base = String(output).match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
    assert.ok(base, `Server did not print a preview URL: ${output}`);
  }
  function request(urlPath, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(base + urlPath, { agent: false, ...options }, res => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
        res.on('error', reject);
      });
      req.setTimeout(1500, () => req.destroy(new Error(`${urlPath} blocked for over 1.5 seconds`)));
      req.on('error', reject);
      req.end();
    });
  }
  let video;
  try {
    assert.equal((await request('/games.html')).status, 200);
    console.log('PASS: Games page responds before streaming');
    // A paused media reader must not block navigation or other file requests.
    video = http.get(base + '/assets/videos/Lockedin.mp4', { agent: false });
    video.on('error', () => {});
    const [stream] = await once(video, 'response');
    stream.pause();
    const started = performance.now();
    assert.equal((await request('/games.html')).status, 200);
    console.log(`PASS: Games page during a stalled video: ${Math.round(performance.now() - started)} ms`);
    video.destroy();
    const full = await request('/assets/videos/flappy-animals-gameplay.mp4');
    const partial = await request('/assets/videos/flappy-animals-gameplay.mp4', { headers: { Range: 'bytes=0-15' } });
    assert.equal(partial.status, 206);
    assert.deepEqual(partial.body, full.body.subarray(0, 16));
    const suffix = await request('/assets/videos/flappy-animals-gameplay.mp4', { headers: { Range: 'bytes=-16' } });
    assert.equal(suffix.status, 206);
    assert.deepEqual(suffix.body, full.body.subarray(-16));
    assert.equal((await request('/assets/videos/flappy-animals-gameplay.mp4', { headers: { Range: 'bytes=999999999-' } })).status, 416);
    const head = await request('/games.html', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.body.length, 0);
    assert.equal((await request('/missing-file.html')).status, 404);
    assert.equal((await request('/%2e%2e%5csecret.txt')).status, 403);
    assert.equal((await request('/.git/config')).status, 403);
    assert.equal((await request('/%ZZ')).status, 400);
    console.log('PASS: video ranges, HEAD, missing files, malformed paths, and private-path protection');
  } finally {
    video?.destroy();
    server?.kill();
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
