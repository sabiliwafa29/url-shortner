const pool = require('../config/database');

/**
 * Get analytics for specific URL
 */
exports.getUrlAnalytics = async (req, res) => {
  try {
    const { urlId } = req.params;
    const userId = req.user.id;
    const { startDate, endDate, limit = 100 } = req.query;

    // Verify URL belongs to user
    const urlCheck = await pool.query(
      'SELECT id FROM urls WHERE id = $1 AND user_id = $2',
      [urlId, userId]
    );

    if (urlCheck.rows.length === 0) {
      return res.status(404).json({ error: 'URL not found or unauthorized' });
    }

    // Build date filter
    let dateFilter = '';
    const params = [urlId];
    
    if (startDate) {
      params.push(startDate);
      dateFilter += ` AND clicked_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      dateFilter += ` AND clicked_at <= $${params.length}`;
    }

    // Get detailed analytics
    const analytics = await pool.query(
      `SELECT 
        id, ip_address, referer, device_type, 
        browser, os, country, city, clicked_at
       FROM analytics 
       WHERE url_id = $1 ${dateFilter}
       ORDER BY clicked_at DESC 
       LIMIT ${limit}`,
      params
    );

    res.json({
      success: true,
      data: analytics.rows,
      total: analytics.rows.length
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get aggregated statistics for URL
 */
exports.getUrlStats = async (req, res) => {
  try {
    const { urlId } = req.params;
    const userId = req.user.id;
    const { days = 30 } = req.query;

    // Verify URL belongs to user
    const urlCheck = await pool.query(
      `SELECT id, original_url, short_code, click_count, created_at 
       FROM urls 
       WHERE id = $1 AND user_id = $2`,
      [urlId, userId]
    );

    if (urlCheck.rows.length === 0) {
      return res.status(404).json({ error: 'URL not found or unauthorized' });
    }

    const url = urlCheck.rows[0];
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get clicks over time (daily)
    const clicksOverTime = await pool.query(
      `SELECT 
        DATE(clicked_at) as date,
        COUNT(*) as clicks
       FROM analytics
       WHERE url_id = $1 AND clicked_at >= $2
       GROUP BY DATE(clicked_at)
       ORDER BY date DESC`,
      [urlId, sinceDate]
    );

    // Get device breakdown
    const deviceStats = await pool.query(
      `SELECT 
        device_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
       FROM analytics
       WHERE url_id = $1 AND clicked_at >= $2
       GROUP BY device_type
       ORDER BY count DESC`,
      [urlId, sinceDate]
    );

    // Get browser breakdown
    const browserStats = await pool.query(
      `SELECT 
        browser,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
       FROM analytics
       WHERE url_id = $1 AND clicked_at >= $2
       GROUP BY browser
       ORDER BY count DESC`,
      [urlId, sinceDate]
    );

    // Get OS breakdown
    const osStats = await pool.query(
      `SELECT 
        os,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
       FROM analytics
       WHERE url_id = $1 AND clicked_at >= $2
       GROUP BY os
       ORDER BY count DESC`,
      [urlId, sinceDate]
    );

    // Get top referrers
    const topReferrers = await pool.query(
      `SELECT 
        referer,
        COUNT(*) as count
       FROM analytics
       WHERE url_id = $1 AND clicked_at >= $2 AND referer != ''
       GROUP BY referer
       ORDER BY count DESC
       LIMIT 10`,
      [urlId, sinceDate]
    );

    // Get geographic data (if available)
    const geoStats = await pool.query(
      `SELECT 
        country,
        city,
        COUNT(*) as count
       FROM analytics
       WHERE url_id = $1 AND clicked_at >= $2 AND country IS NOT NULL
       GROUP BY country, city
       ORDER BY count DESC
       LIMIT 10`,
      [urlId, sinceDate]
    );

    res.json({
      success: true,
      data: {
        url: {
          id: url.id,
          originalUrl: url.original_url,
          shortCode: url.short_code,
          totalClicks: parseInt(url.click_count),
          createdAt: url.created_at
        },
        clicksOverTime: clicksOverTime.rows,
        deviceBreakdown: deviceStats.rows,
        browserBreakdown: browserStats.rows,
        osBreakdown: osStats.rows,
        topReferrers: topReferrers.rows,
        geographic: geoStats.rows,
        period: {
          days: parseInt(days),
          from: sinceDate.toISOString(),
          to: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user dashboard overview
 */
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Total URLs created
    const totalUrls = await pool.query(
      'SELECT COUNT(*) FROM urls WHERE user_id = $1',
      [userId]
    );

    // Total clicks across all URLs
    const totalClicks = await pool.query(
      'SELECT SUM(click_count) as total FROM urls WHERE user_id = $1',
      [userId]
    );

    // Top 5 performing URLs
    const topUrls = await pool.query(
      `SELECT 
        id, original_url, short_code, click_count, created_at
       FROM urls 
       WHERE user_id = $1
       ORDER BY click_count DESC
       LIMIT 5`,
      [userId]
    );

    // Recent activity (last 7 days)
    const recentActivity = await pool.query(
      `SELECT 
        DATE(a.clicked_at) as date,
        COUNT(*) as clicks
       FROM analytics a
       JOIN urls u ON a.url_id = u.id
       WHERE u.user_id = $1 
         AND a.clicked_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(a.clicked_at)
       ORDER BY date DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        totalUrls: parseInt(totalUrls.rows[0].count),
        totalClicks: parseInt(totalClicks.rows[0].total || 0),
        topUrls: topUrls.rows.map(url => ({
          ...url,
          shortUrl: `${process.env.BASE_URL}/${url.short_code}`
        })),
        recentActivity: recentActivity.rows
      }
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
