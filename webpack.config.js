const HtmlWebpackPlugin = require("html-webpack-plugin");

const path = require('path');

module.exports = {
  entry: './src/code/index.ts',
  output: {
    filename: 'js_zero.bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: ''
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  devtool: 'source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    }
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: ['html-loader']
      },
      {
        test: /\.tsx?/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.(bin|png|jpg|jpeg|gif|gltf|glb|babylon|mp3|wav|html)$/,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
      },

    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Project JS_Zero",
    }),
    // new HtmlWebpackPlugin({
    //   filename: "MenuScreen.html",
    // }),
  ],
};
