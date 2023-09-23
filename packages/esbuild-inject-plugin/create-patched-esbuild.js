const esbuild = require('esbuild');

function patchCommand(cmd, argIndex, plugins) {
  return function() {
    const args = Array.from(arguments);
    const options = args[argIndex];
    options.plugins = plugins(options.plugins || []);
    return cmd.apply(this, args);
  } 
}

module.exports = function(plugins) {
  return {
    ...esbuild,
    build: patchCommand(esbuild.build, 0, plugins),
    context: patchCommand(esbuild.context, 0, plugins),
  }
};
