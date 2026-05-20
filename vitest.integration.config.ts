import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		setupFiles: ['./tests/setup.ts'],
		include: [
			'tests/integration.test.ts',
			'tests/wallet-integration.test.ts',
		],
		testTimeout: 30000, // Longer timeout for Puppeteer tests
		hookTimeout: 30000,
	},
});
