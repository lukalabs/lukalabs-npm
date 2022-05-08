# esbuild-inject-plugin

This plugin patches `build` function of [esbuild](https://esbuild.github.io/) to include additional plugins provided via config.

Intended to be used in [Remix](https://remix.run) projects, which currently doesn’t support custom esbuild plugins.

## Install

```sh
npm install -D @lukalabs/esbuild-inject-plugin
# or
yarn add -D @lukalabs/esbuild-inject-plugin
```

## Usage with Remix

1. Replace `build` and `dev` scripts in your `package.json` (you can also use [binode](https://github.com/kentcdodds/binode) to make it work on Windows)

**package.json**
```diff
"scripts": {
-    "build": "remix build",
-    "dev": "remix dev",
+    "build": "node --require @lukalabs/esbuild-inject-plugin -- ./node_modules/.bin/remix build",
+    "dev": "node --require @lukalabs/esbuild-inject-plugin -- ./node_modules/.bin/remix dev",
}
```

2. Add `esbuild-plugins.js` to project’s root folder (or provide config path via `ESBUILD_INJECT_PLUGIN_CONFIG` environment variable)
([@lukalabs/esbuild-styled-components](https://github.com/lukalabs/lukalabs-npm/tree/main/packages/esbuild-styled-components) used here as an example)

**esbuild-plugins.js**
```js
const styledComponentsPlugin = require('@lukalabs/esbuild-styled-components').default;

exports.plugins = function(plugins) {
  return [styledComponentsPlugin(), ...plugins];
}
```

## License

[MIT](https://github.com/lukalabs/lukalabs-npm/blob/main/LICENSE)
