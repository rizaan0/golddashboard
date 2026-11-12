import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { PopupMenu } from "@/components/ui/popup-menu";
import { Input, Label, Textarea } from "@/components/ui/fields";
import { updateCustomerAction } from "@/server/actions";
import { getCustomer } from "@/server/queries";

export const metadata = { title: "Edit Customer" };

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={`Edit ${customer.customerCode}`} description="The customer ID stays the same." />
      <ActionForm action={updateCustomerAction} className="space-y-4 rounded-[26px] border border-zinc-200 bg-white p-5">
        <input type="hidden" name="id" value={customer.id} />
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" autoComplete="name" defaultValue={customer.fullName} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={customer.phone} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" name="address" defaultValue={customer.address ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" defaultValue={customer.notes ?? ""} />
        </div>
        <div className="space-y-1.5">
          <PopupMenu
            id="status"
            name="status"
            label="Status"
            value={customer.status}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          <p className="text-sm text-zinc-500">Inactive customers leave this list and appear under Archived Schemes. Set the status back to Active to return them.</p>
        </div>
        <SubmitButton>Save Changes</SubmitButton>
      </ActionForm>
    </div>
  );
}
