# OVENIR — État du Projet

> **Developer tools. Local. Private. Fast.**

---

## 📊 Vue d'Ensemble

| Aspect | Status |
|--------|--------|
| **Version** | 0.0.1 (Beta) |
| **License** | AGPL-3.0 |
| **Repo** | github.com/ovenirdev/ovenir |
| **Domain** | ovenir.com |
| **Stack** | Next.js 16 + React 19 + TypeScript + Tailwind 4 |
| **Infra** | VPS + Cloudflare + Plausible Analytics |

---

## 🏗️ Architecture
```
OVENIR/
├── apps/
│   └── web/                    # Next.js App (frontend)
├── packages/
│   ├── core/                   # Types, détection, utilitaires
│   ├── tools/                  # Outils individuels (plugins)
│   ├── flows/                  # Pipelines d'outils (à venir)
│   ├── seo/                    # Schemas structured data
│   └── ui/                     # Composants UI partagés (à venir)
├── content/
│   ├── tools/{en,fr,ja}/       # Contenu MDX par outil
│   ├── flows/{en,fr,ja}/       # Contenu MDX par flow
│   └── hubs/{en,fr,ja}/        # Pages hub (catégories)
└── scripts/                    # Scripts de build/deploy
```

### Monorepo

- **Package Manager** : pnpm 10.28.0
- **Build System** : Turborepo
- **Workspaces** : `apps/*`, `packages/*`, `packages/tools/*`, `packages/flows/*`

---

## 🎨 Design System

### Philosophie
- **Organic Tech** — Inspiré de Arc, Linear, Raycast
- **Glassmorphism** — Blur, transparence, gradients subtils
- **Privacy-first** — 100% client-side, aucune donnée envoyée

### Tokens CSS (`tokens.css`)

| Catégorie | Variables |
|-----------|-----------|
| **Couleurs** | `--orange-*`, `--slate-*`, `--coral`, `--rose` |
| **Glass** | `--glass-bg`, `--glass-border`, `--glass-blur` |
| **Typography** | `--text-xs` → `--text-5xl`, `--font-sans`, `--font-mono` |
| **Spacing** | `--space-0` → `--space-32` |
| **Radius** | `--radius-sm`, `--radius`, `--radius-pill` |
| **Shadows** | `--shadow-xs` → `--shadow-2xl`, `--shadow-glow` |
| **Motion** | `--duration-*`, `--ease-*` |
| **Z-index** | `--z-dropdown` → `--z-command` |

### Thèmes
- ✅ Light mode (défaut)
- ✅ Dark mode (`[data-theme="dark"]`)
- ✅ Compact mode (`[data-density="compact"]`)
- ✅ Reduced motion (`prefers-reduced-motion`)

### Font
- **Primary** : Instrument Sans Variable
- **Mono** : SF Mono / Fira Code / JetBrains Mono

---

## 🧩 Composants Clés

### Homepage (`page.tsx`)

| Élément | Description |
|---------|-------------|
| **Background** | Orbes animées + mesh gradient + noise |
| **Smart Input** | Détection auto du format collé |
| **Detection Card** | Affiche le format détecté + actions |
| **Quick Access** | 6 outils rapides |
| **Bento Grid** | Catalogue d'outils filtrable |
| **Categories** | Sliding indicator animé |

### Tool Page (`/tools/[slug]`)

| Élément | Description |
|---------|-------------|
| **Header** | Back link + brand + source link |
| **Mode Selector** | Encode/Decode toggle |
| **Runner Panels** | Input/Output côte à côte |
| **Swap Button** | Inverser input/output |
| **Privacy Badge** | Rappel 100% local |

### Tool Runner (`tool-runner.tsx`)

| Feature | Implémenté |
|---------|------------|
| URL params (input, mode) | ✅ |
| Auto-execute on change | ✅ |
| Debounce (150ms) | ✅ |
| Copy output | ✅ |
| Share link | ✅ |
| Swap input/output | ✅ |
| Error handling | ✅ |

---

