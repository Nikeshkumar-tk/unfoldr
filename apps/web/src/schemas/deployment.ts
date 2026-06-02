import { z } from "zod";

export const createDeploymentFormSchema = z.object({
  stageId: z.string().min(1, "Stage is required"),
  stageName: z.string().min(1),
});

export type CreateDeploymentFormValues = z.infer<
  typeof createDeploymentFormSchema
>;
