import { ActedUser } from "../../types";

export type Stage = {
  PK: string;
  SK: string;
  stageId: string;
  projectId: string;
  orgId: string;
  name: string;
  branch: string;
  environmentVariables: Record<string, string>;
  createdAt: number;
  updatedAt: number;
  createdBy: ActedUser;
};
