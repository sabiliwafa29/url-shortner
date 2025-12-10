const mockPool = { query: jest.fn() };
const mockRedis = { get: jest.fn(), setex: jest.fn() };
const mockLogger = { error: jest.fn(), info: jest.fn() };

jest.mock('../src/config/database', () => mockPool);
jest.mock('../src/config/redis', () => mockRedis);
jest.mock('../src/config/logger', () => mockLogger);

// Mock qrcode
jest.mock('qrcode', () => ({ toDataURL: jest.fn() }));

// Require worker (in test env it exports { process })
const workerModule = require('../src/workers/qrWorker');
const QRCode = require('qrcode');

describe('QR worker processor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes job: updates DB and Redis when cache present', async () => {
    const job = { data: { urlId: 1, shortCode: 'abc', shortUrl: 'http://short/abc' } };

    QRCode.toDataURL.mockResolvedValueOnce('data:image/png;base64,FAKE');
    mockPool.query.mockResolvedValueOnce({}); // for UPDATE
    mockRedis.get.mockResolvedValueOnce(JSON.stringify({ id: 1, originalUrl: 'x' }));
    mockRedis.setex.mockResolvedValueOnce(1);

    // call processor
    const result = await workerModule.process(job);

    expect(QRCode.toDataURL).toHaveBeenCalledWith('http://short/abc');
    expect(mockPool.query).toHaveBeenCalledWith('UPDATE urls SET qr_code = $1 WHERE id = $2', ['data:image/png;base64,FAKE', 1]);
    expect(mockRedis.setex).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it('logs and throws when QR generation fails', async () => {
    const job = { data: { urlId: 2, shortCode: 'def', shortUrl: 'http://short/def' } };
    QRCode.toDataURL.mockRejectedValueOnce(new Error('boom'));

    await expect(workerModule.process(job)).rejects.toThrow('boom');
    expect(mockLogger.error).toHaveBeenCalledWith('QR worker error', expect.any(Error));
  });
});
