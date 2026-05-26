# Extension Icons

This directory contains the extension's icon assets.

## Files

### Source Logos (SVG)
- `logo-light.svg` - Source logo for light backgrounds (white circle with blue design)
- `logo-dark.svg` - Source logo for dark backgrounds (optimized for dark themes)

### Generated Icons (PNG)
- `icon16.png` - 16×16px - Toolbar icon (small)
- `icon32.png` - 32×32px - Toolbar icon
- `icon48.png` - 48×48px - Extension management page
- `icon128.png` - 128×128px - Chrome Web Store, app drawer

## Regenerating Icons

Icons are automatically generated from `logo-light.svg` during the build process.

To manually regenerate:

```bash
npm run icons
```

This runs `scripts/generate-icons.js` which uses ImageMagick to convert the SVG logo to PNG at various sizes.

## Logo Colors

The logo uses:
- **Primary**: `#1C4587` (Deep Blue)
- **Background**: White (`#FFFFFF`)

This color scheme is used throughout the extension's UI for branding consistency.

## Requirements

- **ImageMagick** must be installed to generate icons
  - Ubuntu/Debian: `sudo apt-get install imagemagick`
  - macOS: `brew install imagemagick`

## Notes

- PNG icons are generated from SVG for best quality
- Icons include transparency (alpha channel)
- Source SVG files are preserved for future regeneration
- All icons meet Chrome/Firefox/Safari extension requirements
