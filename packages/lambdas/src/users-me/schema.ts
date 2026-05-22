import z from "zod";
import { HttpMethod } from "@unfoldr/types/http";

export const usersMeSchemas = {
  [HttpMethod.PATCH]: z.object({
    name: z.string().min(1).max(120),
  }),
};
