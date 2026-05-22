import { HttpMethod } from "@unfoldr/types/http";
import z from "zod";
import { orgsSchemas } from "./schema";

export type OrgsData = {
  [HttpMethod.GET]: unknown;
  [HttpMethod.POST]: z.infer<(typeof orgsSchemas)[HttpMethod.POST]>;
};
