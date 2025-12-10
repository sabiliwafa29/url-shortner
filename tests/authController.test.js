// Mocks for DB client and pool
const mockClient = { query: jest.fn(), release: jest.fn() };
const mockPool = { connect: jest.fn(() => mockClient), query: jest.fn() };

jest.mock('../src/config/database', () => mockPool);

// Mock bcrypt and jwt
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(() => Promise.resolve('salt')),
  hash: jest.fn(() => Promise.resolve('hashedpw')),
  compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'FAKE_TOKEN')
}));

// require controller after mocks
const { register, login } = require('../src/controllers/authController');

describe('authController - register and login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'testsecret';
  });

  it('registers a new user successfully', async () => {
    const req = { body: { email: 'new@example.com', password: 'Password1!', name: 'New' } };
    const res = { status: jest.fn(() => res), json: jest.fn() };

    // client.query sequence: BEGIN, SELECT existingUser, INSERT, COMMIT
    mockClient.query.mockImplementation((sql, params) => {
      const s = String(sql || '').toLowerCase();
      if (s.trim() === 'begin' || s.trim() === 'commit') return Promise.resolve();
      if (s.includes('select id from users where email')) return Promise.resolve({ rows: [] });
      if (s.includes('insert into users')) return Promise.resolve({ rows: [{ id: 123, email: 'new@example.com', name: 'New', created_at: '2025-01-01' }] });
      return Promise.resolve({ rows: [] });
    });

    await register(req, res);

    expect(mockPool.connect).toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    const payload = res.json.mock.calls[0][0];
    expect(payload).toHaveProperty('success', true);
    expect(payload.data.token).toBe('FAKE_TOKEN');
  });

  it('returns 409 if email already registered', async () => {
    const req = { body: { email: 'exist@example.com', password: 'pass', name: 'Exist' } };
    const res = { status: jest.fn(() => res), json: jest.fn() };

    mockClient.query.mockImplementation((sql, params) => {
      const s = String(sql || '').toLowerCase();
      if (s.includes('select id from users where email')) return Promise.resolve({ rows: [{ id: 1 }] });
      if (s.trim() === 'begin' || s.trim() === 'rollback') return Promise.resolve();
      return Promise.resolve({ rows: [] });
    });

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email already registered' });
  });

  it('logs in successfully with correct credentials', async () => {
    const req = { body: { email: 'user@example.com', password: 'Password1!' } };
    const res = { status: jest.fn(() => res), json: jest.fn() };

    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 55, email: 'user@example.com', password: 'hashedpw', name: 'User' }] });
    const bcrypt = require('bcryptjs');
    bcrypt.compare.mockResolvedValueOnce(true);

    await login(req, res);

    expect(mockPool.query).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload).toHaveProperty('success', true);
    expect(payload.data.token).toBe('FAKE_TOKEN');
  });

  it('returns 401 on invalid login email', async () => {
    const req = { body: { email: 'noone@example.com', password: 'x' } };
    const res = { status: jest.fn(() => res), json: jest.fn() };

    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
  });

  it('returns 401 on wrong password', async () => {
    const req = { body: { email: 'user@example.com', password: 'wrong' } };
    const res = { status: jest.fn(() => res), json: jest.fn() };

    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 55, email: 'user@example.com', password: 'hashedpw', name: 'User' }] });
    const bcrypt = require('bcryptjs');
    bcrypt.compare.mockResolvedValueOnce(false);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
  });
});
