import { Amplify } from "aws-amplify";
import { getUserPoolClientId, getUserPoolId } from "./env";

export function configureAmplify(): void {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: getUserPoolId(),
        userPoolClientId: getUserPoolClientId(),
      },
    },
  });
}
