import { BrowserManifest } from "./resources";

const VERSION = process.env.npm_package_version ?? '0.0.0';

export const CHROME_MANIFEST = new BrowserManifest(({ entry, icons }) => ({
	'manifest_version': 3,
	'name': 'Wallet Companion',
	'version': VERSION,
	'description': 'A cross-browser companion extension that intercepts W3C Digital Credentials API calls, enabling users to select from multiple digital identity wallet providers.',
	'permissions': [
		'storage',
		'activeTab',
		'scripting'
	],
	'host_permissions': ['<all_urls>'],
	'background': {
		'service_worker': entry('es', 'src/background/index.ts'),
		'type': 'module',
	},
	'content_scripts': [
		{
			'matches': ['<all_urls>'],
			'js': [entry('iife', 'src/content/index.ts')],
			'run_at': 'document_start',
		},
	],
	'web_accessible_resources': [
		{
			'resources': [
				entry('iife', 'src/content/inject.ts'),
			],
			'matches': ['<all_urls>'],
		},
	],
	'action': {
		'default_popup': entry('es', 'src/ui/popup.html'),
		'default_icon': icons('src/ui/assets/icons/logo-dark.svg'),
	},
	'options_page': entry('es', 'src/ui/options.html'),
	'icons': icons('src/ui/assets/icons/logo-dark.svg'),
}));

export const FIREFOX_MANIFEST = new BrowserManifest(({ entry, icons }) => ({
	'manifest_version': 2,
	'name': 'Wallet Companion',
	'version': VERSION,
	'description': 'A cross-browser companion extension that intercepts W3C Digital Credentials API calls, enabling users to select from multiple digital identity wallet providers.',
	'permissions': [
		'storage',
		'<all_urls>'
	],
	'background': {
		'scripts': [entry('iife', 'src/background/index.ts')],
	},
	'content_scripts': [
		{
			'matches': ['<all_urls>'],
			'js': [entry('iife', 'src/content/index.ts')],
			'run_at': 'document_start'
		}
	],
	'web_accessible_resources': [
		entry('iife', 'src/content/inject.ts'),
	],
	'browser_action': {
		'default_popup': entry('es', 'src/ui/popup.html'),
		'default_icon': icons('src/ui/assets/icons/logo-dark.svg'),
	},
	'options_ui': {
		'page': entry('es', 'src/ui/options.html'),
		'open_in_tab': true
	},
	'icons': icons('src/ui/assets/icons/logo-dark.svg'),
	'browser_specific_settings': {
		'gecko': {
			'id': 'digital-credentials-wallet-selector@example.com',
			'strict_min_version': '91.0'
		}
	}
}));

export const SAFARI_MANIFEST = new BrowserManifest(({ entry, icons }) => ({
	'manifest_version': 2,
	'name': 'Wallet Companion',
	'version': VERSION,
	'description': 'A cross-browser companion extension that intercepts W3C Digital Credentials API calls, enabling users to select from multiple digital identity wallet providers.',
	'permissions': [
		'storage',
		'<all_urls>'
	],
	'background': {
		'scripts': [entry('iife', 'src/background/index.ts')],
		'persistent': false
	},
	'content_scripts': [
	{
		'matches': ['<all_urls>'],
		'js': [entry('iife', 'src/content/index.ts')],
		'run_at': 'document_start'
	}
	],
	'web_accessible_resources': [
		entry('iife', 'src/content/inject.ts'),
	],
	'browser_action': {
		'default_popup': entry('es', 'src/ui/popup.html'),
		'default_icon': icons('src/ui/assets/icons/logo-dark.svg'),
	},
	'options_ui': {
		'page': entry('es', 'src/ui/options.html'),
		'open_in_tab': true
	},
	'icons': icons('src/ui/assets/icons/logo-dark.svg'),
}));
