const { generateRandomCode, encodeBase62, decodeBase62, generateHashCode } = require('../src/utils/generateShortCode');

describe('Short Code Generation', () => {
  describe('generateRandomCode', () => {
    it('should generate code with default length 6', () => {
      const code = generateRandomCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[a-zA-Z0-9]+$/);
    });

    it('should generate code with custom length', () => {
      const code = generateRandomCode(8);
      expect(code).toHaveLength(8);
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateRandomCode());
      }
      // Most should be unique (allow for small collision chance)
      expect(codes.size).toBeGreaterThan(95);
    });
  });

  describe('Base62 Encoding/Decoding', () => {
    it('should encode and decode correctly', () => {
      const id = 12345;
      const encoded = encodeBase62(id);
      const decoded = decodeBase62(encoded);
      expect(decoded).toBe(id);
    });

    it('should handle zero', () => {
      const encoded = encodeBase62(0);
      expect(encoded).toBe('0');
      expect(decodeBase62(encoded)).toBe(0);
    });

    it('should handle large numbers', () => {
      const id = 999999999;
      const encoded = encodeBase62(id);
      const decoded = decodeBase62(encoded);
      expect(decoded).toBe(id);
    });
  });

  describe('generateHashCode', () => {
    it('should generate consistent hash for same URL', () => {
      const url = 'https://example.com';
      const hash1 = generateHashCode(url);
      const hash2 = generateHashCode(url);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different URLs', () => {
      const hash1 = generateHashCode('https://example1.com');
      const hash2 = generateHashCode('https://example2.com');
      expect(hash1).not.toBe(hash2);
    });

    it('should respect length parameter', () => {
      const hash = generateHashCode('https://example.com', 8);
      expect(hash).toHaveLength(8);
    });
  });
});
