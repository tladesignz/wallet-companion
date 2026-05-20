/**
 * Unit tests for background/handlers.ts - handleMessage function
 *
 * Tests each message handler exported via handleMessage.
 */

import { handleMessage } from '../../../src/background/handlers';
import { InboundMessages } from '../../../src/shared/schemas/messages';

// Mock the storage module
vi.mock('../../../src/background/storage', () => ({
	Stores: {
		options: {
			getEnabled: vi.fn(),
			getDeveloperMode: vi.fn(),
			updateOptions: vi.fn(),
		},
		wallets: {
			getAll: vi.fn(),
			setAll: vi.fn(),
		},
		stats: {
			getStats: vi.fn(),
			setStats: vi.fn(),
		},
	},
}));

// Mock the runtime module
vi.mock('../../../src/shared/runtime', () => ({
	runtimeSendMessage: vi.fn(),
}));

// Import mocked stores after mocking
import { Stores } from '../../../src/background/storage';

// Use vi.mocked for proper typing
const mockStores = {
	options: {
		getEnabled: vi.mocked(Stores.options.getEnabled),
		getDeveloperMode: vi.mocked(Stores.options.getDeveloperMode),
		updateOptions: vi.mocked(Stores.options.updateOptions),
	},
	wallets: {
		getAll: vi.mocked(Stores.wallets.getAll),
		setAll: vi.mocked(Stores.wallets.setAll),
	},
	stats: {
		getStats: vi.mocked(Stores.stats.getStats),
		setStats: vi.mocked(Stores.stats.setStats),
	},
};

