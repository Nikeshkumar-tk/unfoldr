import { z } from "zod";

export enum ProjectType {
  ReactApp = "ReactApp",
}

export enum Framework {
  vite = "vite",
}

export enum PackageManager {
  npm = "npm",
  yarn = "yarn",
  pnpm = "pnpm",
}

export const createProjectSchema = z.object({
  projectName: z.string().min(1, "Project name is required").max(100),
  projectType: z.nativeEnum(ProjectType),
  repoFullName: z.string().min(1, "Repository is required"),
  config: z.object({
    framework: z.nativeEnum(Framework),
    packageManager: z.nativeEnum(PackageManager),
    installCommand: z.string().min(1, "Install command is required"),
    buildCommand: z.string().min(1, "Build command is required"),
    outputDir: z.string().min(1, "Output directory is required"),
  }),
});

export type CreateProjectValues = z.infer<typeof createProjectSchema>;
