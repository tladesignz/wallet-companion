/**
 * Injected script that runs in the page context
 * Intercepts navigator.credentials.get() calls for the Digital Credentials API
 */

import type { Wallet } from '@shared/schemas/resources';
import { WalletCompanion } from './api/WalletCompanion';
import { OpenID4VPPlugin, ProtocolPluginRegistry } from './protocols/';

console.debug('Digital Credentials API interceptor injected');

// Create the public API instance
const walletCompanion = new WalletCompanion();

// Store the original navigator.credentials.get
const originalCredentialsGet = navigator.credentials.get.bind(navigator.credentials);

// Store original DigitalCredential.userAgentAllowsProtocol if it exists
const originalUserAgentAllowsProtocol =
	typeof DigitalCredential !== 'undefined' && DigitalCredential.userAgentAllowsProtocol
		? DigitalCredential.userAgentAllowsProtocol.bind(DigitalCredential)
		: null;

// Counter for request IDs
let requestIdCounter = 0;

// Store pending requests
const pendingRequests = new Map();

// Initialize protocol plugin registry and register plugins
const protocolRegistry = new ProtocolPluginRegistry();
protocolRegistry.register(new OpenID4VPPlugin());

/**
 * Override DigitalCredential.userAgentAllowsProtocol
 * This allows the extension to report protocols supported by web wallets
 */
if (typeof DigitalCredential !== 'undefined') {
	DigitalCredential.userAgentAllowsProtocol = (protocol) => {
		// Check if any registered web wallet supports this protocol
		if (walletCompanion.supportedProtocols.includes(protocol)) {
			return true;
		}

		// Fall back to native implementation if available
		if (originalUserAgentAllowsProtocol) {
			return originalUserAgentAllowsProtocol(protocol);
		}

		return false;
	};
	console.log('DigitalCredential.userAgentAllowsProtocol overridden');
}

type DigitalIdentityRequest = {
	identity?: boolean;
	digital?: {
		requests: Array<{
			protocol: string;
			data: any;
		}>;
	};
	mediation?: 'optional' | 'required' | 'silent';
};

/**
 * Override navigator.credentials.get
 */
navigator.credentials.get = async (options?: CredentialRequestOptions & DigitalIdentityRequest) => {
	console.debug('navigator.credentials.get intercepted:', options);

	// Check if this is a digital identity request
	const isDigitalIdentityRequest =
		options &&
		(options.identity ||
			options.digital ||
			options.mediation === 'optional' ||
			options.mediation === 'required');

	if (!isDigitalIdentityRequest) {
		// If not a digital identity request, pass through to native implementation
		console.log('Not a digital identity request, passing to native API');
		return originalCredentialsGet(options);
	}

	// Extract digital credential requests
	const digitalRequests = options.digital?.requests || [];

	if (digitalRequests.length === 0) {
		// No digital requests, pass through
		console.log('No digital credential requests, passing to native API');
		return originalCredentialsGet(options);
	}

	// Filter requests by supported protocols
	const supportedRequests = digitalRequests.filter((req) =>
		walletCompanion.supportedProtocols.includes(req.protocol),
	);
	const unsupportedRequests = digitalRequests.filter(
		(req) => !walletCompanion.supportedProtocols.includes(req.protocol),
	);

	// If no requests match our supported protocols, pass through to native
	if (supportedRequests.length === 0) {
		console.log('No requests match supported protocols, passing to native API');
		return originalCredentialsGet(options);
	}

	// If we have mixed requests, we'll handle the supported ones and log the unsupported
	if (unsupportedRequests.length > 0) {
		console.log(
			'Unsupported protocols will be handled by native API:',
			unsupportedRequests.map((r) => r.protocol),
		);
	}

	// Generate unique request ID
	const requestId = `dc-req-${++requestIdCounter}-${Date.now()}`;

	// Process requests through protocol plugins
	const processedRequests: Array<{ protocol: string; data: any; originalData: any }> = [];
	for (const request of supportedRequests) {
		try {
			const preparedData = protocolRegistry.prepareRequest(request.protocol, request.data);
			processedRequests.push({
				protocol: request.protocol,
				data: preparedData,
				originalData: request.data,
			});
		} catch (error) {
			console.error(`Error preparing request for protocol ${request.protocol}:`, error);
			// Skip this request if we can't prepare it
		}
	}

	if (processedRequests.length === 0) {
		console.log('No requests could be processed, passing to native API');
		return originalCredentialsGet(options);
	}

	// Create a promise that will be resolved when we get the response
	const credentialPromise = new Promise<Credential | null>((resolve, reject) => {
		pendingRequests.set(requestId, { resolve, reject, options, processedRequests });

		// Set a timeout for the request (30 seconds)
		setTimeout(() => {
			if (pendingRequests.has(requestId)) {
				pendingRequests.delete(requestId);
				reject(new DOMException('Request timeout', 'AbortError'));
			}
		}, 30000);
	});

	// Dispatch custom event to content script
	window.dispatchEvent(
		new CustomEvent('DC_CREDENTIALS_REQUEST', {
			detail: {
				requestId: requestId,
				requests: processedRequests,
				options: options,
			},
		}),
	);

	return credentialPromise;
};

