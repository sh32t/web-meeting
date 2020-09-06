const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        app: './src/tsx/app.tsx'
    },
    output: {
        filename: '[name]-bundle.js',
        path: path.join(__dirname, 'public/js')
    },
    module: {
        rules: [
            {
                test: /\.tsx$/,
                use: 'ts-loader'
            }
        ]
    },
    devtool: 'source-map',
    resolve: {
        extensions: [".js", ".tsx"],
        modules: [
            path.resolve('./src'),
            path.resolve('./node_modules')
        ]
    }
};