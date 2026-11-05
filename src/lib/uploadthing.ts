import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define a route for student passport photos
  studentPassport: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      // This code runs on your server before upload
      const session = await auth.api.getSession({ headers: await headers() });
      
      // If you throw, the user will not be able to upload
      if (!session) throw new Error("Unauthorized");
      
      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session.user.id, role: session.user.role };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file object:", JSON.stringify(file, null, 2));
      
      // Return data to the client - use file.url or file.ufsUrl depending on version
      const fileUrl = file.url || file.ufsUrl;
      console.log("file url to return:", fileUrl);
      
      if (!fileUrl) {
        throw new Error("No file URL returned from UploadThing");
      }
      
      // Return data to the client
      return { uploadedBy: metadata.userId, url: fileUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;