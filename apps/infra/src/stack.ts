import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { LambdasConstruct } from "./modules/lambdas";
import { CognitoConstruct } from "./modules/cognito";
import { HttpApiConstruct } from "./modules/http-api";
import { DynamoDbConstruct } from "./modules/dynamodb";
import { WebAppConstruct } from "./modules/web-app";
import { HostingConstruct } from "./modules/hosting";
import { EventBridgeConstruct } from "./modules/eventbridge";
import { AcmCertificateConstruct } from "./modules/acm-certificate";
import { Route53Construct } from "./modules/route53";
import { ExternalDnsConstruct } from "./modules/external-dns";
import { CONFIGS } from "./config";

export class UnfoldrStack extends cdk.Stack {
  lambdas: LambdasConstruct;
  cognito: CognitoConstruct;
  httpApi: HttpApiConstruct;
  dynamoDb: DynamoDbConstruct;
  webApp: WebAppConstruct;
  hosting: HostingConstruct;
  eventBridge: EventBridgeConstruct;
  certificate: AcmCertificateConstruct;
  route53?: Route53Construct;
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
      ...this.lambdas.eventBridgeLambdas,
    ];
    this.dynamoDb = new DynamoDbConstruct(this, "DynamoDb", {
      lambdaFns: dataLambdas,
    });

    const codebuildStatusLambda = this.lambdas.eventBridgeLambdas.find(
      ({ config }) => config.name === "codebuild-status",
    );
    if (codebuildStatusLambda) {
      codebuildStatusLambda.fn.addEnvironment(
        "DOMAIN_NAME",
        process.env.DOMAIN_NAME ?? "",
      );
    }

    const projectsLambda = this.lambdas.httpApiLambdas.find(
      ({ config }) => config.name === "projects",
    );
    if (projectsLambda) {
      projectsLambda.fn.addEnvironment(
        "ACCOUNT_ID",
        process.env.ACCOUNT_ID ?? "",
      );
      projectsLambda.fn.addToRolePolicy(
        new iam.PolicyStatement({
          actions: [
            "s3:CreateBucket",
            "s3:PutBucketPolicy",
            "s3:PutEncryptionConfiguration",
            "s3:PutBucketPublicAccessBlock",
          ],
          resources: ["arn:aws:s3:::unfoldr-dedicated-*"],
        }),
      );
      projectsLambda.fn.addToRolePolicy(
        new iam.PolicyStatement({
          actions: [
            "cloudfront:CreateDistribution",
            "cloudfront:CreateOriginAccessControl",
            "cloudfront:GetDistribution",
          ],
          resources: ["*"],
        }),
      );
    }

    this.certificate = new AcmCertificateConstruct(this, "AcmCertificate");

    // 5. Create S3 + CloudFront hosting for the web console
    this.webApp = new WebAppConstruct(this, "WebApp", {
      certificate: this.certificate.certificate,
    });

    // 6. Create S3 bucket + CodeBuild project for deployment hosting
    this.hosting = new HostingConstruct(this, "Hosting", {
      lambdaFns: [
        this.lambdas.httpApiLambdas.find(
          ({ fn, config }) => config.name === "deployments",
        )!.fn,
      ],
      certificate: this.certificate.certificate,
    });

    // 7. DNS: Route 53 records when DNS_PROVIDER=route53, otherwise emit CfnOutputs
    //    so the operator can wire CNAMEs at their external DNS provider.
    if (CONFIGS.DNS_PROVIDER === "route53") {
      this.route53 = new Route53Construct(this, "Route53", {
        deploymentDistribution: this.hosting.deploymentDistribution,
        webAppDistribution: this.webApp.distribution,
      });
    } else {
      new ExternalDnsConstruct(this, "ExternalDns", {
        deploymentDistribution: this.hosting.deploymentDistribution,
        webAppDistribution: this.webApp.distribution,
      });
    }

    // 8. Wire EventBridge rules to event-driven lambdas
    this.eventBridge = new EventBridgeConstruct(this, "EventBridge", {
      eventBridgeLambdas: this.lambdas.eventBridgeLambdas,
    });

    this.lambdas.httpApiLambdas.forEach(({ fn, config }) => {
      fn.addEnvironment(
        "COGNITO_USER_POOL_ID",
        this.cognito.userPool.userPoolId,
      );

      this.cognito.userPool.grant(fn, "cognito-idp:AdminCreateUser");

      fn.addEnvironment("GITHUB_APP_ID", process.env.GITHUB_APP_ID ?? "");
      fn.addEnvironment("GITHUB_CLIENT_ID", process.env.GITHUB_CLIENT_ID ?? "");
      fn.addEnvironment(
        "GITHUB_PRIVATE_KEY",
        process.env.GITHUB_PRIVATE_KEY ?? "",
      );
      fn.addEnvironment(
        "WEB_URL",
        process.env.WEB_URL ?? "http://localhost:5173",
      );
    });

    new cdk.CfnOutput(this, "GithubClientId", {
      value: process.env.GITHUB_CLIENT_ID ?? "",
      description: "GitHub App client ID for the web console",
    });
  }
}
