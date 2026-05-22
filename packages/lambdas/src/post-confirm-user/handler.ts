import type { CognitoLambdaHandler } from "@unfoldr/types/handler";
import {
  createUser,
  getUserById,
} from "@unfoldr/aws/dynamo-db/modules/users/main";

/**
 * Cognito post-confirmation trigger. Fires once after the user verifies
 * their email. We mirror the Cognito user into DynamoDB with
 * `profileCompleted: false` so the web app can prompt them for their name
 * the first time they sign in.
 *
 * The lambda must always return the event (or throw) — Cognito uses the
 * return value to continue the sign-up flow.
 */
export const _handler: CognitoLambdaHandler = async ({ event, logger }) => {
  const { sub, email } = event.request.userAttributes;
  logger.info("post-confirmation trigger", {
    triggerSource: event.triggerSource,
    sub,
    email,
  });

  if (!sub || !email) {
    logger.warn("Missing sub or email on event; skipping DB write", {
      attributes: event.request.userAttributes,
    });
    return event;
  }

  // Idempotency: post-confirmation can fire twice if Cognito retries.
  // If the user already exists, do nothing.
  const existing = await getUserById(sub, logger);
  if (existing) {
    logger.info("User already exists in DB; skipping", { sub });
    return event;
  }

  await createUser({
    userId: sub,
    email,
    name: "",
    profileCompleted: false,
    logger,
  });

  return event;
};
