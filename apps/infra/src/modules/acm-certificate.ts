import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

export class AcmCertificateConstruct extends Construct {
  certificateArn: string;
  certificate: acm.ICertificate;
  constructor(scope: Construct, id: string) {
    super(scope, id);
    this.certificateArn = process.env.ACM_CERTIFICATE_ARN || "";
    this.certificate = acm.Certificate.fromCertificateArn(
      this,
      "AppCertificate",
      this.certificateArn,
    );
  }
}
