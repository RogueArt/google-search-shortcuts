const path = require('path')

module.exports = {
  mode: 'production', // "production" | "development" | "none"
  entry: './src/script.js',
  output: {
    // options related to how webpack emits results
    path: path.resolve(__dirname, 'dist'), // string (default)
    // the target directory for all output files
    // must be an absolute path (use the Node.js path module)
    filename: 'script.js', // string (default)
    // the filename template for entry chunks
    // publicPath: '/assets/', // string
    // the url to the output directory resolved relative to the HTML page
  },
}
