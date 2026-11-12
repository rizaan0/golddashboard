import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { Input, Label } from "@/components/ui/fields";
import { changePasswordAction, logoutAction } from "@/server/actions";

export const metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ password?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="-my-8 mx-auto flex min-h-[calc(100dvh-4.625rem)] w-full max-w-xl flex-col justify-center gap-6 py-8">
      {params.password ? <p role="status" className="rounded-[26px] bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Password updated.</p> : null}
      <ActionForm action={changePasswordAction} className="overflow-hidden rounded-[26px] border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-balance text-zinc-950">Password</h2>
            <p className="text-[15px] leading-normal text-pretty text-zinc-600">Enter Four Digits Code</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" name="currentPassword" type="password" inputMode="numeric" autoComplete="current-password" maxLength={4} required className="rounded-[26px]" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" name="newPassword" type="password" inputMode="numeric" autoComplete="new-password" maxLength={4} required className="rounded-[26px]" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" inputMode="numeric" autoComplete="new-password" maxLength={4} required className="rounded-[26px]" />
            </div>
          </div>
          <SubmitButton pendingLabel="Updating">Update Password</SubmitButton>
        </div>
      </ActionForm>
      <form action={logoutAction}>
        <button type="submit" className="flex min-h-11 w-full items-center justify-center rounded-full bg-white text-[17px] text-[#ff3b30]">
          Sign Out
        </button>
      </form>
    </div>
  );
}
