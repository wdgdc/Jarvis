import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import pkg from './package.json';

const globals = {
	'jquery': 'jQuery',
	'lodash': 'lodash',
};

const banner = `/**
 * ${pkg.name} - ${pkg.description}
 * @version v${pkg.version}
 * @link ${pkg.homepage}
 * @license ${pkg.license}
 */

`;

const plugins = [
	commonjs(),
	babel(
		{
			babelHelpers: 'bundled',
			exclude: 'node_modules/**',
			presets: [
				[
					"@babel/preset-env",
					{
						"modules": false,
					},
				],
			],
		}
	),
];

export default [
	{
		input: 'js/jarvis.js',
		external: Object.keys(globals),
		plugins,
		output: [
			{
				file: 'dist/js/jarvis.js',
				format: 'iife',
				globals,
				name: 'Jarvis',
				banner,
				plugins: [terser()],
				sourcemap: true,
			}
		],
	},
	{
		input: 'js/jarvis-user-profile.js',
		external: Object.keys(globals),
		plugins,
		output: [
			{
				file: 'dist/js/jarvis-user-profile.js',
				format: 'iife',
				globals,
				name: 'Jarvis.UserProfile',
				plugins: [terser()],
				sourcemap: true,
				banner,
			}
		],
	},
];
