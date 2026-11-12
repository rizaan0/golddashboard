"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { requireOwner } from "@/lib/auth-guard";
import type { ActionState } from "@/lib/action-state";
import { isISODate } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { parseRupeesToPaise } from "@/lib/money";
import { isPasscode } from "@/lib/passcode";
import { normalizePhone } from "@/lib/phone";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import {
  LedgerError,
  archiveScheme,
  createCustomer,
  createScheme,
  postPayment,
  restoreScheme,
  reversePayment,
  updateCustomer,
  updateSchemeTerms,
} from "@/server/ledger";

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

function fail(error: unknown): ActionState {
  if (error instanceof LedgerError) return { ok: false, error: error.message };
  throw error;
}

function ownerEmail() {
  return process.env.OWNER_EMAIL?.trim().toLowerCase() ?? "";
}

export async function passcodeIsSet() {
  const email = ownerEmail();
  if (!email) return false;
  const mark = await prisma.auditLog.findFirst({
    where: { action: "passcode_set", entityType: "user" },
    select: { id: true },
  });
  return Boolean(mark);
}

async function lockedMessage() {
  const email = ownerEmail();
  const attempt = email ? await prisma.loginAttempt.findUnique({ where: { email } }) : null;
  if (attempt?.lockedUntil && attempt.lockedUntil.getTime() > Date.now()) {
    return "Too many attempts. Try again in 15 minutes.";
  }
  return null;
}

export async function unlockPasscodeAction(passcode: string): Promise<ActionState> {
  if (!isPasscode(passcode)) return { ok: false, error: "Enter all 4 digits." };
  const locked = await lockedMessage();
  if (locked) return { ok: false, error: locked };
  try {
    await signIn("credentials", { passcode, redirectTo: "/dashboard" });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AuthError) return { ok: false, error: "Wrong passcode." };
    throw error;
  }
  return { ok: true };
}

export async function createPasscodeAction(passcode: string): Promise<ActionState> {
  if (!isPasscode(passcode)) return { ok: false, error: "Enter all 4 digits." };
  const email = ownerEmail();
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!user) return { ok: false, error: "The owner account is not ready." };
  if (await passcodeIsSet()) return { ok: false, error: "A passcode is already set." };
  const passwordHash = await bcrypt.hash(passcode, 12);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
    await writeAudit(tx, {
      userId: user.id,
      entityType: "user",
      entityId: user.id,
      action: "passcode_set",
    });
  });
  return unlockPasscodeAction(passcode);
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

const customerName = z.string().trim().min(2, "Enter the customer's full name.").max(120);
const mobile = z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number.");

