/**
 * Interactive scaffolder for new lambdas in @unfoldr/lambdas.
 *
 * Run with: pnpm --filter @unfoldr/lambdas create-lambda
 *
 * Prompts for trigger type + trigger-specific properties, then:
 *   1. Creates src/<kebab-name>/{config,handler,index}.ts
 *   2. Registers the lambda in the matching trigger barrel file
 *      (e.g. src/http-api-lambdas.ts).
 */

import * as fs from "fs";
import * as path from "path";

type Trigger =
  | "httpApi"
  | "sqs"
  | "eventBridge"
  | "cognito"
  | "s3"
  | "dynamoStream"
  | "webSocket"
  | "standalone";

const TRIGGER_TO_BARREL: Record<Trigger, string> = {
  httpApi: "http-api-lambdas.ts",
  sqs: "sqs-lambdas.ts",
  eventBridge: "eventbridge-lambdas.ts",
  cognito: "cognito-lambdas.ts",
  s3: "s3-lambdas.ts",
  dynamoStream: "dynamo-stream-lambdas.ts",
  webSocket: "websocket-lambdas.ts",
  standalone: "standalone-lambdas.ts",
};

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(PACKAGE_ROOT, "src");

// ── Line-buffered stdin reader (works for both TTY and piped input) ──

let stdinBuffer = "";
let stdinClosed = false;
const lineQueue: string[] = [];
const waiters: ((line: string | null) => void)[] = [];

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk: string) => {
  stdinBuffer += chunk;
  let nl: number;
  while ((nl = stdinBuffer.indexOf("\n")) !== -1) {
    const line = stdinBuffer.slice(0, nl).replace(/\r$/, "");
    stdinBuffer = stdinBuffer.slice(nl + 1);
    if (waiters.length) waiters.shift()!(line);
    else lineQueue.push(line);
  }
});
process.stdin.on("end", () => {
  stdinClosed = true;
  if (stdinBuffer.length) {
    const line = stdinBuffer.replace(/\r$/, "");
    stdinBuffer = "";
    if (waiters.length) waiters.shift()!(line);
    else lineQueue.push(line);
  }
  while (waiters.length) waiters.shift()!(null);
});

function readLine(): Promise<string | null> {
  if (lineQueue.length) return Promise.resolve(lineQueue.shift()!);
  if (stdinClosed) return Promise.resolve(null);
  return new Promise((resolve) => waiters.push(resolve));
}

function closeStdin() {
  process.stdin.pause();
}

function ask(question: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue !== undefined ? ` (${defaultValue})` : "";
  process.stdout.write(`${question}${suffix}: `);
  return readLine().then((answer) => {
    const trimmed = (answer ?? "").trim();
    return trimmed || defaultValue || "";
  });
}

async function askChoice<T extends string>(
  question: string,
  choices: readonly T[],
  defaultValue?: T,
): Promise<T> {
  const list = choices.map((c, i) => `  ${i + 1}. ${c}`).join("\n");
  const defaultLabel =
    defaultValue !== undefined ? ` [default: ${defaultValue}]` : "";
  while (true) {
    const raw = await ask(
      `${question}${defaultLabel}\n${list}\nChoose (number or name)`,
    );
    if (!raw && defaultValue !== undefined) return defaultValue;
    const asNum = Number(raw);
    if (Number.isInteger(asNum) && asNum >= 1 && asNum <= choices.length) {
      return choices[asNum - 1]!;
    }
    const match = choices.find((c) => c === raw);
    if (match) return match;
    console.log(`Invalid choice. Try again.\n`);
  }
}

