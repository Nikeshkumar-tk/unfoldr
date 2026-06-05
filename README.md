# Unfoldr

> An open-source, self-hostable internal deployment platform for startups — built on AWS, pay only for what you use.

Unfoldr lets a small team stand up their own Vercel/Netlify-style deployment platform inside their own AWS account. Point it at a Git repo, give it env vars, and it ships your app to S3 + CloudFront via CodeBuild. No vendor markup, no per-seat pricing, no leaving your cloud.

## Why Unfoldr?

Most startups end up in one of two places:

1. **Pay a managed PaaS** (Vercel, Netlify, Render). Fast to start, but cost scales painfully with traffic, build minutes, and seats — and your app lives in someone else's account.
2. **Roll your own CI/CD on AWS.** Cheap to run, but every team rebuilds the same scaffolding — Cognito for auth, an API for projects, CodeBuild pipelines, CloudFront distributions, DNS wiring. It's weeks of undifferentiated work.

Unfoldr is the second option, productized and open-sourced. One `cdk deploy` from a fresh checkout gives you a working internal deployment platform on serverless AWS primitives. You only pay AWS for the resources you actually use — typically a few dollars a month for a small team, scaling linearly with usage rather than per seat.

**Designed for:**

- Startups running internal tools, dashboards, and frontend apps who don't want to babysit deployments.
- Teams that want their deployments inside their own AWS account for compliance, cost, or control reasons.
- Anyone tired of stitching together GitHub Actions + S3 + CloudFront by hand for every new project.

## What it does today

- **React app deployments.** Connect a GitHub repo, set env vars, and Unfoldr provisions a dedicated S3 bucket + CloudFront distribution and runs a CodeBuild job that builds and ships the bundle. Status streams back to the console.
- **GitHub App integration.** Install the Unfoldr GitHub App on the orgs/repos you want to deploy from — no PATs, no SSH keys.
- **Multi-org, multi-user.** Cognito-backed auth, organization scoping, and per-org GitHub connections.
- **Custom domains.** Bring your own domain via Route 53 or any external DNS provider.
- **Build event pipeline.** CodeBuild status events flow through EventBridge into Lambdas that update deployment records in DynamoDB.

## Architecture

Everything runs serverless on AWS — there are no always-on servers to babysit, and you only pay for what you use.

![Unfoldr architecture](docs/architecture.svg)

