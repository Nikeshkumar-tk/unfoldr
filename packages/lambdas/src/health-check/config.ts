import type { HttpApiLambdaConfig } from "@unfoldr/types/lambda-config";
import { HttpMethod } from "@unfoldr/types/http";

export const config: HttpApiLambdaConfig = {
  trigger: "httpApi",
  name: "health-check",
  entryFile: "src/health-check/index.ts",
  handlerExportName: "index.handler",
  endpoint: "/health",
  methods: [HttpMethod.GET],
  authorized: false,
};
