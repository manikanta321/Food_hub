# HealthyBowl

Responsive Angular storefront for fresh salad delivery inside apartment
communities.

## Prerequisites

- Node.js 24.15.x (see `.nvmrc`)
- npm 10 or newer

With `nvm` installed:

```bash
nvm install
nvm use
```

## Development

```bash
npm install
npm start
```

Open `http://localhost:4200/`. The development server reloads after source
changes.

## Verification

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Production output is written to `dist/healthy-bowl`.

## Specifications

The Markdown files in `specs/` are the product and technical source of truth.
Implement one documented phase at a time and update the specifications when an
implementation decision changes them.
