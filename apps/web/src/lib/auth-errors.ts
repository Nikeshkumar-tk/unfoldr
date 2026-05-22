/**
 * Map common Cognito/Amplify error names to user-facing strings.
 * Falls back to the error's own message, then a generic fallback.
 */
const FRIENDLY: Record<string, string> = {
  NotAuthorizedException: "Incorrect email or password.",
  UserNotFoundException: "We couldn't find an account with that email.",
  UserNotConfirmedException:
    "Your email isn't verified yet. Check your inbox for the verification code.",
  PasswordResetRequiredException:
    "You need to reset your password before signing in.",
  CodeMismatchException: "That code doesn't match. Double-check and try again.",
  ExpiredCodeException:
    "That code has expired. Request a new one and try again.",
  LimitExceededException:
    "Too many attempts. Please wait a few minutes and try again.",
  TooManyRequestsException:
    "Too many requests. Please slow down and try again shortly.",
  TooManyFailedAttemptsException:
    "Too many failed attempts. Please wait and try again.",
  InvalidPasswordException:
    "That password doesn't meet the requirements. Try a longer one with mixed case and numbers.",
  InvalidParameterException: "Something about that input isn't valid.",
  UsernameExistsException: "An account with that email already exists.",
  AliasExistsException: "That email is already in use.",
  CodeDeliveryFailureException:
    "We couldn't send a verification code. Please try again in a moment.",
  NetworkError: "Network error. Check your connection and try again.",
};

export function friendlyAuthError(err: unknown): string {
  if (!err) return "Something went wrong. Please try again.";

  if (typeof err === "object" && err !== null) {
    const e = err as { name?: string; message?: string };
    if (e.name && FRIENDLY[e.name]) return FRIENDLY[e.name]!;
    if (e.message) return e.message;
  }

  if (typeof err === "string") return err;

  return "Something went wrong. Please try again.";
}
