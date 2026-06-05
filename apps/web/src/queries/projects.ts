import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useOrgStore } from "../stores/orgStore";
import type { Deployment } from "./deployments";

export type DeploymentInfo = {
  stage: string;
  type: "ReactApp";
  cloudfrontUrl: string;
};

export type ProjectConfig = {
  framework: "vite";
  packageManager: "npm" | "yarn" | "pnpm";
  installCommand: string;
  buildCommand: string;
  outputDir: string;
};

export type DedicatedHosting = {
  bucketName: string;
  distributionId: string;
  distributionDomainName: string;
};

export interface Project {
  projectName: string;
  projectType: string;
  repoFullName: string;
  config: ProjectConfig;
  deploymentMode: "shared" | "dedicated";
  dedicatedHosting?: DedicatedHosting;
  createdAt: number;
  updatedAt: number;
  createdBy: { name: string; id: string; email: string };
  updatedBy: { name: string; id: string; email: string };
  orgId: string;
  PK: string;
  SK: string;
  lastDeploymentDetails?: Omit<Deployment, "PK" | "SK">;
  deploymentInfo?: DeploymentInfo[];
}

export interface UpdateProjectInput {
  projectId: string;
  projectName: string;
  repoFullName: string;
  config: ProjectConfig;
}

export interface CreateProjectInput {
  projectName: string;
  projectType: string;
  repoFullName: string;
  config: ProjectConfig;
  deploymentMode: "shared" | "dedicated";
}

export const projectsKeys = {
  list: (orgId: string) => ["projects", orgId] as const,
};

export function useProjectsQuery() {
  const orgId = useOrgStore((s) => s.selectedOrg?.orgId);

  return useQuery({
    queryKey: orgId ? projectsKeys.list(orgId) : ["projects"],
    queryFn: async () => {
      if (!orgId) return [] as Project[];
      const res = await api<{ projects: Project[] }>(
        "GET",
        `/orgs/${orgId}/projects`,
      );
      return res.projects;
    },
    enabled: !!orgId,
  });
}

export function useCreateProjectMutation() {
  const qc = useQueryClient();
  const orgId = useOrgStore((s) => s.selectedOrg?.orgId);

  return useMutation({
    mutationFn: (input: CreateProjectInput) => {
      return api<{ project: Project }>("POST", `/orgs/${orgId}/projects`, {
        json: {
          action: "CREATE_PROJECT",
          data: {
            projectName: input.projectName,
            projectType: input.projectType,
            repoFullName: input.repoFullName,
            config: input.config,
            deploymentMode: input.deploymentMode,
          },
        },
      });
    },
    onSuccess: () => {
      if (orgId) {
        qc.invalidateQueries({ queryKey: projectsKeys.list(orgId) });
      }
    },
  });
}

export function useUpdateProjectMutation() {
  const qc = useQueryClient();
  const orgId = useOrgStore((s) => s.selectedOrg?.orgId);

  return useMutation({
    mutationFn: (input: UpdateProjectInput) => {
      return api<{ project: Project }>("POST", `/orgs/${orgId}/projects`, {
        json: {
          action: "UPDATE_PROJECT",
          data: {
            projectId: input.projectId,
            projectName: input.projectName,
            repoFullName: input.repoFullName,
            config: input.config,
          },
        },
      });
    },
    onSuccess: () => {
      if (orgId) {
        qc.invalidateQueries({ queryKey: projectsKeys.list(orgId) });
      }
    },
  });
}

export function useDeleteProjectMutation() {
  const qc = useQueryClient();
  const orgId = useOrgStore((s) => s.selectedOrg?.orgId);

  return useMutation({
    mutationFn: (projectId: string) => {
      return api<{ deleted: boolean }>("POST", `/orgs/${orgId}/projects`, {
        json: {
          action: "DELETE_PROJECT",
          data: { projectId },
        },
      });
    },
    onSuccess: () => {
      if (orgId) {
        qc.invalidateQueries({ queryKey: projectsKeys.list(orgId) });
      }
    },
  });
}