async function askMultiChoice<T extends string>(
  question: string,
  choices: readonly T[],
  defaultValue?: readonly T[],
): Promise<T[]> {
  const list = choices.map((c, i) => `  ${i + 1}. ${c}`).join("\n");
  const defaultLabel =
    defaultValue && defaultValue.length > 0
      ? ` [default: ${defaultValue.join(",")}]`
      : "";
  while (true) {
    const raw = await ask(
      `${question}${defaultLabel}\n${list}\nChoose one or more (comma-separated numbers or names)`,
    );
    if (!raw && defaultValue && defaultValue.length > 0) {
      return [...defaultValue];
    }
    const tokens = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length === 0) {
      console.log("Pick at least one. Try again.\n");
      continue;
    }
    const seen = new Set<T>();
    const picked: T[] = [];
    let invalid = false;
    for (const tok of tokens) {
      const asNum = Number(tok);
      let match: T | undefined;
      if (Number.isInteger(asNum) && asNum >= 1 && asNum <= choices.length) {
        match = choices[asNum - 1];
      } else {
        match = choices.find((c) => c === tok);
      }
      if (!match) {
        console.log(`Invalid choice: "${tok}". Try again.\n`);
        invalid = true;
        break;
      }
      if (!seen.has(match)) {
        seen.add(match);
        picked.push(match);
      }
    }
    if (!invalid) return picked;
  }
}

async function askBool(question: string, defaultValue = false): Promise<boolean> {
  const raw = await ask(`${question} (y/n)`, defaultValue ? "y" : "n");
  return raw.toLowerCase().startsWith("y");
}

async function askOptionalNumber(
  question: string,
): Promise<number | undefined> {
  const raw = await ask(`${question} (leave blank to skip)`);
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    console.log("Not a number — skipping.");
    return undefined;
  }
  return n;
}