/**
 * Listen for responses from the content script
 */
window.addEventListener('DC_CREDENTIALS_RESPONSE', (event) => {
	const { requestId, response, error, useNative, protocol } = (<CustomEvent>event).detail;

	const pending = pendingRequests.get(requestId);
	if (!pending) {
		console.warn('Received response for unknown request:', requestId);
		return;
	}

	pendingRequests.delete(requestId);

	if (useNative) {
		// User chose to use native browser implementation
		console.log('Using native Digital Credentials API');
		originalCredentialsGet(pending.options)
			.then((credential) => pending.resolve(credential))
			.catch((err) => pending.reject(err));
	} else if (error) {
		// An error occurred
		pending.reject(new DOMException(error, 'AbortError'));
	} else if (response) {
		// Validate the response using the protocol plugin
		try {
			if (protocol && protocolRegistry.isSupported(protocol)) {
				const validatedResponse = protocolRegistry.validateResponse(protocol, response);

				// Create a DigitalCredential-like object
				const credential = {
					type: 'digital',
					protocol: protocol,
					data: validatedResponse,
					id: `credential-${Date.now()}`,
					// Add toJSON method for serialization
					toJSON: function () {
						return {
							type: this.type,
							protocol: this.protocol,
							data: this.data,
							id: this.id,
						};
					},
				};

				pending.resolve(credential);
			} else {
				// No protocol specified or unknown protocol, return as-is
				pending.resolve(response);
			}
		} catch (validationError) {
			console.error('Response validation failed:', validationError);
			pending.reject(
				new DOMException(
					`Invalid credential response: ${validationError instanceof Error ? validationError.message : String(validationError)}`,
					'AbortError',
				),
			);
		}
	} else {
		// User cancelled
		pending.reject(new DOMException('User cancelled the request', 'AbortError'));
	}
});

/**
 * Listen for wallet invocation requests
 */
