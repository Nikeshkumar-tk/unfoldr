import z from "zod";
import { HttpMethod } from "@unfoldr/types/http";
import { ProjectType, PackageManager } from "@unfoldr/aws/dynamo-db/modules/projects/types";

const configSchema = z.object({
  framework: z.literal("vite"),
  packageManager: z.nativeEnum(PackageManager),
  installCommand: z.string().min(1),
  buildCommand: z.string().min(1),
  outputDir: z.string().min(1),
});

export const createProjectSchema = z.object({
  action: z.literal("CREATE_PROJECT"),
  data: z.object({
    projectType: z.nativeEnum(ProjectType),
    projectName: z.string().min(1).max(100),
    repoFullName: z.string().min(1),
    config: configSchema,
  }),
});

export const updateProjectSchema = z.object({
  action: z.literal("UPDATE_PROJECT"),
  data: z.object({
    projectId: z.string().min(1),
    projectName: z.string().min(1).max(100),
    repoFullName: z.string().min(1),
    config: configSchema,
  }),
});

export const deleteProjectSchema = z.object({
  action: z.literal("DELETE_PROJECT"),
  data: z.object({
    projectId: z.string().min(1),
  }),
});

export const projectActionSchema = z.discriminatedUnion("action", [
  createProjectSchema,
  updateProjectSchema,
  deleteProjectSchema,
]);

export const projectsSchemas = {
  [HttpMethod.POST]: projectActionSchema,
};
