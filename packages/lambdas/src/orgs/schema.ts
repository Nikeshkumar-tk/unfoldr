import z from "zod";
import { HttpMethod } from "@unfoldr/types/http";

export const orgsSchemas = {
  [HttpMethod.POST]: z.object({
    name: z.string().min(2).max(80),
  }),
};
