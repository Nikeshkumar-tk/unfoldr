import type { EventBridgeLambdaConfig } from "@unfoldr/types/lambda-config";

export const config: EventBridgeLambdaConfig = {
  trigger: "eventBridge",
  name: "codebuild-status",
  entryFile: "src/codebuild-status/index.ts",
  handlerExportName: "index.handler",
  eventSource: "aws.codebuild",
  detailType: "CodeBuild Build State Change",
};
