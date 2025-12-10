// Tests for getUserUrls and deleteUrl
const mockPool = {
  query: jest.fn()
};

const mockRedis = {
  del: jest.fn()
};

jest.mock('../src/config/database', () => mockPool);
jest.mock('../src/config/redis', () => mockRedis);

// import controller after mocks
const { getUserUrls, deleteUrl } = require('../src/controllers/urlController');

describe('urlController - listing and deletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getUserUrls returns paginated data and total count', async () => {
    const req = { user: { id: 42 }, query: { page: '2', limit: '2' } };
    const res = { json: jest.fn(), status: jest.fn(() => res) };

    const rows = [
      { id: 1, original_url: 'https://a', short_code: 'a', custom_alias: null, title: 'A', click_count: 0, expires_at: null, is_active: true, created_at: '2025-01-01' },
      { id: 2, original_url: 'https://b', short_code: 'b', custom_alias: 'alias', title: 'B', click_count: 2, expires_at: null, is_active: true, created_at: '2025-01-02' }
    ];

    mockPool.query.mockImplementation((sql, params) => {
      const s = String(sql || '').toLowerCase();
      if (s.includes('select') && s.includes('from urls') && s.includes('order by')) {
        return Promise.resolve({ rows });
      }
      if (s.includes('select count')) {
        return Promise.resolve({ rows: [{ count: '10' }] });
      }
      return Promise.resolve({ rows: [] });
    });

    await getUserUrls(req, res);

    expect(mockPool.query).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload).toHaveProperty('data');
    expect(Array.isArray(payload.data)).toBe(true);
    expect(payload.pagination).toMatchObject({ page: 2, limit: 2, total: 10 });
  });

  it('deleteUrl deletes when authorized and removes cache', async () => {
    const req = { params: { id: '5' }, user: { id: 100 } };
    const res = { json: jest.fn(), status: jest.fn(() => res) };

    mockPool.query.mockResolvedValueOnce({ rows: [{ short_code: 'code5' }] });
    mockRedis.del.mockResolvedValueOnce(1);

    await deleteUrl(req, res);

    expect(mockPool.query).toHaveBeenCalledWith('DELETE FROM urls WHERE id = $1 AND user_id = $2 RETURNING short_code', ['5', 100]);
    expect(mockRedis.del).toHaveBeenCalledWith('url:code5');
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'URL deleted successfully' });
  });

  it('deleteUrl returns 404 when not found or unauthorized', async () => {
    const req = { params: { id: '99' }, user: { id: 10 } };
    const res = { json: jest.fn(), status: jest.fn(() => res) };

    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await deleteUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'URL not found or unauthorized' });
  });
});
