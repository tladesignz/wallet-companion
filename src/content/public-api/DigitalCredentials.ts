import type { DigitalCredentialsInterface } from '@content/types';

/**
 * @deprecated This API is not useful due to browser page isolation and will be removed.
 */
export class DigitalCredentials implements DigitalCredentialsInterface {
	/** @deprecated */
	registerJWTVerifier(_walletUrl: string, _verifyCallback: unknown): void {
		console.warn('DigitalCredentials.registerJWTVerifier is deprecated and non-functional');
	}

	/** @deprecated */
	unregisterJWTVerifier(_walletUrl: string): boolean {
		console.warn('DigitalCredentials.unregisterJWTVerifier is deprecated and non-functional');
		return false;
	}

	/** @deprecated */
	get registeredJWTVerifiers(): readonly string[] {
		return [];
	}
}
