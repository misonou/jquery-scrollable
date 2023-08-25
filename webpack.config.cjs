const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const packageJSON = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

module.exports = {
    entry: {
        'jquery.scrollable': './index.js',
        'jquery.scrollable.min': './index.js',
    },
    mode: 'production',
    devtool: 'source-map',
    output: {
        path: path.join(process.cwd(), 'dist'),
        filename: '[name].js',
        library: 'jq-scrollable',
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    plugins: [
        new webpack.BannerPlugin({
            banner: `${packageJSON.name} v${packageJSON.version} | (c) ${packageJSON.author} | ${packageJSON.homepage}`
        }),
    ],
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                test: /\.min\.js$/i,
                extractComments: false,
                terserOptions: {
                    format: {
                        comments: 'some'
                    }
                }
            })
        ]
    },
    externals: {
        'jquery': 'jQuery'
    }
};
