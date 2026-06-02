import { Logger } from "@unfoldr/logger";
import type { GenericLambdaHandler } from "@unfoldr/types/handler";

export const _handler: GenericLambdaHandler = async ({ event, logger }) => {
  logger.info("CodeBuild status event received");

  console.log("CodeBuild event:", JSON.stringify(event, null, 2));

  logger.info("CodeBuild event logged successfully");
};
