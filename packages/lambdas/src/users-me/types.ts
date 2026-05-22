import { HttpMethod } from "@unfoldr/types/http";
import z from "zod";
import { usersMeSchemas } from "./schema";

export type UsersMeData = {
  [HttpMethod.GET]: unknown;
  [HttpMethod.PATCH]: z.infer<(typeof usersMeSchemas)[HttpMethod.PATCH]>;
};
