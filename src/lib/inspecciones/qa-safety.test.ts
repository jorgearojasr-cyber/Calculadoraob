import { describe, it, expect } from "vitest";
import { assertQaEmail, assertMaxCount } from "./qa-safety";

describe("assertQaEmail (Fase 20A guardrail)", () => {
  it("accepts an email on the reserved QA domain", () => {
    expect(() => assertQaEmail("qa-20a@obrabien.local")).not.toThrow();
  });

  it("rejects a real-looking email, protecting real user data", () => {
    expect(() => assertQaEmail("jorge.arojasr@gmail.com")).toThrow(/no termina en/);
  });

  it("rejects an empty string instead of silently matching everything", () => {
    expect(() => assertQaEmail("")).toThrow();
  });

  it("rejects a domain that merely contains the suffix, not ends with it", () => {
    expect(() => assertQaEmail("qa@obrabien.local.evil.com")).toThrow();
  });
});

describe("assertMaxCount (Fase 20A guardrail)", () => {
  it("allows a count at or below the expected maximum", () => {
    expect(() => assertMaxCount(1, 1, "casos QA")).not.toThrow();
    expect(() => assertMaxCount(0, 1, "casos QA")).not.toThrow();
  });

  it("aborts when the count exceeds the expected maximum", () => {
    expect(() => assertMaxCount(5, 1, "casos QA")).toThrow(/máximo 1 casos QA/);
  });
});
