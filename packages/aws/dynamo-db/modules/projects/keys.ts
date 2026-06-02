export const projectKeys = {
  PK: ({ orgId }: { orgId: string }) => `PROJECTS#${orgId}`,
  SK: ({ projectId }: { projectId: string }) => `METADATA#${projectId}`,
  GSI1PK: ({ projectName }: { projectName: string }) =>
    `PROJECT_NAME#${projectName.toUpperCase()}`,
  GSI1SK: () => `METADATA`,
};
