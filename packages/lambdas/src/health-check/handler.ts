import { getRepoInfo } from "@unfoldr/github/src/getPublciRepoInfo";
import type { HttpLambdaHandler } from "@unfoldr/types/handler";

export const _handler: HttpLambdaHandler = async ({ logger }) => {
  logger.info("Health check invoked");
  const repoInfo = await getRepoInfo();
  return { message: "Got the repo info", repoInfo };
};
