const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: {
    taskpane: "./src/index.tsx"
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"]
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      filename: "taskpane.html",
      chunks: ["taskpane"]
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, "dist")
    },
    port: 3000,
    hot: true,
    open: false,
    server: {
      type: "https"
    },
    allowedHosts: "all"
  }
};


