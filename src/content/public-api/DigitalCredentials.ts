import type { DigitalCredentialsInterface, JWTVerifierCallback } from '@content/types';

/**
 * Public API to manage JWT verification callbacks for OpenID4VP JAR flows.
 *
 * Access via `window.WalletCompanion.DigitalCredentials`.
 *
 * Verifiers are page-session scoped — they persist only for the lifetime
 * of the current page and are not communicated to the extension background.
 */
export class DigitalCredentials implements DigitalCredentialsInterface {
	/** Maps wallet URL → JWT verification callback. */
	#jwtVerifiers = new Map<string, JWTVerifierCallback>();

	registerJWTVerifier(walletUrl: string, verifyCallback: JWTVerifierCallback): void {
		if (typeof verifyCallback !== 'function') {
			throw new Error('JWT verifier must be a function');
		}

		// Validate wallet URL
		try {
			new URL(walletUrl);
		} catch {
			throw new Error(`Invalid wallet URL: ${walletUrl}`);
		}

		this.#jwtVerifiers.set(walletUrl, verifyCallback);
	}

	unregisterJWTVerifier(walletUrl: string): boolean {
		return this.#jwtVerifiers.delete(walletUrl);
	}

	get registeredJWTVerifiers(): readonly string[] {
		return Array.from(this.#jwtVerifiers.keys());
	}
}
