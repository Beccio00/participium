/** @type {import('ts-jest').JestConfigWithTsJest} */

// Set NODE_ENV to development for tests (enables TypeORM synchronize)
process.env.NODE_ENV = "development";

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.ts"],
  setupFiles: ["dotenv/config"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/index.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // TypeORM需要这个
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: "tsconfig.json",
    }],
  },
  // 设置测试超时时间
  testTimeout: 30000,
  // 设置环境变量
  setupFiles: ["<rootDir>/test/helpers/setupEnv.ts"],
};
