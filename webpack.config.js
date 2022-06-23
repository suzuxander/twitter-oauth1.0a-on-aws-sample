const path = require('path');

module.exports = {
    watchOptions: {
        poll: true
    },
    mode: 'development',
    entry: {
        client: './app/client.ts',
        // test: './app/test.ts',
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: 'commonjs2',
    },
    module: {
        rules: [
            {
                test: /\.(ts|js)?$/,
                exclude: /node_modules/,
                use: ['ts-loader']
            },
        ]
    },
    plugins: [],
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        modules: [
            'node_modules',
            'app',
            'gen'
        ],
        alias: {
            gen: path.resolve(__dirname, './gen'),
            app: path.resolve(__dirname, './app')
        },
    },
    target: 'node'
};