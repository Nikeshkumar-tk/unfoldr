import { createHttpHandler } from "../middleware/index";
import { _handler } from "./handler";
import { config } from "./config";

export { config };

export const handler = createHttpHandler({
  handler: _handler,
  config,
});
