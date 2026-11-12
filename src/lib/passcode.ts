export const PASSCODE_LENGTH = 4;

export function isPasscode(value: string) {
  return new RegExp(`^\\d{${PASSCODE_LENGTH}}$`).test(value);
}
