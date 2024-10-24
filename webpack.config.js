module.exports = {
    entry: "./dist/src/index.js",
    output: {
        filename: "index.min.js",
        path: __dirname + "/dist",
    },
    target: "node",
    module: {
        rules: [
            {
                test: /^node\:/,
                loader: "node-loader",
            },
        ],
    },
};