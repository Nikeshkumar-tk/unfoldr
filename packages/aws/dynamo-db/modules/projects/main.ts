import { Logger } from "@unfoldr/logger";
import { Project, ProjectType, ProjectConfig } from "./types";
import { projectKeys } from "./keys";
import { ActedUser } from "../../types";
import crypto from "crypto";
import { getDdbItem, putDdbItem, queryDdbItems, updateItem, deleteDdbItem } from "../../client";

export const createProject = async ({
  logger,
  user,
  orgId,
  projectType,
  projectName,
  repoFullName,
  config,
}: {
  logger: Logger;
  orgId: string;
  user: ActedUser;
  projectType: ProjectType;
  projectName: string;
  repoFullName: string;
  config: ProjectConfig;
}) => {
  const isDuplicate = await isDuplicateProjectExists(projectName, logger);

  if (isDuplicate) {
    throw new Error(
      `A project with the name "${projectName}" already exists. Please choose a different name.`,
    );
  }

  const now = Date.now();
  const projectId = crypto.randomUUID();

  const projectItem: Project = {
    PK: projectKeys.PK({ orgId }),
    SK: projectKeys.SK({ projectId }),
    projectName,
    projectType,
    repoFullName,
    config,
    createdAt: now,
    updatedAt: now,
    createdBy: user,
    updatedBy: user,
    orgId: orgId,
    GSI1PK: projectKeys.GSI1PK({ projectName }),
    GSI1SK: projectKeys.GSI1SK(),
  };

  logger.info(
    `Creating project with ID ${projectId} for organization ${orgId}`,
  );

  return await putDdbItem({
    item: projectItem,
    logger,
    options: {
      uniqueId: {
        field: "projectName",
      },
    },
  });
};

export const isDuplicateProjectExists = async (
  projectName: string,
  logger: Logger,
) => {
  const result = await queryProjectByname({ projectName, logger });
  return !!result;
};

export const queryProjectsByOrg = async ({
  logger,
  orgId,
}: {
  orgId: string;
  logger: Logger;
}): Promise<Project[]> => {
  return queryDdbItems<Project>({
    query: {
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": projectKeys.PK({ orgId }),
        ":sk": "METADATA#",
      },
    },
    logger,
  });
};

export const queryProjectByname = async ({
  logger,
  projectName,
}: {
  projectName: string;
  logger: Logger;
}) => {
  const result = await queryDdbItems({
    query: {
      KeyConditionExpression: "GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk",
      ExpressionAttributeValues: {
        ":gsi1pk": projectKeys.GSI1PK({ projectName }),
        ":gsi1sk": projectKeys.GSI1SK(),
      },
      IndexName: "GSI1",
    },
    logger,
  });
  return result.length > 0 ? result[0] : null;
};

export const getProjectById = async ({
  logger,
  orgId,
  projectId,
}: {
  logger: Logger;
  orgId: string;
  projectId: string;
}) => {
  return await getDdbItem<Project>({
    pk: projectKeys.PK({ orgId }),
    sk: projectKeys.SK({ projectId }),
    logger,
  });
};

export const updateProject = async ({
  logger,
  user,
  orgId,
  projectId,
  projectName,
  repoFullName,
  config,
}: {
  logger: Logger;
  orgId: string;
  projectId: string;
  user: ActedUser;
  projectName: string;
  repoFullName: string;
  config: ProjectConfig;
}) => {
  const now = Date.now();

  await updateItem({
    pk: projectKeys.PK({ orgId }),
    sk: projectKeys.SK({ projectId }),
    attributesToUpdate: {
      projectName,
      repoFullName,
      config,
      updatedAt: now,
      updatedBy: user,
      GSI1PK: projectKeys.GSI1PK({ projectName }),
    },
    logger,
  });

  logger.info("Updating project", { projectId, orgId });

  return getDdbItem<Project>({
    pk: projectKeys.PK({ orgId }),
    sk: projectKeys.SK({ projectId }),
    logger,
  });
};

export const deleteProject = async ({
  logger,
  orgId,
  projectId,
}: {
  logger: Logger;
  orgId: string;
  projectId: string;
}) => {
  logger.info("Deleting project", { projectId, orgId });

  await deleteDdbItem({
    key: {
      PK: projectKeys.PK({ orgId }),
      SK: projectKeys.SK({ projectId }),
    },
    logger,
  });
};
