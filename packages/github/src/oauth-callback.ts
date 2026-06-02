import { Logger } from "@unfoldr/logger";
import {
  saveGitHubConnection,
  getGitHubConnectionByInstallationId,
} from "@unfoldr/aws/dynamo-db/modules/github-connections";
import { getOrgById } from "@unfoldr/aws/dynamo-db/modules/organizations";

export async function handleGitHubCallback({
  installationId,
  state,
  setupAction,
  webUrl,
  logger,
}: {
  installationId: string | undefined;
  state: string | undefined;
  setupAction: string | undefined;
  webUrl: string;
  logger: Logger;
}): Promise<{ location: string }> {
  if (setupAction !== "install" || !installationId) {
    logger.error("Invalid GitHub App callback", { setupAction, installationId });
    return { location: `${webUrl}/organization?error=invalid_callback` };
  }

  try {
    const numericId = parseInt(installationId, 10);

    const stateData = state
      ? (JSON.parse(
          Buffer.from(state, "base64").toString("utf-8"),
        ) as { orgId: string; userId: string })
      : null;

    if (!stateData?.orgId || !stateData?.userId) {
      logger.error("Missing or invalid state in GitHub callback");
      return { location: `${webUrl}/organization?error=invalid_state` };
    }

    const existing = await getGitHubConnectionByInstallationId({
      installationId: numericId,
      logger,
    });

    if (existing) {
      return { location: `${webUrl}/organization?connected=true` };
    }

    const org = await getOrgById(stateData.orgId, logger);
    if (!org) {
      return { location: `${webUrl}/organization?error=org_not_found` };
    }

    await saveGitHubConnection({
      orgId: stateData.orgId,
      installationId: numericId,
      installedBy: stateData.userId,
      logger,
    });

    return { location: `${webUrl}/organization?connected=true` };
  } catch (error) {
    logger.error("GitHub callback error", { error });
    return { location: `${webUrl}/organization?error=callback_failed` };
  }
}
