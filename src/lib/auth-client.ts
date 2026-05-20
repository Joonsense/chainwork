import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

/**
 * Browser-side Better-Auth client. Same-origin as the API, so no
 * `baseURL` is needed.
 */
export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});
