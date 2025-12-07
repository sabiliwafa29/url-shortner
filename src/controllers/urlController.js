const pool = require('../config/database');
const redis = require('../config/redis');
const { generateRandomCode, encodeBase62 } = require('../utils/generateShortCode');
const QRCode = require('qrcode');

/**
 * Create shortened URL
 */
exports.createShortUrl = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { originalUrl, customAlias, expiresIn, title } = req.body;
    const userId = req.user ? req.user.id : null;

    // Validate URL
    try {
      new URL(originalUrl);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    let shortCode = customAlias;
    let attempts = 0;
    const maxAttempts = 5;

    await client.query('BEGIN');

    // If custom alias provided, check if available
    if (customAlias) {
      const existingAlias = await client.query(
        'SELECT id FROM urls WHERE short_code = $1 OR custom_alias = $1',
        [customAlias]
      );

      if (existingAlias.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Custom alias already taken' });
      }
    } else {
      // Generate unique short code
      while (attempts < maxAttempts) {
        shortCode = generateRandomCode(6);
        
        const existing = await client.query(
          'SELECT id FROM urls WHERE short_code = $1',
          [shortCode]
        );

        if (existing.rows.length === 0) break;
        attempts++;
      }

      if (attempts === maxAttempts) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: 'Failed to generate unique code' });
      }
    }

    // Calculate expiration date
    const expiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000)
      : null;

    // Generate QR Code
    const shortUrl = `${process.env.BASE_URL}/${shortCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(shortUrl);

    // Insert into database
    const result = await client.query(
      `INSERT INTO urls (
        user_id, original_url, short_code, custom_alias, 
        title, qr_code, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [userId, originalUrl, shortCode, customAlias, title, qrCodeDataUrl, expiresAt]
    );

    await client.query('COMMIT');

    const url = result.rows[0];

    // Cache in Redis for fast lookups (TTL: 7 days)
    try {
      await redis.setex(
        `url:${shortCode}`,
        7 * 24 * 60 * 60,
        JSON.stringify({
          id: url.id,
          originalUrl: url.original_url,
          expiresAt: url.expires_at,
          isActive: url.is_active === undefined ? true : url.is_active
        })
      );
    } catch (err) {
      // Redis not available, continue without cache
    }

    res.status(201).json({
      success: true,
      data: {
        id: url.id,
        originalUrl: url.original_url,
        shortCode: url.short_code,
        shortUrl,
        qrCode: url.qr_code,
        expiresAt: url.expires_at,
        createdAt: url.created_at
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create short URL error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

/**
 * Redirect to original URL and track analytics
 */
exports.redirectUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    let urlData;

    // Try to get from Redis cache first
    let cached = null;
    try {
      cached = await redis.get(`url:${shortCode}`);
    } catch (err) {
      // Redis not available, skip cache
    }
    
    if (cached) {
      urlData = JSON.parse(cached);
    } else {
      // Fallback to database
      const result = await pool.query(
        `SELECT id, original_url, expires_at, is_active 
         FROM urls 
         WHERE short_code = $1 OR custom_alias = $1`,
        [shortCode]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'URL not found' });
      }

      urlData = {
        id: result.rows[0].id,
        originalUrl: result.rows[0].original_url,
        expiresAt: result.rows[0].expires_at,
        isActive: result.rows[0].is_active
      };

      // Cache for future requests
      try {
        await redis.setex(
          `url:${shortCode}`,
          7 * 24 * 60 * 60,
          JSON.stringify(urlData)
        );
      } catch (err) {
        // Redis not available, continue without cache
      }
    }

    // Check if URL is active
    if (!urlData.isActive) {
      return res.status(410).json({ error: 'URL has been deactivated' });
    }

    // Check if expired
    if (urlData.expiresAt && new Date(urlData.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'URL has expired' });
    }

    // Track analytics asynchronously (don't block redirect)
    setImmediate(() => {
      trackClick(urlData.id, req);
    });

    // Increment click count in background
    pool.query(
      'UPDATE urls SET click_count = click_count + 1 WHERE id = $1',
      [urlData.id]
    ).catch(err => console.error('Click count update error:', err));

    // Redirect to original URL
    res.redirect(301, urlData.originalUrl);

  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Track click analytics
 */
async function trackClick(urlId, req) {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || req.headers['referrer'] || '';
    const ip = req.ip || req.connection.remoteAddress;

    // Parse user agent for device info
    const deviceType = getDeviceType(userAgent);
    const browser = getBrowser(userAgent);
    const os = getOS(userAgent);

    await pool.query(
      `INSERT INTO analytics (
        url_id, ip_address, user_agent, referer,
        device_type, browser, os
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [urlId, ip, userAgent, referer, deviceType, browser, os]
    );
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}

/**
 * Get user's URLs
 */
exports.getUserUrls = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT 
        id, original_url, short_code, custom_alias, 
        title, click_count, expires_at, is_active, created_at
       FROM urls 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM urls WHERE user_id = $1',
      [userId]
    );

    const urls = result.rows.map(url => ({
      ...url,
      shortUrl: `${process.env.BASE_URL}/${url.short_code}`
    }));

    res.json({
      success: true,
      data: urls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Get URLs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete URL
 */
exports.deleteUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM urls WHERE id = $1 AND user_id = $2 RETURNING short_code',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'URL not found or unauthorized' });
    }

    // Remove from cache
    try {
      await redis.del(`url:${result.rows[0].short_code}`);
    } catch (err) {
      // Redis not available, continue
    }

    res.json({ success: true, message: 'URL deleted successfully' });
  } catch (error) {
    console.error('Delete URL error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper functions for user agent parsing
function getDeviceType(userAgent) {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

function getBrowser(userAgent) {
  if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) return 'Chrome';
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'Safari';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/edg/i.test(userAgent)) return 'Edge';
  return 'Other';
}

function getOS(userAgent) {
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/mac/i.test(userAgent)) return 'MacOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/ios|iphone|ipad/i.test(userAgent)) return 'iOS';
  return 'Other';
}
