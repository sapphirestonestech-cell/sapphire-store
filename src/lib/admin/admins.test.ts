import { describe, it, expect } from "vitest";
import {
  AdminPayloadError,
  canRemoveAdmin,
  validateNewAdmin,
} from "@/lib/admin/admins";

describe("validateNewAdmin", () => {
  it("normalises the email and keeps the password as typed", () => {
    expect(
      validateNewAdmin({
        email: "  Second.Admin@Sapphire.test ",
        password: "  long-enough  ",
      }),
    ).toEqual({
      email: "second.admin@sapphire.test",
      password: "  long-enough  ",
    });
  });

  it("rejects a missing or invalid email", () => {
    expect(() => validateNewAdmin({ password: "long-enough" })).toThrow(
      AdminPayloadError,
    );
    expect(() =>
      validateNewAdmin({ email: "not-an-email", password: "long-enough" }),
    ).toThrow("valid email");
  });

  it("enforces the minimum password length", () => {
    expect(() =>
      validateNewAdmin({ email: "a@b.co", password: "short" }),
    ).toThrow("at least 8");
  });

  it("rejects passwords bcrypt cannot hash", () => {
    expect(() =>
      validateNewAdmin({ email: "a@b.co", password: "x".repeat(73) }),
    ).toThrow("under 72");
  });
});

describe("canRemoveAdmin", () => {
  it("blocks removing yourself", () => {
    expect(canRemoveAdmin("me", "me", 3)).toEqual({
      allowed: false,
      reason: "You can't remove your own account.",
    });
  });

  it("blocks removing the last admin", () => {
    expect(canRemoveAdmin("other", "me", 1)).toEqual({
      allowed: false,
      reason: "You can't remove the last admin.",
    });
  });

  it("allows removing another admin when more than one remains", () => {
    expect(canRemoveAdmin("other", "me", 2)).toEqual({ allowed: true });
  });
});
