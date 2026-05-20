/**
 * Unit tests for content/rpc.ts - RPC communication mechanism
 *
 * Tests the RPC class that enables bidirectional communication
 * between page context (inject.ts) and content script (index.ts)
 * using postMessage.
 */

import { RPC, type Handler } from '../../../src/content/rpc';

describe('RPC Class', () => {
	let messageHandler: (event: MessageEvent) => void;
	let originalPostMessage: typeof window.postMessage;
	let originalAddEventListener: typeof window.addEventListener;

	beforeEach(() => {
		// Capture the message event handler
		originalAddEventListener = window.addEventListener;
		window.addEventListener = vi.fn((type, handler) => {
			if (type === 'message') {
				messageHandler = handler as (event: MessageEvent) => void;
			}
		});

		// Mock postMessage
		originalPostMessage = window.postMessage;
		window.postMessage = vi.fn();
	});

	afterEach(() => {
		window.addEventListener = originalAddEventListener;
		window.postMessage = originalPostMessage;
		vi.clearAllMocks();
	});

	describe('Instantiation', () => {
		it('should create RPC instance without handler (send-only)', () => {
			const rpc = new RPC();
			expect(rpc).toBeDefined();
			expect(window.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
		});

		it('should create RPC instance with handler', () => {
			const handler: Handler = vi.fn();
			const rpc = new RPC(handler);
			expect(rpc).toBeDefined();
		});
	});

	describe('Channel name', () => {
		it('should use WALLET_COMPANION_RPC as channel name', () => {
			const rpc = new RPC();

			// Trigger a send to capture the message
			rpc.send('TEST_METHOD').catch(() => {});

			expect(window.postMessage).toHaveBeenCalledWith(
				expect.objectContaining({
					channel: 'WALLET_COMPANION_RPC',
				}),
				window.location.origin,
			);
		});
	});

	describe('send() method', () => {
		it('should send request with correct format', () => {
			const rpc = new RPC();

			rpc.send('TEST_METHOD', { key: 'value' }).catch(() => {});

			expect(window.postMessage).toHaveBeenCalledWith(
				expect.objectContaining({
					channel: 'WALLET_COMPANION_RPC',
					type: 'TEST_METHOD',
					payload: { key: 'value' },
					id: expect.any(Number),
				}),
				window.location.origin,
			);
		});

		it('should increment message ID for each request', () => {
			const rpc = new RPC();

			rpc.send('METHOD_1').catch(() => {});
			rpc.send('METHOD_2').catch(() => {});

			const calls = (window.postMessage as ReturnType<typeof vi.fn>).mock.calls;
			const id1 = calls[0][0].id;
			const id2 = calls[1][0].id;

			expect(id2).toBe(id1 + 1);
		});

		it('should send request without payload', () => {
			const rpc = new RPC();

			rpc.send('NO_PAYLOAD_METHOD').catch(() => {});

			expect(window.postMessage).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'NO_PAYLOAD_METHOD',
					payload: undefined,
				}),
				window.location.origin,
			);
		});
	});

	describe('Request/Response correlation', () => {
		it('should resolve with response when matching ID received', async () => {
			const rpc = new RPC();

			const promise = rpc.send<{ result: string }>('TEST_METHOD');

			// Simulate response
			const responseEvent = new MessageEvent('message', {
				source: window,
				origin: window.location.origin,
				data: {
					channel: 'WALLET_COMPANION_RPC',
					id: 1, // Matches first request ID
					response: { result: 'success' },
				},
			});

			messageHandler(responseEvent);

			const result = await promise;
			expect(result).toEqual({ result: 'success' });
		});

		it('should reject with error when error response received', async () => {
			const rpc = new RPC();

			const promise = rpc.send('TEST_METHOD');

			// Simulate error response
			const errorEvent = new MessageEvent('message', {
				source: window,
				origin: window.location.origin,
				data: {
					channel: 'WALLET_COMPANION_RPC',
					id: 1,
					error: new Error('Test error'),
				},
			});

			messageHandler(errorEvent);

			await expect(promise).rejects.toEqual(new Error('Test error'));
		});

		it('should handle multiple concurrent requests', async () => {
			const rpc = new RPC();

			const promise1 = rpc.send<{ value: number }>('METHOD_1');
			const promise2 = rpc.send<{ value: number }>('METHOD_2');

			// Respond to second request first
			messageHandler(
				new MessageEvent('message', {
					source: window,
					origin: window.location.origin,
					data: {
						channel: 'WALLET_COMPANION_RPC',
						id: 2,
						response: { value: 2 },
					},
				}),
			);

			// Respond to first request
			messageHandler(
				new MessageEvent('message', {
					source: window,
					origin: window.location.origin,
					data: {
						channel: 'WALLET_COMPANION_RPC',
						id: 1,
						response: { value: 1 },
					},
				}),
			);

			const [result1, result2] = await Promise.all([promise1, promise2]);

			expect(result1.value).toBe(1);
			expect(result2.value).toBe(2);
		});
	});

	describe('5-second timeout behavior', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should reject with AbortError after 5 seconds', async () => {
			const rpc = new RPC();

			const promise = rpc.send('SLOW_METHOD');

			// Advance time by 5 seconds
			vi.advanceTimersByTime(5000);

			await expect(promise).rejects.toThrow('RPC timeout: SLOW_METHOD');
		});

		it('should have AbortError name on timeout', async () => {
			const rpc = new RPC();

			const promise = rpc.send('SLOW_METHOD');

			vi.advanceTimersByTime(5000);

			try {
				await promise;
			} catch (error) {
				expect((error as DOMException).name).toBe('AbortError');
			}
		});

		it('should clear timeout when response received', async () => {
			const rpc = new RPC();

			const promise = rpc.send('FAST_METHOD');

			// Respond before timeout
			messageHandler(
				new MessageEvent('message', {
					source: window,
					origin: window.location.origin,
					data: {
						channel: 'WALLET_COMPANION_RPC',
						id: 1,
						response: { success: true },
					},
				}),
			);

			// Advance time past timeout threshold
			vi.advanceTimersByTime(6000);

			// Should still resolve successfully
			const result = await promise;
			expect(result).toEqual({ success: true });
		});
	});

	describe('Message origin validation', () => {
		it('should ignore messages from different source', () => {
			const handler = vi.fn();
			new RPC(handler);

			// Message from different window (source !== window)
			const foreignEvent = new MessageEvent('message', {
				source: null,
				origin: window.location.origin,
				data: {
					channel: 'WALLET_COMPANION_RPC',
					type: 'TEST',
				},
			});

			messageHandler(foreignEvent);

			expect(handler).not.toHaveBeenCalled();
		});

		it('should ignore messages from different origin', () => {
			const handler = vi.fn();
			new RPC(handler);

			// Message from different origin
			const crossOriginEvent = new MessageEvent('message', {
				source: window,
				origin: 'https://evil.com',
				data: {
					channel: 'WALLET_COMPANION_RPC',
					type: 'TEST',
				},
			});

			messageHandler(crossOriginEvent);

			expect(handler).not.toHaveBeenCalled();
		});

		it('should ignore messages with wrong channel', () => {
			const handler = vi.fn();
			new RPC(handler);

			const wrongChannelEvent = new MessageEvent('message', {
				source: window,
				origin: window.location.origin,
				data: {
					channel: 'WRONG_CHANNEL',
					type: 'TEST',
				},
			});

			messageHandler(wrongChannelEvent);

			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe('Handler invocation', () => {
		it('should invoke handler for incoming requests', () => {
			const handler = vi.fn().mockResolvedValue({ result: 'ok' });
			new RPC(handler);

			const requestEvent = new MessageEvent('message', {
				source: window,
				origin: window.location.origin,
				data: {
					channel: 'WALLET_COMPANION_RPC',
					id: 100,
					type: 'INCOMING_REQUEST',
					payload: { data: 'test' },
				},
			});

			messageHandler(requestEvent);

			expect(handler).toHaveBeenCalledWith('INCOMING_REQUEST', { data: 'test' });
		});

		it('should send response back via postMessage', async () => {
			const handler = vi.fn().mockResolvedValue({ result: 'success' });
			new RPC(handler);

			const requestEvent = new MessageEvent('message', {
				source: window,
				origin: window.location.origin,
				data: {
					channel: 'WALLET_COMPANION_RPC',
					id: 100,
					type: 'REQUEST',
					payload: {},
				},
			});

			messageHandler(requestEvent);

			// Wait for async handler
			await vi.waitFor(() => {
				expect(window.postMessage).toHaveBeenCalledWith(
					expect.objectContaining({
						channel: 'WALLET_COMPANION_RPC',
						id: 100,
						response: { result: 'success' },
					}),
					window.location.origin,
				);
			});
		});
	});

	describe('Error propagation', () => {
		it('should send error response when handler throws', async () => {
			const handler = vi.fn().mockRejectedValue(new Error('Handler failed'));
			new RPC(handler);

			const requestEvent = new MessageEvent('message', {
				source: window,
				origin: window.location.origin,
				data: {
					channel: 'WALLET_COMPANION_RPC',
					id: 100,
					type: 'FAILING_REQUEST',
					payload: {},
				},
			});

			messageHandler(requestEvent);

			await vi.waitFor(() => {
				expect(window.postMessage).toHaveBeenCalledWith(
					expect.objectContaining({
						channel: 'WALLET_COMPANION_RPC',
						id: 100,
						error: expect.any(Error),
					}),
					window.location.origin,
				);
			});
		});

		it('should convert non-Error throws to Error', async () => {
			const handler = vi.fn().mockRejectedValue('string error');
			new RPC(handler);

			const requestEvent = new MessageEvent('message', {
				source: window,
				origin: window.location.origin,
				data: {
					channel: 'WALLET_COMPANION_RPC',
					id: 100,
					type: 'REQUEST',
					payload: {},
				},
			});

			messageHandler(requestEvent);

			await vi.waitFor(() => {
				const call = (window.postMessage as ReturnType<typeof vi.fn>).mock.calls.find(
					(c) => c[0].id === 100 && 'error' in c[0],
				);
				expect(call).toBeDefined();
				expect(call?.[0].error).toBeInstanceOf(Error);
			});
		});
	});
});
