"use client";

import { useState } from "react";
import { createPasscodeAction, unlockPasscodeAction } from "@/server/actions";
import { PASSCODE_LENGTH } from "@/lib/passcode";
import { PasscodePad } from "@/components/passcode-pad";

export function PasscodeLogin({ setup }: { setup: boolean }) {
  const [phase, setPhase] = useState<"enter" | "create" | "verify">(setup ? "create" : "enter");
  const [draft, setDraft] = useState("");
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(0);
  const [busy, setBusy] = useState(false);

  const title = phase === "create" ? "Set a Passcode" : phase === "verify" ? "Verify Passcode" : "Enter Passcode";

  const fail = (text: string) => {
    setMessage(text);
    setValue("");
    setShake((count) => count + 1);
    setBusy(false);
  };

  const onChange = (next: string) => {
    if (busy) return;
    setMessage("");
    setValue(next);
    if (next.length < PASSCODE_LENGTH) return;
    setBusy(true);
    if (phase === "create") {
      setDraft(next);
      setValue("");
      setPhase("verify");
      setBusy(false);
      return;
    }
    if (phase === "verify") {
      if (next !== draft) {
        setDraft("");
        setPhase("create");
        fail("Passcodes did not match.");
        return;
      }
      void createPasscodeAction(next).then((result) => {
        if (!result.ok) fail(result.error ?? "The passcode could not be saved.");
      });
      return;
    }
    void unlockPasscodeAction(next).then((result) => {
      if (!result.ok) fail(result.error ?? "Wrong passcode.");
    });
  };

  return <PasscodePad title={title} value={value} shake={shake} message={message} onChange={onChange} onGlass />;
}
