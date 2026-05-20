/**
 * Integration tests - Content Script Injection
 *
 * Tests that the extension's content script properly injects the WalletCompanion
 * API into web pages. Uses Puppeteer with a real browser and the built extension.
 *
 * SCOPE: These tests verify content script injection and client-side API behavior.
 * They do NOT test background service worker communication (Puppeteer MV3 limitation).
 */

import { launch, type Browser, type Page } from 'puppeteer';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { startTestServer, type TestServer } from '../support/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');
const EXTENSION_PATH = join(PROJECT_ROOT, 'dist', 'chrome');

describe('Content Script Injection', () => {
	let browser: Browser;
	let page: Page;
	let testServer: TestServer;

	beforeAll(async () => {
		if (!existsSync(EXTENSION_PATH)) {
			throw new Error('Extension not built. Run "make build-chrome" first.');
		}

		testServer = await startTestServer(PROJECT_ROOT);

		browser = await launch({
			headless: false,
			slowMo: 50,
			args: [
				`--disable-extensions-except=${EXTENSION_PATH}`,
				`--load-extension=${EXTENSION_PATH}`,
				'--no-sandbox',
			],
		});

		const pages = await browser.pages();
		page = pages[0] || await browser.newPage();

		// Wait for extension service worker to start
		let ready = false;
		for (let i = 0; i < 20 && !ready; i++) {
			await new Promise(r => setTimeout(r, 200));
			const targets = await browser.targets();
			ready = targets.some(t => t.type() === 'service_worker' && t.url().includes('chrome-extension://'));
		}
	}, 30000);

	afterAll(async () => {
		await browser?.close();
		await testServer?.close();
	});

	beforeEach(async () => {
		await page.goto(`${testServer.url}/test-wallet-api.html`, { waitUntil: 'domcontentloaded' });
		await page.waitForFunction(
			() => typeof (window as any).WalletCompanion !== 'undefined',
			{ timeout: 5000 }
		);
	});

	test('injects WalletCompanion API into page', async () => {
		const hasAPI = await page.evaluate(() => {
			return typeof (window as any).WalletCompanion === 'object';
		});
		expect(hasAPI).toBe(true);
	});

	test('WalletCompanion.isInstalled is true', async () => {
		const isInstalled = await page.evaluate(() => {
			return (window as any).WalletCompanion?.isInstalled;
		});
		expect(isInstalled).toBe(true);
	});

	test('exposes expected API methods', async () => {
		const api = await page.evaluate(() => {
			const wc = (window as any).WalletCompanion;
			return {
				registerWallet: typeof wc?.registerWallet,
				isWalletRegistered: typeof wc?.isWalletRegistered,
				version: typeof wc?.version,
				supportedProtocols: Array.isArray(wc?.supportedProtocols),
				DigitalCredentials: typeof wc?.DigitalCredentials,
			};
		});

		expect(api.registerWallet).toBe('function');
		expect(api.isWalletRegistered).toBe('function');
		expect(api.version).toBe('string');
		expect(api.supportedProtocols).toBe(true);
		expect(api.DigitalCredentials).toBe('object');
	});

	test('exposes DigitalCredentials sub-API', async () => {
		const dcApi = await page.evaluate(() => {
			const dc = (window as any).WalletCompanion?.DigitalCredentials;
			return {
				registerJWTVerifier: typeof dc?.registerJWTVerifier,
				unregisterJWTVerifier: typeof dc?.unregisterJWTVerifier,
			};
		});

		expect(dcApi.registerJWTVerifier).toBe('function');
		expect(dcApi.unregisterJWTVerifier).toBe('function');
	});
});

describe('Client-Side Input Validation', () => {
	let browser: Browser;
	let page: Page;
	let testServer: TestServer;

	beforeAll(async () => {
		if (!existsSync(EXTENSION_PATH)) {
			throw new Error('Extension not built. Run "make build-chrome" first.');
		}

		testServer = await startTestServer(PROJECT_ROOT);

		browser = await launch({
			headless: false,
			slowMo: 50,
			args: [
				`--disable-extensions-except=${EXTENSION_PATH}`,
				`--load-extension=${EXTENSION_PATH}`,
				'--no-sandbox',
			],
		});

		const pages = await browser.pages();
		page = pages[0] || await browser.newPage();

		// Wait for extension
		for (let i = 0; i < 20; i++) {
			await new Promise(r => setTimeout(r, 200));
			const targets = await browser.targets();
			if (targets.some(t => t.type() === 'service_worker' && t.url().includes('chrome-extension://'))) break;
		}
	}, 30000);

	afterAll(async () => {
		await browser?.close();
		await testServer?.close();
	});

	beforeEach(async () => {
		await page.goto(`${testServer.url}/test-wallet-api.html`, { waitUntil: 'domcontentloaded' });
		await page.waitForFunction(
			() => typeof (window as any).WalletCompanion !== 'undefined',
			{ timeout: 5000 }
		);
	});

	test('rejects registerWallet without name', async () => {
		const error = await page.evaluate(async () => {
			try {
				await (window as any).WalletCompanion.registerWallet({ url: 'https://test.com', protocols: ['openid4vp'] });
				return null;
			} catch (e: any) {
				return e.message;
			}
		});

		expect(error).toContain('name');
	});

	test('rejects registerWallet without url', async () => {
		const error = await page.evaluate(async () => {
			try {
				await (window as any).WalletCompanion.registerWallet({ name: 'Test', protocols: ['openid4vp'] });
				return null;
			} catch (e: any) {
				return e.message;
			}
		});

		expect(error).toContain('url');
	});

	test('rejects registerWallet without protocols', async () => {
		const error = await page.evaluate(async () => {
			try {
				await (window as any).WalletCompanion.registerWallet({ name: 'Test', url: 'https://test.com' });
				return null;
			} catch (e: any) {
				return e.message;
			}
		});

		expect(error).toContain('protocol');
	});

	test('rejects registerWallet with empty protocols array', async () => {
		const error = await page.evaluate(async () => {
			try {
				await (window as any).WalletCompanion.registerWallet({ name: 'Test', url: 'https://test.com', protocols: [] });
				return null;
			} catch (e: any) {
				return e.message;
			}
		});

		expect(error).toContain('protocol');
	});

	test('rejects registerWallet with invalid protocol format', async () => {
		const error = await page.evaluate(async () => {
			try {
				await (window as any).WalletCompanion.registerWallet({
					name: 'Test',
					url: 'https://test.com',
					protocols: ['invalid protocol with spaces!'],
				});
				return null;
			} catch (e: any) {
				return e.message;
			}
		});

		expect(error).toBeTruthy();
	});
});
