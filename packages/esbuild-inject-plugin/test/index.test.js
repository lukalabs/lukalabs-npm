const createPatchedESBuild = require('../create-patched-esbuild');

const plugins = [
	{
		name: 'test-plugin',
		setup(build) {
			build.onResolve({ filter: /^<stdin>$/ }, (args) => {
        return { path: 'test.js', namespace: 'stdin' };
      });
			build.onLoad({ filter: /.*/, namespace: 'stdin' }, async (args) => {
				return {
					contents: '/*! PATCHED */',
					loader: 'js'
				};
			});
		}
	}
];

const patchedESBuild = createPatchedESBuild((p) => {
	return [...plugins, ...p];
});

const buildOptions = {
	entryPoints: ['<stdin>'],
	format: 'cjs',
	write: false,
	outdir: 'out'
};

test('build', async () => {
	let result = await patchedESBuild.build(buildOptions);

	expect(result.outputFiles[0].text).toMatch('/*! PATCHED */\n');
});

test('context', async () => {
	let ctx = await patchedESBuild.context(buildOptions);
	let result = await ctx.rebuild();

	expect(result.outputFiles[0].text).toMatch('/*! PATCHED */\n');

	ctx.dispose();
});