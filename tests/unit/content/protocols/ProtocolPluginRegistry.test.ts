/**
 * Tests for Protocol Plugin System
 */

import { ExampleProtocolPlugin, ProtocolPlugin, ProtocolPluginRegistry } from '../../../../src/content/protocols';

// Concrete implementation for testing abstract base class
class TestProtocolPlugin extends ProtocolPlugin {
	getProtocolId(): string {
		return 'test-protocol';
	}

	prepareRequest(data: unknown): { timestamp: string } {
		return { timestamp: new Date().toISOString(), ...((data as Record<string, unknown>) || {}) };
	}

	validateResponse(data: unknown): unknown {
		return data;
	}
}

describe('Protocol Plugin System', () => {
	describe('Base ProtocolPlugin', () => {
		it('should have default formatForWallet implementation', () => {
			const plugin = new TestProtocolPlugin();

			const formatted = plugin.formatForWallet({ foo: 'bar', timestamp: '2024-01-01' } as ReturnType<typeof plugin.prepareRequest>, 'https://wallet.example.com');

			expect(formatted).toEqual({
				protocol: 'test-protocol',
				data: { foo: 'bar', timestamp: '2024-01-01' },
				walletUrl: 'https://wallet.example.com',
			});
		});
	});

	describe('ExampleProtocolPlugin', () => {
		let plugin: ExampleProtocolPlugin;

		beforeEach(() => {
			plugin = new ExampleProtocolPlugin();
		});

		it('should have correct protocol ID', () => {
			expect(plugin.getProtocolId()).toBe('example-protocol');
		});

		it('should prepare valid request', () => {
			const requestData = {
				foo: 'bar',
				data: { test: 'value' },
			};

			const prepared = plugin.prepareRequest(requestData);

			expect(prepared).toHaveProperty('foo', 'bar');
			expect(prepared).toHaveProperty('timestamp');
			// The prepared request may have 'data' depending on implementation
		});

		it('should reject invalid request data', () => {
			expect(() => plugin.prepareRequest(null)).toThrow('Request data must be an object');
			expect(() => plugin.prepareRequest('string')).toThrow('Request data must be an object');
		});

		it('should validate response', () => {
			const responseData = {
				result: 'success',
				data: { credential: 'xyz' },
			};

			const validated = plugin.validateResponse(responseData);

			expect(validated).toEqual(responseData);
		});

		it('should reject invalid response data', () => {
			expect(() => plugin.validateResponse(null)).toThrow('Invalid response data');
			expect(() => plugin.validateResponse('string')).toThrow('Invalid response data');
		});
	});

	describe('ProtocolPluginRegistry', () => {
		let registry: ProtocolPluginRegistry;

		beforeEach(() => {
			registry = new ProtocolPluginRegistry();
		});

		it('should register example plugin on construction', () => {
			expect(registry.isSupported('example-protocol')).toBe(true);
		});

		it('should return all supported protocols', () => {
			const protocols = registry.getSupportedProtocols();

			expect(protocols).toContain('example-protocol');
			expect(protocols.length).toBe(1);
		});

		it('should register custom plugin', () => {
			class CustomPlugin extends ProtocolPlugin {
				getProtocolId(): string {
					return 'custom-protocol';
				}
				prepareRequest(data: unknown): unknown {
					return data;
				}
				validateResponse(data: unknown): unknown {
					return data;
				}
			}

			const customPlugin = new CustomPlugin();
			registry.register(customPlugin);

			expect(registry.isSupported('custom-protocol')).toBe(true);
			expect(registry.getSupportedProtocols()).toContain('custom-protocol');
		});

		it('should throw error when registering non-plugin', () => {
			expect(() => registry.register({} as ProtocolPlugin)).toThrow('Plugin must extend ProtocolPlugin');
			expect(() => registry.register(null as unknown as ProtocolPlugin)).toThrow('Plugin must extend ProtocolPlugin');
		});

		it('should get plugin by protocol ID', () => {
			const plugin = registry.getPlugin('example-protocol');

			expect(plugin).toBeInstanceOf(ExampleProtocolPlugin);
		});

		it('should return null for unknown protocol', () => {
			const plugin = registry.getPlugin('unknown-protocol');

			expect(plugin).toBeNull();
		});

		it('should prepare request using correct plugin', () => {
			const requestData = {
				foo: 'bar',
				data: { test: 'value' },
			};

			const prepared = registry.prepareRequest('example-protocol', requestData);

			expect(prepared).toHaveProperty('foo', 'bar');
			expect(prepared).toHaveProperty('timestamp');
		});

		it('should throw error when preparing request for unknown protocol', () => {
			expect(() => registry.prepareRequest('unknown-protocol', {})).toThrow(
				'No plugin registered for protocol: unknown-protocol',
			);
		});

		it('should validate response using correct plugin', () => {
			const responseData = {
				result: 'success',
				data: { credential: 'xyz' },
			};

			const validated = registry.validateResponse('example-protocol', responseData);

			expect(validated).toEqual(responseData);
		});

		it('should throw error when validating response for unknown protocol', () => {
			expect(() => registry.validateResponse('unknown-protocol', {})).toThrow(
				'No plugin registered for protocol: unknown-protocol',
			);
		});

		it('should format request for wallet using correct plugin', () => {
			const preparedRequest = {
				foo: 'bar',
				timestamp: '2023-01-01T00:00:00Z',
			};

			const formatted = registry.formatForWallet('example-protocol', preparedRequest, 'https://wallet.example.com');

			expect(formatted).toEqual({
				protocol: 'example-protocol',
				data: preparedRequest,
				walletUrl: 'https://wallet.example.com',
			});
		});

		it('should throw error when formatting for unknown protocol', () => {
			expect(() => registry.formatForWallet('unknown-protocol', {}, 'https://wallet.example.com')).toThrow(
				'No plugin registered for protocol: unknown-protocol',
			);
		});

		it('should replace existing plugin when re-registering', () => {
			class CustomExamplePlugin extends ProtocolPlugin {
				getProtocolId(): string {
					return 'example-protocol';
				}
				prepareRequest(data: Record<string, unknown>): Record<string, unknown> {
					return { ...data, custom: true };
				}
				validateResponse(data: unknown): unknown {
					return data;
				}
			}

			const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const customPlugin = new CustomExamplePlugin();
			registry.register(customPlugin);

			expect(spy).toHaveBeenCalledWith("Protocol plugin for 'example-protocol' is being replaced");

			const prepared = registry.prepareRequest('example-protocol', { test: 'data' }) as Record<string, unknown>;
			expect(prepared).toHaveProperty('custom', true);

			spy.mockRestore();
		});
	});
});
