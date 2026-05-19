/**
 * Tests for JWT Verification Callback System
 */

import { OpenID4VPPlugin } from '../src/content/protocols';
import type { JWTVerifier as PluginJWTVerifier } from '../src/content/protocols/plugins/types';

type JWTVerifier = (jwt: string, options?: Record<string, unknown>) => Promise<{ valid: boolean; error?: string; payload?: unknown }>;

describe('JWT Verification Callbacks', () => {
	let walletCallbacks: { jwtVerifiers: Map<string, JWTVerifier> };
	let DCWS: {
		registerJWTVerifier: (walletUrl: string, verifyCallback: JWTVerifier) => boolean;
		unregisterJWTVerifier: (walletUrl: string) => boolean;
		getRegisteredJWTVerifiers: () => string[];
	};

	beforeEach(() => {
		// Mock the wallet callbacks store
		walletCallbacks = {
			jwtVerifiers: new Map<string, JWTVerifier>(),
		};

		// Mock the DCWS API
		DCWS = {
			registerJWTVerifier: function (walletUrl: string, verifyCallback: JWTVerifier): boolean {
				if (typeof verifyCallback !== 'function') {
					throw new Error('JWT verifier must be a function');
				}

				try {
					new URL(walletUrl);
				} catch (_e) {
					throw new Error('Invalid wallet URL: ' + walletUrl);
				}

				walletCallbacks.jwtVerifiers.set(walletUrl, verifyCallback);
				return true;
			},

			unregisterJWTVerifier: function (walletUrl: string): boolean {
				return walletCallbacks.jwtVerifiers.delete(walletUrl);
			},

			getRegisteredJWTVerifiers: function (): string[] {
				return Array.from(walletCallbacks.jwtVerifiers.keys());
			},
		};
	});

	describe('registerJWTVerifier', () => {
		it('should register a JWT verifier for a wallet', () => {
			const walletUrl = 'https://wallet.example.com';
			const verifier: JWTVerifier = async (_jwt, _options) => ({ valid: true });

			const result = DCWS.registerJWTVerifier(walletUrl, verifier);

			expect(result).toBe(true);
			expect(walletCallbacks.jwtVerifiers.has(walletUrl)).toBe(true);
			expect(walletCallbacks.jwtVerifiers.get(walletUrl)).toBe(verifier);
		});

		it('should reject non-function verifiers', () => {
			expect(() => {
				DCWS.registerJWTVerifier('https://wallet.example.com', 'not a function' as unknown as JWTVerifier);
			}).toThrow('JWT verifier must be a function');
		});

		it('should reject invalid wallet URLs', () => {
			const verifier: JWTVerifier = async (_jwt) => ({ valid: true });

			expect(() => {
				DCWS.registerJWTVerifier('not-a-url', verifier);
			}).toThrow('Invalid wallet URL');
		});

		it('should allow multiple wallets to register verifiers', () => {
			const wallet1 = 'https://wallet1.example.com';
			const wallet2 = 'https://wallet2.example.com';
			const verifier1: JWTVerifier = async () => ({ valid: true });
			const verifier2: JWTVerifier = async () => ({ valid: false });

			DCWS.registerJWTVerifier(wallet1, verifier1);
			DCWS.registerJWTVerifier(wallet2, verifier2);

			expect(walletCallbacks.jwtVerifiers.size).toBe(2);
			expect(walletCallbacks.jwtVerifiers.get(wallet1)).toBe(verifier1);
			expect(walletCallbacks.jwtVerifiers.get(wallet2)).toBe(verifier2);
		});

		it('should replace existing verifier for same wallet', () => {
			const walletUrl = 'https://wallet.example.com';
			const verifier1: JWTVerifier = async () => ({ valid: true });
			const verifier2: JWTVerifier = async () => ({ valid: false });

			DCWS.registerJWTVerifier(walletUrl, verifier1);
			DCWS.registerJWTVerifier(walletUrl, verifier2);

			expect(walletCallbacks.jwtVerifiers.size).toBe(1);
			expect(walletCallbacks.jwtVerifiers.get(walletUrl)).toBe(verifier2);
		});
	});

	describe('unregisterJWTVerifier', () => {
		it('should unregister a JWT verifier', () => {
			const walletUrl = 'https://wallet.example.com';
			const verifier: JWTVerifier = async () => ({ valid: true });

			DCWS.registerJWTVerifier(walletUrl, verifier);
			const result = DCWS.unregisterJWTVerifier(walletUrl);

			expect(result).toBe(true);
			expect(walletCallbacks.jwtVerifiers.has(walletUrl)).toBe(false);
		});

		it('should return false when unregistering non-existent verifier', () => {
			const result = DCWS.unregisterJWTVerifier('https://wallet.example.com');
			expect(result).toBe(false);
		});
	});

	describe('getRegisteredJWTVerifiers', () => {
		it('should return empty array when no verifiers registered', () => {
			const verifiers = DCWS.getRegisteredJWTVerifiers();
			expect(verifiers).toEqual([]);
		});

		it('should return list of registered wallet URLs', () => {
			const wallet1 = 'https://wallet1.example.com';
			const wallet2 = 'https://wallet2.example.com';

			DCWS.registerJWTVerifier(wallet1, async () => ({ valid: true }));
			DCWS.registerJWTVerifier(wallet2, async () => ({ valid: true }));

			const verifiers = DCWS.getRegisteredJWTVerifiers();

			expect(verifiers).toHaveLength(2);
			expect(verifiers).toContain(wallet1);
			expect(verifiers).toContain(wallet2);
		});
	});
});

