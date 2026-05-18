import type { WalletCompanionInterface, WalletRegistrationResult } from '@content/types';
import {
	type WalletRegistrationInput,
	WalletRegistrationInputSchema,
} from '@shared/schemas/resources';
import { parse } from 'valibot';
import { DigitalCredentials } from './DigitalCredentials';

/**
 * Public API exposed to web pages when the WalletCompanion extension is installed.
 */
export class WalletCompanion implements WalletCompanionInterface {
	readonly DigitalCredentials = new DigitalCredentials();

	/** Cached protocols supported by registered wallets. */
	#supportedProtocols = new Set<string>();

	constructor() {
		this.#updateSupportedProtocols();
	}

	get version(): string {
		return import.meta.env.VITE_EXTENSION_VERSION;
	}

	get isInstalled(): boolean {
		return true;
	}

	get supportedProtocols(): readonly string[] {
		return Array.from(this.#supportedProtocols);
	}

	/** Fetches supported protocols from the extension. */
	#updateSupportedProtocols(): Promise<void> {
		return new Promise<void>((resolve) => {
			const updateId = `protocols-update-${Date.now()}`;

			const responseHandler = (event: Event) => {
				const { detail } = event as CustomEvent;
				if (detail.updateId === updateId) {
					window.removeEventListener('DC_PROTOCOLS_UPDATE_RESPONSE', responseHandler);
					if (detail.protocols) {
						this.#supportedProtocols = new Set(detail.protocols);
					}
					resolve();
				}
			};

			window.addEventListener('DC_PROTOCOLS_UPDATE_RESPONSE', responseHandler);

			window.dispatchEvent(
				new CustomEvent('DC_PROTOCOLS_UPDATE_REQUEST', {
					detail: { updateId },
				}),
			);

			setTimeout(() => {
				window.removeEventListener('DC_PROTOCOLS_UPDATE_RESPONSE', responseHandler);
				resolve();
			}, 1000);
		});
	}

	async registerWallet(walletInfo: WalletRegistrationInput): Promise<WalletRegistrationResult> {
		if (!walletInfo?.name || !walletInfo.url) {
			throw new Error('Wallet registration requires at least name and url');
		}

		if (
			!walletInfo.protocols ||
			!Array.isArray(walletInfo.protocols) ||
			walletInfo.protocols.length === 0
		) {
			throw new Error('Wallet registration requires at least one supported protocol');
		}

		// Validate URL
		try {
			new URL(walletInfo.url);
		} catch {
			throw new Error(`Invalid wallet URL: ${walletInfo.url}`);
		}

		// Validate protocol identifiers (must be ASCII lower alpha, digits, and hyphens)
		const protocolPattern = /^[a-z0-9-]+$/;
		for (const protocol of walletInfo.protocols) {
			if (!protocolPattern.test(protocol)) {
				throw new Error(
					`Invalid protocol identifier: ${protocol} (must contain only lowercase letters, digits, and hyphens)`,
				);
			}
		}

		const walletRegistration = parse(WalletRegistrationInputSchema, walletInfo);

		return new Promise((resolve, reject) => {
			const registrationId = `wallet-reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

			const responseHandler = (event: Event) => {
				const { detail } = event as CustomEvent;
				if (detail.registrationId === registrationId) {
					window.removeEventListener('DC_WALLET_REGISTRATION_RESPONSE', responseHandler);

					if (detail.success) {
						// Update protocol cache after successful registration
						this.#updateSupportedProtocols();
						resolve({
							success: true,
							alreadyRegistered: detail.alreadyRegistered,
							wallet: detail.wallet,
						});
					} else {
						reject(new Error(detail.error || 'Registration failed'));
					}
				}
			};

			window.addEventListener('DC_WALLET_REGISTRATION_RESPONSE', responseHandler);

			window.dispatchEvent(
				new CustomEvent('DC_WALLET_REGISTRATION_REQUEST', {
					detail: {
						registrationId,
						wallet: walletRegistration,
						registeredFrom: window.location.origin,
					},
				}),
			);

			// Timeout after 5 seconds
			setTimeout(() => {
				window.removeEventListener('DC_WALLET_REGISTRATION_RESPONSE', responseHandler);
				reject(new Error('Registration timeout'));
			}, 5000);
		});
	}

	async isWalletRegistered(url: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			const checkId = `wallet-check-${Date.now()}`;

			const responseHandler = (event: Event) => {
				const { detail } = event as CustomEvent<{ checkId: string; isRegistered: boolean }>;
				if (detail.checkId === checkId) {
					window.removeEventListener('DC_WALLET_CHECK_RESPONSE', responseHandler);
					resolve(detail.isRegistered);
				}
			};

			window.addEventListener('DC_WALLET_CHECK_RESPONSE', responseHandler);

			window.dispatchEvent(
				new CustomEvent('DC_WALLET_CHECK_REQUEST', {
					detail: {
						checkId,
						url,
					},
				}),
			);

			// Timeout after 5 seconds
			setTimeout(() => {
				window.removeEventListener('DC_WALLET_CHECK_RESPONSE', responseHandler);
				reject(new Error('Check timeout'));
			}, 5000);
		});
	}
}
