// @see https://github.com/remix-run/remix/issues/1423#issuecomment-1028972479

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const Module = require('module');
const createPatchedESBuild = require('./create-patched-esbuild');

const CONFIG_FILE = process.env.ESBUILD_INJECT_PLUGIN_CONFIG || './esbuild-plugins.js';

const originalRequire = Module.prototype.require;

const patchedESBuild = createPatchedESBuild(
  require(path.resolve(CONFIG_FILE)).plugins
);

function overrideRequire(id) {
  if (id === 'esbuild') {
    return patchedESBuild;
  }
  return originalRequire.apply(this, arguments);
}

if (fs.existsSync(CONFIG_FILE)) {
  if (Module.prototype.require !== overrideRequire) {
    Module.prototype.require = overrideRequire;
  }
}
