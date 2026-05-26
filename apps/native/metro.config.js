const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = false;

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

config.watchFolders = [monorepoRoot];

const uniwindConfig = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./uniwind-types.d.ts",
});

// Packages that need explicit resolution due to package exports + Bun symlinks
const EXPLICIT_RESOLUTIONS = {
  "uniwind": path.resolve(projectRoot, "node_modules/uniwind/src/index.ts"),
  "culori": path.resolve(projectRoot, "node_modules/culori/bundled/culori.cjs"),
  "uniwind/components": path.resolve(projectRoot, "node_modules/uniwind/src/components/index.ts"),
};

uniwindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  // Check explicit resolutions first
  if (EXPLICIT_RESOLUTIONS[moduleName]) {
    return { filePath: EXPLICIT_RESOLUTIONS[moduleName], type: "sourceFile" };
  }

  try {
    return context.resolveRequest(context, moduleName, platform);
  } catch (e) {
    for (const base of [projectRoot, monorepoRoot]) {
      const packageDir = path.resolve(base, "node_modules", moduleName);
      if (fs.existsSync(packageDir)) {
        // Read package.json to find correct entry
        try {
          const pkg = JSON.parse(
            fs.readFileSync(path.join(packageDir, "package.json"), "utf8")
          );
          const entry =
            pkg["react-native"] ||
            pkg["main"] ||
            "index.js";
          const entryPath = path.resolve(packageDir, entry);
          if (fs.existsSync(entryPath)) {
            return { filePath: entryPath, type: "sourceFile" };
          }
        } catch (r) {

        }
      }
    }
    throw e;
  }
};

module.exports = uniwindConfig;