> The editable source lives at [docs/architecture.drawio](docs/architecture.drawio) — open it in [diagrams.net](https://app.diagrams.net) (or the **Draw.io Integration** VS Code extension) to modify. The rendered diagram above is [docs/architecture.svg](docs/architecture.svg); regenerate it via **File → Export As → SVG** in draw.io after any change.
>
> **Flow at a glance:** Operators sign in to the React console (S3 + CloudFront) and authenticate via Cognito. The console calls the HTTP API (API Gateway + Lambda) which reads/writes DynamoDB and talks to GitHub through the self-installed GitHub App. Creating a project triggers a per-project CodeBuild job that clones the repo, builds the bundle, and uploads it to a dedicated S3 bucket fronted by CloudFront + ACM. CodeBuild status flows through EventBridge into a Lambda that syncs deployment records back to DynamoDB. DNS is wired through Route 53 or your external provider. The whole stack is defined in one AWS CDK app.

### Tech stack

| Layer              | What we use                                                                   |
| ------------------ | ----------------------------------------------------------------------------- |
| Infra-as-code      | **AWS CDK v2** (TypeScript) — one stack, one `cdk deploy`                     |
| Compute            | **AWS Lambda** (Node.js), grouped by trigger (HTTP API, Cognito, EventBridge) |
| API                | **API Gateway HTTP API** with a Cognito JWT authorizer                        |
| Auth               | **Cognito User Pool** + hosted UI flows                                       |
| Data               | **DynamoDB** single-table design (typed key-builders in `packages/aws`)       |
| Build runner       | **CodeBuild** projects provisioned per app                                    |
| Hosting (output)   | **S3 + CloudFront + ACM** per deployed app                                    |
| Eventing           | **EventBridge** rules → Lambda for CodeBuild status sync                      |
| GitHub             | **Octokit** via a self-hosted **GitHub App** (`packages/github`)              |
| Operator console   | **React 19 + Vite 8**, TanStack Query, React Hook Form + Zod, Tailwind v4     |
| Monorepo / tooling | **pnpm workspaces + Turborepo**, TypeScript 5, ESLint flat config, Prettier   |

### Repo layout

```
unfoldr/
├── apps/
│   ├── infra/                 # AWS CDK stack — entry point for `cdk deploy`
│   │   └── src/modules/       # One construct per AWS module (cognito, hosting, http-api, ...)
│   └── web/                   # React + Vite operator console
├── packages/
│   ├── aws/                   # Typed AWS SDK helpers (DynamoDB clients, key builders, CodeBuild, hosting)
│   ├── cloudfront-fns/        # CloudFront Functions (edge logic)
│   ├── github/                # Octokit-based GitHub App helpers
│   ├── lambdas/               # All Lambda handlers, grouped by trigger type
│   ├── logger/                # AWS Lambda Powertools logger wrapper
│   ├── nodemailer/            # Email helpers
│   ├── types/                 # Shared handler + config types
│   ├── ui/                    # Shared React primitives
│   ├── eslint-config/         # Shared ESLint flat configs
│   └── typescript-config/     # Shared tsconfigs
├── turbo.json
└── pnpm-workspace.yaml
```

## Prerequisites

Before you start, you'll need:

- **Node.js ≥ 18** and **pnpm 9** (`npm install -g pnpm@9`)
- An **AWS account** with admin (or sufficiently broad) credentials configured in `~/.aws/credentials`
- The **AWS CDK CLI** (`npm install -g aws-cdk`) and a [bootstrapped](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) target region
- A **GitHub App** you control (for repo access). You'll need its App ID, Client ID, and a private key
- A **domain name** you can point at AWS (used both for the operator console and for deployed apps)

## Installation

### 1. Clone and install dependencies

```sh
git clone https://github.com/<your-org>/unfoldr.git
cd unfoldr
pnpm install
```

### 2. Configure the infra stack

Create `apps/infra/.env` with:

```sh
ACCOUNT_ID=123456789012          # Your AWS account ID
REGION=us-east-1                 # Region to deploy into
STAGE=prod                       # Deployment stage name
DOMAIN_NAME=unfoldr.example.com  # Apex/subdomain you own
DNS_PROVIDER=route53             # "route53" if AWS manages DNS, else "external"

# GitHub App (create one at https://github.com/settings/apps)
GITHUB_APP_ID=123456
GITHUB_CLIENT_ID=Iv1.abc123
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"

# Where the operator console will live (used for OAuth callback URLs)
WEB_URL=https://console.unfoldr.example.com
```

> The stack reads these in [apps/infra/src/config.ts](apps/infra/src/config.ts) and [apps/infra/src/stack.ts](apps/infra/src/stack.ts). If you use `DNS_PROVIDER=external`, the stack emits CloudFront domains as outputs so you can wire CNAMEs at your provider.

### 3. Bootstrap CDK (one-time)

```sh
cd apps/infra
npx cdk bootstrap aws://<ACCOUNT_ID>/<REGION>
```

### 4. Deploy the platform

```sh
pnpm run deploy
```

This provisions Cognito, the HTTP API, DynamoDB, all Lambdas, EventBridge rules, the ACM cert, the CodeBuild scaffolding, and the operator console's S3 + CloudFront distribution.

Copy these outputs from the deploy log — you'll need them next:

- `UserPoolId`
- `UserPoolClientId`
- `HttpApiUrl`
- `GithubClientId`

### 5. Configure the operator console

```sh
cd ../web
cp .env.example .env.local
```

Fill in `.env.local` with the values from step 4. See [apps/web/.env.example](apps/web/.env.example) for the full list.

### 6. Run the console locally (optional)

```sh
pnpm dev
```

The console will be at `http://localhost:5173`. In production it's served from the CloudFront distribution provisioned in step 4.

### 7. Create the first user

Cognito doesn't allow public sign-ups by default. Create your initial admin user via the AWS console (Cognito → User Pools → your pool → Create user) or via the AWS CLI.

## Day-to-day usage

```sh
pnpm dev          # Run everything in watch mode (Turborepo)
pnpm build        # Build all apps and packages
pnpm check-types  # Type-check the whole monorepo
pnpm lint         # Lint everything
pnpm format       # Prettier-format the repo
```

To redeploy infra after changes:

```sh
cd apps/infra
pnpm run deploy
```

To preview infra changes without applying:

```sh
pnpm run diff
```

## Roadmap

- [x] React app deployments (S3 + CloudFront + CodeBuild)
- [x] GitHub App integration + multi-org support
- [x] Custom domains (Route 53 + external DNS)
- [ ] Next.js / SSR target via Lambda@Edge
- [ ] Container-based deploys (ECS Fargate)
- [ ] Preview deployments per PR
- [ ] Build-time secret management
- [ ] Usage + cost dashboards per project

## Contributing

This is early-stage open source. Issues, discussions, and PRs welcome — especially around new deployment targets, hardening the CDK stack, and improving the operator console UX.

## License

ISC
