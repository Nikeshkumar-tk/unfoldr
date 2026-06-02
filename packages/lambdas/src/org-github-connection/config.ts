import type { HttpApiLambdaConfig } from "@unfoldr/types/lambda-config";
import { HttpMethod } from "@unfoldr/types/http";

export const config: HttpApiLambdaConfig = {
  trigger: "httpApi",
  name: "org-github-connection",
  entryFile: "src/org-github-connection/index.ts",
  handlerExportName: "index.handler",
  endpoint: "/orgs/{orgId}/github/connection",
  methods: [HttpMethod.GET, HttpMethod.DELETE],
  authorized: true,
  environmentVariables: {
    GITHUB_APP_ID: process.env.GITHUB_APP_ID ?? "",
    GITHUB_PRIVATE_KEY: process.env.GITHUB_PRIVATE_KEY ?? "",
  },
};
