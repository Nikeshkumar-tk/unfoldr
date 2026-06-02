import z from "zod";
import { HttpMethod } from "@unfoldr/types/http";

export const createDeploymentSchema = z.object({
  action: z.literal("CREATE_DEPLOYMENT"),
  data: z.object({
    projectId: z.string().min(1),
    orgId: z.string().min(1),
    stageId: z.string().min(1),
    stageName: z.string().min(1),
  }),
});

export const deploymentsSchemas = {
  [HttpMethod.POST]: createDeploymentSchema,
};
