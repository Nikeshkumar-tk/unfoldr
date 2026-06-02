import { Logger } from "@unfoldr/logger";
import { getGitHubConnectionByOrgId } from "@unfoldr/aws/dynamo-db/modules/github-connections/main";
import { createInstallationOctokit, getInstallationRepos } from "./github-app";

export type RepoResult = {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
};

function repoMatchesSearch(repo: RepoResult, search: string): boolean {
  const q = search.toLowerCase();
  return (
    repo.name.toLowerCase().includes(q) ||
    repo.fullName.toLowerCase().includes(q)
  );
}

export async function searchRepos({
  orgId,
  search,
  logger,
}: {
  orgId: string;
  search: string;
  logger: Logger;
}): Promise<RepoResult[]> {
  const connection = await getGitHubConnectionByOrgId({ orgId, logger });
  if (!connection) {
    return [];
  }

  const appId = process.env.GITHUB_APP_ID ?? "";
  const privateKey =
    process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, "\n") ?? "";
  const octokit = createInstallationOctokit({
    appId,
    privateKey,
    installationId: connection.installationId,
  });

  const allRepos = await getInstallationRepos(octokit);

  if (!search) {
    return allRepos.slice(0, 25);
  }

  return allRepos.filter((r) => repoMatchesSearch(r, search)).slice(0, 25);
}
