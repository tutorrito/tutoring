const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Enable CSS support for web
  isCSSEnabled: true
});

// Add source extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Configure server
config.server = {
  port: 8081,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Increase max listeners to prevent memory leak warnings
      process.setMaxListeners(25);
      return middleware(req, res, next);
    };
  }
};

// Configure transformer
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
      routerRoot: 'app',
    },
  }),
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
      keep_classnames: true,
    },
    compress: {
      global_defs: {
        __DEV__: false,
      },
      passes: 1,
      keep_fargs: true,
      pure_getters: true,
      keep_fnames: true,
    },
  },
};

module.exports = config;