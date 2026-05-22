import { Logger } from "@unfoldr/logger";
import { putDdbItem, queryDdbItems } from "../../client";
import { orgUserKeys } from "./keys";
import { OrgRole, OrgUser } from "./types";

export const createOrgUser = async ({
  orgId,
  userId,
  role,
  orgName,
  orgAvatarUrl,
  userEmail,
  userName,
  userAvatarUrl,
  logger,
}: {
  orgId: string;
  userId: string;
  role: OrgRole;
  orgName: string;
  orgAvatarUrl: string;
  userEmail: string;
  userName: string;
  userAvatarUrl: string;
  logger: Logger;
}): Promise<OrgUser> => {
  const item: OrgUser = {
    PK: orgUserKeys.PK(orgId),
    SK: orgUserKeys.SK(userId),
    GSI1PK: orgUserKeys.GSI1PK(userId),
    GSI1SK: orgUserKeys.GSI1SK(orgId),
    orgId,
    userId,
    role,
    orgName,
    orgAvatarUrl,
    userEmail,
    userName,
    userAvatarUrl,
    joinedAt: Date.now(),
  };
  await putDdbItem({ item, logger });
  return item;
};

/** List all orgs a user belongs to (via GSI1). */
export const listOrgsForUser = async (userId: string, logger: Logger) => {
  return queryDdbItems<OrgUser>({
    query: {
      KeyConditionExpression: "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :prefix)",
      ExpressionAttributeValues: {
        ":gsi1pk": orgUserKeys.GSI1PK(userId),
        ":prefix": "ORG#",
      },
      IndexName: "GSI1",
    },
    logger,
  });
};

/** List all users in an org (main table). */
export const listUsersInOrg = async (orgId: string, logger: Logger) => {
  return queryDdbItems<OrgUser>({
    query: {
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": orgUserKeys.PK(orgId),
        ":prefix": "USER#",
      },
    },
    logger,
  });
};
