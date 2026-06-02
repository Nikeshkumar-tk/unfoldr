import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { HttpUserPoolAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { createResourceName } from "../utils/common";
import type { HttpApiLambdaFn } from "../types";

interface HttpApiConstructProps {
  httpApiLambdas: HttpApiLambdaFn[];
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
}

export class HttpApiConstruct extends Construct {
  public readonly httpApi: apigwv2.HttpApi;

  constructor(scope: Construct, id: string, props: HttpApiConstructProps) {
    super(scope, id);

    this.httpApi = new apigwv2.HttpApi(this, id, {
      apiName: createResourceName({ name: "http-api" }),
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.PATCH,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    const cognitoAuthorizer = new HttpUserPoolAuthorizer(
      "CognitoAuthorizer",
      props.userPool,
      { userPoolClients: [props.userPoolClient] },
    );

    props.httpApiLambdas.forEach(({ fn, config }) => {
      const integration = new integrations.HttpLambdaIntegration(
        `${config.name}-integration`,
        fn,
      );
      this.httpApi.addRoutes({
        path: config.endpoint,
        methods: config.methods as unknown as apigwv2.HttpMethod[],
        integration,
        ...(config.authorized && { authorizer: cognitoAuthorizer }),
      });
    });

    new cdk.CfnOutput(this, "HttpApiUrl", {
      value: this.httpApi.apiEndpoint,
    });
  }
}
