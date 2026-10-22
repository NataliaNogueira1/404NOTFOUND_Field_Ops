/**
 * Jest configuration for the FieldOps mobile app.
 *
 * Two isolated projects (Jest `projects`):
 *
 * - "node": the offline/sync unit tests (PBI-044, PBI-054, PBI-062). They run
 *   with ts-jest in a Node environment against an in-memory fake SQLite DB
 *   (better-sqlite3) and mocked network — no native React Native runtime. This
 *   project is the previous config verbatim and only matches `*.test.ts`.
 *
 * - "components": React Native component tests (`*.test.tsx`). They run under
 *   the `jest-expo` preset, which provides the RN/Expo runtime needed to render
 *   components with @testing-library/react-native.
 *
 * Keeping the two projects separate guarantees the data/sync suites keep their
 * exact Node environment while the component tests get a full RN runtime.
 */

/** @type {import('jest').Config} */
const nodeProject = {
  displayName: 'node',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // The node project has no Expo runtime — mock the native SecureStore module
    // so tokenStorage (imported transitively via EvidenceUploadClient) loads.
    '^expo-secure-store$': '<rootDir>/jest/__mocks__/expo-secure-store.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
};

const path = require('path');

// `expo-modules-core` is hoisted under `expo/node_modules`, so jest-expo's
// `requireActual('expo-modules-core')` cannot resolve it from its own folder.
// Resolve it through the installed `expo` package so Jest can map to it.
const expoDir = path.dirname(require.resolve('expo/package.json'));
const expoModulesCoreDir = path.dirname(
  require.resolve('expo-modules-core/package.json', { paths: [expoDir] }),
);

/** @type {import('jest').Config} */
const componentsProject = {
  displayName: 'components',
  preset: 'jest-expo',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // `expo-modules-core` is hoisted under `expo/node_modules`, so jest-expo's
    // `requireActual('expo-modules-core')` cannot resolve it (nor its subpaths)
    // from its own folder. Redirect the package root + subpaths to the installed copy.
    '^expo-modules-core$': expoModulesCoreDir,
    '^expo-modules-core/(.*)$': `${expoModulesCoreDir}/$1`,
  },
  // `transformIgnorePatterns` is intentionally left to the `jest-expo` preset,
  // whose default already transforms the Expo/RN ESM/TS packages (including the
  // nested `expo/node_modules/expo-modules-core`).
};

module.exports = {
  clearMocks: true,
  projects: [nodeProject, componentsProject],
};
