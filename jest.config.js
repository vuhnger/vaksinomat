/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["**/__tests__/**/*.ts", "**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/"],
  testTimeout: 15000,
};

module.exports = config;
