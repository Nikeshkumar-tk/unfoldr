import { AdminCreateUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { getCognitoClient } from "./client";
import { createUser, getUserById } from "../dynamo-db/modules/users/main";
import { Logger } from "@unfoldr/logger";
import { getOrgById } from "../dynamo-db/modules/organizations/main";
import { createOrgUser } from "../dynamo-db/modules/org-users/main";
import { OrgRole } from "../dynamo-db/modules/org-users/types";

const cognitoClient = getCognitoClient();

const tempPassword = "Temp@123";

/**
 * Admin-invite flow: create a Cognito user, mirror them in DynamoDB, and
 * add them to the given org with the requested role. Used by org admins
 * inviting members.
 */
export const createCognitoUserAsAdmin = async ({
  email,
  name,
  orgId,
  role = OrgRole.MEMBER,
  logger,
}: {
  email: string;
  name: string;
  orgId: string;
  role?: OrgRole;
  logger: Logger;
}) => {
  const org = await getOrgById(orgId, logger);
  if (!org) {
    throw new Error(`Organization ${orgId} not found`);
  }

  const command = new AdminCreateUserCommand({
    UserPoolId: process.env.COGNITO_USER_POOL_ID!,
    Username: email,
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "email_verified", Value: true.toString() },
    ],
    TemporaryPassword: tempPassword,
    MessageAction: "SUPPRESS",
  });

  logger.info("Creating user in Cognito", { email, orgId });

  const response = await cognitoClient.send(command);

  if (response.$metadata.httpStatusCode !== 200) {
    throw new Error(
      `Failed to create user in Cognito. Status code: ${response.$metadata.httpStatusCode}`,
    );
  }

  const sub = response.User?.Attributes?.find((attr) => attr.Name === "sub")
    ?.Value;
  if (!sub) {
    throw new Error("Cognito did not return a sub for the new user");
  }

  // Admin-created users have a name set up front, so profile is complete.
  const dynamoUser =
    (await getUserById(sub, logger)) ??
    (await createUser({
      userId: sub,
      email,
      name,
      profileCompleted: true,
      logger,
    }));

  await createOrgUser({
    orgId: org.orgId,
    userId: sub,
    role,
    orgName: org.name,
    orgAvatarUrl: org.avatarUrl,
    userEmail: dynamoUser.email,
    userName: dynamoUser.name,
    userAvatarUrl: dynamoUser.avatarUrl,
    logger,
  });

  logger.info("User invited to org", { sub, orgId, role });
  return { user: dynamoUser, role, orgId };
};
