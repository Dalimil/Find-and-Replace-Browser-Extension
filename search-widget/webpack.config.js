const path = require('path');

module.exports = {
  entry: [
    './src/index.js'
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  devServer: {
    contentBase: './dist'
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
