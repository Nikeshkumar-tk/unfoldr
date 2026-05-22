/**
 * Normalize an org name for the uniqueness check.
 * Trim + lowercase so "Acme Co" and "acme co" collide.
 */
export function normalizeOrgName(name: string): string {
  return name.trim().toLowerCase();
}

export const orgKeys = {
  PK: (orgId: string) => `ORG#${orgId}`,
  SK: () => `METADATA`,
  /** GSI1 maps a normalized org name to the org item — used for uniqueness checks. */
  GSI1PK: (name: string) => `ORG_NAME#${normalizeOrgName(name)}`,
  GSI1SK: () => `METADATA`,
};
