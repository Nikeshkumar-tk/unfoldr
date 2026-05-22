import { z } from "zod";

export const completeProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Enter your name")
    .max(120, "Keep it under 120 characters"),
});

export type CompleteProfileValues = z.infer<typeof completeProfileSchema>;
