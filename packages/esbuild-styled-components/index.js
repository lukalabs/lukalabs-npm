let path = require('path');
let fs = require('fs');
let Parser = require('tree-sitter');
let TSX = require('tree-sitter-typescript').tsx;
let traverseAndPrint = require('./traverseAndPrint');

const parser = new Parser();
parser.setLanguage(TSX);

let styledComponentsPlugin = (config) => {
  let {
    scMatch = 'styled-components',
    filter = '(.jsx|.js|.tsx|.ts)$',
    exclude = '/node_modules/',
    ssr = true,
    displayName = true,
    fileName = true,
    meaninglessFileNames = ['index']
  } = config || {};
  let opts = { ssr, displayName, fileName, meaninglessFileNames };
  let scMatchRe = new RegExp(scMatch);
  let filterRe = new RegExp(filter);
  let excludeRe = new RegExp(exclude);

  return {
    name: 'sc',
    setup(build) {
      build.onLoad({ filter: filterRe }, async (args) => {
        if (args.path[0] !== '/' || excludeRe.test(args.path)) {
          return;
        }

        let source;

        try {
          source = await fs.promises.readFile(args.path, 'utf8');
        } catch (e) {
          console.error(e);
          return;
        }

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
          path: args.path,
          source: source          
        });

        return {
          contents: output,
          resolveDir: path.dirname(args.path),
          loader: 'tsx',
        };
      });
    },
  };
};

exports.default = styledComponentsPlugin;
