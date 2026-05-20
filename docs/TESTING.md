# Testing Guide

## Overview

This project includes both **unit tests** and **integration tests** to ensure the browser extension works correctly across all features.

## Testing Stack

- **Vitest** - Unit and integration testing framework
- **Puppeteer** - Integration testing (browser automation)
- **jsdom** - DOM testing environment

## Test Structure

```
tests/
├── setup.ts                   # Vitest setup and mocks
├── background.test.ts         # Background script tests
├── content.test.ts            # Content script message bridge
├── inject.test.ts             # DC API & wallet registration tests
├── jwt-verification.test.ts   # JWT callback tests
├── modal.test.ts              # Wallet selector modal tests
├── openid4vp.test.ts          # OpenID4VP protocol tests
├── options.test.ts            # Options page logic tests
├── popup.test.ts              # Popup UI tests
├── protocols.test.ts          # Protocol plugin tests
├── integration.test.ts        # E2E integration tests (separate config)
└── wallet-integration.test.ts # Wallet integration tests (separate config)
```

## Running Tests

### All Tests
```bash
pnpm test
```

### Unit Tests Only
```bash
pnpm test:unit
```

### Integration Tests Only
```bash
# First, build the Chrome extension
pnpm build:chrome

# Then run integration tests
pnpm test:integration
```

### Watch Mode (for development)
```bash
pnpm test:watch
```

### Coverage Report
```bash
pnpm test:coverage
```

### Full Test Suite
```bash
pnpm test:all
```

## Test Categories

### Unit Tests

#### Background Script Tests (`background.test.ts`)
- ✅ Wallet storage and retrieval
- ✅ Wallet registration (auto-registration API)
- ✅ Duplicate detection
- ✅ Extension settings management
- ✅ Usage statistics tracking
- ✅ Message handling

#### Inject Script Tests (`inject.test.ts`)
- ✅ DC API interception detection
- ✅ Request ID generation
- ✅ Event dispatching
- ✅ Wallet registration API exposure
- ✅ URL validation
- ✅ Response handling
- ✅ Error handling

#### Options Page Tests (`options.test.ts`)
- ✅ Wallet CRUD operations
- ✅ wwWallet preset handling
- ✅ Form validation
- ✅ Import/Export functionality
- ✅ Statistics calculation
- ✅ HTML escaping (XSS prevention)
- ✅ Tab switching logic

### Integration Tests

#### Extension Installation (`integration.test.ts`)
- ✅ Extension loads successfully
- ✅ Extension ID is generated
- ✅ Extension pages are accessible

#### Options Page Integration
- ✅ Page loads correctly
- ✅ Tabs are displayed
- ✅ Tab switching works
- ✅ Statistics are displayed

#### DC API Interception
- ✅ Injection script is loaded
- ✅ API is available on page
- ✅ Extension detection works

#### Wallet Auto-Registration
- ✅ Register wallet via API
- ✅ Duplicate detection works
- ✅ Check wallet registration status
- ✅ Unregistered wallets return false

#### Popup Interface
- ✅ Status displayed
- ✅ Wallet count displayed
- ✅ Intercept count displayed
- ✅ Buttons are present

## Test Mocks

### Browser APIs
The Vitest setup ([tests/setup.ts](../tests/setup.ts)) provides mocks for:
- `chrome.runtime`
- `chrome.storage`
- `chrome.tabs`
- `browser.*` (Firefox compatibility)

### DOM APIs
- `window.location`
- `navigator.credentials`
- `document.createElement`
- Custom events

### Console
Console methods are mocked to reduce test noise while still being testable.

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = someFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Integration Test Example

```typescript
import { it, expect } from 'vitest';
import puppeteer from 'puppeteer';

it('should interact with extension', async () => {
  const page = await browser.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  
  const element = await page.$('#someElement');
  expect(element).toBeTruthy();
  
  await page.close();
}, 10000); // Timeout for async operations
```

## Coverage

