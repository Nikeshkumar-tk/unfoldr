import { Logger } from "@unfoldr/logger";
import crypto from "crypto";
import { Deployment, DeploymentStatus } from "./types";
import { deploymentKeys } from "./keys";
import { ActedUser } from "../../types";
import {
  getDdbItem,
  putDdbItem,
  queryDdbItems,
  updateItem,
} from "../../client";
import { triggerBuild } from "../../../codebuild";
import { getInstallationToken } from "@unfoldr/github/src/github-app";
import { getGitHubConnectionByOrgId } from "../github-connections";
import { getProjectById } from "../projects";
import { getStage } from "../stages";

export const createDeployment = async ({
  logger,
  projectId,
  orgId,
  user,
  stageId,
  stageName,
}: {
  logger: Logger;
  projectId: string;
  orgId: string;
  user: ActedUser;
  stageId: string;
  stageName: string;
}) => {
  const now = Date.now();
  const deploymentId = crypto.randomUUID();

  const deploymentItem: Deployment = {
    PK: deploymentKeys.PK(projectId),
    SK: deploymentKeys.SK(deploymentId),
    projectId,
    orgId,
    deploymentId,
    stage: { stageId, stageName },
    status: DeploymentStatus.PENDING,
    createdAt: now,
    updatedAt: now,
    createdBy: user,
  };

  logger.info("Creating deployment", {
    deploymentId,
    projectId,
    stageId,
    stageName,
  });

  await putDdbItem({ item: deploymentItem, logger });

  await createBuild({
    orgId,
    projectId,
    stageId,
    deploymentId,
    logger,
  });

  return deploymentItem;
};

export const queryDeploymentsByProject = async ({
  logger,
  projectId,
}: {
  logger: Logger;
  projectId: string;
}): Promise<Deployment[]> => {
  return queryDdbItems<Deployment>({
    query: {
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": deploymentKeys.PK(projectId),
        ":sk": "DEPLOYMENT#",
      },
    },
    logger,
  });
};

export const getDeployment = async ({
  logger,
  projectId,
  deploymentId,
}: {
  logger: Logger;
  projectId: string;
  deploymentId: string;
}) => {
  return getDdbItem<Deployment>({
    pk: deploymentKeys.PK(projectId),
    sk: deploymentKeys.SK(deploymentId),
    logger,
  });
};

export const updateDeployment = async ({
  logger,
  projectId,
  deploymentId,
  status,
}: {
  logger: Logger;
  projectId: string;
  deploymentId: string;
  status: DeploymentStatus;
}) => {
  const now = Date.now();
  const attributesToUpdate: Record<string, unknown> = {
    status,
    updatedAt: now,
  };

  if (status === DeploymentStatus.IN_PROGRESS) {
    attributesToUpdate.startedAt = now;
  }

  if (
    status === DeploymentStatus.COMPLETED ||
    status === DeploymentStatus.FAILED
  ) {
    attributesToUpdate.endedAt = now;
  }

  await updateItem({
    pk: deploymentKeys.PK(projectId),
    sk: deploymentKeys.SK(deploymentId),
    attributesToUpdate,
    logger,
  });

  return getDeployment({ logger, projectId, deploymentId });
};

export const createBuild = async ({
  orgId,
  logger,
  projectId,
  deploymentId,
  stageId,
}: {
  orgId: string;
  logger: Logger;
  projectId: string;
  deploymentId: string;
  stageId: string;
}) => {
  const githubConnection = await getGitHubConnectionByOrgId({
    orgId,
    logger,
  });

  if (!githubConnection) {
    logger.error("No GitHub connection found for org", { orgId });
    throw new Error("No GitHub connection found for org");
  }

  const project = await getProjectById({
    orgId,
    projectId,
    logger,
  });

  console.log("Project Info:", project);

  if (!project) {
    logger.error("Project not found", { orgId, projectId });
    throw new Error("Project not found");
  }

  const stage = await getStage({
    projectId,
    stageId,
    logger,
  });

  console.log("Stage Info:", stage);

  const githubToken = await getInstallationToken({
    appId: process.env.GITHUB_APP_ID!,
    privateKey: process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    installationId: githubConnection?.installationId!,
  });

  console.log("GitHub Token:", githubToken);

  const response = await triggerBuild({
    projectName: process.env.CODEBUILD_PROJECT_NAME!,
    githubToken: githubToken,
    repoFullName: project.repoFullName,
    branch: stage?.branch || "main",
    installCommand: project.config.installCommand,
    buildCommand: project.config.buildCommand,
    outputDir: project.config.outputDir,
    s3Bucket: project.dedicatedHosting?.bucketName
      ?? process.env.DEPLOYMENTS_S3_BUCKET!,
    projectId,
    deploymentId,
    logger,
  });
  return response;
};
