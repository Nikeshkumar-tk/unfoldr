import {
  S3Client,
  CreateBucketCommand,
  PutBucketEncryptionCommand,
  PutPublicAccessBlockCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import {
  CloudFrontClient,
  CreateDistributionCommand,
  CreateOriginAccessControlCommand,
  DistributionConfig,
} from "@aws-sdk/client-cloudfront";
import { Logger } from "@unfoldr/logger";

const REGION = process.env.REGION || "us-east-1";
const s3 = new S3Client({ region: REGION });
const cloudfront = new CloudFrontClient({ region: REGION });

export type DedicatedHostingResources = {
  bucketName: string;
  distributionId: string;
  distributionDomainName: string;
};

export const provisionDedicatedHosting = async ({
  logger,
  projectId,
  accountId,
}: {
  logger: Logger;
  projectId: string;
  accountId: string;
}): Promise<DedicatedHostingResources> => {
  const bucketName = `unfoldr-dedicated-${projectId}`;

  logger.info("Creating dedicated S3 bucket", { bucketName });
  await s3.send(
    new CreateBucketCommand({
      Bucket: bucketName,
      ...(REGION !== "us-east-1"
        ? { CreateBucketConfiguration: { LocationConstraint: REGION as any } }
        : {}),
    }),
  );

  await s3.send(
    new PutPublicAccessBlockCommand({
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: true,
        RestrictPublicBuckets: true,
      },
    }),
  );

  await s3.send(
    new PutBucketEncryptionCommand({
      Bucket: bucketName,
      ServerSideEncryptionConfiguration: {
        Rules: [
          {
            ApplyServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" },
          },
        ],
      },
    }),
  );

  logger.info("Creating CloudFront origin access control");
  const oacResp = await cloudfront.send(
    new CreateOriginAccessControlCommand({
      OriginAccessControlConfig: {
        Name: `oac-${projectId}`,
        OriginAccessControlOriginType: "s3",
        SigningBehavior: "always",
        SigningProtocol: "sigv4",
      },
    }),
  );
  const oacId = oacResp.OriginAccessControl?.Id;
  if (!oacId) {
    throw new Error("Failed to create CloudFront OAC");
  }

  const originDomain = `${bucketName}.s3.${REGION}.amazonaws.com`;
  const callerRef = `${projectId}-${Date.now()}`;
  const originPath = `/deployments/${projectId}`;

  const distConfig: DistributionConfig = {
    CallerReference: callerRef,
    Comment: `Unfoldr dedicated distribution for ${projectId}`,
    Enabled: true,
    DefaultRootObject: "index.html",
    Origins: {
      Quantity: 1,
      Items: [
        {
          Id: "s3-origin",
          DomainName: originDomain,
          OriginPath: originPath,
          S3OriginConfig: { OriginAccessIdentity: "" },
          OriginAccessControlId: oacId,
          CustomHeaders: { Quantity: 0 },
          ConnectionAttempts: 3,
          ConnectionTimeout: 10,
        },
      ],
    },
    DefaultCacheBehavior: {
      TargetOriginId: "s3-origin",
      ViewerProtocolPolicy: "redirect-to-https",
      AllowedMethods: {
        Quantity: 3,
        Items: ["GET", "HEAD", "OPTIONS"],
        CachedMethods: { Quantity: 2, Items: ["GET", "HEAD"] },
      },
      Compress: true,
      // CachingOptimized managed policy id
      CachePolicyId: "658327ea-f89d-4fab-a63d-7e88639e58f6",
    },
    CustomErrorResponses: {
      Quantity: 2,
      Items: [
        {
          ErrorCode: 403,
          ResponseCode: "200",
          ResponsePagePath: "/index.html",
          ErrorCachingMinTTL: 10,
        },
        {
          ErrorCode: 404,
          ResponseCode: "200",
          ResponsePagePath: "/index.html",
          ErrorCachingMinTTL: 10,
        },
      ],
    },
    PriceClass: "PriceClass_100",
    ViewerCertificate: { CloudFrontDefaultCertificate: true },
    HttpVersion: "http2",
    IsIPV6Enabled: true,
    Restrictions: {
      GeoRestriction: { RestrictionType: "none", Quantity: 0 },
    },
  };

  logger.info("Creating CloudFront distribution", { bucketName, oacId });
  const distResp = await cloudfront.send(
    new CreateDistributionCommand({ DistributionConfig: distConfig }),
  );

  const distribution = distResp.Distribution;
  if (!distribution?.Id || !distribution.DomainName) {
    throw new Error("CloudFront distribution creation returned no Id/DomainName");
  }

  const distributionArn = `arn:aws:cloudfront::${accountId}:distribution/${distribution.Id}`;
  const bucketPolicy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "AllowCloudFrontServicePrincipalRead",
        Effect: "Allow",
        Principal: { Service: "cloudfront.amazonaws.com" },
        Action: "s3:GetObject",
        Resource: `arn:aws:s3:::${bucketName}/*`,
        Condition: { StringEquals: { "AWS:SourceArn": distributionArn } },
      },
    ],
  };

  await s3.send(
    new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(bucketPolicy),
    }),
  );

  logger.info("Dedicated hosting provisioned", {
    bucketName,
    distributionId: distribution.Id,
    distributionDomainName: distribution.DomainName,
  });

  return {
    bucketName,
    distributionId: distribution.Id,
    distributionDomainName: distribution.DomainName,
  };
};
