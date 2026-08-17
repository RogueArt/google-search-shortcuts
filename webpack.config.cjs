const path = require('node:path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ZipPlugin = require('zip-webpack-plugin')

const packageJson = require('./package.json')
const baseManifest = require('./src/manifest.base.json')
const TARGETS = ['firefox', 'chromium']

function createManifest(target) {
  const { toolbar_popup: defaultPopup, ...common } = baseManifest

  if (target === 'firefox') {
    return {
      ...common,
      version: packageJson.version,
      manifest_version: 2,
      browser_action: {
        default_icon: common.icons,
        default_popup: defaultPopup,
      },
      browser_specific_settings: {
        gecko: {
          id: '{10bdbdc0-e1da-4471-96a3-8f4dd6ed38a3}',
          data_collection_permissions: { required: ['none'] },
        },
      },
    }
  }

  return {
    ...common,
    version: packageJson.version,
    manifest_version: 3,
    minimum_chrome_version: '95',
    action: {
      default_icon: common.icons,
      default_popup: defaultPopup,
    },
  }
}

function createConfig(target) {
  return {
    name: target,
    mode: 'production',
    target: 'web',
    devtool: false,
    entry: {
      script: './src/script.js',
      popup: './src/popup.js',
    },
    output: {
      path: path.resolve(__dirname, `dist/${target}`),
      filename: '[name].js',
      clean: true,
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: './src/manifest.base.json',
            to: 'manifest.json',
            transform: () => `${JSON.stringify(createManifest(target), null, 2)}\n`,
          },
          { from: './src/content.css', to: 'content.css' },
          { from: './src/popup.html', to: 'popup.html' },
          { from: './src/popup.css', to: 'popup.css' },
          { from: './src/icons', to: 'icons' },
          { from: './LICENSE', to: 'LICENSE', toType: 'file' },
        ],
      }),
      new ZipPlugin({
        path: path.resolve(__dirname, 'dist/packages'),
        filename: `google-search-shortcuts-${target}.zip`,
      }),
    ],
  }
}

module.exports = env => {
  const requestedTarget = env && env.target
  if (requestedTarget && !TARGETS.includes(requestedTarget)) {
    throw new Error(`Unknown browser target: ${requestedTarget}`)
  }

  return requestedTarget
    ? createConfig(requestedTarget)
    : TARGETS.map(createConfig)
}
