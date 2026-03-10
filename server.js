'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const apiRouter = require('./routes/api');
const {
  apiKeyAuth,
  createRateLimiter,
  requestLogger,
  errorHandler,
  notFoundHandler,
} = require('./middleware/index');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy for Render.com / reverse proxies
app.set('trust proxy', 1);

// ── CORS ────────────────────────────────────────────────────────────────────
const corsAllowed = process.env.CORS_ALLOWED_ORIGINS || '*';

const corsOptions = {
  origin: (origin, callback) => {
    if (corsAllowed === '*' || NODE_ENV === 'development') return callback(null, true);
    if (!origin) return callback(null, true);
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    const allowedList = corsAllowed.split(',').map(o => o.trim());
    if (allowedList.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  optionsSuccessStatus: 200,
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(requestLogger);
app.use(createRateLimiter());

// ── Root Info ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'Universal Media Downloader API',
    version: '1.0.0',
    status: 'online',
    docs: {
      endpoints: {
        'POST /api/extract':   'Extract downloadable media links from a URL',
        'GET  /api/thumbnail': 'Get thumbnail for a media URL (?url=...)',
        'GET  /api/formats':   'List available formats (?url=...)',
        'GET  /health':        'Health check (no auth required)',
      },
      authentication: 'Include x-api-key header with all /api/* requests',
      supportedPlatforms: ['YouTube', 'Instagram', 'Facebook', 'TikTok'],
      example: {
        curl: `curl -X POST http://localhost:${PORT}/api/extract \\
  -H "x-api-key: maim12345" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'`,
      },
    },
  });
});

// ── API Routes (auth protected) ─────────────────────────────────────────────
app.use('/api', apiKeyAuth, apiRouter);

// ── Error Handlers ──────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start ───────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.info('╔══════════════════════════════════════════════╗');
  logger.info(`║  Universal Media Downloader API              ║`);
  logger.info(`║  http://localhost:${PORT}  [${NODE_ENV}]${''.padEnd(Math.max(0, 14 - NODE_ENV.length))}║`);
  logger.info('╚══════════════════════════════════════════════╝');
  logger.info('Platforms: YouTube | Instagram | Facebook | TikTok');
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully...`);
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

module.exports = app;