## 🔧 Packages

### `@ovenir/core`
```typescript
// Types
export type { Tool, ToolMeta, ToolCategory, ToolResult } from './types/tool';
export type { Flow, FlowMeta, FlowStep, FlowState } from './types/flow';
export { runTool } from './types/tool';

// Detection
export { detectFormat } from './detect/detector';
export { FORMAT_PATTERNS } from './detect/patterns';
```

#### Format Patterns (7)
| Pattern | Catégorie | Confidence |
|---------|-----------|------------|
| JWT | crypto | 85-95% |
| JSON | data | 95% |
| Base64 | encoding | 60-80% |
| URL | web | 75-95% |
| UUID | id | 99% |
| Timestamp | time | 90% |
| Color (Hex) | web | 95% |

### `@ovenir/tools`
```typescript
export { base64Tool } from './base64';
export const tools: Record<string, Tool>;
export const getToolById = (id: string) => Tool | null;
export const getAllTools = () => Tool[];
```

#### Outils Implémentés

| Outil | Status | Tests |
|-------|--------|-------|
| **base64** | ✅ Complet | ✅ 6 tests |

#### Outils Prévus (V1)

| Outil | Catégorie | Complexité |
|-------|-----------|------------|
| JSON Studio | data | Medium |
| URL Parser | web | Easy |
| Hash Generator | crypto | Easy |
| UUID Generator | id | Easy |
| Timestamp Converter | time | Easy |
| JWT Decoder | crypto | Medium |
| Regex Tester | text | Medium |
| Diff Studio | text | Hard |
| YAML ↔ JSON | data | Easy |
| XML Format | data | Easy |
| SQL Format | data | Medium |
| Cron Parser | time | Easy |
| Color Picker | web | Easy |
| HTML Entities | web | Easy |

### `@ovenir/seo`
```typescript
export function generateToolSchema(tool) → SoftwareApplication
export function generateFlowSchema(flow) → HowTo
export function generateFAQSchema(faqs) → FAQPage
export function generateBreadcrumbSchema(items) → BreadcrumbList
```

---

## 🌐 SEO & i18n

### Langues Cibles
- 🇬🇧 English (défaut)
- 🇫🇷 Français
- 🇯🇵 日本語

### Structure URL
```
/tools/{slug}           # EN (défaut)
/fr/tools/{slug}        # FR
/ja/tools/{slug}        # JA
```

### Contenu MDX (`content/tools/`)
```yaml
---
id: base64
title: Base64 Encoder & Decoder
description: Encode and decode Base64 strings instantly...
category: encoding
tags: [base64, encode, decode, binary]
keywords: [base64 encoder, base64 decoder, base64 online]
ogImage: /og/tools/base64.png
---

# Base64 Encoder & Decoder
## What is Base64?
## How to use
## Examples
## Privacy & Security
## Technical details
## Common use cases
## Limitations
## Related tools
## FAQ
```

### Structured Data
- ✅ SoftwareApplication (outils)
- ✅ HowTo (flows)
- ✅ FAQPage (si FAQ présente)
- ✅ BreadcrumbList (navigation)

---

## ⌨️ Navigation & UX

### Méthodes d'Accès

| Méthode | Priorité | Couverture |
|---------|----------|------------|
| **Smart Paste** | P0 | 60% des cas |
| **Cmd+K** | P0 | 30% des cas |
| **Bento Grid** | P1 | 10% des cas |

### Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `⌘K` / `Ctrl+K` | Focus sur l'input principal |
| `⌘V` | Coller + détection auto |
| `Escape` | Clear / Close |

### Flow Utilisateur
```
1. User colle du contenu
   ↓
2. Détection automatique (< 50ms)
   ↓
3. Affichage du format + confidence
   ↓
4. Clic sur action (ex: "Decode →")
   ↓
5. Navigation vers /tools/{id}?input=...&mode=...
   ↓
6. Exécution automatique + affichage résultat
```

---

## 📁 Fichiers Clés

### Configuration