describe('OpenID4VPPlugin - JWT Verification Integration', () => {
	let plugin: OpenID4VPPlugin;

	beforeEach(() => {
		plugin = new OpenID4VPPlugin();
	});

	describe('verifyJWT', () => {
		it('should verify JWT using wallet verifier', async () => {
			const jwt = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiIxMjM0In0.signature';
			const verifier: JWTVerifier = async (_jwt, _options) => ({
				valid: true,
			});

			const result = await plugin.verifyJWT(jwt, verifier);

			expect(result.valid).toBe(true);
		});

		it('should handle verification failure', async () => {
			const jwt = 'invalid.jwt.token';
			const verifier: JWTVerifier = async (_jwt, _options) => ({
				valid: false,
				error: 'Invalid signature',
			});

			const result = await plugin.verifyJWT(jwt, verifier);

			expect(result.valid).toBe(false);
			if (!result.valid) {
				expect(result.error).toBe('Invalid signature');
			}
		});

		it('should reject non-function verifiers', async () => {
			const jwt = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiIxMjM0In0.signature';

			await expect(plugin.verifyJWT(jwt, 'not a function' as unknown as PluginJWTVerifier)).rejects.toThrow(
				'Verifier must be a function',
			);
		});

		it('should handle verifier that throws error', async () => {
			const jwt = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiIxMjM0In0.signature';
			const verifier: JWTVerifier = async () => {
				throw new Error('Crypto error');
			};

			const result = await plugin.verifyJWT(jwt, verifier);

			expect(result.valid).toBe(false);
			if (!result.valid) {
				expect(result.error).toBe('Crypto error');
			}
		});

		it('should validate verifier return value structure', async () => {
			const jwt = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiIxMjM0In0.signature';
			const verifier = async () => 'invalid return'; // Returns string instead of object

			const result = await plugin.verifyJWT(jwt, verifier as unknown as PluginJWTVerifier);

			expect(result.valid).toBe(false);
			if (!result.valid) {
				expect(result.error).toContain('must return an object');
			}
		});

		it('should validate verifier includes valid property', async () => {
			const jwt = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiIxMjM0In0.signature';
			const verifier = async () => ({ payload: {} }); // Missing 'valid' property

			const result = await plugin.verifyJWT(jwt, verifier as unknown as PluginJWTVerifier);

			expect(result.valid).toBe(false);
			if (!result.valid) {
				expect(result.error).toContain('must include "valid" property');
			}
		});

		it('should pass options to verifier', async () => {
			const jwt = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiIxMjM0In0.signature';
			let receivedOptions: Record<string, unknown> | undefined;

			const verifier: JWTVerifier = async (_jwt, options) => {
				receivedOptions = options;
				return { valid: true };
			};

			const testOptions = {
				certificate: 'MIICert...',
				algorithm: 'ES256',
				kid: 'key-1',
			};

			await plugin.verifyJWT(jwt, verifier as unknown as PluginJWTVerifier, testOptions);

			expect(receivedOptions).toEqual(testOptions);
		});
	});

	describe('handleRequestUri with JWT verification', () => {
		beforeEach(() => {
			// Mock fetch
			globalThis.fetch = vi.fn();
		});

		afterEach(() => {
			delete (globalThis as { fetch?: unknown }).fetch;
		});

		it('should verify JWT when verifier is provided', async () => {
			const mockJWT =
				'eyJ0eXAiOiJvYXV0aC1hdXRoei1yZXErand0IiwiYWxnIjoiRVMyNTYiLCJ4NWMiOlsiTUlJQ2VydCJdfQ.eyJjbGllbnRfaWQiOiJodHRwczovL3ZlcmlmaWVyLmV4YW1wbGUuY29tIiwibm9uY2UiOiIxMjMifQ.signature';

			(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
				ok: true,
				text: async () => mockJWT,
			});

			let verifierCalled = false;
			const verifier: JWTVerifier = async (jwt, options) => {
				verifierCalled = true;
				expect(jwt).toBe(mockJWT);
				expect((options as { certificate?: string }).certificate).toBe('MIICert');
				expect((options as { algorithm?: string }).algorithm).toBe('ES256');
				return { valid: true };
			};

			const result = await plugin.handleRequestUri('https://verifier.example.com/request', {
				jwtVerifier: verifier as unknown as PluginJWTVerifier,
			});

			expect(verifierCalled).toBe(true);
			expect(result.verified).toBe(true);
			expect(result.payload.client_id).toBe('https://verifier.example.com');
		});

		it('should throw error if verification fails', async () => {
			const mockJWT =
				'eyJ0eXAiOiJvYXV0aC1hdXRoei1yZXErand0IiwiYWxnIjoiRVMyNTYifQ.eyJjbGllbnRfaWQiOiJ0ZXN0In0.sig';

			(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
				ok: true,
				text: async () => mockJWT,
			});

			const verifier: JWTVerifier = async () => ({
				valid: false,
				error: 'Invalid signature',
			});

			await expect(
				plugin.handleRequestUri('https://verifier.example.com/request', { jwtVerifier: verifier as unknown as PluginJWTVerifier }),
			).rejects.toThrow('JWT signature verification failed: Invalid signature');
		});

		it('should skip verification if no verifier provided', async () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mockJWT =
				'eyJ0eXAiOiJvYXV0aC1hdXRoei1yZXErand0IiwiYWxnIjoiRVMyNTYifQ.eyJjbGllbnRfaWQiOiJ0ZXN0In0.sig';

			(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
				ok: true,
				text: async () => mockJWT,
			});

			const result = await plugin.handleRequestUri('https://verifier.example.com/request');

			expect(result.verified).toBe(false);
			expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('JWT signature verification skipped'));

			consoleSpy.mockRestore();
		});

		it('should extract certificate from x5c header', async () => {
			const mockJWT =
				'eyJ0eXAiOiJvYXV0aC1hdXRoei1yZXErand0IiwiYWxnIjoiRVMyNTYiLCJ4NWMiOlsiQ2VydDEiLCJDZXJ0MiJdfQ.eyJub25jZSI6IjEyMyJ9.sig';

			(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
				ok: true,
				text: async () => mockJWT,
			});

			const verifier: JWTVerifier = async (_jwt, options) => {
				expect((options as { certificate?: string }).certificate).toBe('Cert1'); // First cert in chain
				return { valid: true };
			};

			await plugin.handleRequestUri('https://verifier.example.com/request', {
				jwtVerifier: verifier as unknown as PluginJWTVerifier,
			});
		});

		it('should handle verifier throwing error', async () => {
			const mockJWT = 'eyJ0eXAiOiJvYXV0aC1hdXRoei1yZXErand0IiwiYWxnIjoiRVMyNTYifQ.eyJub25jZSI6IjEyMyJ9.sig';

			(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
				ok: true,
				text: async () => mockJWT,
			});

			const verifier: JWTVerifier = async () => {
				throw new Error('Verification failed');
			};

			await expect(
				plugin.handleRequestUri('https://verifier.example.com/request', { jwtVerifier: verifier as unknown as PluginJWTVerifier }),
			).rejects.toThrow('JWT verification error: Verification failed');
		});
	});
});

export {};
