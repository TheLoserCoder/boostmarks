const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const miniCss = require("mini-css-extract-plugin");
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');

const output_path =  path.join(__dirname, "/extension");

module.exports = (env) => {
  const options = {};
  let devServer = {};

  if(env.dev){
    options.mode = "development";
    options.devtool = "inline-source-map";
    options.optimization = {minimize: false};
    devServer.static = output_path;
    devServer.hot = true;
    devServer.port = 3000;
  }else{
    options.mode = "production";
    devServer = null;
  };
  
  const manifest_entry = env.dev ? "manifest.dev.json" : env.browser = "firefox" ? "manifest.firefox.json" : "manifest.chrome.json";
  
  return [
    //worker
    {
      ...options,
      entry: `./src/js/worker/worker_index.js`,
      devServer,
      output: {
        path: output_path,
        filename: "worker.js"
      },
      plugins: [
        new CopyPlugin({
          patterns: [
            {
              from:`./manifests/${manifest_entry}`,
              to: `${output_path}/manifest.json`
            },
            {
              from:`./src/html/index.html`,
              to: `${output_path}/index.html`
            },
            {
              from:`./src/icons/icon.png`,
              to: `${output_path}/icon.png`
            }
          ]
        }),
      ]
    },
    //content_script
    {
      ...options,
      entry: `./src/js/content_script/content_script.js`,
      output: {
        path: output_path,
        filename: "content_script.js"
      },
    },
    //popup
    {
      ...options,
      entry: `./src/js/front/front_index.js`,
      output: {
        path: output_path,
        filename: "front_index.js"
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
              loader: "babel-loader",
              options: {
                presets: ['@babel/preset-env', '@babel/preset-react'],
                plugins: ["@babel/plugin-transform-runtime"]
              }
            },
          }
        ]
      }
    },
    //styles
    {
      ...options,
      entry: "./src/styles/index.scss" ,
      output: {
        path: output_path,
      },
      module: {
        rules: [
          {
            test: /.(scss|css)$/,
            exclude: /node_modules/,
            use: [ {
                loader: miniCss.loader
              } 
              , "css-loader","sass-loader"],
          }
        ]
      },
      plugins: [
        new RemoveEmptyScriptsPlugin(),
        new miniCss({
           filename: 'index.css',
        }),
      ]
    }
  ]
}