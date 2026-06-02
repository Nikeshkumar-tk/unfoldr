import type { HttpApiLambdaConfig } from "@unfoldr/types/lambda-config";
import { HttpMethod } from "@unfoldr/types/http";

export const config: HttpApiLambdaConfig = {
  trigger: "httpApi",
  name: "projects",
  entryFile: "src/projects/index.ts",
  handlerExportName: "index.handler",
  endpoint: "/orgs/{orgId}/projects",
  methods: [HttpMethod.GET, HttpMethod.POST],
  authorized: true,
};
