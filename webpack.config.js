import path from "path";
import { fileURLToPath } from "url";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Данные по умолчанию для шаблонов
const defaultData = {
  title: "Default Title",
  error: {
    status: 404,
    stack: "",
    message: "Page not found",
  },
  userslist: [],
};

export default {
  mode: "development",
  entry: {
    main: "./bin/www",
    admin: "./public/javascripts/admin.js",
    welcomepage: "./public/javascripts/welcomepage.js",
    layout: "./views/layout.pug",
    userslist: "./views/admin/userslist.pug",
    welcome: "./views/welcome_page.pug",
    error: "./views/error.pug",
    friends: "./views/friends.pug",
    user_layout: "./views/user_layout.pug",
    profile: "./views/profile_page.pug",
    friendsfeed: "./views/friends_feed.pug",
    feed: "./views/admin/feed.pug",
  },
  output: {
    path: path.resolve(__dirname, "dist/webpack"),
    filename: "js/[name].bundle.js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: ["autoprefixer"],
              },
            },
          },
          "less-loader",
        ],
      },
      {
        test: /\.pug$/,
        use: [
          {
            loader: "pug-loader",
            options: {
              pretty: true,
              self: true,
              globals: ["defaultData"],
              data: defaultData,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: "css/[name].css",
    }),
    new HtmlWebpackPlugin({
      template: "./views/layout.pug",
      filename: "layout.html",
      chunks: ["layout", "main"],
      templateParameters: defaultData,
    }),
    new HtmlWebpackPlugin({
      template: "./views/welcome_page.pug",
      filename: "welcome.html",
      chunks: ["welcome", "welcomepage"],
      templateParameters: defaultData,
    }),
    new HtmlWebpackPlugin({
      template: "./views/admin/userslist.pug",
      filename: "admin/userslist.html",
      chunks: ["userslist", "admin"],
      templateParameters: defaultData,
    }),
    new HtmlWebpackPlugin({
      template: "./views/error.pug",
      filename: "error.html",
      chunks: ["error"],
    }),
    new HtmlWebpackPlugin({
      template: "./views/friends.pug",
      filename: "friends.html",
      chunks: ["friends"],
    }),
    new HtmlWebpackPlugin({
      template: "./views/user_layout.pug",
      filename: "user_layout.html",
      chunks: ["user_layout"],
    }),
    new HtmlWebpackPlugin({
      template: "./views/profile_page.pug",
      filename: "profile.html",
      chunks: ["profile"],
    }),
    new HtmlWebpackPlugin({
      template: "./views/friends_feed.pug",
      filename: "friends_feed.html",
      chunks: ["friendsfeed"],
    }),
    new HtmlWebpackPlugin({
      template: "./views/admin/feed.pug",
      filename: "admin/feed.html",
      chunks: ["feed", "admin"],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, "dist/webpack"),
    },
    port: 9000,
    hot: true,
    compress: true,
    open: true,
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      name: "vendors",
    },
  },
  resolve: {
    extensions: [".js", ".pug"],
    alias: {
      views: path.resolve(__dirname, "views/"),
    },
  },
};
