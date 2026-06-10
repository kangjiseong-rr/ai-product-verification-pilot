const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 8010);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data', 'applications');
const FINAL_RESULTS_DIR = path.join(__dirname, 'data', 'final-results');

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(FINAL_RESULTS_DIR, { recursive: true });
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

function sendText(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function findRowValue(rows, item) {
  for (const row of rows || []) {
    if (row.item === item) return String(row.value || '');
  }
  return '';
}

function summarizePayload(payload) {
  const application = payload.application || {};
  return {
    company_name: findRowValue(application.companyRows, '기업명'),
    product_name: findRowValue(application.productRows, '제품 또는 서비스명'),
  };
}

function applicationPath(id) {
  return path.join(DATA_DIR, `${id}.json`);
}

function finalResultPath(id) {
  return path.join(FINAL_RESULTS_DIR, `${id}.json`);
}

function saveApplication(payload) {
  ensureDataDir();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const summary = summarizePayload(payload);
  const stored = {
    ...payload,
    id,
    submittedAt: payload.submittedAt || createdAt,
    status: payload.status || 'draft',
    pilotMeta: {
      createdAt,
      companyName: summary.company_name,
      productName: summary.product_name,
    },
  };

  fs.writeFileSync(applicationPath(id), JSON.stringify(stored, null, 2), 'utf8');
  return stored;
}

function listApplications() {
  ensureDataDir();
  return fs.readdirSync(DATA_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const payload = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
      return {
        id: payload.id,
        created_at: payload.pilotMeta?.createdAt || payload.submittedAt,
        status: payload.status || 'draft',
        company_name: payload.pilotMeta?.companyName || '',
        product_name: payload.pilotMeta?.productName || '',
      };
    })
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

function getApplication(id) {
  const filePath = applicationPath(id);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveFinalResult(payload) {
  ensureDataDir();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const stored = {
    ...payload,
    id,
    submittedAt: payload.submittedAt || createdAt,
    status: payload.status || 'final-review',
    pilotMeta: {
      createdAt,
      applicationId: payload.applicationId || null,
    },
  };

  fs.writeFileSync(finalResultPath(id), JSON.stringify(stored, null, 2), 'utf8');
  return stored;
}

function listFinalResults() {
  ensureDataDir();
  return fs.readdirSync(FINAL_RESULTS_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const payload = JSON.parse(fs.readFileSync(path.join(FINAL_RESULTS_DIR, file), 'utf8'));
      return {
        id: payload.id,
        application_id: payload.applicationId || payload.pilotMeta?.applicationId || '',
        created_at: payload.pilotMeta?.createdAt || payload.submittedAt,
        status: payload.status || 'final-review',
        final_decision: payload.finalReview?.decision?.finalDecision || '',
      };
    })
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

function getFinalResult(id) {
  const filePath = finalResultPath(id);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function serveStatic(reqPath, res) {
  const normalizedPath = reqPath === '/' ? '/index.html' : reqPath;
  const requested = path.normalize(decodeURIComponent(normalizedPath)).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(ROOT_DIR, requested);

  if (!filePath.startsWith(ROOT_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendText(res, 404, 'Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
  };

  sendText(res, 200, fs.readFileSync(filePath), contentTypes[ext] || 'application/octet-stream');
}

async function handleApi(req, res, url) {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/applications') {
    try {
      const body = await readRequestBody(req);
      const payload = JSON.parse(body || '{}');
      const stored = saveApplication(payload);
      sendJson(res, 201, { id: stored.id, status: 'created' });
    } catch (error) {
      sendJson(res, 400, { error: 'Invalid application payload' });
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/applications') {
    sendJson(res, 200, listApplications());
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/final-results') {
    try {
      const body = await readRequestBody(req);
      const payload = JSON.parse(body || '{}');
      const stored = saveFinalResult(payload);
      sendJson(res, 201, { id: stored.id, status: 'created' });
    } catch (error) {
      sendJson(res, 400, { error: 'Invalid final result payload' });
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/final-results') {
    sendJson(res, 200, listFinalResults());
    return;
  }

  const finalResultMatch = url.pathname.match(/^\/api\/final-results\/([^/]+)$/);
  if (req.method === 'GET' && finalResultMatch) {
    const payload = getFinalResult(finalResultMatch[1]);
    if (!payload) {
      sendJson(res, 404, { error: 'Final result not found' });
      return;
    }
    sendJson(res, 200, payload);
    return;
  }

  const match = url.pathname.match(/^\/api\/applications\/([^/]+)$/);
  if (req.method === 'GET' && match) {
    const payload = getApplication(match[1]);
    if (!payload) {
      sendJson(res, 404, { error: 'Application not found' });
      return;
    }
    sendJson(res, 200, payload);
    return;
  }

  sendJson(res, 404, { error: 'API route not found' });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);

  if (url.pathname.startsWith('/api/')) {
    await handleApi(req, res, url);
    return;
  }

  serveStatic(url.pathname, res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Pilot server running at http://127.0.0.1:${PORT}`);
  console.log(`API health check: http://127.0.0.1:${PORT}/api/health`);
});
