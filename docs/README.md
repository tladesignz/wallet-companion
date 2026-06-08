# Documentation

This directory contains the active documentation for Wallet Companion.

## Structure

```
docs/
├── QUICKSTART.md               # Verifier and wallet quick start
├── API_REFERENCE.md            # API request/response reference
├── DEVELOPMENT.md              # Build, test, and packaging workflow
├── TESTING.md                  # Testing practices and troubleshooting
├── CHANGELOG.md                # Documentation and project change notes
├── MAKEFILE.md                 # Make targets reference
├── BRANDING.md                 # Branding and visual assets
├── DEVELOPER_MODE.md           # Developer mode behavior and controls
├── WALLET_INVOCATION.md        # Wallet invocation flow details
├── browser/                    # Browser-specific notes
└── design/                     # Architecture and protocol design
```

## Documentation Index

### Getting Started

- **[QUICKSTART.md](QUICKSTART.md)** - Canonical quick start guide for verifiers and wallets
- **[API_REFERENCE.md](API_REFERENCE.md)** - Canonical API reference
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Canonical development setup and workflows
- **[TESTING.md](TESTING.md)** - Testing guide and best practices

### Design Documents (`design/`)

- **[PROTOCOL_SUPPORT.md](design/PROTOCOL_SUPPORT.md)** - Protocol-aware business logic, plugin architecture, and W3C Digital Credentials API implementation
- **[WALLET_API.md](design/WALLET_API.md)** - Wallet registration and communication API
- **[WALLET_MANAGEMENT.md](design/WALLET_MANAGEMENT.md)** - Wallet management system design

### Brand Guidelines

- **[BRANDING.md](BRANDING.md)** - Complete branding guide including logo usage, color palette, typography, and UI components

### Project Information

- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes
- **[MAKEFILE.md](MAKEFILE.md)** - Build system documentation
- **[WALLET_INVOCATION.md](WALLET_INVOCATION.md)** - Wallet invocation behavior
- **[DEVELOPER_MODE.md](DEVELOPER_MODE.md)** - Developer mode guidance

## Quick Links

### For Developers

- [Protocol Plugin System](design/PROTOCOL_SUPPORT.md#protocol-plugin-system) - How to create custom protocol plugins
- [Architecture Overview](design/PROTOCOL_SUPPORT.md#architecture) - System design and data flow
- [Testing](design/PROTOCOL_SUPPORT.md#testing) - How to test protocol implementations

### For Designers

- [Logo Files](BRANDING.md#logo-files) - Available logo formats and usage
- [Color Palette](BRANDING.md#color-palette) - Brand colors and their applications
- [Icon Generation](BRANDING.md#icon-generation) - How to regenerate extension icons

### For Wallet Developers

- [Wallet Registration](design/PROTOCOL_SUPPORT.md#wallet-registration) - How to register your wallet with the extension
- [Protocol Specifications](design/PROTOCOL_SUPPORT.md#protocol-specifications) - Supported protocols and their formats

## Contributing to Documentation

When adding new documentation:

1. **Design Documents**: Place in `docs/design/`
2. **User/Contributor Guides**: Place in `docs/`
3. **Brand Assets**: Store source files in `src/icons/`, document in `docs/BRANDING.md`

### Documentation Standards

- Use Markdown format (`.md`)
- Include table of contents for documents > 200 lines
- Add code examples where applicable
- Reference related documents with relative links
- Keep line length ≤ 120 characters for readability
- Update this index when adding new documents

## Generating Documentation

Documentation is currently maintained manually. For API and test details, use existing project commands:

```bash
# Generate test coverage reports
make test-coverage
```

## License

This documentation is part of the Wallet Companion project and is licensed under the same terms as the project itself.
