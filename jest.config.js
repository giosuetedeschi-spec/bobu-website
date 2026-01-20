module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/tests/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/app/globals.css$': '<rootDir>/__mocks__/globals.css.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
