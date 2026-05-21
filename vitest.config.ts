import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'@shared': resolve(__dirname, './src/shared'),
			'@background': resolve(__dirname, './src/background'),
			'@content': resolve(__dirname, './src/content'),
			'@ui': resolve(__dirname, './src/ui'),
		},
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./tests/setup.ts'],
		include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.spec.ts'],
		exclude: [
			'**/node_modules/**',
		],
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.test.ts'],
			reporter: ['text', 'lcov', 'html'],
			reportsDirectory: 'coverage',
		},
	},
});
