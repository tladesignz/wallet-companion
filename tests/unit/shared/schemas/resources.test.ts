/**
 * Tests for resource schemas
 *
 * Tests Valibot schema validation for wallet, options, and stats data.
 */

import { safeParse } from 'valibot';
import {
	OptionsSchema,
	UsageStatsSchema,
	WalletRegistrationInputSchema,
	WalletSchema,
	WalletsSchema,
} from '../../../../src/shared/schemas/resources';

describe('Resource Schemas', () => {
	describe('WalletRegistrationInputSchema', () => {
		it('should validate minimal valid input', () => {
			const input = {
				name: 'Test Wallet',
				url: 'https://wallet.example.com',
			};

			const result = safeParse(WalletRegistrationInputSchema, input);

			expect(result.success).toBe(true);
		});

		it('should validate input with all optional fields', () => {
			const input = {
				name: 'Test Wallet',
				url: 'https://wallet.example.com',
				icon: '🏦',
				logo: 'https://example.com/logo.png',
				description: 'A test wallet',
				color: '#ff0000',
				protocols: ['openid4vp'],
			};

			const result = safeParse(WalletRegistrationInputSchema, input);

			expect(result.success).toBe(true);
		});

		it('should reject missing name', () => {
			const input = {
				url: 'https://wallet.example.com',
			};

			const result = safeParse(WalletRegistrationInputSchema, input);

			expect(result.success).toBe(false);
		});

		it('should reject missing url', () => {
			const input = {
				name: 'Test Wallet',
			};

			const result = safeParse(WalletRegistrationInputSchema, input);

			expect(result.success).toBe(false);
		});

		it('should reject invalid url', () => {
			const input = {
				name: 'Test Wallet',
				url: 'not-a-valid-url',
			};

			const result = safeParse(WalletRegistrationInputSchema, input);

			expect(result.success).toBe(false);
		});

		it('should accept null/undefined optional fields', () => {
			const input = {
				name: 'Test Wallet',
				url: 'https://wallet.example.com',
				icon: null,
				description: undefined,
			};

			const result = safeParse(WalletRegistrationInputSchema, input);

			expect(result.success).toBe(true);
		});
	});

	describe('WalletSchema', () => {
		it('should validate minimal valid wallet', () => {
			const wallet = {
				id: 'wallet-123',
				name: 'Test Wallet',
				url: 'https://wallet.example.com',
				enabled: true,
			};

			const result = safeParse(WalletSchema, wallet);

			expect(result.success).toBe(true);
		});

		it('should validate wallet with all fields', () => {
			const wallet = {
				id: 'wallet-123',
				name: 'Test Wallet',
				url: 'https://wallet.example.com',
				icon: '🏦',
				description: 'A test wallet',
				color: '#ff0000',
				protocols: ['openid4vp', 'mdoc-openid4vp'],
				enabled: true,
				autoRegistered: true,
				registeredFrom: 'https://example.com',
				registeredAt: '2024-01-01T00:00:00Z',
				iconType: 'emoji',
			};

			const result = safeParse(WalletSchema, wallet);

			expect(result.success).toBe(true);
		});

		it('should reject missing id', () => {
			const wallet = {
				name: 'Test Wallet',
				url: 'https://wallet.example.com',
				enabled: true,
			};

			const result = safeParse(WalletSchema, wallet);

			expect(result.success).toBe(false);
		});

		it('should reject missing enabled', () => {
			const wallet = {
				id: 'wallet-123',
				name: 'Test Wallet',
				url: 'https://wallet.example.com',
			};

			const result = safeParse(WalletSchema, wallet);

			expect(result.success).toBe(false);
		});

		it('should reject invalid url', () => {
			const wallet = {
				id: 'wallet-123',
				name: 'Test Wallet',
				url: 'not-a-url',
				enabled: true,
			};

			const result = safeParse(WalletSchema, wallet);

			expect(result.success).toBe(false);
		});

		it('should reject non-boolean enabled', () => {
			const wallet = {
				id: 'wallet-123',
				name: 'Test Wallet',
				url: 'https://wallet.example.com',
				enabled: 'true', // string instead of boolean
			};

			const result = safeParse(WalletSchema, wallet);

			expect(result.success).toBe(false);
		});
	});

	describe('WalletsSchema', () => {
		it('should validate empty array', () => {
			const result = safeParse(WalletsSchema, []);

			expect(result.success).toBe(true);
		});

		it('should validate array of wallets', () => {
			const wallets = [
				{
					id: 'wallet-1',
					name: 'Wallet 1',
					url: 'https://wallet1.example.com',
					enabled: true,
				},
				{
					id: 'wallet-2',
					name: 'Wallet 2',
					url: 'https://wallet2.example.com',
					enabled: false,
				},
			];

			const result = safeParse(WalletsSchema, wallets);

			expect(result.success).toBe(true);
		});

		it('should reject if any wallet is invalid', () => {
			const wallets = [
				{
					id: 'wallet-1',
					name: 'Wallet 1',
					url: 'https://wallet1.example.com',
					enabled: true,
				},
				{
					id: 'wallet-2',
					name: 'Wallet 2',
					url: 'invalid-url',
					enabled: true,
				},
			];

			const result = safeParse(WalletsSchema, wallets);

			expect(result.success).toBe(false);
		});

		it('should reject non-array', () => {
			const result = safeParse(WalletsSchema, { wallet: 'test' });

			expect(result.success).toBe(false);
		});
	});

	describe('UsageStatsSchema', () => {
		it('should validate valid stats', () => {
			const stats = {
				interceptCount: 42,
				walletUses: {
					'wallet-1': 10,
					'wallet-2': 5,
				},
			};

			const result = safeParse(UsageStatsSchema, stats);

			expect(result.success).toBe(true);
		});

		it('should validate empty wallet uses', () => {
			const stats = {
				interceptCount: 0,
				walletUses: {},
			};

			const result = safeParse(UsageStatsSchema, stats);

			expect(result.success).toBe(true);
		});

		it('should reject missing interceptCount', () => {
			const stats = {
				walletUses: {},
			};

			const result = safeParse(UsageStatsSchema, stats);

			expect(result.success).toBe(false);
		});

		it('should reject missing walletUses', () => {
			const stats = {
				interceptCount: 10,
			};

			const result = safeParse(UsageStatsSchema, stats);

			expect(result.success).toBe(false);
		});

		it('should reject non-number interceptCount', () => {
			const stats = {
				interceptCount: '10',
				walletUses: {},
			};

			const result = safeParse(UsageStatsSchema, stats);

			expect(result.success).toBe(false);
		});

		it('should reject non-number values in walletUses', () => {
			const stats = {
				interceptCount: 10,
				walletUses: {
					'wallet-1': 'five',
				},
			};

			const result = safeParse(UsageStatsSchema, stats);

			expect(result.success).toBe(false);
		});
	});

	describe('OptionsSchema', () => {
		it('should validate valid options', () => {
			const options = {
				enabled: true,
				developerMode: false,
			};

			const result = safeParse(OptionsSchema, options);

			expect(result.success).toBe(true);
		});

		it('should reject missing enabled', () => {
			const options = {
				developerMode: false,
			};

			const result = safeParse(OptionsSchema, options);

			expect(result.success).toBe(false);
		});

		it('should reject missing developerMode', () => {
			const options = {
				enabled: true,
			};

			const result = safeParse(OptionsSchema, options);

			expect(result.success).toBe(false);
		});

		it('should reject non-boolean values', () => {
			const options = {
				enabled: 1,
				developerMode: 0,
			};

			const result = safeParse(OptionsSchema, options);

			expect(result.success).toBe(false);
		});
	});
});
