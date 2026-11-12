import { describe, expect, it } from "vitest";
import { buildDueDates, dueDateForInstallment, installmentDisplayStatus } from "@/lib/dates";

describe("due dates", () => {
  it("keeps the original day after a short month", () => {
    expect(dueDateForInstallment("2026-01-31", 0)).toBe("2026-01-31");
    expect(dueDateForInstallment("2026-01-31", 1)).toBe("2026-02-28");
    expect(dueDateForInstallment("2026-01-31", 2)).toBe("2026-03-31");
    expect(dueDateForInstallment("2026-01-31", 3)).toBe("2026-04-30");
    expect(dueDateForInstallment("2026-01-31", 4)).toBe("2026-05-31");
  });

  it("uses 29 February in a leap year and returns to the 31st", () => {
    expect(dueDateForInstallment("2024-01-31", 1)).toBe("2024-02-29");
    expect(dueDateForInstallment("2024-01-31", 2)).toBe("2024-03-31");
  });

  it("builds the January 10 example schedule", () => {
    expect(buildDueDates("2026-01-10")).toEqual([
      "2026-01-10",
      "2026-02-10",
      "2026-03-10",
      "2026-04-10",
      "2026-05-10",
      "2026-06-10",
      "2026-07-10",
      "2026-08-10",
      "2026-09-10",
      "2026-10-10",
      "2026-11-10",
    ]);
  });
});

describe("installment status", () => {
  it("derives paid, overdue, due, and upcoming from the date", () => {
    expect(installmentDisplayStatus("2026-03-01", true, "2026-03-10")).toBe("paid");
    expect(installmentDisplayStatus("2026-03-01", false, "2026-03-10")).toBe("overdue");
    expect(installmentDisplayStatus("2026-03-10", false, "2026-03-10")).toBe("due");
    expect(installmentDisplayStatus("2026-03-11", false, "2026-03-10")).toBe("upcoming");
  });
});
