# esbuild-styled-components

It is like [Styled Components babel plugin](https://github.com/styled-components/babel-plugin-styled-components), but for [esbuild](https://esbuild.github.io/).

## Usage with Remix

(see [esbuild-inject-plugin](https://github.com/lukalabs/lukalabs-npm/projects/esbuild-inject-plugin/README.md) for how to setup a Remix project)

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
