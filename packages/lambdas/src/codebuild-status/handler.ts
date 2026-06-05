import type { GenericLambdaHandler } from "@unfoldr/types/handler";
import {
  getDeployment,
  updateDeployment,
} from "@unfoldr/aws/dynamo-db/modules/deployments";
import { DeploymentStatus } from "@unfoldr/aws/dynamo-db/modules/deployments/types";
import {
  getProjectById,
  setProjectDeploymentInfo,
} from "@unfoldr/aws/dynamo-db/modules/projects";

type CodeBuildStateChangeEvent = {
  detail: {
    "build-status": string;
    "additional-information"?: {
      environment?: {
        "environment-variables"?: Array<{ name: string; value: string }>;
      };
    };
  };
};

const buildStatusToDeploymentStatus: Record<string, DeploymentStatus> = {
  IN_PROGRESS: DeploymentStatus.IN_PROGRESS,
  SUCCEEDED: DeploymentStatus.COMPLETED,
  FAILED: DeploymentStatus.FAILED,
  STOPPED: DeploymentStatus.FAILED,
  FAULT: DeploymentStatus.FAILED,
  TIMED_OUT: DeploymentStatus.FAILED,
};

export const _handler: GenericLambdaHandler = async ({ event, logger }) => {
  const cbEvent = event as unknown as CodeBuildStateChangeEvent;
  const buildStatus = cbEvent.detail?.["build-status"];
  const envVars =
    cbEvent.detail?.["additional-information"]?.environment?.[
      "environment-variables"
    ] ?? [];

  const deploymentId = envVars.find((v) => v.name === "DEPLOYMENT_ID")?.value;
  const projectId = envVars.find((v) => v.name === "PROJECT_ID")?.value;

  if (!deploymentId || !projectId) {
    logger.info("Skipping CodeBuild event without unfoldr ids", {
      buildStatus,
      hasDeploymentId: !!deploymentId,
      hasProjectId: !!projectId,
    });
    return;
  }

  const nextStatus = buildStatusToDeploymentStatus[buildStatus];
  if (!nextStatus) {
    logger.info("Ignoring unmapped CodeBuild status", { buildStatus });
    return;
  }

  logger.info("Updating deployment from CodeBuild event", {
    deploymentId,
    projectId,
    buildStatus,
    nextStatus,
  });

  await updateDeployment({
    logger,
    projectId,
    deploymentId,
    status: nextStatus,
  });

  if (nextStatus !== DeploymentStatus.COMPLETED) {
    return;
  }

  const deployment = await getDeployment({ logger, projectId, deploymentId });
  if (!deployment) {
    logger.error("Deployment row not found after status update", {
      projectId,
      deploymentId,
    });
    return;
  }

  const project = await getProjectById({
    logger,
    orgId: deployment.orgId,
    projectId,
  });
  if (!project) {
    logger.error("Project not found when resolving deployment URL", {
      projectId,
    });
    return;
  }

  let cloudfrontUrl: string;
  if (project.dedicatedHosting) {
    cloudfrontUrl = `https://${project.dedicatedHosting.distributionDomainName}`;
  } else {
    const domainName = process.env.DOMAIN_NAME;
    if (!domainName) {
      logger.error("DOMAIN_NAME env var is not set; cannot set deployment URL");
      return;
    }
    cloudfrontUrl = `https://${projectId}.${domainName}`;
  }

  await setProjectDeploymentInfo({
    logger,
    orgId: deployment.orgId,
    projectId,
    deploymentInfo: {
      type: "ReactApp",
      stage: deployment.stage.stageName,
      cloudfrontUrl,
    },
  });
};
