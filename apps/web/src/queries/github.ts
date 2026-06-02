import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useOrgStore } from "../stores/orgStore";

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
}

export interface GitHubConnectionStatus {
  connected: boolean;
  installationId?: number;
  githubOrgName?: string;
  installedBy?: string;
  createdAt?: number;
  repos?: GitHubRepo[];
}

export const githubKeys = {
  connection: (orgId: string) => ["github-connection", orgId] as const,
};

export function useGitHubConnectionQuery() {
  const orgId = useOrgStore((s) => s.selectedOrg?.orgId);

  return useQuery({
    queryKey: orgId ? githubKeys.connection(orgId) : ["github-connection"],
    queryFn: async () => {
      if (!orgId) return { connected: false } as GitHubConnectionStatus;
      return api<GitHubConnectionStatus>(
        "GET",
        `/orgs/${orgId}/github/connection`,
      );
    },
    enabled: !!orgId,
  });
}

export function useDisconnectGitHubMutation() {
  const qc = useQueryClient();
  const orgId = useOrgStore((s) => s.selectedOrg?.orgId);

  return useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No organization selected");
      return api<{ connected: boolean }>(
        "DELETE",
        `/orgs/${orgId}/github/connection`,
      );
    },
    onSuccess: () => {
      if (orgId) {
        qc.invalidateQueries({ queryKey: githubKeys.connection(orgId) });
      }
    },
  });
}
