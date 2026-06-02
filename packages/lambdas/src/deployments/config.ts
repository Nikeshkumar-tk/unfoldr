import type { HttpApiLambdaConfig } from "@unfoldr/types/lambda-config";
import { HttpMethod } from "@unfoldr/types/http";

export const config: HttpApiLambdaConfig = {
  trigger: "httpApi",
  name: "deployments",
  entryFile: "src/deployments/index.ts",
  handlerExportName: "index.handler",
  endpoint: "/deployments",
  methods: [HttpMethod.GET, HttpMethod.POST],
  authorized: true,
};
