import { z } from "zod";

export const verifyEmailSchema = z.object({
  email: z.string().email("Enter a valid email"),
  code: z
    .string()
    .min(1, "Enter the code from your email")
    .regex(/^\d+$/, "Code should be digits only"),
});

export type VerifyEmailValues = z.infer<typeof verifyEmailSchema>;
