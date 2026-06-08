# Wallet Management

This document describes wallet configuration and lifecycle behavior in Wallet Companion.

## Core Concepts

Each configured wallet includes:

- Name
- URL endpoint
- Supported protocols
- Optional description and visual metadata
- Enabled/disabled state

Wallet entries are used by request routing and wallet selection UI.

## User Management Flow

Users can:

1. Add wallets
2. Edit wallet metadata
3. Enable or disable wallets
4. Remove wallets

Configured wallets are persisted in extension storage.

## Selection Behavior

When a request arrives:

1. Wallets are filtered by protocol compatibility.
2. Disabled wallets are excluded.
3. A wallet chooser is shown when multiple candidates are available.

If no compatible wallet is available, the request falls back to native behavior or returns an error depending on flow context.

## Registration API Integration

Wallet software can self-register through `window.WalletCompanion.registerWallet(...)`.

Registration must include at least:

- Wallet name
- Wallet URL
- Non-empty protocol list

See:

- `WALLET_API.md`
- `../API_REFERENCE.md`

## Operational Guidance

- Prefer stable HTTPS wallet URLs.
- Keep protocol declarations accurate to avoid routing mismatches.
- Disable wallets temporarily instead of deleting when diagnosing behavior.

## Related Docs

- [WALLET_API.md](WALLET_API.md)
- [PROTOCOL_SUPPORT.md](PROTOCOL_SUPPORT.md)
- [../API_REFERENCE.md](../API_REFERENCE.md)
