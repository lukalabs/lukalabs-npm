exports = module.exports = styledComponentsPlugin;

let path = require('path');
let fs = require('fs');
let createPlugin = require('./createPlugin');

let styledComponentsPlugin = (config) => {
  let {processFile, validatePath} = createPlugin(config);
  return {
    name: 'sc',
    setup(build) {
      build.onLoad({ filter: filterRe }, async (args) => {
        if (!validatePath(args.path)) {return}

        let source;

        try {
          source = await fs.promises.readFile(filePath, 'utf8');
        } catch (e) {
          console.error(e);
          return;
        }

        let output = await processFile(args.path);

        return output && {
          contents: output,
          resolveDir: path.dirname(args.path),
          loader: 'tsx',
        };
      });
    }
  };
};