Run `pnpm test:coverage` to generate a coverage report.

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML report (open in browser)
- `coverage/coverage-final.json` - JSON report
- Terminal output shows coverage summary

### Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run unit tests
        run: pnpm test:unit
      
      - name: Build extension
        run: pnpm build:chrome
      
      - name: Run integration tests
        run: pnpm test:integration
      
      - name: Generate coverage
        run: pnpm test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Troubleshooting

### Integration Tests Fail

**Problem**: Integration tests timeout or fail to find extension

**Solutions**:
1. Ensure Chrome extension is built: `pnpm build:chrome`
2. Check that `dist/chrome/` directory exists and contains all files
3. Increase timeout in test (default is 10000ms)
4. Run with `headless: false` to see what's happening

### Tests Can't Find Modules

**Problem**: `Cannot find module 'XXX'`

**Solutions**:
1. Install dependencies: `pnpm install`
2. Check Jest configuration in `jest.config.js`
3. Ensure babel is configured correctly

### Puppeteer Issues

**Problem**: Puppeteer fails to launch browser

**Solutions**:
1. Install dependencies: `sudo apt-get install chromium-browser` (Linux)
2. Set `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false`
3. Try running with different browser: `puppeteer.launch({ executablePath: '/path/to/chrome' })`

### Mocks Not Working

**Problem**: Browser APIs return undefined

**Solutions**:
1. Check that `tests/setup.js` is loaded (configured in `jest.config.js`)
2. Clear Jest cache: `npx jest --clearCache`
3. Restart Jest if running in watch mode

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` to reset state
- Don't rely on test execution order

### 2. Descriptive Names
```javascript
// Good
test('should return existing wallet if URL already registered', () => {});

// Bad
test('test1', () => {});
```

### 3. AAA Pattern
- **Arrange**: Set up test data
- **Act**: Execute the code being tested
- **Assert**: Verify the results

### 4. Mock External Dependencies
- Don't make real API calls in tests
- Mock `chrome.*` APIs
- Mock file system operations

### 5. Async Handling
```javascript
// Use async/await
test('should handle async operations', async () => {
  const result = await someAsyncFunction();
  expect(result).toBe('value');
});

// Or return promises
test('should handle promises', () => {
  return someAsyncFunction().then(result => {
    expect(result).toBe('value');
  });
});
```

## Test Data

### Sample Wallets
```javascript
const mockWallets = [
  {
    id: 'wallet-1',
    name: 'Test Wallet',
    url: 'https://wallet.test.com',
    icon: '🔐',
    color: '#3b82f6',
    enabled: true
  }
];
```

### Sample Credentials Request
```javascript
const credentialRequest = {
  digital: true,
  mediation: 'optional',
  identity: {
    providers: [{
      protocol: 'openid4vp',
      request: JSON.stringify({
        client_id: 'test-client',
        response_type: 'vp_token'
      })
    }]
  }
};
```

## Debugging Tests

### VS Code Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest: Current File",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "${fileBasenameNoExtension}",
        "--config",
        "jest.config.js"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Console Debugging

Temporarily enable console output in specific tests:

```javascript
test('debug test', () => {
  console.log = jest.fn((...args) => {
    // Actually log
    global.console.log(...args);
  });
  
  // Your test code
});
```

## Performance

### Slow Tests

If tests are slow:
1. Use `--maxWorkers=4` to limit parallelization
2. Increase timeout for specific tests
3. Mock expensive operations
4. Use `test.only()` to run specific tests during development

### Memory Issues

If tests run out of memory:
1. Run tests serially: `jest --runInBand`
2. Increase Node memory: `NODE_OPTIONS=--max_old_space_size=4096 npm test`
3. Clean up resources in `afterEach`/`afterAll`

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Puppeteer Documentation](https://pptr.dev/)
- [Testing Library](https://testing-library.com/)
- [Chrome Extension Testing](https://developer.chrome.com/docs/extensions/mv3/tut_testing/)
