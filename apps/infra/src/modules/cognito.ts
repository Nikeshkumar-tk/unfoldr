import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { createResourceName } from "../utils/common";
import type { CognitoLambdaFn } from "../types";
import type { CognitoLambdaConfig } from "@unfoldr/types/lambda-config";

/** Map our config's triggerType strings to the CDK `UserPoolOperation` constants. */
const TRIGGER_TYPE_TO_OPERATION: Record<
  CognitoLambdaConfig["triggerType"],
  cognito.UserPoolOperation
> = {
  preSignUp: cognito.UserPoolOperation.PRE_SIGN_UP,
  postConfirmation: cognito.UserPoolOperation.POST_CONFIRMATION,
  preAuthentication: cognito.UserPoolOperation.PRE_AUTHENTICATION,
  postAuthentication: cognito.UserPoolOperation.POST_AUTHENTICATION,
  customMessage: cognito.UserPoolOperation.CUSTOM_MESSAGE,
  defineAuthChallenge: cognito.UserPoolOperation.DEFINE_AUTH_CHALLENGE,
  createAuthChallenge: cognito.UserPoolOperation.CREATE_AUTH_CHALLENGE,
  verifyAuthChallengeResponse:
    cognito.UserPoolOperation.VERIFY_AUTH_CHALLENGE_RESPONSE,
  preTokenGeneration: cognito.UserPoolOperation.PRE_TOKEN_GENERATION,
};

interface CognitoConstructProps {
  /**
   * Cognito-trigger lambdas. The construct attaches each one to its
   * declared triggerType on the user pool.
   */
  cognitoLambdas: CognitoLambdaFn[];
}

export class CognitoConstruct extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: CognitoConstructProps) {
    super(scope, id);

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: createResourceName({ name: "user-pool" }),
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Attach Cognito trigger lambdas. `addTrigger` is the mutable API for
    // wiring triggers after the pool is created — handy for dynamically
    // attaching whichever lambdas the lambda construct produced.
    for (const { fn, config } of props.cognitoLambdas) {
      this.userPool.addTrigger(
        TRIGGER_TYPE_TO_OPERATION[config.triggerType],
        fn,
      );
    }

    this.userPoolClient = this.userPool.addClient("WebClient", {
      userPoolClientName: createResourceName({ name: "web-client" }),
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });

    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
    });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
    });
  }
}
