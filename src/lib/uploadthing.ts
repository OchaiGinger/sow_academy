import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const f = createUploadthing();

export const ourFileRouter = {
  studentPassport: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new UploadThingError("Unauthorized");
        return { userId: session.user.id, role: session.user.role };
      } catch (error) {
        console.error("[uploadthing middleware]", error);
        if (error instanceof UploadThingError) throw error;
        throw new UploadThingError("Unauthorized");
      }
    })
    .onUploadError(async ({ error, fileKey }) => {
      console.error("[uploadthing onUploadError]", { fileKey, error: error?.message ?? error });
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log("[uploadthing onUploadComplete]", { userId: metadata?.userId, key: file?.key });
        const fileUrl = file?.url ?? file?.ufsUrl ?? file?.appUrl ?? (file?.key ? `https://utfs.io/f/${file.key}` : undefined);
        if (!fileUrl) {
          console.error("[uploadthing onUploadComplete] no url", file);
          throw new Error("No file URL returned from UploadThing");
        }
        return { uploadedBy: metadata?.userId ?? null, url: fileUrl };
      } catch (error) {
        console.error("[uploadthing onUploadComplete error]", error);
        throw error;
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;