export const githubConnectionKeys = {
  PK: (orgId: string) => `ORG#${orgId}`,
  SK: () => `GITHUB_CONNECTION`,
  GSI1PK: (installationId: number) => `GITHUB_INSTALLATION#${installationId}`,
  GSI1SK: () => `GITHUB_CONNECTION`,
};
