import path from "path";
import { fileURLToPath } from "url";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import TerserPlugin from "terser-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { merge } from "webpack-merge";
import CopyPlugin from "copy-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Базовая конфигурация
const commonConfig = {
  entry: {
    main: ["./public/javascripts/admin.js", "./public/stylesheets/style.scss"],
  },
  output: {
    filename: "js/[name].[contenthash].js",
    path: path.resolve(__dirname, "dist-webpack"),
    publicPath: "",
  },
  module: {
    rules: [
      // JavaScript
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
      // SCSS
      {
        test: /\.scss$/,
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
          "sass-loader",
        ],
      },
      // Изображения
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
        generator: {
          filename: "images/[name].[hash][ext]",
        },
      },
      // Шрифты
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
        generator: {
          filename: "fonts/[name].[hash][ext]",
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: "css/[name].[contenthash].css",
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "public/images",
          to: "images",
        },
        {
          from: "public/javascripts",
          to: "javascripts",
        },
        {
          from: "public/stylesheets/*.css",
          to: "stylesheets/[name][ext]",
          noErrorOnMissing: true,
        },
        // Копируем HTML из Gulp сборки
        {
          from: "dist-gulp/views",
          to: "views",
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
};

// Конфигурация для разработки
const developmentConfig = {
  mode: "development",
  devtool: "source-map",
  devServer: {
    static: path.resolve(__dirname, "dist-webpack"),
    hot: true,
    port: 8080,
    open: true,
  },
};

// Конфигурация для продакшена
const productionConfig = {
  mode: "production",
  devtool: false,
  optimization: {
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          format: {
            comments: false,
          },
        },
      }),
    ],
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          name: "vendors",
          test: /[\\/]node_modules[\\/]/,
          chunks: "all",
        },
      },
    },
  },
};

// Экспорт итоговой конфигурации в зависимости от режима
export default (env, argv) => {
  const isProduction = argv.mode === "production";
  const config = isProduction ? productionConfig : developmentConfig;

  return merge(commonConfig, config);
};
