const { validateUrl, validateRegister, validateLogin } = require('../src/utils/validator');

describe('Validation Middleware', () => {
  describe('validateUrl', () => {
    it('should accept valid URL', () => {
      const req = {
        body: {
          originalUrl: 'https://example.com',
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateUrl(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid URL', () => {
      const req = {
        body: {
          originalUrl: 'not-a-url',
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateUrl(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should accept valid custom alias', () => {
      const req = {
        body: {
          originalUrl: 'https://example.com',
          customAlias: 'mylink'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateUrl(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid custom alias', () => {
      const req = {
        body: {
          originalUrl: 'https://example.com',
          customAlias: 'my-link!' // Invalid: contains special chars
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateUrl(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateRegister', () => {
    it('should accept valid registration data', () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateRegister(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject weak password', () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'weak',
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateRegister(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject invalid email', () => {
      const req = {
        body: {
          email: 'not-an-email',
          password: 'Password123',
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateRegister(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
