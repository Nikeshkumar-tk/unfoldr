import { HttpMethod } from "@unfoldr/types/http";
import z from "zod";
import { stagesSchemas } from "./schema";

export type StagesData = {
  [HttpMethod.GET]: unknown;
  [HttpMethod.POST]: z.infer<(typeof stagesSchemas)[HttpMethod.POST]>;
};
