import { requireOwner } from "@/lib/auth-guard";
import { Shell } from "@/components/shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireOwner();
  return <Shell>{children}</Shell>;
}
