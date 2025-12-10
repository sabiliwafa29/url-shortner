// Mocks
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  connect: jest.fn(() => mockClient),
};

const mockRedis = {
  setex: jest.fn(() => Promise.resolve()),
  del: jest.fn(() => Promise.resolve()),
};

const mockQrQueue = {
  add: jest.fn(() => Promise.resolve()),
};

jest.mock('../src/config/database', () => mockPool);
jest.mock('../src/config/redis', () => mockRedis);
jest.mock('../src/queues/qrQueue', () => mockQrQueue);
jest.mock('qrcode', () => ({ toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,FAKE')) }));
jest.mock('../src/utils/generateShortCode', () => ({
  generateRandomCode: jest.fn(() => 'abc123'),
  encodeBase62: jest.fn(),
  decodeBase62: jest.fn(),
  generateHashCode: jest.fn()
}));

// Require controller after mocks to ensure module dependencies are mocked
const { createShortUrl } = require('../src/controllers/urlController');

describe('createShortUrl controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ensure pool.connect returns our mock client
    mockPool.connect = jest.fn(() => mockClient);
    process.env.BASE_URL = 'http://localhost:3000';
  });

  it('creates a short URL with custom alias', async () => {
    // Arrange
    const req = {
      body: { originalUrl: 'https://example.com', customAlias: 'myalias', title: 'Example' },
      user: { id: 2 }
    };

    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    // Stub client behavior
    mockClient.query.mockImplementation((sql, params) => {
      const s = String(sql || '').toLowerCase();
      if (s.includes('select id from urls')) return Promise.resolve({ rows: [] });
      if (s.includes('insert into urls')) {
        return Promise.resolve({ rows: [{ id: 10, short_code: 'myalias', original_url: 'https://example.com', custom_alias: 'myalias', qr_code: null, expires_at: null, created_at: new Date().toISOString() }] });
      }
      if (s.includes('update urls set qr_code')) return Promise.resolve({});
      if (s.trim().toLowerCase() === 'begin' || s.trim().toLowerCase() === 'commit' || s.trim().toLowerCase() === 'rollback') return Promise.resolve();
      return Promise.resolve({ rows: [] });
    });

    // Act
    await createShortUrl(req, res);

    // Assert
    expect(mockPool.connect).toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg).toHaveProperty('success', true);
    expect(jsonArg.data).toHaveProperty('shortUrl', 'http://localhost:3000/myalias');
    expect(jsonArg.data).toHaveProperty('qrCode');
    // queue should be called (noop in test env or mocked)
    expect(mockQrQueue.add).toHaveBeenCalled();
  });

  it('creates a short URL with random code when no custom alias provided', async () => {
    const req = {
      body: { originalUrl: 'https://example.com', title: 'Random' },
      user: { id: 3 }
    };

    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    // First, the insert should succeed
    mockClient.query.mockImplementation((sql, params) => {
      const s = String(sql || '').toLowerCase();
      if (s.includes('insert into urls')) {
        return Promise.resolve({ rows: [{ id: 11, short_code: 'abc123', original_url: 'https://example.com', custom_alias: null, qr_code: null, expires_at: null, created_at: new Date().toISOString() }] });
      }
      return Promise.resolve({ rows: [] });
    });

    await createShortUrl(req, res);

    expect(mockPool.connect).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data.shortUrl).toBe('http://localhost:3000/abc123');
    // qrPending should be true because qr_code is null
    expect(jsonArg.data.qrPending).toBe(true);
  });
});
