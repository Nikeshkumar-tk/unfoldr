import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { CONFIGS } from "../config";
import { createResourceName } from "../utils/common";
import { getRewriteDeploymentCode } from "@unfoldr/cloudfront-fns";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";

type HostingConstructProps = {
  lambdaFns: NodejsFunction[];
  certificate: ICertificate;
};

export class HostingConstruct extends Construct {
  public readonly deploymentBucket: s3.Bucket;
  public readonly project: codebuild.CfnProject;
  public readonly deploymentDistribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: HostingConstructProps) {
    super(scope, id);

    const accountId = CONFIGS.ACCOUNT_ID ?? "000000000000";

    this.deploymentBucket = new s3.Bucket(this, "DeploymentBucket", {
      bucketName: createResourceName({
        name: `deployments-${accountId}`,
      }),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const serviceRole = new iam.Role(this, "CodeBuildServiceRole", {
      assumedBy: new iam.ServicePrincipal("codebuild.amazonaws.com"),
    });

    this.deploymentBucket.grantReadWrite(serviceRole);

    serviceRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket",
        ],
        resources: [
          "arn:aws:s3:::unfoldr-dedicated-*",
          "arn:aws:s3:::unfoldr-dedicated-*/*",
        ],
      }),
    );

    serviceRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["*"],
      }),
    );

    this.project = new codebuild.CfnProject(this, "DeploymentBuilder", {
      name: createResourceName({ name: "deployment-builder" }),
      serviceRole: serviceRole.roleArn,
      logsConfig: {
        cloudWatchLogs: {
          status: "ENABLED",
          groupName: createResourceName({ name: "deployment-builder" }),
          streamName: "deployment-logs",
        },
      },
      source: {
        type: "NO_SOURCE",
        buildSpec: JSON.stringify({
          version: "0.2",
          phases: {
            install: {
              "runtime-versions": {
                nodejs: "22",
              },

              commands: ["node -v", "git  --version", "corepack enable"],
            },
            pre_build: {
              commands: [
                "echo Cloning Repository",

                "git clone https://x-access-token:$GITHUB_TOKEN@github.com/$REPO_FULL_NAME.git app",

                "cd app",

                "git checkout $BRANCH",

                `
    if [ -f pnpm-lock.yaml ]; then
       pnpm install;
    elif [ -f yarn.lock ]; then
      yarn install;
    else
      npm install;
    fi
    `,
              ],
            },
            build: {
              commands: ["echo Building App", "$BUILD_COMMAND"],
            },
            post_build: {
              commands: [
                "echo Uploading to S3",
                "aws s3 sync $OUTPUT_DIR s3://$S3_BUCKET/deployments/$PROJECT_ID --delete",
              ],
            },
          },
        }),
      },
      environment: {
        type: "LINUX_CONTAINER",
        image: "aws/codebuild/standard:7.0",
        computeType: "BUILD_GENERAL1_SMALL",
        privilegedMode: false,
      },
      artifacts: {
        type: "NO_ARTIFACTS",
      },
    });

    new cdk.CfnOutput(this, "DeploymentBucketName", {
      value: this.deploymentBucket.bucketName,
      description: "S3 bucket for hosted application deployments",
    });

    new cdk.CfnOutput(this, "CodeBuildProjectName", {
      value: this.project.name!,
      description: "CodeBuild project for building and deploying applications",
    });

    // CloudFront distribution for serving deployed apps
    const deploymentOac = new cloudfront.S3OriginAccessControl(
      this,
      "DeploymentOAC",
      {
        signing: cloudfront.Signing.SIGV4_ALWAYS,
      },
    );

    const rewriteFunction = new cloudfront.Function(
      this,
      "DeploymentRewriteFunction",
      {
        code: cloudfront.FunctionCode.fromInline(getRewriteDeploymentCode()),
      },
    );

    const htmlNoCachePolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      "DeploymentHtmlNoCache",
      {
        responseHeadersPolicyName: createResourceName({
          name: "deployment-html-no-cache",
        }),
        customHeadersBehavior: {
          customHeaders: [
            {
              header: "Cache-Control",
              value: "no-cache, no-store, must-revalidate",
              override: true,
            },
          ],
        },
      },
    );

    this.deploymentDistribution = new cloudfront.Distribution(
      this,
      "DeploymentDistribution",
      {
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(
            this.deploymentBucket,
            { originAccessControl: deploymentOac },
          ),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          functionAssociations: [
            {
              function: rewriteFunction,
              eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            },
          ],
          compress: true,
        },
        additionalBehaviors: {
          "*.html": {
            origin: origins.S3BucketOrigin.withOriginAccessControl(
              this.deploymentBucket,
              { originAccessControl: deploymentOac },
            ),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
            cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
            cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
            responseHeadersPolicy: htmlNoCachePolicy,
            functionAssociations: [
              {
                function: rewriteFunction,
                eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
              },
            ],
            compress: true,
          },
        },
        certificate: props.certificate,
        domainNames: [this.getWildcardDomainNames()],
      },
    );

    props.lambdaFns.forEach((fn) => {
      fn.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ["codebuild:StartBuild"],
          resources: [this.project.attrArn],
        }),
      );
      fn.addEnvironment(
        "DEPLOYMENTS_S3_BUCKET",
        this.deploymentBucket.bucketName,
      );

      fn.addEnvironment("CODEBUILD_PROJECT_NAME", this.project.name ?? "");
    });

    new cdk.CfnOutput(this, "DeploymentDistributionDomain", {
      value: this.deploymentDistribution.distributionDomainName,
      description: "CloudFront distribution domain for deployed apps",
    });

    new cdk.CfnOutput(this, "DeploymentDistributionId", {
      value: this.deploymentDistribution.distributionId,
      description: "CloudFront distribution ID for deployed apps",
    });
  }
  getWildcardDomainNames() {
    const domainName = process.env.DOMAIN_NAME;
    if (!domainName) {
      throw new Error("DOMAIN_NAME environment variable is not set");
    }
    return `*.${domainName}`;
  }
}