| Fichier | Description |
|---------|-------------|
| `package.json` | Root package, scripts turbo |
| `pnpm-workspace.yaml` | Définition des workspaces |
| `turbo.json` | Configuration Turborepo |
| `tsconfig.base.json` | Config TypeScript partagée |

### App Web

| Fichier | Description |
|---------|-------------|
| `apps/web/src/app/page.tsx` | Homepage |
| `apps/web/src/app/tools/[slug]/page.tsx` | Tool page (server) |
| `apps/web/src/app/tools/[slug]/client.tsx` | Tool page (client) |
| `apps/web/src/components/tool-runner.tsx` | Runner universel |
| `apps/web/src/styles/globals.css` | Styles globaux |
| `apps/web/src/styles/tokens.css` | Design tokens |
| `apps/web/tailwind.config.ts` | Config Tailwind |

### Core

| Fichier | Description |
|---------|-------------|
| `packages/core/src/types/tool.ts` | Types Tool, ToolMeta, runTool() |
| `packages/core/src/types/flow.ts` | Types Flow, FlowStep, FlowState |
| `packages/core/src/detect/patterns.ts` | Patterns de détection |
| `packages/core/src/detect/detector.ts` | Logique de détection |

---

## ✅ Complété

- [x] Monorepo pnpm + Turborepo
- [x] Design system (tokens, glassmorphism, themes)
- [x] Homepage avec Smart Paste + Bento Grid
- [x] Détection automatique de format (7 patterns)
- [x] Catégories avec sliding indicator
- [x] Tool Base64 complet avec tests
- [x] Tool Registry (`@ovenir/tools`)
- [x] Routes dynamiques `/tools/[slug]`
- [x] Tool Runner avec URL params
- [x] SEO schemas (SoftwareApplication, etc.)
- [x] MDX templates + contenu Base64
- [x] CI/CD GitHub → VPS
- [x] Cloudflare DNS + SSL
- [x] Plausible Analytics

---

## 🚧 En Cours / À Faire

### Phase 1 — Prochaines Étapes

| Tâche | Priorité | Effort |
|-------|----------|--------|
| i18n (next-intl) | P0 | 2h |
| MDX Pipeline (rendering) | P0 | 2h |
| 5 nouveaux outils | P1 | 4h |
| Command Palette (cmdk) | P1 | 2h |

### Phase 2 — Features

| Tâche | Priorité | Effort |
|-------|----------|--------|
| Flow System (types + UI) | P1 | 4h |
| Explore Page | P1 | 3h |
| Theme Toggle (light/dark) | P1 | 1h |
| Paste Guard UI | P1 | 2h |

### Phase 3 — Polish

| Tâche | Priorité | Effort |
|-------|----------|--------|
| Sitemap dynamique | P2 | 1h |
| OG Images | P2 | 2h |
| a11y Audit | P2 | 2h |
| Perf Audit | P2 | 1h |

---

## 🛠️ Commandes
```bash
# Installation
pnpm install

# Développement
pnpm dev

# Build
pnpm build

# Tests
pnpm test

# Typecheck
pnpm typecheck

# Lint
pnpm lint

# Clean
pnpm clean
```

---

## 🔗 Liens

- **Prod** : https://ovenir.com
- **GitHub** : https://github.com/ovenirdev/ovenir
- **Analytics** : Plausible (self-hosted)

---

## 📝 Notes

### Principes Non-Négociables

1. **100% Client-side** — Aucune donnée utilisateur ne quitte le navigateur
2. **Privacy-first** — Pas de tracking invasif, Plausible uniquement
3. **Offline-friendly** — Fonctionne sans internet après premier chargement
4. **Keyboard-first** — Tout accessible au clavier
5. **SEO-ready** — Chaque outil indexable avec contenu riche

### Contraintes Techniques

- Pas de backend pour le traitement des données
- Toute persistance = opt-in et explicite
- Pas de dark patterns
- Support navigateurs modernes (pas IE)

---

*Dernière mise à jour : Janvier 2026*
