import { describe, expect, it } from "vitest";
import { dataScopeFilter, parseDataScope } from "@/lib/admin/data-scope";

describe("admin data scope", () => {
  it("defaults to live for missing or unknown cookies", () => {
    expect(parseDataScope(undefined)).toBe("live");
    expect(parseDataScope("nonsense")).toBe("live");
    expect(parseDataScope("live")).toBe("live");
    expect(parseDataScope("test")).toBe("test");
  });

  it("selects test orders only", () => {
    expect(dataScopeFilter("test")).toEqual({ paymentMode: "test" });
  });

  it("treats orders written before the field as live", () => {
    const filter = dataScopeFilter("live") as {
      $or: Array<Record<string, unknown>>;
    };
    expect(filter.$or).toContainEqual({ paymentMode: "live" });
    expect(filter.$or).toContainEqual({ paymentMode: { $exists: false } });
    expect(filter.$or).toContainEqual({ paymentMode: null });
  });
});
