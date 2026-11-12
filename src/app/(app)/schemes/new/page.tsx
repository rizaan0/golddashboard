import { redirect } from "next/navigation";

export default async function NewSchemePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const params = await searchParams;
  const customer = params.customerId ? `&customerId=${encodeURIComponent(params.customerId)}` : "";
  redirect(`/schemes?compose=1${customer}`);
}
