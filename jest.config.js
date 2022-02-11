module.exports = {
  testTimeout: 20000,
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|js)x?$',
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.{ts,tsx,js,jsx}', '!src/**/*.d.ts'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'src/entry.ts',
    'src/parse.ts',
    'src/detect.ts',
  ],
};
