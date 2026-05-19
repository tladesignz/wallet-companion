import type { JWTVerifier } from '../../protocols/plugins/types';

/**
 * Digital Credentials API-specific features.
 *
 * Access via `window.WalletCompanion.DigitalCredentials`.
 *
 * @todo The JWT verifier methods are currently broken due to browser page isolation.
 * See issue for architectural discussion and potential solutions.
 */
export interface DigitalCredentialsInterface {
	/**
	 * Register a JWT verification callback for OpenID4VP JAR flows.
	 *
	 * The extension delegates JWT signature verification to wallets rather than
	 * bundling crypto libraries. Verifiers persist for the page session only.
	 *
	 * The callback must:
	 * - Never reject — return `{ valid: false, error: '...' }` on failure
	 * - Complete within 5 seconds
	 *
	 * @todo Broken: verifier registered on wallet page is not accessible from
	 * RP page where verification needs to happen due to page context isolation.
	 *
	 * @throws {Error} If walletUrl is invalid or verifyCallback is not a function
	 */
	registerJWTVerifier(walletUrl: string, verifyCallback: JWTVerifier): void;

	/**
	 * Remove a JWT verifier for a wallet.
	 *
	 * @todo Broken: see registerJWTVerifier.
	 *
	 * @returns `true` if a verifier was removed
	 */
	unregisterJWTVerifier(walletUrl: string): boolean;

	/**
	 * Wallet URLs with active JWT verifiers in this page session.
	 *
	 * @todo Broken: see registerJWTVerifier.
	 */
	readonly registeredJWTVerifiers: readonly string[];
}
