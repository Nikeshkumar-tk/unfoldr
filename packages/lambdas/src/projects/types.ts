import { HttpMethod } from "@unfoldr/types/http";
import z from "zod";
import { projectsSchemas } from "./schema";

export type ProjectsData = {
  [HttpMethod.GET]: unknown;
  [HttpMethod.POST]: z.infer<(typeof projectsSchemas)[HttpMethod.POST]>;
};
