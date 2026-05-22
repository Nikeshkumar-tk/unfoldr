import { Logger } from "@unfoldr/logger";
import type { HttpMethod } from "./http";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  SQSEvent,
  SQSRecord,
  DynamoDBStreamEvent,
  S3Event,
  PostConfirmationTriggerEvent,
} from "aws-lambda";

/**
 * Per-method data shape map. Each key is an `HttpMethod` value the lambda
 * serves; the value is the shape of `event.data` for that method.
 *
 * @example
 *   type UsersData = {
 *     [HttpMethod.GET]: { userId: string };
 *     [HttpMethod.POST]: { email: string; name: string };
 *   };
 */
export type HttpDataByMethod = Partial<Record<HttpMethod, unknown>>;

/** Default map used when the caller doesn't specify one. */
type DefaultDataByMethod = { [M in HttpMethod]: unknown };

/**
 * Discriminated union of `{ method, data }` branches built from `TMap`.
 * Narrowing on `event.method` narrows `event.data` to the matching entry.
 */
type HttpEventBranch<TMap extends HttpDataByMethod> = {
  [M in Extract<keyof TMap, HttpMethod>]: APIGatewayProxyEventV2 & {
    method: M;
    data: TMap[M];
    userId?: string;
  };
}[Extract<keyof TMap, HttpMethod>];

/**
 * HTTP API event enriched with parsed body data, the typed method, and an
 * optional `userId` (set when the lambda's config has `authorized: true`).
 *
 * Pass a method-keyed map for per-method `data` typing. With no generic
 * argument, `data` is `unknown` and `method` is `HttpMethod`.
 */
export type HttpEventWithData<TMap extends HttpDataByMethod = DefaultDataByMethod> =
  HttpEventBranch<TMap>;

/** Handler signature for HTTP API lambdas */
export type HttpLambdaHandler<
  TMap extends HttpDataByMethod = DefaultDataByMethod,
> = (ctx: {
  event: HttpEventBranch<TMap>;
  logger: Logger;
}) => Promise<unknown>;

/** Handler signature for SQS lambdas */
export type SqsLambdaHandler = (ctx: {
  event: SQSEvent;
  logger: Logger;
}) => Promise<void>;

/** Handler signature for DynamoDB stream lambdas */
export type DynamoStreamLambdaHandler = (ctx: {
  event: DynamoDBStreamEvent;
  logger: Logger;
}) => Promise<void>;

/** Handler signature for S3 event lambdas */
export type S3LambdaHandler = (ctx: {
  event: S3Event;
  logger: Logger;
}) => Promise<void>;

/** Handler signature for Cognito trigger lambdas */
export type CognitoLambdaHandler = (ctx: {
  event: PostConfirmationTriggerEvent;
  logger: Logger;
}) => Promise<PostConfirmationTriggerEvent>;

/** Generic handler for standalone/EventBridge lambdas */
export type GenericLambdaHandler<TEvent = unknown> = (ctx: {
  event: TEvent;
  logger: Logger;
}) => Promise<unknown>;

export { Logger };
export type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  SQSEvent,
  SQSRecord,
  DynamoDBStreamEvent,
  S3Event,
  PostConfirmationTriggerEvent,
};
