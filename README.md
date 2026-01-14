<div align="center">
  <h1>OVENIR</h1>
  <p><strong>Developer tools. Local. Private. Fast.</strong></p>
  
  <p>
    <a href="https://ovenir.com">Website</a> •
    <a href="#features">Features</a> •
    <a href="#tools">Tools</a> •
    <a href="#contributing">Contributing</a>
  </p>
  
  <p>
    <img src="https://img.shields.io/github/license/ovenirdev/ovenir" alt="License" />
    <img src="https://img.shields.io/github/actions/workflow/status/ovenirdev/ovenir/ci.yml?branch=main" alt="CI" />
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
  </p>
</div>

---

## Why OVENIR?

Most developer tools require pasting sensitive data into random websites. OVENIR is different:

- 🔒 **100% client-side** — Your data never leaves your browser
- ⚡ **Instant** — No server round-trips, no loading spinners
- 🌐 **Offline-ready** — Works without internet after first load
- ⌨️ **Keyboard-first** — `Cmd+K` to find anything
- 🔗 **Flows** — Chain tools into reusable pipelines
- 🛡️ **Paste Guard** — Detects secrets, warns before pasting

## Features

### Command Palette
Press `Cmd+K` (or `Ctrl+K`) to instantly find and launch any tool.

### Explore
Browse tools by category with a premium bento-grid interface.

### Flows
Chain multiple tools into pipelines. Debug a JWT → decode Base64 → format JSON in one click.

### Paste Guard
Automatically detects secrets (API keys, tokens, passwords) in your clipboard. Warns before pasting. One-click redaction. Panic clear.

## Development
```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run tests
pnpm test

# Build
pnpm build
```

## Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

- 🐛 [Report a bug](https://github.com/ovenirdev/ovenir/issues/new?template=bug_report.yml)
- 💡 [Request a feature](https://github.com/ovenirdev/ovenir/issues/new?template=feature_request.yml)
- 🔧 [Request a tool](https://github.com/ovenirdev/ovenir/issues/new?template=tool_request.yml)

## License

[AGPL-3.0](./LICENSE) © OVENIR Contributors

---

<div align="center">
  <sub>Built with ❤️ for developers who care about privacy.</sub>
</div>
