import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
	site: 'https://azan.pages.dev',
	output: 'server',
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
	integrations: [
		(await import('@playform/compress')).default({
			CSS: false,
			HTML: {
				'html-minifier-terser': {
					quoteCharacter: `'`,
					removeAttributeQuotes: true,
					removeComments: false,
				},
			},
			Image: false,
			JavaScript: false,
			SVG: false,
		})
	]
});