const http = require('http');
const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'web');
const webPort = 5173;
const capsulePort = 7777;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const webServer = http.createServer((req, res) => {
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(baseDir, urlPath.split('?')[0]);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain' });
      res.end(err.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

function sendJson(res, code, payload) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const capsuleServer = http.createServer(async (req, res) => {
  const pathname = (req.url || '').split('?')[0];

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'GET' && pathname === '/health') {
    sendJson(res, 200, {
      status: 'ok',
      capsule: 'openwhispr',
      time: new Date().toISOString(),
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/run') {
    try {
      const body = await parseJsonBody(req);
      const message = body && typeof body.message === 'string' ? body.message : '';
      sendJson(res, 200, {
        ok: true,
        capsule: 'openwhispr',
        input: message,
        response: message.toUpperCase(),
        time: new Date().toISOString(),
      });
      return;
    } catch (err) {
      sendJson(res, 400, {
        ok: false,
        error: 'Invalid JSON payload',
      });
      return;
    }
  }

  sendJson(res, 404, { ok: false, error: 'Not found' });
});

webServer.listen(webPort, () => {
  console.log('[DeepFlex] web runtime server running at http://localhost:' + webPort);
});

capsuleServer.listen(capsulePort, () => {
  console.log('[DeepFlex] OpenWhispr capsule server running at http://localhost:' + capsulePort);
});
