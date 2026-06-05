import { ActedUser, DbBaseType } from "../../types";
import type { Deployment } from "../deployments/types";

export enum ProjectType {
  ReactApp = "ReactApp",
}

export enum PackageManager {
  npm = "npm",
  yarn = "yarn",
  pnpm = "pnpm",
}

export enum DeploymentMode {
  Shared = "shared",
  Dedicated = "dedicated",
}

export type DedicatedHosting = {
  bucketName: string;
  distributionId: string;
  distributionDomainName: string;
};

export type LastDeploymentDetail = Omit<Deployment, "PK" | "SK">;

export type ReactAppDeploymentInfo = {
  stage: string;
  type: "ReactApp";
  cloudfrontUrl: string;
};

export type DeploymentInfo = ReactAppDeploymentInfo;

export type ProjectConfig = {
  framework: "vite";
  packageManager: PackageManager;
  installCommand: string;
  buildCommand: string;
  outputDir: string;
};

export type Project = {
  projectName: string;
  projectType: ProjectType;
  repoFullName: string;
  config: ProjectConfig;
  createdAt: number;
  updatedAt: number;
  createdBy: ActedUser;
  updatedBy: ActedUser;
  orgId: string;
  deploymentMode: DeploymentMode;
  dedicatedHosting?: DedicatedHosting;
  lastDeploymentDetails?: LastDeploymentDetail;
  deploymentInfo?: DeploymentInfo[];
} & Partial<DbBaseType<"GSI1">>;
