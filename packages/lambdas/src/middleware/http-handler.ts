import { Logger } from "@unfoldr/logger";
import { HttpError } from "@unfoldr/types/errors";
import type { HttpApiLambdaConfig } from "@unfoldr/types/lambda-config";
import { HttpMethod, matchAllowedMethod } from "@unfoldr/types/http";
import type {
  HttpDataByMethod,
  HttpLambdaHandler,
  APIGatewayProxyEventV2,
} from "@unfoldr/types/handler";
import { ZodError, type ZodType } from "zod";
import { formatZodErrors, lambdaResponse } from "./utils";

/**
 * Per-method Zod schemas. Keys are typed HttpMethod values (e.g. `HttpMethod.POST`).
 */
export type HttpSchemas = Partial<Record<HttpMethod, ZodType>>;

export const createHttpHandler = <
  TMap extends HttpDataByMethod = HttpDataByMethod,
>({
  handler,
  config,
  schemas,
}: {
  handler: HttpLambdaHandler<TMap>;
  config: HttpApiLambdaConfig;
  schemas?: HttpSchemas;
}) => {
  return async (event: APIGatewayProxyEventV2) => {
    const logger = new Logger({ serviceName: config.name });

    try {
      // Validate the request method against the lambda's declared methods.
      // If the route is wired correctly in infra this can only fail when
      // someone hits the lambda directly or the config was changed without
      // redeploying — either way, 405 is the right answer.
      const method = matchAllowedMethod(
        event.requestContext.http.method,
        config.methods,
      );
      if (!method) {
        return lambdaResponse({
          data: {
            message: `Method ${event.requestContext.http.method} not allowed. Allowed: ${config.methods.join(", ")}`,
          },
          status: 405,
        });
      }

      // We build up the enriched event dynamically; the typed branch is what
      // the handler sees. Casting to `any` here keeps the internals simple
      // without weakening the public API.
      const enrichedEvent = event as APIGatewayProxyEventV2 & {
        method: HttpMethod;
        data: unknown;
        userId?: string;
      };
      enrichedEvent.method = method;

      // Per-method schema validation. GET uses query params, everything else uses body.
      const schema = schemas?.[method];
      if (schema) {
        const rawData =
          method === HttpMethod.GET
            ? event.queryStringParameters
            : JSON.parse(event.body || "{}");
        enrichedEvent.data = schema.parse(rawData);
      }

      // Auth: extract userId from JWT claims
      if (config.authorized) {
        enrichedEvent.userId = (
          event.requestContext as any
        ).authorizer?.jwt?.claims?.sub;
      }

      const result = await (
        handler as (ctx: { event: unknown; logger: Logger }) => Promise<unknown>
      )({ event: enrichedEvent, logger });
      return lambdaResponse({ data: result, status: 200 });
    } catch (error) {
      if (error instanceof HttpError) {
        return lambdaResponse({
          data: { message: error.message },
          status: error.statusCode,
        });
      }
      if (error instanceof ZodError) {
        return lambdaResponse({
          data: {
            message: "Validation Error",
            errors: formatZodErrors(error),
          },
          status: 400,
        });
      }
      if (error instanceof Error) {
        logger.error("Unexpected error", { error });
        return lambdaResponse({
          data: { message: "Internal Server Error" },
          status: 500,
        });
      }
      logger.error("Unknown error type", { error });
      return lambdaResponse({
        data: { message: "An unknown error occurred" },
        status: 500,
      });
    }
  };
};
