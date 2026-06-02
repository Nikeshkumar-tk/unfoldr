import { Logger } from "@unfoldr/logger";
import crypto from "crypto";
import { Stage } from "./types";
import { stageKeys } from "./keys";
import { ActedUser } from "../../types";
import { getDdbItem, putDdbItem, queryDdbItems } from "../../client";

export const createStage = async ({
  logger,
  projectId,
  orgId,
  user,
  name,
  branch,
  environmentVariables = {},
}: {
  logger: Logger;
  projectId: string;
  orgId: string;
  user: ActedUser;
  name: string;
  branch: string;
  environmentVariables?: Record<string, string>;
}) => {
  const now = Date.now();
  const stageId = crypto.randomUUID();

  const stageItem: Stage = {
    PK: stageKeys.PK(projectId),
    SK: stageKeys.SK(stageId),
    stageId,
    projectId,
    orgId,
    name,
    branch,
    environmentVariables,
    createdAt: now,
    updatedAt: now,
    createdBy: user,
  };

  logger.info("Creating stage", { stageId, projectId, name, branch });

  await putDdbItem({ item: stageItem, logger });

  return stageItem;
};

export const queryStagesByProject = async ({
  logger,
  projectId,
}: {
  logger: Logger;
  projectId: string;
}): Promise<Stage[]> => {
  return queryDdbItems<Stage>({
    query: {
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": stageKeys.PK(projectId),
        ":sk": "STAGE#",
      },
    },
    logger,
  });
};

export const getStage = async ({
  logger,
  projectId,
  stageId,
}: {
  logger: Logger;
  projectId: string;
  stageId: string;
}) => {
  return getDdbItem<Stage>({
    pk: stageKeys.PK(projectId),
    sk: stageKeys.SK(stageId),
    logger,
  });
};