function toKebabCase(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toCamelCase(kebab: string): string {
  return kebab.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

function writeFileSafe(filePath: string, content: string) {
  if (fs.existsSync(filePath)) {
    throw new Error(`File already exists: ${filePath}`);
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`  + ${path.relative(PACKAGE_ROOT, filePath)}`);
}

// ── Per-trigger config + handler templates ──

type Scaffold = {
  configBody: string;
  handlerImport: string;
  handlerSignature: string;
  handlerBody: string;
  indexFactory: { fn: string; module: string };
};

function scaffoldHttpApi(opts: {
  name: string;
  endpoint: string;
  methods: string[];
  authorized: boolean;
}): Scaffold {
  const methodsLiteral = opts.methods
    .map((m) => `HttpMethod.${m}`)
    .join(", ");
  return {
    configBody: `import type { HttpApiLambdaConfig } from "@unfoldr/types/lambda-config";
import { HttpMethod } from "@unfoldr/types/http";

export const config: HttpApiLambdaConfig = {
  trigger: "httpApi",
  name: "${opts.name}",
  entryFile: "src/${opts.name}/index.ts",
  handlerExportName: "index.handler",
  endpoint: "${opts.endpoint}",
  methods: [${methodsLiteral}],
  authorized: ${opts.authorized},
};
`,
    handlerImport: `import type { HttpLambdaHandler } from "@unfoldr/types/handler";`,
    handlerSignature: `export const _handler: HttpLambdaHandler = async ({ event, logger }) => {`,
    handlerBody: `  logger.info("${opts.name} invoked");
  return { ok: true };
};
`,
    indexFactory: { fn: "createHttpHandler", module: "../middleware/index" },
  };
}

function scaffoldSqs(opts: {
  name: string;
  queueRef: string;
  batchSize?: number;
  maxBatchingWindowSeconds?: number;
}): Scaffold {
  const extra: string[] = [];
  if (opts.batchSize !== undefined) extra.push(`  batchSize: ${opts.batchSize},`);
  if (opts.maxBatchingWindowSeconds !== undefined)
    extra.push(`  maxBatchingWindowSeconds: ${opts.maxBatchingWindowSeconds},`);

  return {
    configBody: `import type { SqsLambdaConfig } from "@unfoldr/types/lambda-config";

export const config: SqsLambdaConfig = {
  trigger: "sqs",
  name: "${opts.name}",
  entryFile: "src/${opts.name}/index.ts",
  handlerExportName: "index.handler",
  queueRef: "${opts.queueRef}",${extra.length ? "\n" + extra.join("\n") : ""}
};
`,
    handlerImport: `import type { SqsLambdaHandler } from "@unfoldr/types/handler";`,
    handlerSignature: `export const _handler: SqsLambdaHandler = async ({ event, logger }) => {`,
    handlerBody: `  logger.info("${opts.name} received SQS records", { count: event.Records.length });
};
`,
    indexFactory: { fn: "createSqsHandler", module: "../middleware/index" },
  };
}

function scaffoldEventBridge(opts: {
  name: string;
  eventSource: string;
  detailType: string;
}): Scaffold {
  return {
    configBody: `import type { EventBridgeLambdaConfig } from "@unfoldr/types/lambda-config";

export const config: EventBridgeLambdaConfig = {
  trigger: "eventBridge",
  name: "${opts.name}",
  entryFile: "src/${opts.name}/index.ts",
  handlerExportName: "index.handler",
  eventSource: "${opts.eventSource}",
  detailType: "${opts.detailType}",
};
`,
    handlerImport: `import type { GenericLambdaHandler } from "@unfoldr/types/handler";`,
    handlerSignature: `export const _handler: GenericLambdaHandler = async ({ event, logger }) => {`,
    handlerBody: `  logger.info("${opts.name} received event", { event });
};
`,
    indexFactory: { fn: "createGenericHandler", module: "../middleware/index" },
  };
}

function scaffoldCognito(opts: { name: string; triggerType: string }): Scaffold {
  return {
    configBody: `import type { CognitoLambdaConfig } from "@unfoldr/types/lambda-config";

export const config: CognitoLambdaConfig = {
  trigger: "cognito",
  name: "${opts.name}",
  entryFile: "src/${opts.name}/index.ts",
  handlerExportName: "index.handler",
  triggerType: "${opts.triggerType}",
};
`,
    handlerImport: `import type { CognitoLambdaHandler } from "@unfoldr/types/handler";`,
    handlerSignature: `export const _handler: CognitoLambdaHandler = async ({ event, logger }) => {`,
    handlerBody: `  logger.info("${opts.name} cognito trigger", { userName: event.userName });
  return event;
};
`,
    indexFactory: { fn: "createGenericHandler", module: "../middleware/index" },
  };
}

function scaffoldS3(opts: {
  name: string;
  bucketRef: string;
  events: string[];
  prefix?: string;
  suffix?: string;
}): Scaffold {
  const extra: string[] = [];
  if (opts.prefix) extra.push(`  prefix: "${opts.prefix}",`);
  if (opts.suffix) extra.push(`  suffix: "${opts.suffix}",`);

  return {
    configBody: `import type { S3LambdaConfig } from "@unfoldr/types/lambda-config";

export const config: S3LambdaConfig = {
  trigger: "s3",
  name: "${opts.name}",
  entryFile: "src/${opts.name}/index.ts",
  handlerExportName: "index.handler",
  bucketRef: "${opts.bucketRef}",
  events: [${opts.events.map((e) => `"${e}"`).join(", ")}],${
    extra.length ? "\n" + extra.join("\n") : ""
  }
};
`,
    handlerImport: `import type { S3LambdaHandler } from "@unfoldr/types/handler";`,
    handlerSignature: `export const _handler: S3LambdaHandler = async ({ event, logger }) => {`,
    handlerBody: `  logger.info("${opts.name} received S3 event", { records: event.Records.length });
};
`,
    indexFactory: { fn: "createGenericHandler", module: "../middleware/index" },
  };
}

function scaffoldDynamoStream(opts: {
  name: string;
  tableRef: string;
  startingPosition: string;
  batchSize?: number;
}): Scaffold {
  const extra =
    opts.batchSize !== undefined ? `\n  batchSize: ${opts.batchSize},` : "";
  return {
    configBody: `import type { DynamoStreamLambdaConfig } from "@unfoldr/types/lambda-config";

export const config: DynamoStreamLambdaConfig = {
  trigger: "dynamoStream",
  name: "${opts.name}",
  entryFile: "src/${opts.name}/index.ts",
  handlerExportName: "index.handler",
  tableRef: "${opts.tableRef}",
  startingPosition: "${opts.startingPosition}",${extra}
};
`,
    handlerImport: `import type { DynamoStreamLambdaHandler } from "@unfoldr/types/handler";`,
    handlerSignature: `export const _handler: DynamoStreamLambdaHandler = async ({ event, logger }) => {`,
    handlerBody: `  logger.info("${opts.name} received stream records", { count: event.Records.length });
};
`,
    indexFactory: { fn: "createGenericHandler", module: "../middleware/index" },
  };
}

function scaffoldWebSocket(opts: { name: string; routeKey: string }): Scaffold {
  return {
    configBody: `import type { WebSocketLambdaConfig } from "@unfoldr/types/lambda-config";

export const config: WebSocketLambdaConfig = {
  trigger: "webSocket",
  name: "${opts.name}",
  entryFile: "src/${opts.name}/index.ts",
  handlerExportName: "index.handler",
  routeKey: "${opts.routeKey}",
};
`,
    handlerImport: `import type { GenericLambdaHandler } from "@unfoldr/types/handler";`,
    handlerSignature: `export const _handler: GenericLambdaHandler = async ({ event, logger }) => {`,
    handlerBody: `  logger.info("${opts.name} websocket invoked", { event });
  return { statusCode: 200, body: "ok" };
};
`,
    indexFactory: { fn: "createGenericHandler", module: "../middleware/index" },
  };
}

function scaffoldStandalone(opts: { name: string }): Scaffold {
  return {
    configBody: `import type { StandaloneLambdaConfig } from "@unfoldr/types/lambda-config";

export const config: StandaloneLambdaConfig = {
  trigger: "standalone",
  name: "${opts.name}",
  entryFile: "src/${opts.name}/index.ts",
  handlerExportName: "index.handler",
};
`,
    handlerImport: `import type { GenericLambdaHandler } from "@unfoldr/types/handler";`,
    handlerSignature: `export const _handler: GenericLambdaHandler = async ({ event, logger }) => {`,
    handlerBody: `  logger.info("${opts.name} invoked", { event });
  return { ok: true };
};
`,
    indexFactory: { fn: "createGenericHandler", module: "../middleware/index" },
  };
}

function renderIndex(scaffold: Scaffold): string {
  return `import { ${scaffold.indexFactory.fn} } from "${scaffold.indexFactory.module}";
import { _handler } from "./handler";
import { config } from "./config";

export { config };

export const handler = ${scaffold.indexFactory.fn}({
  handler: _handler,
  config,
});
`;
}

function renderHandler(scaffold: Scaffold): string {
  return `${scaffold.handlerImport}

${scaffold.handlerSignature}
${scaffold.handlerBody}`;
}

function updateBarrel(trigger: Trigger, lambdaName: string) {
  const barrelPath = path.join(SRC_DIR, TRIGGER_TO_BARREL[trigger]);
  const exportName = toCamelCase(lambdaName);
  const exportLine = `export * as ${exportName} from "./${lambdaName}/config";\n`;

  let contents = "";
  if (fs.existsSync(barrelPath)) {
    contents = fs.readFileSync(barrelPath, "utf8");
    if (contents.includes(`from "./${lambdaName}/config"`)) {
      console.log(`  = barrel already references ${lambdaName}, skipping`);
      return;
    }
    if (contents.trim().length === 0 || contents.trim().startsWith("//")) {
      contents = exportLine;
    } else {
      contents = contents.endsWith("\n") ? contents : contents + "\n";
      contents += exportLine;
    }
  } else {
    contents = exportLine;
  }
  fs.writeFileSync(barrelPath, contents, "utf8");
  console.log(`  ~ ${path.relative(PACKAGE_ROOT, barrelPath)} (added export)`);
}

async function collectHttpApi(name: string) {
  const endpoint = await ask("Endpoint path (e.g. /users)", `/${name}`);
  const methods = await askMultiChoice(
    "HTTP methods",
    ["GET", "POST", "PUT", "PATCH", "DELETE"] as const,
    ["GET"],
  );
  const authorized = await askBool("Requires Cognito auth?", false);
  return scaffoldHttpApi({ name, endpoint, methods, authorized });
}

async function collectSqs(name: string) {
  const queueRef = await ask("Logical queue ref (e.g. orders-queue)");
  const batchSize = await askOptionalNumber("Batch size");
  const maxBatchingWindowSeconds = await askOptionalNumber(
    "Max batching window (seconds)",
  );
  return scaffoldSqs({ name, queueRef, batchSize, maxBatchingWindowSeconds });
}

async function collectEventBridge(name: string) {
  const eventSource = await ask("Event source (e.g. unfoldr.orders)");
  const detailType = await ask("Detail type (e.g. OrderCreated)");
  return scaffoldEventBridge({ name, eventSource, detailType });
}

async function collectCognito(name: string) {
  const triggerType = await askChoice(
    "Cognito trigger type",
    [
      "preSignUp",
      "postConfirmation",
      "preAuthentication",
      "postAuthentication",
      "customMessage",
      "defineAuthChallenge",
      "createAuthChallenge",
      "verifyAuthChallengeResponse",
      "preTokenGeneration",
    ] as const,
    "postConfirmation",
  );
  return scaffoldCognito({ name, triggerType });
}

async function collectS3(name: string) {
  const bucketRef = await ask("Logical bucket ref (e.g. uploads-bucket)");
  const eventsRaw = await ask(
    "S3 events (comma-separated, e.g. s3:ObjectCreated:*)",
    "s3:ObjectCreated:*",
  );
  const events = eventsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const prefix = (await ask("Prefix filter (optional)")) || undefined;
  const suffix = (await ask("Suffix filter (optional)")) || undefined;
  return scaffoldS3({ name, bucketRef, events, prefix, suffix });
}

async function collectDynamoStream(name: string) {
  const tableRef = await ask("Logical table ref (e.g. main-table)");
  const startingPosition = await askChoice(
    "Starting position",
    ["TRIM_HORIZON", "LATEST"] as const,
    "LATEST",
  );
  const batchSize = await askOptionalNumber("Batch size");
  return scaffoldDynamoStream({ name, tableRef, startingPosition, batchSize });
}

async function collectWebSocket(name: string) {
  const routeKey = await ask("Route key (e.g. $connect, $disconnect, $default)");
  return scaffoldWebSocket({ name, routeKey });
}

async function main() {
  console.log("\n=== Create a new lambda ===\n");

  const rawName = await ask("Lambda name (e.g. getUserProfile)");
  if (!rawName) {
    console.log("Name is required. Aborting.");
    closeStdin();
    process.exit(1);
  }
  const name = toKebabCase(rawName);
  if (!name) {
    console.log("Could not derive a valid folder name. Aborting.");
    closeStdin();
    process.exit(1);
  }

  const lambdaDir = path.join(SRC_DIR, name);
  if (fs.existsSync(lambdaDir)) {
    console.log(`Folder src/${name} already exists. Aborting.`);
    closeStdin();
    process.exit(1);
  }

  const trigger = await askChoice<Trigger>(
    "Trigger type",
    [
      "httpApi",
      "sqs",
      "eventBridge",
      "cognito",
      "s3",
      "dynamoStream",
      "webSocket",
      "standalone",
    ] as const,
    "httpApi",
  );

  let scaffold: Scaffold;
  switch (trigger) {
    case "httpApi":
      scaffold = await collectHttpApi(name);
      break;
    case "sqs":
      scaffold = await collectSqs(name);
      break;
    case "eventBridge":
      scaffold = await collectEventBridge(name);
      break;
    case "cognito":
      scaffold = await collectCognito(name);
      break;
    case "s3":
      scaffold = await collectS3(name);
      break;
    case "dynamoStream":
      scaffold = await collectDynamoStream(name);
      break;
    case "webSocket":
      scaffold = await collectWebSocket(name);
      break;
    case "standalone":
      scaffold = scaffoldStandalone({ name });
      break;
  }

  console.log("\nCreating files:");
  writeFileSafe(path.join(lambdaDir, "config.ts"), scaffold.configBody);
  writeFileSafe(path.join(lambdaDir, "handler.ts"), renderHandler(scaffold));
  writeFileSafe(path.join(lambdaDir, "index.ts"), renderIndex(scaffold));

  console.log("\nUpdating barrel:");
  updateBarrel(trigger, name);

  console.log(`\nDone. Lambda "${name}" scaffolded.\n`);
  closeStdin();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  closeStdin();
  process.exit(1);
});
