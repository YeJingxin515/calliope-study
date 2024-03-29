const { override, fixBabelImports, addLessLoader, addWebpackAlias ,disableEsLint} = require('customize-cra');
const path = require("path");

module.exports = override(
    disableEsLint(),
    fixBabelImports('import', {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: true,
    }),
    addLessLoader({
        javascriptEnabled: true,
        modifyVars: {
            '@primary-color': '#F28B30'
        }
    }),
    addWebpackAlias({
        '@': path.resolve(__dirname, './src')
    }),
);