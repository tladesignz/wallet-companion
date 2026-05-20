/**
 * Tests for ProtocolPlugin base class and ExampleProtocolPlugin
 *
 * Tests the abstract base class and its example implementation.
 */

import { ExampleProtocolPlugin, type FormatForWallet, ProtocolPlugin } from '../../../../src/content/protocols';

describe('ProtocolPlugin', () => {
	describe('ExampleProtocolPlugin', () => {
		let plugin: ExampleProtocolPlugin;

		beforeEach(() => {
			plugin = new ExampleProtocolPlugin();
		});

		describe('getProtocolId()', () => {
			it('should return example-protocol', () => {
				expect(plugin.getProtocolId()).toBe('example-protocol');
			});
		});

		describe('prepareRequest()', () => {
			it('should prepare valid request data', () => {
				const requestData = { foo: 'bar' };

				const result = plugin.prepareRequest(requestData);

				expect(result).toHaveProperty('foo', 'bar');
				expect(result).toHaveProperty('timestamp');
			});

			it('should add ISO timestamp', () => {
				const requestData = { test: true };

				const result = plugin.prepareRequest(requestData) as { timestamp: string };

				expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
			});

			it('should throw for null input', () => {
				expect(() => plugin.prepareRequest(null)).toThrow('Request data must be an object');
			});

			it('should throw for undefined input', () => {
				expect(() => plugin.prepareRequest(undefined)).toThrow('Request data must be an object');
			});

			it('should throw for string input', () => {
				expect(() => plugin.prepareRequest('string')).toThrow('Request data must be an object');
			});

			it('should throw for number input', () => {
				expect(() => plugin.prepareRequest(42)).toThrow('Request data must be an object');
			});

			it('should accept arrays (they are objects)', () => {
				const result = plugin.prepareRequest([1, 2, 3]);

				expect(result).toHaveProperty('timestamp');
			});
		});

		describe('validateResponse()', () => {
			it('should return valid response data', () => {
				const responseData = { success: true, data: 'test' };

				const result = plugin.validateResponse(responseData);

				expect(result).toEqual(responseData);
			});

			it('should throw for null response', () => {
				expect(() => plugin.validateResponse(null)).toThrow('Invalid response data');
			});

			it('should throw for undefined response', () => {
				expect(() => plugin.validateResponse(undefined)).toThrow('Invalid response data');
			});

			it('should throw for string response', () => {
				expect(() => plugin.validateResponse('response')).toThrow('Invalid response data');
			});

			it('should throw for number response', () => {
				expect(() => plugin.validateResponse(123)).toThrow('Invalid response data');
			});

			it('should accept empty object', () => {
				const result = plugin.validateResponse({});
				expect(result).toEqual({});
			});
		});

		describe('formatForWallet()', () => {
			it('should format request for wallet', () => {
				const preparedRequest = { foo: 'bar', timestamp: '2024-01-01' };
				const walletUrl = 'https://wallet.example.com';

				const result = plugin.formatForWallet(preparedRequest, walletUrl);

				expect(result.protocol).toBe('example-protocol');
				expect(result.walletUrl).toBe(walletUrl);
				expect(result).toHaveProperty('data', preparedRequest);
			});

			it('should include protocol ID from getProtocolId()', () => {
				const result = plugin.formatForWallet({}, 'https://wallet.example.com');

				expect(result.protocol).toBe(plugin.getProtocolId());
			});
		});
	});

	describe('FormatForWallet type', () => {
		it('should require protocol and walletUrl', () => {
			const formatted: FormatForWallet = {
				protocol: 'test',
				walletUrl: 'https://example.com',
			};

			expect(formatted.protocol).toBe('test');
			expect(formatted.walletUrl).toBe('https://example.com');
		});

		it('should allow additional properties', () => {
			const formatted: FormatForWallet = {
				protocol: 'test',
				walletUrl: 'https://example.com',
				customProp: 'value',
				data: { foo: 'bar' },
			};

			expect(formatted.customProp).toBe('value');
			expect(formatted.data).toEqual({ foo: 'bar' });
		});
	});

	describe('ProtocolPlugin abstract class', () => {
		it('should be extendable', () => {
			class CustomPlugin extends ProtocolPlugin {
				getProtocolId() {
					return 'custom-protocol';
				}
				prepareRequest(data: unknown) {
					return data;
				}
				validateResponse(data: unknown) {
					return data;
				}
			}

			const plugin = new CustomPlugin();

			expect(plugin.getProtocolId()).toBe('custom-protocol');
		});

		it('should provide default formatForWallet implementation', () => {
			class MinimalPlugin extends ProtocolPlugin {
				getProtocolId() {
					return 'minimal';
				}
				prepareRequest(data: unknown) {
					return data;
				}
				validateResponse(data: unknown) {
					return data;
				}
			}

			const plugin = new MinimalPlugin();
			const result = plugin.formatForWallet({ test: true }, 'https://wallet.example.com');

			expect(result.protocol).toBe('minimal');
			expect(result.walletUrl).toBe('https://wallet.example.com');
		});

		it('should allow overriding formatForWallet', () => {
			class CustomFormattingPlugin extends ProtocolPlugin {
				getProtocolId() {
					return 'custom';
				}
				prepareRequest(data: unknown) {
					return data;
				}
				validateResponse(data: unknown) {
					return data;
				}
				formatForWallet(preparedRequest: unknown, walletUrl: string) {
					return {
						protocol: this.getProtocolId(),
						walletUrl,
						customFormat: true,
						request: preparedRequest,
					};
				}
			}

			const plugin = new CustomFormattingPlugin();
			const result = plugin.formatForWallet({ data: 'test' }, 'https://wallet.example.com');

			expect(result.customFormat).toBe(true);
			expect(result.request).toEqual({ data: 'test' });
		});
	});
});
