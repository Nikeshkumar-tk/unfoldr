import { HttpMethod } from "@unfoldr/types/http";
import z from "zod";
import { deploymentsSchemas } from "./schema";

export type DeploymentsData = {
  [HttpMethod.GET]: unknown;
  [HttpMethod.POST]: z.infer<(typeof deploymentsSchemas)[HttpMethod.POST]>;
};
