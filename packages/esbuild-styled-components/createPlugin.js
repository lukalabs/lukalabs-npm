exports = module.exports = createPlugin;

let Parser = require('tree-sitter');
let TSX = require('tree-sitter-typescript').tsx;
let traverseAndPrint = require('./traverseAndPrint');

const parser = new Parser();
parser.setLanguage(TSX);

function createPlugin(config) {
  let {
    scMatch = 'styled-components',
    filter = '(.jsx|.js|.tsx|.ts)$',
    exclude = '/node_modules/',
    ssr = true,
    displayName = true,
    fileName = true,
    meaninglessFileNames = ['index'],
    namespace = ''
  } = config || {};
  let opts = { ssr, displayName, fileName, meaninglessFileNames, namespace };
  let scMatchRe = new RegExp(scMatch);
  let filterRe = new RegExp(filter);
  let excludeRe = new RegExp(exclude);

  return {
    validatePath(filePath) {
      return filePath[0] === '/' && !excludeRe.test(filePath);
    },
    processFile(filePath, source) {
      if (!scMatchRe.test(source)) {
        return;
      }

      let ast;

      try {
        ast = parser.parse(source);
      } catch(e) {
        console.error(e);
        return;
      }

      output = traverseAndPrint(ast.walk(), {
        ...opts,
        path: filePath,
        source: source
      });

      return output;
    }
  };
}
