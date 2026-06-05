import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";

interface ExternalDnsConstructProps {
  deploymentDistribution: cloudfront.IDistribution;
  webAppDistribution: cloudfront.IDistribution;
}

export class ExternalDnsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ExternalDnsConstructProps) {
    super(scope, id);

    const domainName = process.env.DOMAIN_NAME;
    if (!domainName) {
      throw new Error("DOMAIN_NAME environment variable is not set");
    }
    const webAppPrefix = process.env.WEB_APP_SUB_DOMAIN_PREFIX;
    const webAppHost = webAppPrefix
      ? `${webAppPrefix}.${domainName}`
      : domainName;

    new cdk.CfnOutput(this, "DeploymentDistributionDomainName", {
      value: props.deploymentDistribution.distributionDomainName,
      description: `Create a CNAME at your DNS provider: *.${domainName} -> <this value>`,
    });

    new cdk.CfnOutput(this, "WebAppDistributionDomainName", {
      value: props.webAppDistribution.distributionDomainName,
      description: `Create a CNAME at your DNS provider: ${webAppHost} -> <this value>`,
    });
  }
}
