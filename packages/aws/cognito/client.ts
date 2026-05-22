import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

let cognitoClient: CognitoIdentityProviderClient;

export const getCognitoClient = () => {
  if (!cognitoClient) {
    cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.REGION || "us-east-1",
    });
  }
  return cognitoClient;
};
