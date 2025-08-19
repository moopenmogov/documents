/* eslint-disable no-undef */

const devCerts = require("office-addin-dev-certs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const fs = require("fs");
const path = require("path");

const urlDev = "https://localhost:3000/";
const urlProd = "https://www.contoso.com/"; // CHANGE THIS TO YOUR PRODUCTION DEPLOYMENT LOCATION

async function getHttpsOptions() {
  const httpsOptions = await devCerts.getHttpsServerOptions();
  return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
}

module.exports = async (env, options) => {
  const dev = options.mode === "development";
  const pick = (...p) => p.find((q) => fs.existsSync(q));
  const config = {
    devtool: "source-map",
    entry: {
      polyfill: ["core-js/stable", "regenerator-runtime/runtime"],
      taskpane: ["./src/taskpane/taskpane.js"],
      commands: "./src/commands/commands.js",
    },
    output: {
      clean: true,
    },
    resolve: {
      extensions: [".html", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.html$/,
          exclude: /node_modules/,
          use: "html-loader",
        },
        {
          test: /\.(png|jpg|jpeg|gif|ico)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[name][ext][query]",
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: "taskpane.html",
        // Serve the root taskpane.html so the add-in shows the intended page
        templateContent: () => fs.readFileSync(path.resolve(__dirname, "./taskpane.html"), "utf8"),
        inject: false,
      }),
      (() => {
        // Build CopyWebpackPlugin patterns dynamically, only including files that exist
        const patterns = [
          { from: "assets/*", to: "assets/[name][ext][query]" },
          { from: "state-matrix-client.js", to: "[name][ext]" },
          { from: "new-feature-banner.js", to: "[name][ext]" },
        ];

        const bannerJsonPath = pick(
          path.resolve(__dirname, "new-feature-banner-text.json"),
          path.resolve(__dirname, "src", "new-feature-banner-text.json"),
          path.resolve(__dirname, "scripts", "new-feature-banner-text.json")
        );
        if (bannerJsonPath) {
          patterns.push({ from: bannerJsonPath, to: "new-feature-banner-text.json" });
        }

        const approvalsJsonPath = pick(
          path.resolve(__dirname, "approvals-ui.json"),
          path.resolve(__dirname, "src", "approvals-ui.json")
        );
        if (approvalsJsonPath) {
          patterns.push({ from: approvalsJsonPath, to: "approvals-ui.json" });
        }

        patterns.push({
          from: "manifest*.xml",
          to: "[name]" + "[ext]",
          transform(content) {
            if (dev) {
              return content;
            } else {
              return content.toString().replace(new RegExp(urlDev, "g"), urlProd);
            }
          },
        });

        return new CopyWebpackPlugin({ patterns });
      })(),
      new HtmlWebpackPlugin({
        filename: "commands.html",
        templateContent: () => fs.readFileSync(path.resolve(__dirname, "./src/commands/commands.html"), "utf8"),
        chunks: ["polyfill", "commands"],
      }),
    ],
    devServer: {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      server: {
        type: "https",
        options: env.WEBPACK_BUILD || options.https !== undefined ? options.https : await getHttpsOptions(),
      },
      port: process.env.npm_package_config_dev_server_port || 3000,
    },
  };

  return config;
};
