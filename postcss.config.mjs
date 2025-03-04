import postcssFluidStyle from 'postcss-fluid-style';
import cssnano from 'cssnano';
import postcssLightning from 'postcss-lightningcss';

/** @type {Array<import('postcss-load-config').ConfigPlugin>} */
export const pluginsBase = [
	postcssFluidStyle(),
];

/** @type {Array<import('postcss-load-config').ConfigPlugin>} */
export const pluginsMinify = [
	cssnano({
		preset: ['default', {
			cssDeclarationSorter: false,
		}]
	}),
	postcssLightning()
];


/** @type {import('postcss-load-config').Config} */
export const postcssConfig = {
	plugins: [
		...pluginsBase,
		...pluginsMinify,
	],
};

export default postcssConfig;
