var nodeExternals = require('webpack-node-externals'); // Prevent webpack from bundling dependencies in node_modules like AWS, which is already included in lambda

module.exports = {
    entry: './src/index.js',
    target: 'node',
    exterrnals: [nodeExternals()],
    output: {
        libraryTarget: 'commonjs',
        filename: 'index.js',
        path: __dirname
    },
    module: {
        loaders: [
            {
                test: /.js?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['es2017', 'stage-2']
                }
            }
        ]
    },
    node: {
        console: true,
        fs: 'empty',
        net: 'empty',
        tls: 'empty'
    }
};