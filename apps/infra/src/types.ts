import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type {
  HttpApiLambdaConfig,
  SqsLambdaConfig,
  EventBridgeLambdaConfig,
  CognitoLambdaConfig,
  S3LambdaConfig,
  DynamoStreamLambdaConfig,
  WebSocketLambdaConfig,
  StandaloneLambdaConfig,
} from "@unfoldr/types/lambda-config.js";

export type LambdaWithConfig<TConfig> = {
  fn: NodejsFunction;
  config: TConfig;
};

export type HttpApiLambdaFn = LambdaWithConfig<HttpApiLambdaConfig>;
export type SqsLambdaFn = LambdaWithConfig<SqsLambdaConfig>;
export type EventBridgeLambdaFn = LambdaWithConfig<EventBridgeLambdaConfig>;
export type CognitoLambdaFn = LambdaWithConfig<CognitoLambdaConfig>;
export type S3LambdaFn = LambdaWithConfig<S3LambdaConfig>;
export type DynamoStreamLambdaFn = LambdaWithConfig<DynamoStreamLambdaConfig>;
export type WebSocketLambdaFn = LambdaWithConfig<WebSocketLambdaConfig>;
export type StandaloneLambdaFn = LambdaWithConfig<StandaloneLambdaConfig>;

/** Any lambda — used by constructs that grant resources to a mixed set of fns. */
export type AnyLambdaFn =
  | HttpApiLambdaFn
  | SqsLambdaFn
  | EventBridgeLambdaFn
  | CognitoLambdaFn
  | S3LambdaFn
  | DynamoStreamLambdaFn
  | WebSocketLambdaFn
  | StandaloneLambdaFn;
