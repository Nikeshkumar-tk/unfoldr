import { DbBaseType } from "../../types";

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
}

export type User = {
  PK: string;
  SK: string;
  email: string;
  userId: string;
  sub: string;
  status: UserStatus;
  createdAt: number;
  name: string;
  /** False until the user has provided their display name post-signup. */
  profileCompleted: boolean;
  /** External URL (DiceBear initials placeholder until real uploads exist). */
  avatarUrl: string;
} & Partial<DbBaseType<"GSI1">>;
