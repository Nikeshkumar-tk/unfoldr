import {
  CodeBuildClient,
  StartBuildCommand,
  EnvironmentVariable,
} from "@aws-sdk/client-codebuild";
import { Logger } from "@unfoldr/logger";

const codeBuildClient = new CodeBuildClient({
  region: process.env.REGION || "us-east-1",
});

export const triggerBuild = async ({
  logger,
  projectName,
  githubToken,
  repoFullName,
  branch,
  installCommand,
  buildCommand,
  outputDir,
  s3Bucket,
  projectId,
  deploymentId,
  environmentVariables = {},
}: {
  logger: Logger;
  projectName: string;
  githubToken: string;
  repoFullName: string;
  branch: string;
  installCommand: string;
  buildCommand: string;
  outputDir: string;
  s3Bucket: string;
  projectId: string;
  deploymentId: string;
  environmentVariables?: Record<string, string>;
}) => {
  const envVarsOverride: EnvironmentVariable[] = [
    { name: "GITHUB_TOKEN", value: githubToken, type: "PLAINTEXT" },
    { name: "REPO_FULL_NAME", value: repoFullName, type: "PLAINTEXT" },
    { name: "BRANCH", value: branch, type: "PLAINTEXT" },
    { name: "INSTALL_COMMAND", value: installCommand, type: "PLAINTEXT" },
    { name: "BUILD_COMMAND", value: buildCommand, type: "PLAINTEXT" },
    { name: "OUTPUT_DIR", value: outputDir, type: "PLAINTEXT" },
    { name: "S3_BUCKET", value: s3Bucket, type: "PLAINTEXT" },
    { name: "PROJECT_ID", value: projectId, type: "PLAINTEXT" },
    { name: "DEPLOYMENT_ID", value: deploymentId, type: "PLAINTEXT" },
  ];

  console.log(
    "Environment Variables for CodeBuild:",
    JSON.stringify(envVarsOverride, null, 2),
  );

  for (const [key, value] of Object.entries(environmentVariables)) {
    envVarsOverride.push({ name: key, value, type: "PLAINTEXT" });
  }

  logger.info("Triggering CodeBuild", { projectName, projectId });

  const response = await codeBuildClient.send(
    new StartBuildCommand({
      projectName,
      environmentVariablesOverride: envVarsOverride,
    }),
  );

  console.log("CodeBuild Response:", response);

  const buildId = response.build?.id;

  logger.info("CodeBuild triggered", { buildId, projectId });

  return { buildId };
};
