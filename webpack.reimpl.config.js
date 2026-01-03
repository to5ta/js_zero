const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require('path');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';

  return {
    entry: './src/reimpl/main.ts',
    output: {
      filename: 'reimpl.bundle.js',
      path: path.resolve(__dirname, 'dist-reimpl'),
      publicPath: ''
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js']
    },
    devtool: isDev ? 'inline-source-map' : false,
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist-reimpl')
      },
      port: 8080, // Different port from main app (changed from 8081)
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
              options: {
                name: '[name].[ext]',
              },
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
        title: "JS_Zero - Reimplementation",
      }),
      isDev && new webpack.HotModuleReplacementPlugin(),
    ].filter(Boolean),
  };
};
