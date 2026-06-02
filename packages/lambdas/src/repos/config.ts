import type { HttpApiLambdaConfig } from "@unfoldr/types/lambda-config";
import { HttpMethod } from "@unfoldr/types/http";

export const config: HttpApiLambdaConfig = {
  trigger: "httpApi",
  name: "repos",
  entryFile: "src/repos/index.ts",
  handlerExportName: "index.handler",
  endpoint: "/orgs/{orgId}/repos",
  methods: [HttpMethod.GET],
  authorized: true,
  environmentVariables: {
    GITHUB_APP_ID: process.env.GITHUB_APP_ID ?? "",
    GITHUB_PRIVATE_KEY: process.env.GITHUB_PRIVATE_KEY ?? "",
  },
};
