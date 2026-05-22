import type { HttpApiLambdaConfig } from "@unfoldr/types/lambda-config";
import { HttpMethod } from "@unfoldr/types/http";

export const config: HttpApiLambdaConfig = {
  trigger: "httpApi",
  name: "orgs",
  entryFile: "src/orgs/index.ts",
  handlerExportName: "index.handler",
  endpoint: "/orgs",
  methods: [HttpMethod.GET, HttpMethod.POST],
  authorized: true,
};
