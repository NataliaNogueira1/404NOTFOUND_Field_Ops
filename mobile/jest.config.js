/**
 * Jest configuration for the FieldOps mobile app.
 *
 * Uses ts-jest in a Node environment for the offline/sync unit tests (PBI-044),
 * which exercise the repositories/service logic against an in-memory fake SQLite
 * DB and mocked network — no native React Native runtime required.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
  clearMocks: true,
};
