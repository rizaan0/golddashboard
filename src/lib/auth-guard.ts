import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireOwner() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
}

export async function requireOwnerApi() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}
