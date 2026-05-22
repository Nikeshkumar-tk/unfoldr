# @unfoldr/web

Operator console for Unfoldr. Vite + React 19 + TypeScript + Tailwind v4 + aws-amplify v6.

## Setup

1. Deploy the infra stack (from `apps/infra/`, run `pnpm run deploy`).
2. Copy the `UserPoolId` and `UserPoolClientId` from the CDK outputs.
3. From this directory:
   ```sh
   cp .env.example .env.local
   ```
4. Open `.env.local` and fill in `VITE_USER_POOL_ID`, `VITE_USER_POOL_CLIENT_ID`, and `VITE_ORG_NAME`.

## Local dev

```sh
pnpm dev
```

App runs at `http://localhost:5173`.

## Production build

```sh
pnpm build
pnpm preview   # local sanity check of the built bundle
```

Env vars from `.env.local` are inlined at build time. Re-build to change them.

## What's included

- `/signin` — email + password sign-in, also handles the first-login "set new password" challenge inline.
- `/reset-password` — forgot password (request code, then set new password).
- `/verify-email` — confirm sign-up code, with resend.
- `/` — minimal protected home page (welcome + sign out).
