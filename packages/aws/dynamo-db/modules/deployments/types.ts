import { ActedUser } from "../../types";

export enum DeploymentStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export type Deployment = {
  PK: string;
  SK: string;
  projectId: string;
  orgId: string;
  deploymentId: string;
  status: DeploymentStatus;
  stage: {
    stageId: string;
    stageName: string;
  };
  createdAt: number;
  updatedAt: number;
  createdBy: ActedUser;
  startedAt?: number;
  endedAt?: number;
};
