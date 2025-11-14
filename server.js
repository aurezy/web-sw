const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const OCR_SCRIPT = path.join(__dirname, 'ocr.py');
const PYTHON_BIN = process.env.PYTHON || 'python3';
const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB
const OCR_TIMEOUT_MS = 60_000;
const fsp = fs.promises;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  const method = req.method || 'GET';

  if (req.url === '/api/ocr' && method === 'POST') {
    handleOcr(req, res);
    return;
  }

  if (!['GET', 'HEAD'].includes(method)) {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Method Not Allowed');
    return;
  }

  const rawPath = req.url === '/' ? '/index.html' : req.url;

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch (_error) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Bad Request');
    return;
  }

  if (decodedPath === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  const normalizedPath = path
    .normalize(decodedPath)
    .replace(/^\/+/, '')
    .replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, normalizedPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('Not Found');
      return;
    }

    if (stats.isDirectory()) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('Forbidden');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    if (method === 'HEAD') {
      res.end();
      return;
    }

    fs.createReadStream(filePath).pipe(res);
  });
}

async function handleOcr(req, res) {
  let tempDir;
  try {
    const rawBody = await readRequestBody(req);
    let payload;
    try {
      payload = JSON.parse(rawBody || '{}');
    } catch (_error) {
      throw createHttpError(400, 'JSON 본문을 해석하지 못했습니다.');
    }
    const base64 = typeof payload.image === 'string' ? payload.image.trim() : '';
    const mime = typeof payload.mime === 'string' ? payload.mime : '';

    if (!base64) {
      throw createHttpError(400, '이미지 데이터가 필요합니다.');
    }

    let buffer;
    try {
      buffer = Buffer.from(base64, 'base64');
    } catch (_error) {
      throw createHttpError(400, '이미지 데이터를 해석하지 못했습니다.');
    }

    if (!buffer || buffer.length === 0) {
      throw createHttpError(400, '이미지가 비어 있습니다.');
    }

    tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'receipt-ocr-'));
    const imagePath = path.join(tempDir, `upload${getExtensionFromMime(mime)}`);
    await fsp.writeFile(imagePath, buffer);

    const { text } = await runEasyOcr(imagePath);
    sendJson(res, 200, { text: typeof text === 'string' ? text : '' });
  } catch (error) {
    console.error('OCR request failed:', error.internalMessage || error);
    const statusCode = error.statusCode || 500;
    const message = error.publicMessage || 'OCR 처리에 실패했습니다.';
    sendJson(res, statusCode, { error: message });
  } finally {
    if (tempDir) {
      fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let received = 0;

    req.on('data', (chunk) => {
      received += chunk.length;
      if (received > MAX_BODY_SIZE) {
        req.pause();
        reject(createHttpError(413, '이미지 크기가 너무 큽니다. (최대 10MB)'));
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    req.on('error', (error) => {
      reject(error);
    });
  });
}

function runEasyOcr(imagePath) {
  return new Promise((resolve, reject) => {
    execFile(
      PYTHON_BIN,
      [OCR_SCRIPT, imagePath],
      { timeout: OCR_TIMEOUT_MS },
      (error, stdout, stderr) => {
        if (error) {
          const err = createHttpError(500, 'EasyOCR 실행에 실패했습니다.');
          err.internalMessage = stderr || error.message;
          reject(err);
          return;
        }

        try {
          const parsed = JSON.parse(stdout);
          resolve(parsed);
        } catch (_parseError) {
          const err = createHttpError(500, 'OCR 결과를 해석하지 못했습니다.');
          err.internalMessage = stdout;
          reject(err);
        }
      }
    );
  });
}

function sendJson(res, statusCode, payload) {
  if (res.headersSent) return;
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=UTF-8' });
  res.end(JSON.stringify(payload));
}

function createHttpError(statusCode, publicMessage) {
  const error = new Error(publicMessage);
  error.statusCode = statusCode;
  error.publicMessage = publicMessage;
  return error;
}

const MIME_EXTENSION_MAP = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
};

function getExtensionFromMime(mime) {
  if (!mime) return '.png';
  return MIME_EXTENSION_MAP[mime.toLowerCase()] || '.png';
}

const server = http.createServer(serveStatic);

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
