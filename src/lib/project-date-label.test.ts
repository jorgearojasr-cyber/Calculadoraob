import { describe, expect, it } from "vitest";
import { projectDateLabel } from "./project-date-label";

describe("projectDateLabel", () => {
  it("shows 'Guardado el' when updatedAt is not meaningfully after createdAt", () => {
    const createdAt = new Date("2026-08-01T10:00:00Z");
    const updatedAt = new Date("2026-08-01T10:00:00.500Z"); // Prisma jitter only
    const label = projectDateLabel(createdAt, updatedAt, new Date("2026-08-05T10:00:00Z"));
    expect(label).toBe("Guardado el 01/08/2026");
  });

  it("shows relative 'Actualizado hace X' when updatedAt is meaningfully after createdAt", () => {
    const createdAt = new Date("2026-08-01T10:00:00Z");
    const updatedAt = new Date("2026-08-03T10:00:00Z");
    const now = new Date("2026-08-05T10:00:00Z"); // 2 days after updatedAt
    const label = projectDateLabel(createdAt, updatedAt, now);
    expect(label).toBe("Actualizado hace 2 días");
  });

  it("pluralizes correctly for 1 unit", () => {
    const createdAt = new Date("2026-08-01T10:00:00Z");
    const updatedAt = new Date("2026-08-03T10:00:00Z");
    const now = new Date("2026-08-04T10:00:00Z"); // 1 day after updatedAt
    expect(projectDateLabel(createdAt, updatedAt, now)).toBe("Actualizado hace 1 día");
  });

  it("falls back to 'hace un momento' for very recent updates", () => {
    const createdAt = new Date("2026-08-01T10:00:00Z");
    const updatedAt = new Date("2026-08-03T10:00:00Z");
    const now = new Date("2026-08-03T10:00:30Z"); // 30s after updatedAt
    expect(projectDateLabel(createdAt, updatedAt, now)).toBe("Actualizado hace un momento");
  });
});
