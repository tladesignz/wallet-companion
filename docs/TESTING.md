# Testing Guide

This guide covers how to run and debug tests for Wallet Companion.

## Test Stack

- Unit and integration tests: Vitest
- End-to-end tests: Playwright
- Fixture server: tests/support/server.ts

## Commands

```bash
# Unit tests
make test

# Integration tests
make test-integration

# E2E tests
make test-e2e

# Watch mode
make test-watch

# Coverage
make test-coverage

# Full validation pipeline
make test-all
```

## Fixture Pages

Start the local fixture server:

```bash
make test-server
```

Then open:

- http://127.0.0.1:3456/
- http://127.0.0.1:3456/mock-wallet.html
- http://127.0.0.1:3456/mock-verifier.html

## Suggested Workflow

1. Run `make test` while iterating on unit-level behavior.
2. Run `make test-integration` for cross-module behavior.
3. Run `make build-chrome && make test-e2e` before merge.
4. Run `make test-all` for final validation.

## Debugging Failures

- Re-run a failing suite in isolation with its specific command.
- Check browser and extension logs when debugging e2e behavior.
- Verify fixture server is running when tests depend on local pages.
- Confirm built artifacts exist in `dist/` before browser-level tests.

## Related Docs

- [DEVELOPMENT.md](DEVELOPMENT.md)
- [API_REFERENCE.md](API_REFERENCE.md)
- [design/PROTOCOL_SUPPORT.md](design/PROTOCOL_SUPPORT.md)
