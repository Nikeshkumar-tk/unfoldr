import { ZodError } from "zod";

export const lambdaResponse = ({
  data,
  status,
}: {
  data: unknown;
  status: number;
}) => {
  return {
    statusCode: status,
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  };
};

export const formatZodErrors = (
  error: ZodError
): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "root";
    if (!errors[key]) errors[key] = [];
    errors[key]!.push(issue.message);
  }
  return errors;
};
