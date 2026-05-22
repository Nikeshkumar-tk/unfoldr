import { HttpMethod } from "./http";

// ── Base fields shared by every lambda config ──

export type BaseLambdaConfig = {
  /** Unique name used for resource naming and Logger serviceName */
  name: string;
  /** Path to the entry file relative to the lambdas package root, e.g. "src/health-check/index.ts" */
  entryFile: string;
  /** Export path within the bundled file, e.g. "index.handler" */
  handlerExportName: string;
  /** Env vars to inject into the Lambda function */
  environmentVariables?: Record<string, string>;
  /** Memory in MB (defaults to 512 in construct) */
  memorySize?: number;
  /** Timeout in seconds (defaults to 30 in construct) */
  timeoutSeconds?: number;
};

// ── Trigger-specific configs ──

export type HttpApiLambdaConfig = BaseLambdaConfig & {
  trigger: "httpApi";
  endpoint: string;
  /** One or more HTTP methods this lambda serves on `endpoint`. */
  methods: HttpMethod[];
  authorized: boolean;
};

export type SqsLambdaConfig = BaseLambdaConfig & {
  trigger: "sqs";
  /** Logical queue identifier (the actual queue is created in infra) */
  queueRef: string;
  batchSize?: number;
  maxBatchingWindowSeconds?: number;
};

export type EventBridgeLambdaConfig = BaseLambdaConfig & {
  trigger: "eventBridge";
  /** EventBridge rule pattern source, e.g. "unfoldr.orders" */
  eventSource: string;
  /** Detail type for the rule */
  detailType: string;
};

export type CognitoLambdaConfig = BaseLambdaConfig & {
  trigger: "cognito";
  /** Which Cognito trigger this lambda handles */
  triggerType:
    | "preSignUp"
    | "postConfirmation"
    | "preAuthentication"
    | "postAuthentication"
    | "customMessage"
    | "defineAuthChallenge"
    | "createAuthChallenge"
    | "verifyAuthChallengeResponse"
    | "preTokenGeneration";
};

export type S3LambdaConfig = BaseLambdaConfig & {
  trigger: "s3";
  /** Logical bucket identifier (the actual bucket is created in infra) */
  bucketRef: string;
  /** S3 event types, e.g. ["s3:ObjectCreated:*"] */
  events: string[];
  /** Optional prefix filter */
  prefix?: string;
  /** Optional suffix filter */
  suffix?: string;
};

export type DynamoStreamLambdaConfig = BaseLambdaConfig & {
  trigger: "dynamoStream";
  /** Logical table identifier */
  tableRef: string;
  startingPosition: "TRIM_HORIZON" | "LATEST";
  batchSize?: number;
};

export type WebSocketLambdaConfig = BaseLambdaConfig & {
  trigger: "webSocket";
  /** WebSocket route key, e.g. "$connect", "$disconnect", "$default", or custom */
  routeKey: string;
};

export type StandaloneLambdaConfig = BaseLambdaConfig & {
  trigger: "standalone";
};

// ── Discriminated union of all lambda configs ──

export type LambdaConfig =
  | HttpApiLambdaConfig
  | SqsLambdaConfig
  | EventBridgeLambdaConfig
  | CognitoLambdaConfig
  | S3LambdaConfig
  | DynamoStreamLambdaConfig
  | WebSocketLambdaConfig
  | StandaloneLambdaConfig;
