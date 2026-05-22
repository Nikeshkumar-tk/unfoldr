import type { CognitoLambdaConfig } from "@unfoldr/types/lambda-config";

export const config: CognitoLambdaConfig = {
  trigger: "cognito",
  name: "post-confirm-user",
  entryFile: "src/post-confirm-user/index.ts",
  handlerExportName: "index.handler",
  triggerType: "postConfirmation",
};
