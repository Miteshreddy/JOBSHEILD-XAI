module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testPathIgnorePatterns: ["/node_modules/"],
  collectCoverageFrom: ["controllers/**/*.js", "middleware/**/*.js", "utils/**/*.js", "models/**/*.js"],
};
