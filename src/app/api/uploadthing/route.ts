import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/lib/uploadthing";

const callbackUrl =
  process.env.UPLOADTHING_CALLBACK_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/uploadthing` : undefined);

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: callbackUrl ? { callbackUrl } : undefined,
});