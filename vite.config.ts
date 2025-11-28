import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5174,
		allowedHosts: ['erna-colourational-suffusedly.ngrok-free.dev']
	},
	build: {
		rollupOptions: {
			external: ['pg-native', 'cloudflare:sockets']
		}
	}
});
