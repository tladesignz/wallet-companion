/**
 * Tests for message utilities
 *
 * Tests the defineMessage helper for creating typed message schemas.
 */

import { literal, number, safeParse, string } from 'valibot';
import { defineMessage } from '../../../../../src/shared/schemas/messages/utils';

describe('defineMessage utility', () => {
	describe('basic structure', () => {
		it('should create message definition with TYPE', () => {
			const TestMessage = defineMessage(literal('TEST_MESSAGE'), {}, {});

			expect(TestMessage.TYPE).toBeDefined();
		});

		it('should create message definition with MESSAGE schema', () => {
			const TestMessage = defineMessage(literal('TEST_MESSAGE'), {}, {});

			expect(TestMessage.MESSAGE).toBeDefined();
		});

		it('should create message definition with RESPONSE schema', () => {
			const TestMessage = defineMessage(literal('TEST_MESSAGE'), {}, {});

			expect(TestMessage.RESPONSE).toBeDefined();
		});

		it('should create message definition with RESPONSE_SCHEMA', () => {
			const TestMessage = defineMessage(literal('TEST_MESSAGE'), {}, {});

			expect(TestMessage.RESPONSE_SCHEMA).toBeDefined();
		});
	});

	describe('MESSAGE schema validation', () => {
		it('should validate message with type', () => {
			const TestMessage = defineMessage(literal('TEST_MESSAGE'), {}, {});

			const result = safeParse(TestMessage.MESSAGE, {
				type: 'TEST_MESSAGE',
			});

			expect(result.success).toBe(true);
		});

		it('should reject message with wrong type', () => {
			const TestMessage = defineMessage(literal('TEST_MESSAGE'), {}, {});

			const result = safeParse(TestMessage.MESSAGE, {
				type: 'WRONG_TYPE',
			});

			expect(result.success).toBe(false);
		});

		it('should include optional origin field', () => {
			const TestMessage = defineMessage(literal('TEST_MESSAGE'), {}, {});

			const result = safeParse(TestMessage.MESSAGE, {
				type: 'TEST_MESSAGE',
				origin: 'https://example.com',
			});

			expect(result.success).toBe(true);
		});

		it('should reject invalid origin URL', () => {
			const TestMessage = defineMessage(literal('TEST_MESSAGE'), {}, {});

			const result = safeParse(TestMessage.MESSAGE, {
				type: 'TEST_MESSAGE',
				origin: 'not-a-url',
			});

			expect(result.success).toBe(false);
		});

		it('should validate custom message fields', () => {
			const TestMessage = defineMessage(
				literal('TEST_MESSAGE'),
				{
					walletId: string(),
					count: number(),
				},
				{},
			);

			const result = safeParse(TestMessage.MESSAGE, {
				type: 'TEST_MESSAGE',
				walletId: 'wallet-123',
				count: 5,
			});

			expect(result.success).toBe(true);
		});

		it('should reject missing custom fields', () => {
			const TestMessage = defineMessage(
				literal('TEST_MESSAGE'),
				{
					walletId: string(),
				},
				{},
			);

			const result = safeParse(TestMessage.MESSAGE, {
				type: 'TEST_MESSAGE',
				// missing walletId
			});

			expect(result.success).toBe(false);
		});
	});

	describe('RESPONSE schema validation', () => {
		it('should validate empty response', () => {
			const TestMessage = defineMessage(literal('TEST_MESSAGE'), {}, {});

			const result = safeParse(TestMessage.RESPONSE, {});

			expect(result.success).toBe(true);
		});

		it('should validate response with custom fields', () => {
			const TestMessage = defineMessage(
				literal('TEST_MESSAGE'),
				{},
				{
					success: string(),
					data: number(),
				},
			);

			const result = safeParse(TestMessage.RESPONSE, {
				success: 'ok',
				data: 42,
			});

			expect(result.success).toBe(true);
		});

		it('should reject missing response fields', () => {
			const TestMessage = defineMessage(
				literal('TEST_MESSAGE'),
				{},
				{
					success: string(),
				},
			);

			const result = safeParse(TestMessage.RESPONSE, {});

			expect(result.success).toBe(false);
		});
	});

	describe('RESPONSE_SCHEMA validation', () => {
		it('should include type in response schema', () => {
			const TestMessage = defineMessage(
				literal('TEST_MESSAGE'),
				{},
				{
					success: string(),
				},
			);

			const result = safeParse(TestMessage.RESPONSE_SCHEMA, {
				type: 'TEST_MESSAGE',
				response: {
					success: 'ok',
				},
			});

			expect(result.success).toBe(true);
		});

		it('should reject wrong type in response schema', () => {
			const TestMessage = defineMessage(
				literal('TEST_MESSAGE'),
				{},
				{
					success: string(),
				},
			);

			const result = safeParse(TestMessage.RESPONSE_SCHEMA, {
				type: 'WRONG_TYPE',
				response: {
					success: 'ok',
				},
			});

			expect(result.success).toBe(false);
		});
	});

	describe('real-world usage patterns', () => {
		it('should work with enum-like literal types', () => {
			enum MessageTypes {
				GET_DATA = 'GET_DATA',
			}

			const GetDataMessage = defineMessage(
				literal(MessageTypes.GET_DATA),
				{
					id: string(),
				},
				{
					data: string(),
				},
			);

			const messageResult = safeParse(GetDataMessage.MESSAGE, {
				type: MessageTypes.GET_DATA,
				id: '123',
			});

			const responseResult = safeParse(GetDataMessage.RESPONSE, {
				data: 'test data',
			});

			expect(messageResult.success).toBe(true);
			expect(responseResult.success).toBe(true);
		});
	});
});
