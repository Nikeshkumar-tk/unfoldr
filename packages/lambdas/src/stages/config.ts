import type { HttpApiLambdaConfig } from "@unfoldr/types/lambda-config";
import { HttpMethod } from "@unfoldr/types/http";

export const config: HttpApiLambdaConfig = {
  trigger: "httpApi",
  name: "stages",
  entryFile: "src/stages/index.ts",
  handlerExportName: "index.handler",
  endpoint: "/stages",
  methods: [HttpMethod.GET, HttpMethod.POST],
  authorized: true,
};
