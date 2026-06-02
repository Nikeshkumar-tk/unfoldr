import type { HttpLambdaHandler } from "@unfoldr/types/handler";
import type { HttpMethod } from "@unfoldr/types/http";
import { handleGitHubCallback } from "@unfoldr/github/src/oauth-callback";

type CallbackData = {
  [HttpMethod.GET]: never;
};

export const _handler: HttpLambdaHandler<CallbackData> = async ({
  event,
  logger,
}) => {
  const params = event.queryStringParameters ?? {};
  const webUrl = process.env.WEB_URL ?? "http://localhost:5173";

  const { location } = await handleGitHubCallback({
    installationId: params.installation_id,
    state: params.state,
    setupAction: params.setup_action,
    webUrl,
    logger,
  });

  return {
    statusCode: 302,
    headers: { Location: location },
  };
};
