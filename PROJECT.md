# Unfoldr

An open-source, self-hostable deployment platform for startups.

## Mission

Unfoldr lets a small team self-host an AWS-based deployment platform from a single repo. The first module is **React app deployments** — give it a Git repo URL and environment variables, and it deploys to AWS using S3 + CloudFront + CodeBuild. Future modules will extend beyond React.

Everything is deployable from a fresh checkout. A self-hoster runs `cdk deploy`, copies a few output values into env files, and has a working platform.

## Current modules

| Module        | Location                                            | Status      |
| ------------- | --------------------------------------------------- | ----------- |
| Cognito       | [apps/infra/src/modules/cognito.ts](apps/infra/src/modules/cognito.ts) | done        |
| DynamoDB      | [apps/infra/src/modules/dynamodb.ts](apps/infra/src/modules/dynamodb.ts) | done        |
| HTTP API      | [apps/infra/src/modules/http-api.ts](apps/infra/src/modules/http-api.ts) | done        |
| Lambdas       | [packages/lambdas/](packages/lambdas/)              | done        |
| Web console   | [apps/web/](apps/web/)                              | done (auth) |
| React deploys | (planned: S3 + CloudFront + CodeBuild)              | planned     |

## Repo layout

```
unfoldr/
├── apps/
│   ├── infra/   # AWS CDK stack — Cognito, DynamoDB, HTTP API, Lambdas
│   └── web/     # React + Vite operator console (sign-in, auth flows)
├── packages/
│   ├── aws/             # Typed AWS SDK helpers (DynamoDB client + key builders)
│   ├── github/          # Octokit-based GitHub helpers
│   ├── lambdas/         # All Lambda handlers + per-trigger configs
│   ├── logger/          # AWS Lambda Powertools logger
│   ├── types/           # Shared lambda config + handler types
│   ├── ui/              # Shared React component primitives (placeholder)
│   ├── eslint-config/   # Shared ESLint flat configs
│   └── typescript-config/ # Shared tsconfigs
└── PROJECT.md   # This file
```

## Self-host quickstart

1. `pnpm install` at repo root.
2. Configure AWS credentials (`~/.aws/credentials`) and edit [apps/infra/src/config.ts](apps/infra/src/config.ts).
3. From `apps/infra/`, run `pnpm run deploy`.
4. From the `cdk deploy` outputs, copy `UserPoolId` and `UserPoolClientId` into [apps/web/.env.local](apps/web/.env.example).
5. From `apps/web/`, run `pnpm dev`.
