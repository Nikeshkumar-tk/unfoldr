import * as path from "path";
import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { createResourceName } from "../utils/common";
import type { LambdaConfig } from "@unfoldr/types/lambda-config";
import type {
  HttpApiLambdaFn,
  SqsLambdaFn,
  EventBridgeLambdaFn,
  CognitoLambdaFn,
  S3LambdaFn,
  DynamoStreamLambdaFn,
  WebSocketLambdaFn,
  StandaloneLambdaFn,
} from "../types";

// Import all lambda barrel exports
import * as httpApiLambdas from "@unfoldr/lambdas/src/http-api-lambdas";
import * as cognitoLambdas from "@unfoldr/lambdas/src/cognito-lambdas";

export class LambdasConstruct extends Construct {
  public readonly httpApiLambdas: HttpApiLambdaFn[] = [];
  public readonly sqsLambdas: SqsLambdaFn[] = [];
  public readonly eventBridgeLambdas: EventBridgeLambdaFn[] = [];
  public readonly cognitoLambdas: CognitoLambdaFn[] = [];
  public readonly s3Lambdas: S3LambdaFn[] = [];
  public readonly dynamoStreamLambdas: DynamoStreamLambdaFn[] = [];
  public readonly webSocketLambdas: WebSocketLambdaFn[] = [];
  public readonly standaloneLambdas: StandaloneLambdaFn[] = [];

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const lambdasRoot = path.dirname(
      require.resolve("@unfoldr/lambdas/package.json"),
    );

    const allConfigModules = [
      ...Object.values(httpApiLambdas),
      ...Object.values(cognitoLambdas),
      // Add other barrel imports here as lambdas are created:
      // ...Object.values(sqsLambdas),
      // ...Object.values(eventBridgeLambdas),
    ] as Array<{ config: LambdaConfig }>;

    for (const { config } of allConfigModules) {
      const fn = this.createLambdaFunction(lambdasRoot, config);

      switch (config.trigger) {
        case "httpApi":
          this.httpApiLambdas.push({ fn, config });
          break;
        case "sqs":
          this.sqsLambdas.push({ fn, config });
          break;
        case "eventBridge":
          this.eventBridgeLambdas.push({ fn, config });
          break;
        case "cognito":
          this.cognitoLambdas.push({ fn, config });
          break;
        case "s3":
          this.s3Lambdas.push({ fn, config });
          break;
        case "dynamoStream":
          this.dynamoStreamLambdas.push({ fn, config });
          break;
        case "webSocket":
          this.webSocketLambdas.push({ fn, config });
          break;
        case "standalone":
          this.standaloneLambdas.push({ fn, config });
          break;
      }
    }
  }

  private createLambdaFunction(
    lambdasRoot: string,
    config: LambdaConfig,
  ): NodejsFunction {
    return new NodejsFunction(this, `${config.name}-lambda`, {
      entry: path.join(lambdasRoot, config.entryFile),
      handler: config.handlerExportName,
      functionName: createResourceName({ name: config.name }),
      memorySize: config.memorySize ?? 512,
      timeout: Duration.seconds(config.timeoutSeconds ?? 30),
      bundling: {
        minify: true,
        bundleAwsSDK: false,
      },
      environment: config.environmentVariables ?? {},
    });
  }
}
