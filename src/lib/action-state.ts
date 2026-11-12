export type ActionState = {
  ok: boolean;
  error?: string;
};

export const emptyActionState: ActionState = { ok: false };
