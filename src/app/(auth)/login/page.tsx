import { passcodeIsSet } from "@/server/actions";
import { PasscodeLogin } from "@/components/passcode-login";
import { GlassFold } from "@/components/ui/glass-fold";

export const dynamic = "force-dynamic";

export const metadata = { title: "Passcode" };

export default async function LoginPage() {
  const ready = await passcodeIsSet();
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#06081e]">
      <GlassFold className="pointer-events-none absolute inset-0" />
      <div className="relative z-10">
        <PasscodeLogin setup={!ready} />
      </div>
    </main>
  );
}
