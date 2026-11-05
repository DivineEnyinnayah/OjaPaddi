// @ts-check
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: [
      "dist/*",
      ".expo/*",
      "android/*",
      "node_modules/*",
      "uniwind-types.d.ts",
      "uniwind-env.d.ts",
      "expo-env.d.ts",
      "*.config.js",
      "jest.setup.ts",
    ],
  },
  {
    rules: {
      // Rebuild discipline: no dead code, no stray logs.
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-unused-vars": "off",
    },
  },
  {
    // The offline queue / retry transport logs its decisions with a structured
    // `[API]` prefix. That is intentional transport observability, not a stray
    // debug log, so `log` is permitted at this one boundary.
    files: ["lib/api.ts"],
    rules: {
      "no-console": ["error", { allow: ["warn", "error", "log"] }],
    },
  },
]);
