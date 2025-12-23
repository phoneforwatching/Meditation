import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
	plugins: [
		sveltekit(),
		basicSsl()
	],
	server: {
		port: 5174,
		https: true,
		allowedHosts: ['erna-colourational-suffusedly.ngrok-free.dev']
	},
	build: {
		rollupOptions: {
			external: ['pg-native', 'cloudflare:sockets']
		}
	}
});
