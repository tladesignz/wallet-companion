# Branding Guide

## Logo

The extension logo is stored in SVG format in `src/icons/`:

- **logo-light.svg** - For use on light backgrounds (white background with blue design)
- **logo-dark.svg** - For use on dark backgrounds (same design, optimized for dark themes)

## Color Scheme

The extension uses a professional blue color palette based on the logo:

### Primary Colors

- **Brand Blue**: `#1C4587`
  - Used for: Primary buttons, headers, main UI elements
  - RGB: rgb(28, 69, 135)

- **Brand Blue Dark**: `#14366B`
  - Used for: Hover states, pressed buttons
  - RGB: rgb(20, 54, 107)

- **Brand Blue Light**: `#2557A7`
  - Used for: Gradients, accents
  - RGB: rgb(37, 87, 167)

### Supporting Colors

- **Success Green**: `#10b981`
  - Used for: Success messages, positive actions

- **Error Red**: `#ef4444`
  - Used for: Error messages, destructive actions

- **Warning Yellow**: `#fbbf24`
  - Used for: Warning messages, cautionary notices

- **Neutral Gray**: `#f9fafb`
  - Used for: Backgrounds, subtle UI elements

## Icons

Extension icons are automatically generated from `logo-light.svg` in multiple sizes:

- `icon16.png` - 16×16px (toolbar icon small)
- `icon32.png` - 32×32px (toolbar icon)
- `icon48.png` - 48×48px (extension management)
- `icon128.png` - 128×128px (Chrome Web Store, app drawer)

### Generating Icons

Icons are automatically generated during `make build` by the Vite build plugin using `sharp`. No separate command is needed.

## Typography

The extension uses system fonts for optimal performance and native feel:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif;
```

## UI Components

### Buttons

**Primary Button**
- Background: `#1C4587`
- Hover: `#14366B`
- Text: White

**Secondary Button**
- Background: `#f9fafb`
- Hover: `#e5e7eb`
- Text: `#1C4587`

### Cards & Containers

- Background: White
- Border: `#e5e7eb`
- Border Radius: 8px
- Shadow: `0 1px 3px rgba(0, 0, 0, 0.1)`

### Wallet Icons

Individual wallet icons can use custom colors. Default fallback color is `#1C4587`.

## File Locations

```
src/
├── icons/
│   ├── logo-light.svg      # Source logo (light backgrounds)
│   ├── logo-dark.svg       # Source logo (dark backgrounds)
│   ├── icon16.png          # Generated 16×16 icon
│   ├── icon32.png          # Generated 32×32 icon
│   ├── icon48.png          # Generated 48×48 icon
│   └── icon128.png         # Generated 128×128 icon
├── popup.html              # Uses brand colors in CSS
├── options.html            # Uses brand colors in CSS
└── modal.js                # Uses brand colors for UI

chrome/icons/               # Built icons for Chrome
firefox/icons/              # Built icons for Firefox
safari/icons/               # Built icons for Safari
```

## Updating Branding

To update the logo or colors:

1. **Update Logo**: Replace `src/icons/logo-light.svg` and/or `logo-dark.svg`
2. **Update Colors**: Search for color hex codes in `src/` and replace
3. **Rebuild**: Run `make build` (icons are regenerated automatically)

### Color References

Search for these colors to update the brand:

```bash
grep -r "#1C4587" src/    # Primary brand blue
grep -r "#14366B" src/    # Brand blue dark
grep -r "#2557A7" src/    # Brand blue light
```

## Design Principles

1. **Simplicity**: Clean, minimal interface
2. **Consistency**: Use brand colors consistently across all UI
3. **Accessibility**: Ensure sufficient color contrast (WCAG AA)
4. **Native Feel**: Use system fonts and standard UI patterns
5. **Professional**: Maintain a professional, trustworthy appearance

## Resources

- Logo SVG files are vector graphics, infinitely scalable
- Icons are generated at standard extension sizes
- All colors meet WCAG AA contrast requirements for accessibility
- Design follows Material Design and Human Interface Guidelines principles
