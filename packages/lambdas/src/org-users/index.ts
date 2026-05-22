import { createHttpHandler } from "../middleware/index";
import { _handler } from "./handler";
import { config } from "./config";
import { orgUsersSchemas } from "./schema";

export { config };

export const handler = createHttpHandler({
  handler: _handler,
  config,
  schemas: orgUsersSchemas,
});
