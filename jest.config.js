module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/config/**',
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  verbose: true,
  testTimeout: 10000,
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 25,
      lines: 35,
      statements: 35
    }
  }
};
