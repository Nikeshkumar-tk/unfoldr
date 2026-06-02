export const deploymentKeys = {
  PK: (projectId: string) => `DEPLOYMENTS#${projectId}`,
  SK: (deploymentId: string) => `DEPLOYMENT#${deploymentId}`,
};
