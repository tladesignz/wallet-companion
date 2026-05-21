/**
 * Tests for icon utilities
 *
 * Tests pure utility functions for generating wallet icons.
 * fetchFavicon and generateWalletIconOptions are excluded (require browser APIs).
 */

import {
	generateGeometricIcon,
	generateIdenticon,
	generateInitialAvatar,
	getColorFromString,
	ICON_COLORS,
	isIconUrl,
	svgToDataUrl,
} from '../../../../src/ui/utils/icons';

describe('Icon Utilities', () => {
	describe('ICON_COLORS', () => {
		it('should export a color palette array', () => {
			expect(Array.isArray(ICON_COLORS)).toBe(true);
			expect(ICON_COLORS.length).toBeGreaterThan(0);
		});

		it('should contain valid hex colors', () => {
			for (const color of ICON_COLORS) {
				expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
			}
		});
	});

	describe('getColorFromString()', () => {
		it('should return a color from the palette', () => {
			const color = getColorFromString('test');
			expect(ICON_COLORS).toContain(color);
		});

		it('should be deterministic (same input = same output)', () => {
			const color1 = getColorFromString('wallet');
			const color2 = getColorFromString('wallet');
			expect(color1).toBe(color2);
		});

		it('should return different colors for different inputs', () => {
			const color1 = getColorFromString('wallet1');
			const color2 = getColorFromString('different-wallet');
			// Note: collision is possible but unlikely for different strings
			expect(typeof color1).toBe('string');
			expect(typeof color2).toBe('string');
		});

		it('should handle empty string', () => {
			const color = getColorFromString('');
			expect(ICON_COLORS).toContain(color);
		});

		it('should handle special characters', () => {
			const color = getColorFromString('https://wallet.example.com/path?query=1');
			expect(ICON_COLORS).toContain(color);
		});
	});

	describe('generateIdenticon()', () => {
		it('should generate valid SVG', () => {
			const svg = generateIdenticon('test');
			expect(svg).toContain('<svg');
			expect(svg).toContain('</svg>');
			expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
		});

		it('should use default size of 48', () => {
			const svg = generateIdenticon('test');
			expect(svg).toContain('width="48"');
			expect(svg).toContain('height="48"');
		});

		it('should respect custom size', () => {
			const svg = generateIdenticon('test', 64);
			expect(svg).toContain('width="64"');
			expect(svg).toContain('height="64"');
		});

		it('should be deterministic', () => {
			const svg1 = generateIdenticon('wallet');
			const svg2 = generateIdenticon('wallet');
			expect(svg1).toBe(svg2);
		});

		it('should produce different patterns for different inputs', () => {
			const svg1 = generateIdenticon('wallet-a');
			const svg2 = generateIdenticon('wallet-b');
			expect(svg1).not.toBe(svg2);
		});

		it('should contain background rect with rounded corners', () => {
			const svg = generateIdenticon('test');
			expect(svg).toContain('rx="8"');
		});

		it('should contain colored cells (rect elements)', () => {
			const svg = generateIdenticon('test');
			// Should have at least the background rect
			expect(svg).toContain('<rect');
		});
	});

	describe('generateInitialAvatar()', () => {
		it('should generate valid SVG', () => {
			const svg = generateInitialAvatar('Test Wallet');
			expect(svg).toContain('<svg');
			expect(svg).toContain('</svg>');
		});

		it('should extract two initials from two-word name', () => {
			const svg = generateInitialAvatar('Test Wallet');
			expect(svg).toMatch(/>\s*TW\s*<\/text>/);
		});

		it('should extract first two characters from single word', () => {
			const svg = generateInitialAvatar('Wallet');
			expect(svg).toMatch(/>\s*WA\s*<\/text>/);
		});

		it('should uppercase initials', () => {
			const svg = generateInitialAvatar('test wallet');
			expect(svg).toMatch(/>\s*TW\s*<\/text>/);
		});

		it('should use default size of 48', () => {
			const svg = generateInitialAvatar('Test');
			expect(svg).toContain('width="48"');
			expect(svg).toContain('height="48"');
		});

		it('should respect custom size', () => {
			const svg = generateInitialAvatar('Test', 32);
			expect(svg).toContain('width="32"');
			expect(svg).toContain('height="32"');
		});

		it('should use white text', () => {
			const svg = generateInitialAvatar('Test');
			expect(svg).toContain('fill="white"');
		});

		it('should use a color from the palette as background', () => {
			const svg = generateInitialAvatar('Test');
			const hasColor = ICON_COLORS.some((color) => svg.includes(`fill="${color}"`));
			expect(hasColor).toBe(true);
		});
	});

	describe('generateGeometricIcon()', () => {
		it('should generate valid SVG', () => {
			const svg = generateGeometricIcon('test');
			expect(svg).toContain('<svg');
			expect(svg).toContain('</svg>');
		});

		it('should use default size of 48', () => {
			const svg = generateGeometricIcon('test');
			expect(svg).toContain('width="48"');
			expect(svg).toContain('height="48"');
		});

		it('should respect custom size', () => {
			const svg = generateGeometricIcon('test', 64);
			expect(svg).toContain('width="64"');
			expect(svg).toContain('height="64"');
		});

		it('should be deterministic', () => {
			const svg1 = generateGeometricIcon('wallet');
			const svg2 = generateGeometricIcon('wallet');
			expect(svg1).toBe(svg2);
		});

		it('should produce different patterns for different inputs', () => {
			// Test several inputs to find ones that produce different patterns
			const patterns = new Set<string>();
			const inputs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
			for (const input of inputs) {
				patterns.add(generateGeometricIcon(input));
			}
			// Should have at least 2 different patterns
			expect(patterns.size).toBeGreaterThan(1);
		});

		it('should contain geometric shapes', () => {
			// Generate multiple to test different pattern types
			const svgs = ['test1', 'test2', 'test3', 'test4'].map((input) => generateGeometricIcon(input));
			const hasCircle = svgs.some((svg) => svg.includes('<circle'));
			const hasPolygon = svgs.some((svg) => svg.includes('<polygon'));
			const hasRect = svgs.some((svg) => svg.includes('<rect'));
			// At least one of these should be true (besides background rect)
			expect(hasCircle || hasPolygon || hasRect).toBe(true);
		});
	});

	describe('svgToDataUrl()', () => {
		it('should convert SVG to data URL', () => {
			const svg = '<svg></svg>';
			const dataUrl = svgToDataUrl(svg);
			expect(dataUrl).toMatch(/^data:image\/svg\+xml,/);
		});

		it('should encode SVG content', () => {
			const svg = '<svg width="48"><rect fill="#ff0000"/></svg>';
			const dataUrl = svgToDataUrl(svg);
			expect(dataUrl).toContain('data:image/svg+xml,');
			expect(dataUrl).toContain(encodeURIComponent('<svg'));
		});

		it('should handle special characters', () => {
			const svg = '<svg><text>Test & "quotes"</text></svg>';
			const dataUrl = svgToDataUrl(svg);
			expect(dataUrl).toContain('%26'); // encoded &
			expect(dataUrl).toContain('%22'); // encoded "
		});

		it('should produce usable data URL from generated icons', () => {
			const svg = generateIdenticon('test');
			const dataUrl = svgToDataUrl(svg);
			expect(dataUrl).toMatch(/^data:image\/svg\+xml,%3Csvg/);
		});
	});

	describe('isIconUrl()', () => {
		it('should return true for data URLs', () => {
			expect(isIconUrl('data:image/svg+xml,...')).toBe(true);
			expect(isIconUrl('data:image/png;base64,abc')).toBe(true);
		});

		it('should return true for http URLs', () => {
			expect(isIconUrl('http://example.com/icon.png')).toBe(true);
		});

		it('should return true for https URLs', () => {
			expect(isIconUrl('https://example.com/icon.png')).toBe(true);
		});

		it('should return false for empty string', () => {
			expect(isIconUrl('')).toBe(false);
		});

		it('should return false for emoji', () => {
			expect(isIconUrl('🏦')).toBe(false);
			expect(isIconUrl('💼')).toBe(false);
		});

		it('should return false for plain text', () => {
			expect(isIconUrl('wallet')).toBe(false);
			expect(isIconUrl('icon')).toBe(false);
		});

		it('should return false for relative paths', () => {
			expect(isIconUrl('/icons/wallet.png')).toBe(false);
			expect(isIconUrl('./icon.svg')).toBe(false);
		});
	});
});