window.addEventListener('DC_INVOKE_WALLET', (event) => {
	const { requestId, wallet, protocol, request } = (<CustomEvent>event).detail;

	console.log('Invoking wallet:', wallet.name, 'for protocol:', protocol);

	try {
		// Build wallet URL with the authorization request
		const walletUrl = buildWalletUrl(wallet, protocol, request);

		console.log('Opening wallet URL:', walletUrl);

		// Store the request context for when the wallet responds
		const _responseChannel = `dc-response-${requestId}`;

		// Listen for response via postMessage or redirect
		const messageHandler = (
			messageEvent: MessageEvent<{ type: string; requestId: string; response?: any }>,
		) => {
			// Verify origin matches wallet domain
			const walletOrigin = new URL(wallet.url).origin;
			if (messageEvent.origin !== walletOrigin) {
				return;
			}

			// Check if this is a DC API response
			if (
				messageEvent.data &&
				messageEvent.data.type === 'DC_WALLET_RESPONSE' &&
				messageEvent.data.requestId === requestId
			) {
				console.log('Received wallet response via postMessage:', messageEvent.data);

				window.removeEventListener('message', messageHandler);

				// Dispatch the response
				window.dispatchEvent(
					new CustomEvent('DC_CREDENTIALS_RESPONSE', {
						detail: {
							requestId: requestId,
							response: messageEvent.data.response,
							protocol: protocol,
						},
					}),
				);
			}
		};

		window.addEventListener('message', messageHandler);

		// Set a timeout for the wallet response
		setTimeout(() => {
			window.removeEventListener('message', messageHandler);

			// Check if request is still pending
			const pending = pendingRequests.get(requestId);
			if (pending) {
				console.warn('Wallet response timeout for request:', requestId);
				window.dispatchEvent(
					new CustomEvent('DC_CREDENTIALS_RESPONSE', {
						detail: {
							requestId: requestId,
							error: 'Wallet response timeout',
						},
					}),
				);
			}
		}, 300000); // 5 minute timeout

		// Open the wallet in a new tab (not popup)
		const walletWindow = window.open(walletUrl, '_blank');

		if (!walletWindow) {
			console.error('Failed to open wallet window - popup may be blocked');
			throw new Error('Failed to open wallet window - popup blocked by browser');
		}
	} catch (error) {
		console.error('Error invoking wallet:', error);
		window.dispatchEvent(
			new CustomEvent('DC_CREDENTIALS_RESPONSE', {
				detail: {
					requestId: requestId,
					error: error instanceof Error ? error.message : String(error),
				},
			}),
		);
	}
});

/**
 * Build wallet URL with authorization request parameters
 */
function buildWalletUrl(wallet: Wallet, protocol: string, request: any) {
	const walletBaseUrl = wallet.url;

	// Extract the actual request data (request might have .data property from prepareRequest)
	const requestData = request.data || request;

	// For OpenID4VP protocols, construct the authorization request
	if (protocol.startsWith('openid4vp')) {
		// wwWallet's UriHandlerProvider checks window.location.search for query parameters
		// It looks for client_id and request_uri (or direct parameters) in the URL query string
		// So we pass all OpenID4VP parameters directly as query params to the wallet URL
		const walletUrl = new URL(walletBaseUrl);

		// Set all OpenID4VP parameters as query params per parseAuthorizationParams()
		walletUrl.searchParams.set('client_id', window.location.origin);
		walletUrl.searchParams.set('response_type', requestData.response_type || 'vp_token');
		walletUrl.searchParams.set('response_mode', requestData.response_mode || 'dc_api');
		walletUrl.searchParams.set('nonce', requestData.nonce);
		walletUrl.searchParams.set('response_uri', window.location.href);

		// Complex parameters need to be JSON-stringified per OpenID4VP spec
		walletUrl.searchParams.set(
			'client_metadata',
			JSON.stringify(requestData.client_metadata || {}),
		);
		walletUrl.searchParams.set('dcql_query', JSON.stringify(requestData.dcql_query || {}));

		// Add state if provided
		if (requestData.state) {
			walletUrl.searchParams.set('state', requestData.state);
		}

		console.log(
			'Built wallet URL with query params:',
			`${walletUrl.toString().substring(0, 200)}...`,
		);

		return walletUrl.toString();
	}

	// For other protocols, use a generic approach
	const url = new URL(walletBaseUrl);
	url.searchParams.set('request', JSON.stringify(requestData));
	url.searchParams.set('protocol', protocol);
	url.searchParams.set('origin', window.location.origin);

	return url.toString();
}

console.debug('Digital Credentials API interception active');

window.WalletCompanion = walletCompanion;

console.debug('Wallet auto-registration API exposed');
