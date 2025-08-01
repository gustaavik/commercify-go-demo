import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Use Node.js adapter for better Docker compatibility
		adapter: adapter(),

		// CSRF configuration
		csrf: {
			// Allow origin mismatch in development
			checkOrigin: process.env.NODE_ENV === 'production'
		}
	}
};

export default config;