describe('handleMessage', () => {
	const mockSender = { tab: { id: 1 }, frameId: 0 };
	let sendResponse: (r: unknown) => void;

	beforeEach(() => {
		vi.clearAllMocks();
		sendResponse = vi.fn<(r: unknown) => void>();

		// Default mock implementations
		mockStores.options.getEnabled.mockResolvedValue(true);
		mockStores.options.getDeveloperMode.mockResolvedValue(false);
		mockStores.wallets.getAll.mockResolvedValue([]);
		mockStores.stats.getStats.mockResolvedValue({ interceptCount: 0, walletUses: {} });
	});

	describe('GET_WALLETS', () => {
		it('should return wallets from storage', async () => {
			const mockWallets = [
				{ id: 'w1', name: 'Wallet 1', url: 'https://w1.com', enabled: true },
				{ id: 'w2', name: 'Wallet 2', url: 'https://w2.com', enabled: false },
			];
			mockStores.wallets.getAll.mockResolvedValue(mockWallets);

			await handleMessage({ type: InboundMessages.GET_WALLETS }, mockSender, sendResponse);

			expect(mockStores.wallets.getAll).toHaveBeenCalled();
			expect(sendResponse).toHaveBeenCalledWith({ wallets: mockWallets });
		});

		it('should return empty array when no wallets configured', async () => {
			mockStores.wallets.getAll.mockResolvedValue([]);

			await handleMessage({ type: InboundMessages.GET_WALLETS }, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith({ wallets: [] });
		});

		it('should return error when storage fails', async () => {
			mockStores.wallets.getAll.mockRejectedValueOnce(new Error('Storage error'));

			await handleMessage({ type: InboundMessages.GET_WALLETS }, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});
	});

	describe('SAVE_WALLETS', () => {
		it('should save wallets to storage', async () => {
			const walletsToSave = [{ id: 'w1', name: 'New Wallet', url: 'https://new.com', enabled: true }];

			await handleMessage({ type: InboundMessages.SAVE_WALLETS, wallets: walletsToSave }, mockSender, sendResponse);

			expect(mockStores.wallets.setAll).toHaveBeenCalledWith(walletsToSave);
			expect(sendResponse).toHaveBeenCalledWith({ success: true });
		});

		it('should return error when storage fails', async () => {
			mockStores.wallets.setAll.mockRejectedValueOnce(new Error('Storage error'));

			await handleMessage(
				{ type: InboundMessages.SAVE_WALLETS, wallets: [{ id: 'w1', name: 'W', url: 'https://w.com', enabled: true }] },
				mockSender,
				sendResponse,
			);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});

		it('should return error when wallets field is missing', async () => {
			await handleMessage({ type: InboundMessages.SAVE_WALLETS } as unknown, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});
	});

	describe('GET_SETTINGS', () => {
		it('should return current settings', async () => {
			mockStores.options.getEnabled.mockResolvedValue(true);
			mockStores.options.getDeveloperMode.mockResolvedValue(true);
			mockStores.stats.getStats.mockResolvedValue({ interceptCount: 5, walletUses: { w1: 3 } });

			await handleMessage({ type: InboundMessages.GET_SETTINGS }, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith({
				enabled: true,
				developerMode: true,
				stats: { interceptCount: 5, walletUses: { w1: 3 } },
			});
		});

		it('should default enabled to true when undefined', async () => {
			mockStores.options.getEnabled.mockResolvedValue(undefined);
			mockStores.options.getDeveloperMode.mockResolvedValue(false);

			await handleMessage({ type: InboundMessages.GET_SETTINGS }, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
		});

		it('should default stats when undefined', async () => {
			mockStores.stats.getStats.mockResolvedValue(undefined);

			await handleMessage({ type: InboundMessages.GET_SETTINGS }, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith(
				expect.objectContaining({ stats: { interceptCount: 0, walletUses: {} } }),
			);
		});

		it('should return error when storage fails', async () => {
			mockStores.options.getEnabled.mockRejectedValueOnce(new Error('Storage error'));

			await handleMessage({ type: InboundMessages.GET_SETTINGS }, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});
	});

	describe('SAVE_SETTINGS', () => {
		it('should save enabled and developerMode settings', async () => {
			await handleMessage(
				{ type: InboundMessages.SAVE_SETTINGS, enabled: false, developerMode: true },
				mockSender,
				sendResponse,
			);

			expect(mockStores.options.updateOptions).toHaveBeenCalledWith({ enabled: false, developerMode: true });
			expect(sendResponse).toHaveBeenCalledWith({ success: true });
		});

		it('should return error when storage fails', async () => {
			mockStores.options.updateOptions.mockRejectedValueOnce(new Error('Storage error'));

			await handleMessage(
				{ type: InboundMessages.SAVE_SETTINGS, enabled: true, developerMode: false },
				mockSender,
				sendResponse,
			);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});

		it('should return error when required fields are missing', async () => {
			await handleMessage({ type: InboundMessages.SAVE_SETTINGS } as unknown, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});
	});

	describe('TOGGLE_ENABLED', () => {
		it('should update enabled setting to false', async () => {
			await handleMessage({ type: InboundMessages.TOGGLE_ENABLED, enabled: false }, mockSender, sendResponse);

			expect(mockStores.options.updateOptions).toHaveBeenCalledWith({ enabled: false });
			expect(sendResponse).toHaveBeenCalledWith({ success: true });
		});

		it('should update enabled setting to true', async () => {
			await handleMessage({ type: InboundMessages.TOGGLE_ENABLED, enabled: true }, mockSender, sendResponse);

			expect(mockStores.options.updateOptions).toHaveBeenCalledWith({ enabled: true });
			expect(sendResponse).toHaveBeenCalledWith({ success: true });
		});

		it('should return error when storage fails', async () => {
			mockStores.options.updateOptions.mockRejectedValueOnce(new Error('Storage error'));

			await handleMessage({ type: InboundMessages.TOGGLE_ENABLED, enabled: true }, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});

		it('should return error when enabled field is missing', async () => {
			await handleMessage({ type: InboundMessages.TOGGLE_ENABLED } as unknown, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});
	});

	describe('REGISTER_WALLET', () => {
		it('should register a new wallet', async () => {
			mockStores.wallets.getAll.mockResolvedValue([]);

			const newWallet = {
				name: 'New Wallet',
				url: 'https://new-wallet.com',
				description: 'A new wallet',
			};

			await handleMessage(
				{ type: InboundMessages.REGISTER_WALLET, wallet: newWallet },
				mockSender,
				sendResponse,
			);

			expect(mockStores.wallets.setAll).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						name: 'New Wallet',
						url: 'https://new-wallet.com',
						enabled: true,
						autoRegistered: true,
					}),
				]),
			);
			expect(sendResponse).toHaveBeenCalledWith(
				expect.objectContaining({ success: true, alreadyRegistered: false }),
			);
		});

		it('should return existing wallet if URL already registered', async () => {
			const existingWallet = { id: 'w1', name: 'Existing', url: 'https://existing.com', enabled: true };
			mockStores.wallets.getAll.mockResolvedValue([existingWallet]);

			await handleMessage(
				{ type: InboundMessages.REGISTER_WALLET, wallet: { name: 'Duplicate', url: 'https://existing.com' } },
				mockSender,
				sendResponse,
			);

			expect(mockStores.wallets.setAll).not.toHaveBeenCalled();
			expect(sendResponse).toHaveBeenCalledWith({
				success: true,
				alreadyRegistered: true,
				wallet: existingWallet,
			});
		});

		it('should return error when storage fails on getAll', async () => {
			mockStores.wallets.getAll.mockRejectedValueOnce(new Error('Storage error'));

			await handleMessage(
				{ type: InboundMessages.REGISTER_WALLET, wallet: { name: 'W', url: 'https://w.com' } },
				mockSender,
				sendResponse,
			);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});

		it('should return error when storage fails on setAll', async () => {
			mockStores.wallets.getAll.mockResolvedValue([]);
			mockStores.wallets.setAll.mockRejectedValueOnce(new Error('Storage error'));

			await handleMessage(
				{ type: InboundMessages.REGISTER_WALLET, wallet: { name: 'W', url: 'https://w.com' } },
				mockSender,
				sendResponse,
			);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});

		it('should return error when wallet field is missing', async () => {
			await handleMessage({ type: InboundMessages.REGISTER_WALLET } as unknown, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});
	});

	describe('CHECK_WALLET', () => {
		it('should return true when wallet is registered', async () => {
			mockStores.wallets.getAll.mockResolvedValue([{ id: 'w1', name: 'W1', url: 'https://wallet.example.com', enabled: true }]);

			await handleMessage(
				{ type: InboundMessages.CHECK_WALLET, url: 'https://wallet.example.com' },
				mockSender,
				sendResponse,
			);

			expect(sendResponse).toHaveBeenCalledWith({ isRegistered: true });
		});

		it('should return false when wallet is not registered', async () => {
			mockStores.wallets.getAll.mockResolvedValue([]);

			await handleMessage(
				{ type: InboundMessages.CHECK_WALLET, url: 'https://unknown.com' },
				mockSender,
				sendResponse,
			);

			expect(sendResponse).toHaveBeenCalledWith({ isRegistered: false });
		});

		it('should return error when storage fails', async () => {
			mockStores.wallets.getAll.mockRejectedValueOnce(new Error('Storage error'));

			await handleMessage(
				{ type: InboundMessages.CHECK_WALLET, url: 'https://wallet.example.com' },
				mockSender,
				sendResponse,
			);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});

		it('should return error when url is invalid', async () => {
			await handleMessage(
				{ type: InboundMessages.CHECK_WALLET, url: 'not-a-valid-url' },
				mockSender,
				sendResponse,
			);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});

		it('should return error when url field is missing', async () => {
			await handleMessage({ type: InboundMessages.CHECK_WALLET } as unknown, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});
	});

	describe('GET_SUPPORTED_PROTOCOLS', () => {
		it('should return protocols from enabled wallets', async () => {
			mockStores.wallets.getAll.mockResolvedValue([
				{ id: 'w1', name: 'W1', url: 'https://w1.com', enabled: true, protocols: ['openid4vp', 'dcapi'] },
				{ id: 'w2', name: 'W2', url: 'https://w2.com', enabled: true, protocols: ['openid4vp'] },
				{ id: 'w3', name: 'W3', url: 'https://w3.com', enabled: false, protocols: ['other'] },
			]);

			await handleMessage({ type: InboundMessages.GET_SUPPORTED_PROTOCOLS }, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith({
				protocols: expect.arrayContaining(['openid4vp', 'dcapi']),
			});
			// Should not include 'other' from disabled wallet
			const response = vi.mocked(sendResponse).mock.calls[0][0] as { protocols: string[] };
			expect(response.protocols).not.toContain('other');
		});

		it('should return empty array when no wallets have protocols', async () => {
			mockStores.wallets.getAll.mockResolvedValue([{ id: 'w1', name: 'W1', url: 'https://w1.com', enabled: true }]);

			await handleMessage({ type: InboundMessages.GET_SUPPORTED_PROTOCOLS }, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith({ protocols: [] });
		});

		it('should return error when storage fails', async () => {
			mockStores.wallets.getAll.mockRejectedValueOnce(new Error('Storage error'));

			await handleMessage({ type: InboundMessages.GET_SUPPORTED_PROTOCOLS }, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});
	});

	describe('CONTENT_SCRIPT_READY', () => {
		it('should acknowledge content script ready', async () => {
			await handleMessage(
				{ type: InboundMessages.CONTENT_SCRIPT_READY, timestamp: Date.now() },
				mockSender,
				sendResponse,
			);

			expect(sendResponse).toHaveBeenCalledWith({ success: true });
		});

		it('should return error when timestamp is missing', async () => {
			await handleMessage({ type: InboundMessages.CONTENT_SCRIPT_READY } as unknown, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});

		it('should return error when timestamp is invalid type', async () => {
			await handleMessage(
				{ type: InboundMessages.CONTENT_SCRIPT_READY, timestamp: 'not-a-number' } as unknown,
				mockSender,
				sendResponse,
			);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});
	});

	describe('CLEAR_STATS', () => {
		it('should reset statistics to zero', async () => {
			await handleMessage({ type: InboundMessages.CLEAR_STATS }, mockSender, sendResponse);

			expect(mockStores.stats.setStats).toHaveBeenCalledWith({ interceptCount: 0, walletUses: {} });
			expect(sendResponse).toHaveBeenCalledWith({ success: true });
		});

		it('should return error when storage fails', async () => {
			mockStores.stats.setStats.mockRejectedValueOnce(new Error('Storage error'));

			await handleMessage({ type: InboundMessages.CLEAR_STATS }, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});
	});

	describe('WALLET_SELECTED', () => {
		it('should record wallet usage and return success', async () => {
			mockStores.stats.getStats.mockResolvedValue({ interceptCount: 5, walletUses: {} });

			await handleMessage(
				{ type: InboundMessages.WALLET_SELECTED, walletId: 'w1', protocol: 'openid4vp' },
				mockSender,
				sendResponse,
			);

			expect(mockStores.stats.setStats).toHaveBeenCalledWith(
				expect.objectContaining({ walletUses: { w1: 1 } }),
			);
			expect(sendResponse).toHaveBeenCalledWith({ success: true });
		});

		it('should increment existing wallet usage count', async () => {
			mockStores.stats.getStats.mockResolvedValue({ interceptCount: 5, walletUses: { w1: 3 } });

			await handleMessage(
				{ type: InboundMessages.WALLET_SELECTED, walletId: 'w1', protocol: 'openid4vp' },
				mockSender,
				sendResponse,
			);

			expect(mockStores.stats.setStats).toHaveBeenCalledWith(
				expect.objectContaining({ walletUses: { w1: 4 } }),
			);
		});

		it('should return error when storage fails', async () => {
			mockStores.stats.getStats.mockRejectedValueOnce(new Error('Storage error'));

			await handleMessage(
				{ type: InboundMessages.WALLET_SELECTED, walletId: 'w1', protocol: 'openid4vp' },
				mockSender,
				sendResponse,
			);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});

		it('should return error when walletId is missing', async () => {
			await handleMessage(
				{ type: InboundMessages.WALLET_SELECTED, protocol: 'openid4vp' } as unknown,
				mockSender,
				sendResponse,
			);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});

		it('should return error when protocol is missing', async () => {
			await handleMessage(
				{ type: InboundMessages.WALLET_SELECTED, walletId: 'w1' } as unknown,
				mockSender,
				sendResponse,
			);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});
	});

	describe('Error handling', () => {
		it('should return error response for invalid message type', async () => {
			await handleMessage({ type: 'INVALID_TYPE' }, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});

		it('should return error response for malformed message', async () => {
			await handleMessage(null, mockSender, sendResponse);

			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
		});
	});
});
