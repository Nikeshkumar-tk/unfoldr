import { z } from "zod";

const envVarSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string(),
});

export const createStageFormSchema = z.object({
  name: z.string().min(1, "Stage name is required"),
  branch: z.string().min(1, "Branch is required"),
  environmentVariables: z.array(envVarSchema),
});

export type CreateStageFormValues = z.infer<typeof createStageFormSchema>;
