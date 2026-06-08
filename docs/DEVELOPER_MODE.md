# Developer Mode

## Overview

Developer Mode is an advanced feature that allows you to edit the list of supported protocols for each wallet. This is useful for testing, debugging, and working with wallets that support specific protocol variants.

## Enabling Developer Mode

1. Open the extension options page
2. Navigate to the **Settings** tab
3. Check the **Developer Mode** checkbox

## Using Developer Mode

### Adding Protocols to a New Wallet

When Developer Mode is enabled, you'll see an additional field when adding a new wallet:

1. Go to the **Add Wallet** tab
2. Fill in the wallet details (name, URL, etc.)
3. In the **Supported Protocols** field, enter protocol identifiers one per line

Example protocols:
```
openid4vp
openid4vp-v1-unsigned
openid4vp-v1-signed
w3c-vc
```

### Editing Protocols for Existing Wallets

1. Ensure Developer Mode is enabled
2. Go to the **My Wallets** tab
3. Click **Edit** on any wallet
4. The **Supported Protocols** field will be visible in the edit dialog
5. Add, modify, or remove protocol identifiers (one per line)
6. Click **Save Changes**

### Viewing Protocols

When Developer Mode is enabled, wallet cards will display the supported protocols for each wallet in a dedicated section.

## Protocol Identifiers

Protocol identifiers are strings that match the `protocol` field in Digital Credentials API requests. Common examples:

- `openid4vp` - Generic OpenID4VP support
- `openid4vp-v1-unsigned` - OpenID4VP v1.0 with unsigned requests
- `openid4vp-v1-signed` - OpenID4VP v1.0 with signed requests (JAR)
- `w3c-vc` - W3C Verifiable Credentials
- `mdoc-openid4vp` - mDoc with OpenID4VP

## Preset Wallets

The wwWallet Demo preset (demo.wwwallet.org) comes pre-configured with these protocols:
- `openid4vp`
- `openid4vp-v1-unsigned`
- `openid4vp-v1-signed`

## How Protocol Matching Works

When a website uses the Digital Credentials API to request credentials:

1. The extension handles the request
2. It extracts the `protocol` field from each credential request
3. It filters wallets to show only those that have the requested protocol in their `protocols` array
4. If no wallets match, the request is passed to the browser's native implementation

### Example Request

```javascript
navigator.credentials.get({
  digital: {
    requests: [{
      protocol: "openid4vp-v1-unsigned",
      data: { /* request details */ }
    }]
  }
});
```

This request will only match wallets that have `openid4vp-v1-unsigned` in their protocols list.

## Use Cases

### Testing New Protocol Variants

If you're testing a wallet that supports a new protocol variant:

1. Enable Developer Mode
2. Add or edit the wallet
3. Add the protocol identifier to the protocols list
4. The wallet will now appear for requests using that protocol

### Debugging Protocol Mismatches

If a wallet isn't appearing when expected:

1. Enable Developer Mode
2. Check the wallet's protocols list
3. Compare with the protocol identifier in the request
4. Update the protocols list to include the exact identifier

### Working with Multiple Protocol Versions

Some wallets support multiple versions of the same protocol. For example:

```
openid4vp
openid4vp-v1-unsigned
openid4vp-v1-signed
openid4vp-v2-unsigned
```

Add all supported variants to ensure the wallet appears for all compatible requests.

## Security Considerations

Developer Mode is intended for advanced users and developers. When editing protocols:

- Only add protocols that the wallet actually supports
- Incorrect protocol configuration may cause requests to fail
- The wallet must be able to handle the protocol format it claims to support

## Disabling Developer Mode

When Developer Mode is disabled:

- The protocols field is hidden from add/edit forms
- Existing protocol configurations are preserved
- Protocol matching continues to work normally
- Wallet cards no longer display protocols

## Export/Import Configuration

Protocol configurations are included when you export your wallet configuration. This allows you to:

- Share configurations with team members
- Backup your protocol settings
- Migrate settings between browsers or machines
