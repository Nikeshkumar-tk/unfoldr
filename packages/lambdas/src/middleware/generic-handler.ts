import { Logger } from "@unfoldr/logger";
import type { BaseLambdaConfig } from "@unfoldr/types/lambda-config";

export const createGenericHandler = <TEvent, TResult = unknown>({
  handler,
  config,
}: {
  handler: (ctx: { event: TEvent; logger: Logger }) => Promise<TResult>;
  config: BaseLambdaConfig;
}) => {
  return async (event: TEvent): Promise<TResult> => {
    const logger = new Logger({ serviceName: config.name });
    return handler({ event, logger });
  };
};
