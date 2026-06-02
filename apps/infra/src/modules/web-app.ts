import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Construct } from "constructs";
import { CONFIGS } from "../config";
import { createResourceName } from "../utils/common";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";

interface WebAppConstructProps {
  certificate: ICertificate;
}

export class WebAppConstruct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: WebAppConstructProps) {
    super(scope, id);

    const accountId = CONFIGS.ACCOUNT_ID ?? "000000000000";

    this.bucket = new s3.Bucket(this, "Bucket", {
      bucketName: createResourceName({ name: `web-app-${accountId}` }),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const oac = new cloudfront.S3OriginAccessControl(this, "OAC", {
      signing: cloudfront.Signing.SIGV4_ALWAYS,
    });

    const errorResponses: cloudfront.ErrorResponse[] = [
      {
        httpStatus: 403,
        responseHttpStatus: 200,
        responsePagePath: "/index.html",
        ttl: cdk.Duration.seconds(10),
      },
      {
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: "/index.html",
        ttl: cdk.Duration.seconds(10),
      },
    ];

    this.distribution = new cloudfront.Distribution(
      this,
      createResourceName({ name: "web-app-distribution" }),
      {
        defaultRootObject: "index.html",
        errorResponses,
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
            originAccessControl: oac,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
        domainNames: [this.getWebAppDomainName()],
        certificate: props.certificate,
      },
    );

    new cdk.CfnOutput(this, "BucketName", {
      value: this.bucket.bucketName,
      description: "S3 bucket for React app hosting",
    });

    new cdk.CfnOutput(this, "DistributionDomain", {
      value: this.distribution.distributionDomainName,
      description: "CloudFront distribution domain name",
    });

    new cdk.CfnOutput(this, "DistributionId", {
      value: this.distribution.distributionId,
      description: "CloudFront distribution ID",
    });
  }
  getWebAppDomainName() {
    const domainName = process.env.DOMAIN_NAME;
    if (!domainName) {
      throw new Error("DOMAIN_NAME environment variable is not set");
    }
    if (process.env.WEB_APP_SUB_DOMAIN_PREFIX) {
      return `${process.env.WEB_APP_SUB_DOMAIN_PREFIX}.${domainName}`;
    }
    return domainName;
  }
}
