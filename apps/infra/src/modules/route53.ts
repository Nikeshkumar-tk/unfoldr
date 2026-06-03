import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";

interface Route53ConstructProps {
  deploymentDistribution: cloudfront.IDistribution;
  webAppDistribution: cloudfront.IDistribution;
}

export class Route53Construct extends Construct {
  public readonly hostedZone: route53.IHostedZone;

  constructor(scope: Construct, id: string, props: Route53ConstructProps) {
    super(scope, id);

    const domainName = process.env.DOMAIN_NAME;
    if (!domainName) {
      throw new Error("DOMAIN_NAME environment variable is not set");
    }

    const hostedZoneId = process.env.HOSTED_ZONE_ID;
    if (!hostedZoneId) {
      throw new Error("HOSTED_ZONE_ID environment variable is not set");
    }

    this.hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId,
        zoneName: domainName,
      },
    );

    const deploymentTarget = route53.RecordTarget.fromAlias(
      new targets.CloudFrontTarget(props.deploymentDistribution),
    );

    new route53.ARecord(this, "DeploymentWildcardA", {
      zone: this.hostedZone,
      recordName: "*",
      target: deploymentTarget,
    });

    new route53.AaaaRecord(this, "DeploymentWildcardAaaa", {
      zone: this.hostedZone,
      recordName: "*",
      target: deploymentTarget,
    });

    const webAppPrefix = process.env.WEB_APP_SUB_DOMAIN_PREFIX;
    const webAppTarget = route53.RecordTarget.fromAlias(
      new targets.CloudFrontTarget(props.webAppDistribution),
    );

    new route53.ARecord(this, "WebAppA", {
      zone: this.hostedZone,
      recordName: webAppPrefix,
      target: webAppTarget,
    });

    new route53.AaaaRecord(this, "WebAppAaaa", {
      zone: this.hostedZone,
      recordName: webAppPrefix,
      target: webAppTarget,
    });

    new cdk.CfnOutput(this, "HostedZoneId", {
      value: this.hostedZone.hostedZoneId,
      description: "Hosted zone ID used for wildcard + web app records",
    });
  }
}