function readCustomer(formData: FormData) {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const name = customerName.safeParse(String(formData.get("fullName") ?? ""));
  const parsedPhone = mobile.safeParse(phone ?? "");
  if (!name.success) return { error: name.error.issues[0]?.message ?? "Invalid name." };
  if (!parsedPhone.success) return { error: parsedPhone.error.issues[0]?.message ?? "Invalid phone." };
  return {
    fullName: name.data,
    phone: parsedPhone.data,
    address: String(formData.get("address") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

export async function createCustomerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireOwner();
  const input = readCustomer(formData);
  if ("error" in input) return { ok: false, error: input.error };
  try {
    const customer = await createCustomer(session.user.id, {
      fullName: input.fullName,
      phone: input.phone,
      address: String(formData.get("address") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });
    revalidatePath("/customers");
    redirect(`/customers/${customer.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return fail(error);
  }
}

export async function updateCustomerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireOwner();
  const input = readCustomer(formData);
  if ("error" in input) return { ok: false, error: input.error };
  const status = String(formData.get("status") ?? "active");
  if (status !== "active" && status !== "inactive") return { ok: false, error: "Choose a valid status." };
  const id = String(formData.get("id") ?? "");
  try {
    await updateCustomer(session.user.id, {
      id,
      fullName: input.fullName,
      phone: input.phone,
      address: String(formData.get("address") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      status,
    });
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    revalidatePath("/schemes");
    revalidatePath("/archived");
    revalidatePath("/dashboard");
    redirect(status === "inactive" ? "/archived" : `/customers/${id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return fail(error);
  }
}

export async function createSchemeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireOwner();
  const amount = parseRupeesToPaise(String(formData.get("monthlyRupees") ?? ""));
  if (!amount) return { ok: false, error: "Enter a monthly installment greater than zero." };
  const customerId = String(formData.get("customerId") ?? "");
  if (!z.string().uuid().safeParse(customerId).success) return { ok: false, error: "Choose a customer." };
  const startDate = String(formData.get("startDate") ?? "");
  if (!isISODate(startDate)) return { ok: false, error: "Enter a valid start date." };
  try {
    const scheme = await createScheme(session.user.id, {
      customerId,
      monthlyInstallmentPaise: amount,
      startDate,
    });
    revalidatePath("/schemes");
    revalidatePath("/dashboard");
    redirect(`/schemes/${scheme.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return fail(error);
  }
}

export async function updateSchemeTermsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireOwner();
  const amount = parseRupeesToPaise(String(formData.get("monthlyRupees") ?? ""));
  if (!amount) return { ok: false, error: "Enter a monthly installment greater than zero." };
  const schemeId = String(formData.get("schemeId") ?? "");
  try {
    await updateSchemeTerms(session.user.id, {
      schemeId,
      monthlyInstallmentPaise: amount,
      startDate: String(formData.get("startDate") ?? ""),
    });
    revalidatePath(`/schemes/${schemeId}`);
    redirect(`/schemes/${schemeId}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return fail(error);
  }
}

export async function recordPaymentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireOwner();
  const amountPaise = Number(String(formData.get("amountPaise") ?? ""));
  if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
    return { ok: false, error: "Payment amount is invalid." };
  }
  const schemeId = String(formData.get("schemeId") ?? "");
  try {
    await postPayment(session.user.id, {
      installmentId: String(formData.get("installmentId") ?? ""),
      amountPaise,
      paymentDate: String(formData.get("paymentDate") ?? ""),
      paymentMethod: String(formData.get("paymentMethod") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });
    revalidatePath("/dashboard");
    revalidatePath("/schemes");
    if (schemeId) revalidatePath(`/schemes/${schemeId}`);
    redirect(`/schemes/${schemeId}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return fail(error);
  }
}

export async function clearPaymentAction(formData: FormData) {
  const session = await requireOwner();
  const schemeId = String(formData.get("schemeId") ?? "");
  try {
    await reversePayment(session.user.id, {
      transactionId: String(formData.get("transactionId") ?? ""),
    });
  } catch (error) {
    if (error instanceof LedgerError) {
      redirect(`/schemes/${schemeId}?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
  revalidatePath("/dashboard");
  revalidatePath("/schemes");
  revalidatePath(`/schemes/${schemeId}`);
  redirect(`/schemes/${schemeId}`);
}

export async function archiveSchemeAction(formData: FormData) {
  const session = await requireOwner();
  const schemeId = String(formData.get("schemeId") ?? "");
  try {
    await archiveScheme(session.user.id, schemeId);
  } catch (error) {
    if (error instanceof LedgerError) {
      redirect(`/schemes/${schemeId}?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
  revalidatePath("/archived");
  revalidatePath("/schemes");
  revalidatePath("/dashboard");
  redirect("/archived");
}

export async function restoreSchemeAction(formData: FormData) {
  const session = await requireOwner();
  const schemeId = String(formData.get("schemeId") ?? "");
  try {
    await restoreScheme(session.user.id, schemeId);
  } catch (error) {
    if (error instanceof LedgerError) {
      redirect(`/schemes/${schemeId}?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
  revalidatePath("/archived");
  revalidatePath(`/schemes/${schemeId}`);
  redirect(`/schemes/${schemeId}`);
}

export async function updateSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireOwner();
  const businessName = String(formData.get("businessName") ?? "").trim();
  if (businessName.length < 2) return { ok: false, error: "Enter a business name." };
  const allowMultipleActiveSchemes = formData.get("allowMultipleActiveSchemes") === "on";
  const existing = await prisma.appSetting.findUnique({ where: { id: "default" } });
  await prisma.$transaction(async (tx) => {
    await tx.appSetting.upsert({
      where: { id: "default" },
      create: { id: "default", businessName, allowMultipleActiveSchemes },
      update: { businessName, allowMultipleActiveSchemes },
    });
    await writeAudit(tx, {
      userId: session.user.id,
      entityType: "settings",
      entityId: "default",
      action: "update",
      previousValues: {
        businessName: existing?.businessName ?? "",
        allowMultipleActiveSchemes: existing?.allowMultipleActiveSchemes ?? false,
      },
      newValues: { businessName, allowMultipleActiveSchemes },
    });
  });
  revalidatePath("/", "layout");
  redirect("/settings?saved=1");
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireOwner();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  if (!isPasscode(current) || !isPasscode(next)) return { ok: false, error: "Use 4 digits." };
  if (next !== confirm) return { ok: false, error: "Passwords do not match." };
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) {
    return { ok: false, error: "Current password is wrong." };
  }
  const passwordHash = await bcrypt.hash(next, 12);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
    await writeAudit(tx, {
      userId: user.id,
      entityType: "user",
      entityId: user.id,
      action: "password_change",
    });
  });
  revalidatePath("/settings");
  redirect("/settings?password=1");
}
