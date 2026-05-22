import { Logger } from "@unfoldr/logger";
import type { SqsLambdaConfig } from "@unfoldr/types/lambda-config";
import type { SqsLambdaHandler, SQSEvent } from "@unfoldr/types/handler";

export const createSqsHandler = ({
  handler,
  config,
}: {
  handler: SqsLambdaHandler;
  config: SqsLambdaConfig;
}) => {
  return async (event: SQSEvent) => {
    const logger = new Logger({ serviceName: config.name });
    logger.info("Processing SQS batch", {
      recordCount: event.Records.length,
    });
    await handler({ event, logger });
  };
};
