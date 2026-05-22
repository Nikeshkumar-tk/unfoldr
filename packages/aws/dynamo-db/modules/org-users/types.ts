import { DbBaseType } from "../../types";

export enum OrgRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export type OrgUser = {
  PK: string;
  SK: string;
  orgId: string;
  userId: string;
  role: OrgRole;
  /** Denormalized for cheap list-orgs-of-user (avoid extra GET per row). */
  orgName: string;
  orgAvatarUrl: string;
  /** Denormalized too — saves a lookup when listing users in an org. */
  userEmail: string;
  userName: string;
  userAvatarUrl: string;
  joinedAt: number;
} & Partial<DbBaseType<"GSI1">>;
