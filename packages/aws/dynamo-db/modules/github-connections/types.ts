import type { DbBaseType } from "../../types";

export type GitHubConnection = {
  PK: string;
  SK: string;
  orgId: string;
  installationId: number;
  installedBy: string;
  createdAt: number;
  updatedAt: number;
} & Partial<DbBaseType<"GSI1">>;
