const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ZipPlugin = require('zip-webpack-plugin')

module.exports = {
  mode: 'production', // "production" | "development" | "none"
  entry: './src/script.js',
  output: {
    // options related to how webpack emits results
    path: path.resolve(__dirname, 'dist/src'), // string (default)
    // the target directory for all output files
    // must be an absolute path (use the Node.js path module)
    filename: 'script.js', // string (default)
    // the filename template for entry chunks
    // publicPath: '/assets/', // string
    // the url to the output directory resolved relative to the HTML page
  },
  plugins: [
    // Copy manifest.json to dist folder
    new CopyWebpackPlugin({
      patterns: [path.resolve(__dirname, './src/manifest.json')],
    }),
    // Zip the output
    new ZipPlugin({
      path: path.resolve(__dirname, 'dist/zip'),
      filename: 'google-shortcuts-extension.zip',
    })
  ],
}
