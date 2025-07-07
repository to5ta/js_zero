const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

const path = require('path');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';

  return {
    entry: './src/code/index.ts',
    output: {
      filename: 'js_zero.bundle.js',
      path: path.resolve(__dirname, 'dist'),
      publicPath: ''
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js']
    },
    devtool: isDev ? 'inline-source-map' : false,
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
        title: "Project JS_Zero",
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'src/code/**/*.php', to: '[name][ext]' }
        ]
      }),
      isDev && new webpack.HotModuleReplacementPlugin(),
    ].filter(Boolean),
  };
};
