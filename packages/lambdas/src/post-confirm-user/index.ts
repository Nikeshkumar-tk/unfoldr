import { createGenericHandler } from "../middleware/index";
import { _handler } from "./handler";
import { config } from "./config";

export { config };

export const handler = createGenericHandler({
  handler: _handler,
  config,
});
