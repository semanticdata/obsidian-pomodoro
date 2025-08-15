export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: 'tests/.*\\.test\\.ts$',
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/tests/__mocks__/obsidian.ts',
    '\\.svg$': '<rootDir>/tests/__mocks__/svg-mock.ts',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
  ],
};