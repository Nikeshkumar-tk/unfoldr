import z from "zod";
import { HttpMethod } from "@unfoldr/types/http";

export const createStageSchema = z.object({
  action: z.literal("CREATE_STAGE"),
  data: z.object({
    projectId: z.string().min(1),
    orgId: z.string().min(1),
    name: z.string().min(1),
    branch: z.string().min(1),
    environmentVariables: z.record(z.string(), z.string()).optional(),
  }),
});

export const stagesSchemas = {
  [HttpMethod.POST]: createStageSchema,
};
