const path = require('path');

module.exports = {
  entry: [
    './src/index.js'
  ],
  output: {
    filename: 'bundle.js',

    /* webpack build */
    path: path.resolve(__dirname, '../main/src/widget'),

    /* webpack dev server */
    publicPath: '/'
  },
  devServer: {
    contentBase: './debug'
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: "babel-loader",
      query: {
        presets: ["react", "env"]
      }
    }]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx']
  }
};
