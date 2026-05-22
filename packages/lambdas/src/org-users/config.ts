import type { HttpApiLambdaConfig } from "@unfoldr/types/lambda-config";
import { HttpMethod } from "@unfoldr/types/http";

export const config: HttpApiLambdaConfig = {
  trigger: "httpApi",
  name: "org-users",
  entryFile: "src/org-users/index.ts",
  handlerExportName: "index.handler",
  endpoint: "/orgs/{orgId}/users",
  methods: [HttpMethod.GET, HttpMethod.POST],
  authorized: true,
};
