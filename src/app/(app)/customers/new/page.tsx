import { redirect } from "next/navigation";

export default function NewCustomerPage() {
  redirect("/customers?compose=1");
}
