/**
 * Tests for DigitalCredentials class
 *
 * Tests the WalletCompanion.DigitalCredentials API for registering
 * JWT verification callbacks for OpenID4VP JAR flows.
 */

import { DigitalCredentials } from '../../../../src/content/public-api/DigitalCredentials';

type JWTVerifier = (
	jwt: string,
	options?: Record<string, unknown>,
) => Promise<{ valid: boolean; error?: string; payload?: unknown }>;

describe('DigitalCredentials Class', () => {
	let dc: DigitalCredentials;

	beforeEach(() => {
		dc = new DigitalCredentials();
	});

	describe('registerJWTVerifier()', () => {
		it('should register a JWT verifier for a wallet', () => {
			const walletUrl = 'https://wallet.example.com';
			const verifier: JWTVerifier = async () => ({ valid: true });

			// Returns void
			dc.registerJWTVerifier(walletUrl, verifier);

			expect(dc.registeredJWTVerifiers).toContain(walletUrl);
		});

		it('should return void (not boolean)', () => {
			const walletUrl = 'https://wallet.example.com';
			const verifier: JWTVerifier = async () => ({ valid: true });

			const result = dc.registerJWTVerifier(walletUrl, verifier);

			expect(result).toBeUndefined();
		});

		it('should throw for non-function verifiers', () => {
			expect(() => {
				dc.registerJWTVerifier('https://wallet.example.com', 'not a function' as unknown as JWTVerifier);
			}).toThrow('JWT verifier must be a function');
		});

		it('should throw for invalid wallet URLs', () => {
			const verifier: JWTVerifier = async () => ({ valid: true });

			expect(() => {
				dc.registerJWTVerifier('not-a-url', verifier);
			}).toThrow('Invalid wallet URL');
		});

		it('should allow multiple wallets to register verifiers', () => {
			const wallet1 = 'https://wallet1.example.com';
			const wallet2 = 'https://wallet2.example.com';
			const verifier1: JWTVerifier = async () => ({ valid: true });
			const verifier2: JWTVerifier = async () => ({ valid: false });

			dc.registerJWTVerifier(wallet1, verifier1);
			dc.registerJWTVerifier(wallet2, verifier2);

			expect(dc.registeredJWTVerifiers).toHaveLength(2);
			expect(dc.registeredJWTVerifiers).toContain(wallet1);
			expect(dc.registeredJWTVerifiers).toContain(wallet2);
		});

		it('should replace existing verifier for same wallet', () => {
			const walletUrl = 'https://wallet.example.com';
			const verifier1: JWTVerifier = async () => ({ valid: true });
			const verifier2: JWTVerifier = async () => ({ valid: false });

			dc.registerJWTVerifier(walletUrl, verifier1);
			dc.registerJWTVerifier(walletUrl, verifier2);

			expect(dc.registeredJWTVerifiers).toHaveLength(1);
		});
	});

	describe('unregisterJWTVerifier()', () => {
		it('should unregister a JWT verifier', () => {
			const walletUrl = 'https://wallet.example.com';
			const verifier: JWTVerifier = async () => ({ valid: true });

			dc.registerJWTVerifier(walletUrl, verifier);
			const result = dc.unregisterJWTVerifier(walletUrl);

			expect(result).toBe(true);
			expect(dc.registeredJWTVerifiers).not.toContain(walletUrl);
		});

		it('should return false when unregistering non-existent verifier', () => {
			const result = dc.unregisterJWTVerifier('https://wallet.example.com');
			expect(result).toBe(false);
		});
	});

	describe('registeredJWTVerifiers property', () => {
		it('should return empty array when no verifiers registered', () => {
			expect(dc.registeredJWTVerifiers).toEqual([]);
		});

		it('should be a property (getter), not a method', () => {
			// Access as property without calling
			const verifiers = dc.registeredJWTVerifiers;
			expect(Array.isArray(verifiers)).toBe(true);
		});

		it('should return list of registered wallet URLs', () => {
			const wallet1 = 'https://wallet1.example.com';
			const wallet2 = 'https://wallet2.example.com';

			dc.registerJWTVerifier(wallet1, async () => ({ valid: true }));
			dc.registerJWTVerifier(wallet2, async () => ({ valid: true }));

			const verifiers = dc.registeredJWTVerifiers;

			expect(verifiers).toHaveLength(2);
			expect(verifiers).toContain(wallet1);
			expect(verifiers).toContain(wallet2);
		});

		it('should return readonly array', () => {
			dc.registerJWTVerifier('https://wallet.example.com', async () => ({ valid: true }));

			const verifiers = dc.registeredJWTVerifiers;

			// TypeScript enforces readonly, verify it's an array
			expect(Array.isArray(verifiers)).toBe(true);
		});
	});
});
