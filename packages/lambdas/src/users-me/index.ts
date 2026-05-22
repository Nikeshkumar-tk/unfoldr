import { createHttpHandler } from "../middleware/index";
import { _handler } from "./handler";
import { config } from "./config";
import { usersMeSchemas } from "./schema";

export { config };

export const handler = createHttpHandler({
  handler: _handler,
  config,
  schemas: usersMeSchemas,
});
