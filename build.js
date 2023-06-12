const ncc = require('@vercel/ncc');
const path = require('path');
const fs = require('fs');
ncc(path.resolve(__dirname, 'src/cli.ts'), {
    cache: false, // default
    filterAssetBase: './src', // default
    minify: false, // default
    sourceMap: false, // default
    assetBuilds: false, // default
    sourceMapRegister: true, // default
    watch: false, // default
    license: '', // default does not generate a license file
    target: 'es2015', // default
    v8cache: false, // default
    quiet: false, // default
    debugLog: false // default
  }).then(({ code, map, assets }) => {
    if(!fs.existsSync('./dist')) {
        fs.mkdirSync('./dist');
    }
    fs.writeFileSync('./dist/cli.js', code);
    Object.keys(assets).forEach((filename) => {
        fs.writeFileSync(path.join('./dist', filename), assets[filename].source);
    });
  })