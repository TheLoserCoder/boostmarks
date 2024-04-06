const path = require("path");

function handler(env)
{
    const options = {};
    if(env.dev){
      options.mode = "development";
      options.devtool = "inline-source-map";
      options.optimization = {minimize: false},
      options.devServer = {
        static: {
          directory: path.join(__dirname, 'web-ext')
        },
        devMiddleware:{
          writeToDisk: true
        }
      }
    }else{
      options.mode = "production";
    };

    return {
      ...options,
        entry: {
            'index': path.join(__dirname, '/src/index.tsx'),
            'worker' : path.join(__dirname, '/src/Worker/worker.ts')
            },
        output: {
            path: path.join(__dirname, '/web-ext'),
            filename: '[name].js'
            },
        module: {
            rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: [/node_modules/, /web-ext/],
            },
            ],
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
    }
}

module.exports = handler;