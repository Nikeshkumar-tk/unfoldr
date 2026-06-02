import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useOrgStore } from "../stores/orgStore";

export interface Stage {
  PK: string;
  SK: string;
  stageId: string;
  projectId: string;
  orgId: string;
  name: string;
  branch: string;
  environmentVariables: Record<string, string>;
  createdAt: number;
  updatedAt: number;
  createdBy: { name: string; id: string; email: string };
}

export interface CreateStageInput {
  projectId: string;
  name: string;
  branch: string;
  environmentVariables?: Record<string, string>;
}

export const stagesKeys = {
  list: (projectId: string) => ["stages", projectId] as const,
};

export function useStagesQuery(projectId: string) {
  return useQuery({
    queryKey: stagesKeys.list(projectId),
    queryFn: async () => {
      const res = await api<{ stages: Stage[] }>(
        "GET",
        `/stages?projectId=${projectId}`,
      );
      return res.stages;
    },
    enabled: !!projectId,
  });
}

export function useCreateStageMutation() {
  const qc = useQueryClient();
  const orgId = useOrgStore((s) => s.selectedOrg?.orgId);

  return useMutation({
    mutationFn: (input: CreateStageInput) =>
      api<{ stage: Stage }>("POST", "/stages", {
        json: {
          action: "CREATE_STAGE",
          data: {
            projectId: input.projectId,
            orgId,
            name: input.name,
            branch: input.branch,
            environmentVariables: input.environmentVariables,
          },
        },
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: stagesKeys.list(variables.projectId) });
    },
  });
}
