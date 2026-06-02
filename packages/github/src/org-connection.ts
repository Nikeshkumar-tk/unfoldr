import { Logger } from "@unfoldr/logger";
import {
  getGitHubConnectionByOrgId,
  deleteGitHubConnection,
} from "@unfoldr/aws/dynamo-db/modules/github-connections/main";
import {
  createInstallationOctokit,
  getInstallationRepos,
} from "./github-app";
import { listUsersInOrg } from "@unfoldr/aws/dynamo-db/modules/org-users/main";

export type GitHubConnectionResult = {
  connected: boolean;
  installationId?: number;
  installedBy?: string;
  createdAt?: number;
  repos?: Array<{
    id: number;
    name: string;
    fullName: string;
    private: boolean;
  }>;
};

export async function getOrgGithubConnection({
  orgId,
  logger,
}: {
  orgId: string;
  logger: Logger;
}): Promise<GitHubConnectionResult> {
  const connection = await getGitHubConnectionByOrgId({ orgId, logger });

  if (!connection) {
    return { connected: false };
  }

  let repos: Array<{
    id: number;
    name: string;
    fullName: string;
    private: boolean;
  }> = [];
  try {
    const appId = process.env.GITHUB_APP_ID ?? "";
    const privateKey =
      process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, "\n") ?? "";
    const installationOctokit = createInstallationOctokit({
      appId,
      privateKey,
      installationId: connection.installationId,
    });
    repos = await getInstallationRepos(installationOctokit);
  } catch (error) {
    logger.warn("Failed to fetch repos for connected GitHub app", { error });
  }

  return {
    connected: true,
    installationId: connection.installationId,
    installedBy: connection.installedBy,
    createdAt: connection.createdAt,
    repos,
  };
}

export async function deleteOrgGithubConnection({
  orgId,
  logger,
}: {
  orgId: string;
  logger: Logger;
}): Promise<void> {
  await deleteGitHubConnection({ orgId, logger });
}

export async function isOrgMember({
  orgId,
  userId,
  logger,
}: {
  orgId: string;
  userId: string;
  logger: Logger;
}): Promise<boolean> {
  const members = await listUsersInOrg(orgId, logger);
  return members.some((m) => m.userId === userId);
}
