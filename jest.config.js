module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@unimodules|unimodules|@react-navigation|@nozbe/watermelondb|aws-amplify|@aws-amplify)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-css-interop.*$': '<rootDir>/__mocks__/react-native-css-interop.js',
    '^nativewind.*$': '<rootDir>/__mocks__/nativewind.js',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/utils/'],
  collectCoverageFrom: [
    'services/**/*.{ts,tsx}',
    'src/constants/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/index.ts',
    '!**/index.native.ts',
  ],
  // Coverage thresholds focused on testable business logic
  // React Native UI components are tested via logic extraction and E2E tests
  coverageThreshold: {
    global: { branches: 50, functions: 70, lines: 70, statements: 70 },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'node',
  globals: {
    __DEV__: true,
  },
};
