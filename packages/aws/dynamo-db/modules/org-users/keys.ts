/**
 * OrgUser keys.
 *
 * Two access patterns:
 *   1. List users in an org           — query main table by PK = ORG#{orgId}
 *   2. List orgs a user is a member of — query GSI1 by GSI1PK = USER#{userId}
 */
export const orgUserKeys = {
  PK: (orgId: string) => `ORG#${orgId}`,
  SK: (userId: string) => `USER#${userId}`,
  GSI1PK: (userId: string) => `USER#${userId}`,
  GSI1SK: (orgId: string) => `ORG#${orgId}`,
};
