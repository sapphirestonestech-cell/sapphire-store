import { describe, it, expect } from "vitest";
import {
  isCustomerAdmin,
  orderCountForCustomer,
} from "@/lib/admin/customer-access";

describe("orderCountForCustomer", () => {
  it("adds account orders and matching guest orders", () => {
    expect(
      orderCountForCustomer(
        "customer-1",
        "Ada@Example.com",
        new Map([["customer-1", 2]]),
        new Map([["ada@example.com", 1]]),
      ),
    ).toBe(3);
  });

  it("falls back to guest orders when the account has none", () => {
    expect(
      orderCountForCustomer("customer-2", "tolu@example.com", new Map(), new Map([
        ["tolu@example.com", 4],
      ])),
    ).toBe(4);
  });

  it("returns zero when nothing matches", () => {
    expect(
      orderCountForCustomer("customer-3", "new@example.com", new Map(), new Map()),
    ).toBe(0);
  });
});

describe("isCustomerAdmin", () => {
  it("matches admin emails case-insensitively", () => {
    expect(
      isCustomerAdmin(
        "  Owner@Sapphire.test ",
        new Map([["owner@sapphire.test", "admin"]]),
      ),
    ).toBe(true);
  });

  it("returns false when the email has no admin row", () => {
    expect(
      isCustomerAdmin("shopper@example.com", new Map([["owner@sapphire.test", "admin"]])),
    ).toBe(false);
  });
});
