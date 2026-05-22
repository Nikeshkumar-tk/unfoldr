import z from "zod";
import { HttpMethod } from "@unfoldr/types/http";
import { OrgRole } from "@unfoldr/aws/dynamo-db/modules/org-users/types";

export const orgUsersSchemas = {
  [HttpMethod.POST]: z.object({
    email: z.string().email(),
    name: z.string().min(1).max(120),
    role: z.nativeEnum(OrgRole).default(OrgRole.MEMBER),
  }),
};
