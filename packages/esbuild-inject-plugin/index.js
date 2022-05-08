// @see https://github.com/remix-run/remix/issues/1423#issuecomment-1028972479

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const Module = require('module');

const originalBuild = esbuild.build;

const CONFIG_FILE = process.env.ESBUILD_INJECT_PLUGIN_CONFIG || './esbuild-plugins.js';

function build(options) {
  if (fs.existsSync(CONFIG_FILE)) {
    const plugins = require(path.resolve(CONFIG_FILE)).plugins;
    return originalBuild({ ...options, plugins: plugins(options.plugins) });
  }
  return originalBuild(options);
}

const originalRequire = Module.prototype.require;

const ovverideBuild = { ...esbuild, build };

function overrideRequire(id) {
  if (id === 'esbuild') {
    return ovverideBuild;
  }
  return originalRequire.apply(this, arguments);
}

if (Module.prototype.require !== overrideRequire) {
  Module.prototype.require = overrideRequire;
}
