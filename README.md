# Ton Connection - DEPRECATED
> A library for connecting to ton


## Deprecation notice
With the release of [TON Connect 2](https://github.com/ton-connect/sdk), after TonHub will adhere to the TC2 standard, this library will no longer be needed.

For now, it is recommended to use TC2, and add Tonhub support manually (use this library as a reference implementation only) if needed.

## Description

=> Note: This library is in alpha. Use at your own risk.

The library currently the following operations:
 1. Retrieving a wallet details
 2. Sending a transaction

Current supported wallet providers are:

- Tonhub (via [ton-x](https://github.com/ton-foundation/ton-x) connector)
- Ton wallet chrome extension
- Mnemonic-based provider

## Usage

```
const tonHubCon = new TonConnection(
  new TonhubProvider({
    isSandbox: true,
    onSessionLinkReady: (session) => {
      // For example, display `session.link` as a QR code for the mobile tonhub wallet to scan
    },
    persistenceProvider: localStorage, // If you want the persist the session
  }),
  EnvProfiles[Environments.SANDBOX].rpcApi
);
const wallet = await tonHubCon.connect(); // Get wallet details

// Send a transaction
await tonHubCon.requestTransaction(...)
```

## Future

- Support disconnection
- Support transaction details (exit code)
- Support get methods
