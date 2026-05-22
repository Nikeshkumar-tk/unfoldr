import { Logger } from "@unfoldr/logger";
import { randomUUID } from "crypto";
import { getDdbItem, putDdbItem, queryDdbItems } from "../../client";
import { normalizeOrgName, orgKeys } from "./keys";
import { Organization } from "./types";
import { buildInitialsAvatarUrl } from "../../../avatar";

export class OrgNameTakenError extends Error {
  constructor(name: string) {
    super(`An organization named "${name}" already exists.`);
    this.name = "OrgNameTakenError";
  }
}

export const getOrgByName = async (name: string, logger: Logger) => {
  const result = await queryDdbItems<Organization>({
    query: {
      KeyConditionExpression: "GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk",
      ExpressionAttributeValues: {
        ":gsi1pk": orgKeys.GSI1PK(name),
        ":gsi1sk": orgKeys.GSI1SK(),
      },
      IndexName: "GSI1",
    },
    logger,
  });
  return result.length > 0 ? result[0] : null;
};

export const getOrgById = async (orgId: string, logger: Logger) => {
  return getDdbItem<Organization>({
    pk: orgKeys.PK(orgId),
    sk: orgKeys.SK(),
    logger,
  });
};

export const createOrganization = async ({
  name,
  createdBy,
  logger,
}: {
  name: string;
  createdBy: string;
  logger: Logger;
}): Promise<Organization> => {
  const existing = await getOrgByName(name, logger);
  if (existing) {
    throw new OrgNameTakenError(name);
  }

  const orgId = randomUUID();
  const org: Organization = {
    PK: orgKeys.PK(orgId),
    SK: orgKeys.SK(),
    GSI1PK: orgKeys.GSI1PK(name),
    GSI1SK: orgKeys.GSI1SK(),
    orgId,
    name: name.trim(),
    normalizedName: normalizeOrgName(name),
    createdBy,
    createdAt: Date.now(),
    avatarUrl: buildInitialsAvatarUrl(name),
  };

  await putDdbItem({ item: org, logger });
  return org;
};
