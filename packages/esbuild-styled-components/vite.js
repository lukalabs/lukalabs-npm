exports = module.exports = vitePlugin;

let createPlugin = require('./createPlugin');

function vitePlugin(config) {
  const {processFile, validatePath} = createPlugin(config);

  return {
    name: 'sc',
    transform(code, id, options) {
      if (!validatePath(id)) {return}
      const output = processFile(id, code);
      return {
        code: output
      };
    }
  }
}
