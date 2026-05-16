const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = Array.from(
  new Set([projectRoot, ...(config.watchFolders ?? []), workspaceRoot]),
);

config.resolver.nodeModulesPaths = Array.from(
  new Set([
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
    ...(config.resolver.nodeModulesPaths ?? []),
  ]),
);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const safeContext = {
    ...context,
    getPackageForModule: (absolutePath) => {
      try {
        return context.getPackageForModule(absolutePath);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Unexpectedly escaped traversal')
        ) {
          return null;
        }

        throw error;
      }
    },
  };

  if (defaultResolveRequest) {
    return defaultResolveRequest(safeContext, moduleName, platform);
  }

  return context.resolveRequest(safeContext, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
  dtsFile: './uniwind-types.d.ts',
  extraThemes: [
    'lavender-light',
    'lavender-dark',
    'mint-light',
    'mint-dark',
    'sky-light',
    'sky-dark',
  ],
});