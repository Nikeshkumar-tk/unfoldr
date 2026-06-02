import type { HttpApiLambdaConfig } from "@unfoldr/types/lambda-config";
import { HttpMethod } from "@unfoldr/types/http";

export const config: HttpApiLambdaConfig = {
  trigger: "httpApi",
  name: "github",
  entryFile: "src/github/index.ts",
  handlerExportName: "index.handler",
  endpoint: "/github/callback",
  methods: [HttpMethod.GET],
  authorized: false,
};
