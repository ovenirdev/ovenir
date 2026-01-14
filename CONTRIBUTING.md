# Contributing to OVENIR

Thank you for your interest in contributing to OVENIR! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ovenir.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Workflow
```bash
# Start dev server
pnpm dev

# Run linting
pnpm lint

# Run type checking
pnpm typecheck

# Run tests
pnpm test

# Format code
pnpm format
```

## Commit Messages

We use conventional commits. Format:
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(tools): add UUID generator`
- `fix(paste-guard): detect AWS keys correctly`
- `docs(readme): update installation instructions`

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all checks pass (`pnpm lint && pnpm typecheck && pnpm test`)
4. Request review from maintainers

## Adding a New Tool

1. Create folder in `packages/tools/your-tool-name/`
2. Implement required files:
   - `index.ts` — Tool logic (pure function)
   - `meta.ts` — Metadata, tags, i18n keys
   - `schema.ts` — Zod input/output schemas
   - `your-tool.test.ts` — Tests with golden data
3. Add content in `content/tools/{en,fr,ja}/your-tool-name.mdx`
4. Submit PR

## Developer Certificate of Origin (DCO)

By contributing, you certify that you wrote the code or have the right to submit it. Sign off your commits:
```bash
git commit -s -m "feat(tools): add new tool"
```

## Questions?

Open a [Discussion](https://github.com/ovenirdev/ovenir/discussions) or reach out to maintainers.
