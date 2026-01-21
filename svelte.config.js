import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			// Edge functions for faster global response
			runtime: 'nodejs22.x',
			regions: ['sin1'], // Singapore for Thai users
			split: true, // Split functions for better cold start
		}),
		// Preload for faster navigation
		prerender: {
			handleHttpError: 'warn'
		}
	}
};

export default config;
