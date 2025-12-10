// Mocks for DB and Redis
const mockPool = {
  query: jest.fn()
};

const mockRedis = {
  get: jest.fn(),
  setex: jest.fn()
};

jest.mock('../src/config/database', () => mockPool);
jest.mock('../src/config/redis', () => mockRedis);

// Require controller after mocks
const { redirectUrl } = require('../src/controllers/urlController');

describe('redirectUrl controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect (301) on cache hit (browser request)', async () => {
    const req = {
      params: { shortCode: 'abc123' },
      headers: {},
      ip: '127.0.0.1',
    };

    const res = {
      redirect: jest.fn(),
      status: jest.fn(() => res),
      json: jest.fn()
    };

    // Redis returns cached data
    mockRedis.get.mockResolvedValueOnce(JSON.stringify({ id: 5, originalUrl: 'https://example.com', expiresAt: null, isActive: true }));
    // pool.query for click_count increment should resolve
    mockPool.query.mockResolvedValueOnce({});

    await redirectUrl(req, res);

    expect(mockRedis.get).toHaveBeenCalledWith('url:abc123');
    expect(res.redirect).toHaveBeenCalledWith(301, 'https://example.com/');
  });

  it('should lookup DB and redirect on cache miss', async () => {
    const req = { params: { shortCode: 'xyz' }, headers: {}, ip: '::1' };
    const res = { redirect: jest.fn(), status: jest.fn(() => res), json: jest.fn() };

    mockRedis.get.mockResolvedValueOnce(null);
    // First pool.query: SELECT
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 7, original_url: 'http://localhost/path', expires_at: null, is_active: true }] });
    // Subsequent pool.query: increment click_count
    mockPool.query.mockResolvedValueOnce({});

    await redirectUrl(req, res);

    expect(mockPool.query).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(301, 'http://localhost/path');
  });

  it('should return 410 for expired url', async () => {
    const req = { params: { shortCode: 'old' }, headers: {}, ip: '127.0.0.1' };
    const res = { redirect: jest.fn(), status: jest.fn(() => res), json: jest.fn() };

    const past = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    mockRedis.get.mockResolvedValueOnce(null);
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 9, original_url: 'https://expired', expires_at: past, is_active: true }] });

    await redirectUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({ error: 'URL has expired' });
  });

  it('should return JSON instead of redirect for AJAX requests', async () => {
    const req = { params: { shortCode: 'ajax' }, headers: { accept: 'application/json' }, ip: '127.0.0.1' };
    const res = { redirect: jest.fn(), status: jest.fn(() => res), json: jest.fn() };

    mockRedis.get.mockResolvedValueOnce(JSON.stringify({ id: 12, originalUrl: 'https://api.example', expiresAt: null, isActive: true }));
    mockPool.query.mockResolvedValueOnce({});

    await redirectUrl(req, res);

    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    // controller normalizes URL and will include a trailing slash
    expect(payload).toHaveProperty('targetUrl', 'https://api.example/');
  });
});
