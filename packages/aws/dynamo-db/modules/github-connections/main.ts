import { Logger } from "@unfoldr/logger";
import {
  getDdbItem,
  putDdbItem,
  deleteDdbItem,
  queryDdbItems,
} from "../../client";
import { githubConnectionKeys } from "./keys";
import type { GitHubConnection } from "./types";

export async function getGitHubConnectionByOrgId({
  orgId,
  logger,
}: {
  orgId: string;
  logger: Logger;
}): Promise<GitHubConnection | undefined> {
  return getDdbItem<GitHubConnection>({
    pk: githubConnectionKeys.PK(orgId),
    sk: githubConnectionKeys.SK(),
    logger,
  });
}

export async function getGitHubConnectionByInstallationId({
  installationId,
  logger,
}: {
  installationId: number;
  logger: Logger;
}): Promise<GitHubConnection | undefined> {
  const results = await queryDdbItems<GitHubConnection>({
    query: {
      KeyConditionExpression: "GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk",
      ExpressionAttributeValues: {
        ":gsi1pk": githubConnectionKeys.GSI1PK(installationId),
        ":gsi1sk": githubConnectionKeys.GSI1SK(),
      },
      IndexName: "GSI1",
    },
    logger,
  });
  return results[0];
}

export async function saveGitHubConnection({
  orgId,
  installationId,
  installedBy,
  logger,
}: {
  orgId: string;
  installationId: number;
  installedBy: string;
  logger: Logger;
}): Promise<GitHubConnection> {
  const now = Date.now();
  const item: GitHubConnection = {
    PK: githubConnectionKeys.PK(orgId),
    SK: githubConnectionKeys.SK(),
    GSI1PK: githubConnectionKeys.GSI1PK(installationId),
    GSI1SK: githubConnectionKeys.GSI1SK(),
    orgId,
    installationId,
    installedBy,
    createdAt: now,
    updatedAt: now,
  };

  await putDdbItem({ item, logger });
  return item;
}

export async function deleteGitHubConnection({
  orgId,
  logger,
}: {
  orgId: string;
  logger: Logger;
}): Promise<void> {
  await deleteDdbItem({
    key: {
      PK: githubConnectionKeys.PK(orgId),
      SK: githubConnectionKeys.SK(),
    },
    logger,
  });
}
