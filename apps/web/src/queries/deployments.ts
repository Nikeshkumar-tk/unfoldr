import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useOrgStore } from "../stores/orgStore";

export interface ActedUser {
  name: string;
  id: string;
  email: string;
}

export type DeploymentStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface Deployment {
  PK: string;
  SK: string;
  projectId: string;
  orgId: string;
  deploymentId: string;
  status: DeploymentStatus;
  stage: {
    stageId: string;
    stageName: string;
  };
  createdAt: number;
  updatedAt: number;
  createdBy: ActedUser;
  startedAt?: number;
  endedAt?: number;
}

export interface CreateDeploymentInput {
  projectId: string;
  stageId: string;
  stageName: string;
}

export interface DeploymentResponse {
  deployment: Deployment;
}

export const deploymentsKeys = {
  list: (projectId: string) => ["deployments", projectId] as const,
};

export function useDeploymentsQuery(projectId: string) {
  return useQuery({
    queryKey: deploymentsKeys.list(projectId),
    queryFn: async () => {
      const res = await api<{ deployments: Deployment[] }>(
        "GET",
        `/deployments?projectId=${projectId}`,
      );
      return res.deployments;
    },
    enabled: !!projectId,
  });
}

export function useCreateDeploymentMutation() {
  const qc = useQueryClient();
  const orgId = useOrgStore((s) => s.selectedOrg?.orgId);

  return useMutation({
    mutationFn: (input: CreateDeploymentInput) =>
      api<DeploymentResponse>("POST", "/deployments", {
        json: {
          action: "CREATE_DEPLOYMENT",
          data: {
            projectId: input.projectId,
            orgId,
            stageId: input.stageId,
            stageName: input.stageName,
          },
        },
      }),
    onSuccess: (_data, variables) => {
      const projectId = variables.projectId;
      qc.invalidateQueries({ queryKey: deploymentsKeys.list(projectId) });
      // Invalidate projects to refresh lastDeploymentDetails
      if (orgId) {
        qc.invalidateQueries({ queryKey: ["projects", orgId] });
      }
    },
  });
}
