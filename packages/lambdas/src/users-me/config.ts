import type { HttpApiLambdaConfig } from "@unfoldr/types/lambda-config";
import { HttpMethod } from "@unfoldr/types/http";

export const config: HttpApiLambdaConfig = {
  trigger: "httpApi",
  name: "users-me",
  entryFile: "src/users-me/index.ts",
  handlerExportName: "index.handler",
  endpoint: "/users/me",
  methods: [HttpMethod.GET, HttpMethod.PATCH],
  authorized: true,
};
