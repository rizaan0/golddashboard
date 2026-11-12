export const SCHEME_DURATION = 11;

export function shouldCompleteScheme(postedCount: number, duration = SCHEME_DURATION): boolean {
  return postedCount >= duration;
}

export function shouldReopenScheme(postedCount: number, duration = SCHEME_DURATION): boolean {
  return postedCount < duration;
}

export const PAYMENT_METHODS = ["cash", "upi", "bank_transfer", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function paymentMethodLabel(method: string | null | undefined): string {
  switch (method) {
    case "cash":
      return "Cash";
    case "upi":
      return "UPI";
    case "bank_transfer":
      return "Bank transfer";
    case "other":
      return "Other";
    default:
      return "—";
  }
}
