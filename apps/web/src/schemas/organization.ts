import { z } from "zod";

export const createOrgSchema = z.object({
  name: z
    .string()
    .min(2, "At least 2 characters")
    .max(80, "Keep it under 80 characters"),
});

export type CreateOrgValues = z.infer<typeof createOrgSchema>;
