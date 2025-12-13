require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const logger = require('./config/logger');
const swaggerSpec = require('./config/swagger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const urlRoutes = require('./routes/urlRoutes');
const authRoutes = require('./routes/authRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(morgan('combined', { stream: logger.stream }));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve static frontend from /public if present. Place before the root
// handler so `GET /` will return `public/index.html` when available.
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'URL Shortener API Docs'
}));

// Swagger JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
// Root route (fallback health) — if no static `index.html` served, return JSON
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'URL Shortener API',
    docs: process.env.BASE_URL ? `${process.env.BASE_URL}/api-docs` : '/api-docs'
  });
});

app.use('/', urlRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;