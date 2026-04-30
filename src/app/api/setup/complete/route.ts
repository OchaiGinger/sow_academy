import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      schoolName,
      schoolEmail,
      schoolPhone,
      schoolAddress,
      schoolWebsite,
      schoolDescription,
      schoolLogo,
      schoolStamp,
      schoolMotto,
      principalName,
      adminName,
      password,
      resultCardPrice,
    } = body;

    // Check if setup was already performed
    const existingSchool = await db.school.findFirst();
    if (existingSchool) {
      return NextResponse.json(
        { error: "Setup already complete" },
        { status: 409 },
      );
    }

    // 1. Create the Admin User via Better Auth
    //    Pass req.headers so Better Auth has full server-side context
    const signUpResponse = await auth.api.signUpEmail({
      body: {
        email: schoolEmail,
        password: password,
        name: adminName,
      },
      headers: req.headers,
    });

    if (!signUpResponse?.user) {
      throw new Error(
        "Failed to initialize administrator account. Please try again.",
      );
    }

    // 2. Explicitly set the role to ADMIN
    //    signUpEmail ignores custom fields unless declared as additionalFields
    //    in your auth config, so we set it directly via Prisma
    await db.user.update({
      where: { id: signUpResponse.user.id },
      data: { role: "ADMIN" },
    });

    // 3. Create the School record and link it to the admin user
    await db.school.create({
      data: {
        name: schoolName,
        email: schoolEmail,
        phone: schoolPhone ?? null,
        address: schoolAddress ?? null,
        website: schoolWebsite ?? null,
        description: schoolDescription ?? null,
        logoUrl: schoolLogo ?? null,
        stampUrl: schoolStamp ?? null,
        motto: schoolMotto ?? null,
        principalName: principalName,
        resultCardPrice: parseFloat(resultCardPrice?.toString()) || 500,
        adminUserId: signUpResponse.user.id,
      },
    });
    console.log("Setup completed successfully");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Stringify the full error so Better Auth's nested fields
    // (body, status, cause) are visible in your server logs
    console.error("Setup completion failure:", JSON.stringify(error, null, 2));

    return NextResponse.json(
      {
        error:
          error.message || "A critical error occurred during initialization.",
      },
      { status: 500 },
    );
  }
}
