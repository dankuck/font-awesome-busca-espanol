const VueLoader = require('vue-loader');
const path = require('path');

module.exports = {
    devtool: 'source-map',
    entry: [
        './frontend/app.js'
    ],
    output: {
        filename: 'app.js',
        path: __dirname,
    },
    mode: 'development',
    resolve: {
        extensions: ['.vue', '.js'],
        alias: {
            '@': __dirname,
            vue$: path.resolve(__dirname, './node_modules/vue/dist/vue.esm.js'),
        },
    },
    plugins: [
        new VueLoader.VueLoaderPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
            {
                test: /\.css$/,
                loader: 'css-loader',
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                loader: 'file-loader'
            }
        ]
    }
};
