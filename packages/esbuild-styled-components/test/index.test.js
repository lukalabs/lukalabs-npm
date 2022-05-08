const path = require('path');
const Parser = require('tree-sitter');
const TSX = require('tree-sitter-typescript').tsx;
const create = require('babel-test').create;
const toMatchFile = require('jest-file-snapshot').toMatchFile;
const traverseAndPrint = require('../traverseAndPrint');

expect.extend({ toMatchFile })

const parser = new Parser();
parser.setLanguage(TSX);

const { fixtures } = create((code, options) => {
  let configpath = path.join(path.dirname(options.filename), 'config.js');
  let config = require(configpath);
  let ast = parser.parse(code);
  let opts = {
    ssr: true,
    displayName: true,
    fileName: true,
    meaninglessFileNames: ['index'],
    ...config,
    path: options.filename,
    source: code
  };

  try {
    return { code: traverseAndPrint(ast.walk(), opts) };
  } catch (e) {
    console.error(e);
  }
})

fixtures('esbuild-styled-components', path.join(__dirname, 'fixtures'))

// const styledExampleCode = `
// import styled from '../../macro'
// styled.div\`
//   background: \${p => (p.error ? 'red' : 'green')};
// \`
// `;

// const tests = {
//   'should work with styled': {
//     code: styledExampleCode,
//   },
// }

// Object.entries(tests).map(([name, conf]) => {
//   test('macro ' + name, () => {
//     let source = conf.code;
//     let ast = parser.parse(source);
//     let opts = {
//       source: source
//     };
//     let result = traverseAndPrint(ast.walk(), opts);

//     let separator = '\n\n      ↓ ↓ ↓ ↓ ↓ ↓\n\n'
//     let formattedOutput = [source, separator, result].join('')

//     expect(`\n${formattedOutput}\n`).toMatchSnapshot(name)
//   });
// });