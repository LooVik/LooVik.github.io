// Local preview only. Uses Node's built-in HTTP server and streaming file I/O.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { pipeline } = require('node:stream');

const root = fs.realpathSync(process.argv[3] || path.join(__dirname, '..'));
const requestedPort = Number(process.argv[2] ?? 8080);
if (!Number.isInteger(requestedPort) || requestedPort < 0 || requestedPort > 65535) {
  throw new Error('Port must be an integer between 0 and 65535.');
}
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.pdf': 'application/pdf',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.webp': 'image/webp', '.mp4': 'video/mp4', '.mov': 'video/quicktime',
  '.webm': 'video/webm', '.woff': 'font/woff', '.woff2': 'font/woff2',
};
function insideRoot(file) {
  const relative = path.relative(root, file);
  return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
}

const server = http.createServer(async (req, res) => {
  const reply = (status, message) => {
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(message);
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') return reply(405, 'Method not allowed');
  let pathname;
  try { pathname = decodeURIComponent(req.url.split('?')[0]); }
  catch { return reply(400, 'Bad request'); }
  if (pathname.includes('\0')) return reply(400, 'Bad request');
  const parts = pathname.split(/[\\/]+/).filter(Boolean);
  if (parts.some(part => part.startsWith('.') || part.includes(':'))) return reply(403, 'Forbidden');
  let file = path.resolve(root, ...parts);
  if (!insideRoot(file)) return reply(403, 'Forbidden');
  try {
    let stat = await fs.promises.stat(file);
    if (stat.isDirectory()) {
      file = path.join(file, 'index.html');
      stat = await fs.promises.stat(file);
    }
    if (!insideRoot(await fs.promises.realpath(file))) return reply(403, 'Forbidden');
    if (!stat.isFile()) return reply(404, 'Not found');
    let start = 0, end = stat.size - 1, status = 200;
    const headers = {
      'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
    };
    // Single byte ranges support both normal seeking and MP4 metadata at the end.
    const range = req.headers.range;
    if (range && req.method === 'GET') {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (match && (match[1] || match[2])) {
        start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2]));
        end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= stat.size) {
          res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
          return res.end();
        }
        status = 206;
        headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
      }
    }
    headers['Content-Length'] = Math.max(0, end - start + 1);
    res.writeHead(status, headers);
    if (req.method === 'HEAD' || !stat.size) return res.end();
    // Backpressure and disconnects apply to this response, leaving other requests free.
    pipeline(fs.createReadStream(file, { start, end }), res, () => {});
  } catch (error) {
    if (res.headersSent) return res.destroy();
    reply(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 500, 'File unavailable');
  }
});

let port = requestedPort;
server.on('error', error => {
  if (error.code === 'EADDRINUSE' && port < Math.min(requestedPort + 19, 65535)) {
    server.listen(++port, '127.0.0.1');
  } else {
    console.error(error.message);
    process.exitCode = 1;
  }
});
server.on('listening', () => {
  console.log(`Open: http://127.0.0.1:${server.address().port}/\nServing: ${root}\nStop: Ctrl+C`);
});
server.listen(port, '127.0.0.1');
