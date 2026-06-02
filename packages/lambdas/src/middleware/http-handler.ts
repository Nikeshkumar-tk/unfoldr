import { Logger } from "@unfoldr/logger";
import { HttpError } from "@unfoldr/types/errors";
import type { HttpApiLambdaConfig } from "@unfoldr/types/lambda-config";
import { HttpMethod, matchAllowedMethod } from "@unfoldr/types/http";
import type {
  HttpDataByMethod,
  HttpLambdaHandler,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "@unfoldr/types/handler";
import { ZodError, type ZodType } from "zod";
import { formatZodErrors, lambdaResponse } from "./utils";

export type HttpSchemas = Partial<Record<HttpMethod, ZodType>>;

function isApiGatewayResult(result: unknown): result is APIGatewayProxyResultV2 {
  return (
    typeof result === "object" &&
    result !== null &&
    "statusCode" in result
  );
}

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

      const enrichedEvent = event as APIGatewayProxyEventV2 & {
        method: HttpMethod;
        data: unknown;
        userId?: string;
      };
      enrichedEvent.method = method;

      const schema = schemas?.[method];
      if (schema) {
        const rawData =
          method === HttpMethod.GET
            ? event.queryStringParameters
            : JSON.parse(event.body || "{}");
        enrichedEvent.data = schema.parse(rawData);
      }

      if (config.authorized) {
        enrichedEvent.userId = (
          event.requestContext as any
        ).authorizer?.jwt?.claims?.sub;
      }

      const result = await (
        handler as (ctx: { event: unknown; logger: Logger }) => Promise<unknown>
      )({ event: enrichedEvent, logger });

      if (isApiGatewayResult(result)) {
        return result;
      }

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
