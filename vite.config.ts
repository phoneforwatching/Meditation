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
		https: {},
		allowedHosts: ['erna-colourational-suffusedly.ngrok-free.dev']
	},
	build: {
		rollupOptions: {
			external: ['pg-native', 'cloudflare:sockets']
		},
		// Build optimizations
		target: 'esnext',
		minify: 'esbuild',
		cssMinify: true,
		reportCompressedSize: false, // Faster builds
	},
	// Dependency optimization
	optimizeDeps: {
		include: ['clsx', 'tailwind-merge'],
		exclude: ['@sveltejs/kit']
	},
	// Enable caching for faster rebuilds
	cacheDir: 'node_modules/.vite'
});
