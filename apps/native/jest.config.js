const path = require("path");

/**
 * pnpm's nested layout (`node_modules/.pnpm/<pkg>@<ver>_<hash>/node_modules/<pkg>`)
 * defeats the usual `node_modules/(?!...)` transform-ignore regex, so instead of
 * trying to whitelist packages by name we transform *every* JS/TS file that Jest
 * loads, including those inside node_modules. Slower, but correct and stable.
 */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transformIgnorePatterns: [],
  transform: {
    "^.+\\.[jt]sx?$": ["babel-jest", { configFile: path.resolve(__dirname, "babel.config.js") }],
  },
  testMatch: ["<rootDir>/**/*.test.{ts,tsx}"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  collectCoverageFrom: ["components/**/*.{ts,tsx}", "hooks/**/*.{ts,tsx}", "!**/*.test.{ts,tsx}"],
};
