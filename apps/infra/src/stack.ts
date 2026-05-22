import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { LambdasConstruct } from "./modules/lambdas";
import { CognitoConstruct } from "./modules/cognito";
import { HttpApiConstruct } from "./modules/http-api";
import { DynamoDbConstruct } from "./modules/dynamodb";

export class UnfoldrStack extends cdk.Stack {
  lambdas: LambdasConstruct;
  cognito: CognitoConstruct;
  httpApi: HttpApiConstruct;
  dynamoDb: DynamoDbConstruct;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Create ALL lambdas (grouped by trigger type)
    this.lambdas = new LambdasConstruct(this, "Lambdas");

    // 2. Create Cognito User Pool with its trigger lambdas attached
    this.cognito = new CognitoConstruct(this, "Cognito", {
      cognitoLambdas: this.lambdas.cognitoLambdas,
    });

    // 3. Wire HTTP API routes with Cognito authorizer
    this.httpApi = new HttpApiConstruct(this, "HttpApi", {
      httpApiLambdas: this.lambdas.httpApiLambdas,
      userPool: this.cognito.userPool,
      userPoolClient: this.cognito.userPoolClient,
    });

    // 4. Create DynamoDB table and grant access to every lambda that touches data
    const dataLambdas = [
      ...this.lambdas.httpApiLambdas,
      ...this.lambdas.cognitoLambdas,
    ];
    this.dynamoDb = new DynamoDbConstruct(this, "DynamoDb", {
      lambdaFns: dataLambdas,
    });

    this.lambdas.httpApiLambdas.forEach(({ fn }) => {
      fn.addEnvironment(
        "COGNITO_USER_POOL_ID",
        this.cognito.userPool.userPoolId,
      );

      this.cognito.userPool.grant(fn, "cognito-idp:AdminCreateUser");
    });
  }
}
