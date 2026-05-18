/**
 * Digital Credentials API-specific features.
 *
 * Access via `window.WalletCompanion.DigitalCredentials`.
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
	 * @throws {Error} If walletUrl is invalid or verifyCallback is not a function
	 */
	registerJWTVerifier(walletUrl: string, verifyCallback: JWTVerifierCallback): void;

	/**
	 * Remove a JWT verifier for a wallet.
	 *
	 * @returns `true` if a verifier was removed
	 */
	unregisterJWTVerifier(walletUrl: string): boolean;

	/**
	 * Wallet URLs with active JWT verifiers in this page session.
	 */
	readonly registeredJWTVerifiers: readonly string[];
}

/**
 * Cryptographic context for JWT verification, extracted from the JOSE header.
 */
export interface JWTVerificationOptions {
	/**
	 * Base64-encoded X.509 certificate from the `x5c` header.
	 */
	certificate?: string;

	/**
	 * Signing algorithm from the `alg` header (e.g., `'ES256'`, `'RS256'`).
	 */
	algorithm?: string;

	/**
	 * Key identifier from the `kid` header for JWKS lookup.
	 */
	kid?: string;
}

/**
 * Result from a JWT verification callback.
 */
export interface JWTVerificationResult {
	/**
	 * `true` if signature verification succeeded.
	 */
	valid: boolean;

	/**
	 * Decoded JWT payload on success. Avoids re-parsing the JWT.
	 */
	payload?: Record<string, unknown>;

	/**
	 * Error description on failure (e.g., `'Certificate expired'`).
	 */
	error?: string;
}

/**
 * JWT verification callback signature.
 *
 * @param jwt - Complete JWT string (`header.payload.signature`)
 * @param options - Cryptographic context from the JWT header
 */
export type JWTVerifierCallback = (
	jwt: string,
	options: JWTVerificationOptions,
) => Promise<JWTVerificationResult>;
