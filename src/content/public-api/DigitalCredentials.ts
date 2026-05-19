import type { DigitalCredentialsInterface } from '@content/types';
import type { JWTVerifier } from '../protocols/plugins/types';

/**
 * Public API to manage JWT verification callbacks for OpenID4VP JAR flows.
 *
 * Access via `window.WalletCompanion.DigitalCredentials`.
 *
 * Verifiers are page-session scoped — they persist only for the lifetime
 * of the current page and are not communicated to the extension background.
 *
 * @todo This API is currently broken due to browser page isolation. Verifiers
 * registered on the wallet page cannot be accessed from the RP page where
 * verification needs to happen. See issue for architectural discussion.
 */
export class DigitalCredentials implements DigitalCredentialsInterface {
	/** Maps wallet URL → JWT verification callback. */
	#jwtVerifiers = new Map<string, JWTVerifier>();

	/**
	 * @todo Broken: verifier registered here is not accessible from RP page context.
	 */
	registerJWTVerifier(walletUrl: string, verifyCallback: JWTVerifier): void {
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

	/**
	 * @todo Broken: see registerJWTVerifier.
	 */
	unregisterJWTVerifier(walletUrl: string): boolean {
		return this.#jwtVerifiers.delete(walletUrl);
	}

	/**
	 * @todo Broken: see registerJWTVerifier.
	 */
	get registeredJWTVerifiers(): readonly string[] {
		return Array.from(this.#jwtVerifiers.keys());
	}
}
