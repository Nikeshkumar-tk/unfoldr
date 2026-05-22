import { DbBaseType } from "../../types";

export type Organization = {
  PK: string;
  SK: string;
  orgId: string;
  name: string;
  /** Lowercased copy of `name` for case-insensitive comparisons. */
  normalizedName: string;
  /** Cognito sub of the creator. */
  createdBy: string;
  createdAt: number;
  avatarUrl: string;
} & Partial<DbBaseType<"GSI1">>;
