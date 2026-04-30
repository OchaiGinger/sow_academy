import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;

  switch (role) {
    case "ADMIN":
      redirect("/admin");

    case "PRINCIPAL":
      // Principals share the teacher dashboard — they are
      // distinguished by the isPrincipal flag inside the layout,
      // not by having a separate route.
      redirect("/teacher");

    case "TEACHER":
      redirect("/teacher");

    case "STUDENT":
      redirect("/student");

    default:
      redirect("/login");
  }
}
