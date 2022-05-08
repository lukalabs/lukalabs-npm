# esbuild-styled-components

It is like [Styled Components babel plugin](https://github.com/styled-components/babel-plugin-styled-components), but for [esbuild](https://esbuild.github.io/).

## Install

```sh
npm install -D @lukalabs/esbuild-styled-components
# or
yarn add -D @lukalabs/esbuild-styled-components
```

## Usage with Remix

(see [esbuild-inject-plugin](https://github.com/lukalabs/lukalabs-npm/tree/main/packages/esbuild-inject-plugin/README.md) for how to setup a Remix project)

**esbuild-plugins.js**
```js
const styledComponentsPlugin = require('@lukalabs/esbuild-styled-components').default;

exports.plugins = function(plugins) {
  return [styledComponentsPlugin(/* options */), ...plugins];
}
```

### Plugin options

```js
const options = {
  // Regular expression to match current file contents
  // (only process files with "styled-components" in it)
  scMatch = 'styled-components',
  // Regular expression to match current file name
  filter = '(.jsx|.js|.tsx|.ts)$',
  // Regular expression for files to exclude 
  exclude = '/node_modules/',

  // These options are same as in Babel plugin (see https://styled-components.com/docs/tooling#babel-plugin)
  ssr = true,
  displayName = true,
  fileName = true,
  meaninglessFileNames = ['index']  
};
```

## License

[MIT](https://github.com/lukalabs/lukalabs-npm/blob/main/LICENSE)

esbuild-styled-components uses these libraries:

- [tree-sitter](https://github.com/tree-sitter/tree-sitter) (MIT license)
- [tree-sitter-typescript](https://github.com/tree-sitter/tree-sitter-typescript) (MIT license)
