import * as cdk from "aws-cdk-lib";
import { UnfoldrStack } from "./stack";
import { CONFIGS } from "./config";
import { createResourceName } from "./utils/common";

const app = new cdk.App();

new UnfoldrStack(app, createResourceName({ name: "unfoldr-stack" }), {
  env: {
    account: CONFIGS.ACCOUNT_ID,
    region: CONFIGS.REGION,
  },
});

app.synth();
