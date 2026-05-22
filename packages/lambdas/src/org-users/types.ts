import { HttpMethod } from "@unfoldr/types/http";
import z from "zod";
import { orgUsersSchemas } from "./schema";

export type OrgUsersData = {
  [HttpMethod.GET]: unknown;
  [HttpMethod.POST]: z.infer<(typeof orgUsersSchemas)[HttpMethod.POST]>;
};
