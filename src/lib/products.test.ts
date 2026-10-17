import { describe, it, expect } from "vitest";
import { buildProductQuery, sortSpec } from "@/lib/products";

describe("buildProductQuery", () => {
  it("only ever returns published rings", () => {
    expect(buildProductQuery({})).toEqual({ status: "published" });
  });

  it("maps a category slug to its id through the slug map", () => {
    const map = new Map([["engagement", "abc123"]]);
    const query = buildProductQuery({ category: "engagement" }, map);
    expect(query.categories).toEqual({ $in: ["abc123"] });
  });

  it("ignores an unknown category slug", () => {
    const map = new Map([["engagement", "abc123"]]);
    const query = buildProductQuery({ category: "missing" }, map);
    expect(query.categories).toBeUndefined();
  });

  it("accepts only valid ring types", () => {
    expect(buildProductQuery({ type: "female" }).type).toBe("female");
    expect(buildProductQuery({ type: "hacked" }).type).toBeUndefined();
  });

  it("accepts only valid availability values", () => {
    expect(buildProductQuery({ availability: "pre_order" }).availability).toBe(
      "pre_order",
    );
    expect(
      buildProductQuery({ availability: "anything" }).availability,
    ).toBeUndefined();
  });

  it("builds a price range when min or max is numeric", () => {
    expect(buildProductQuery({ min: "20", max: "80" }).basePrice).toEqual({
      $gte: 20,
      $lte: 80,
    });
    expect(buildProductQuery({ min: "20" }).basePrice).toEqual({ $gte: 20 });
    expect(buildProductQuery({ min: "abc" }).basePrice).toBeUndefined();
  });

  it("turns a search term into a case-insensitive $or across fields", () => {
    const query = buildProductQuery({ q: " gold " });
    expect(query.$or).toEqual([
      { name: { $regex: "gold", $options: "i" } },
      { description: { $regex: "gold", $options: "i" } },
      { material: { $regex: "gold", $options: "i" } },
    ]);
  });

  it("filters by size label", () => {
    expect(buildProductQuery({ size: "US 7" })["sizes.sizeLabel"]).toBe("US 7");
  });
});

describe("sortSpec", () => {
  it("defaults to newest first", () => {
    expect(sortSpec()).toEqual({ createdAt: -1 });
    expect(sortSpec("nonsense")).toEqual({ createdAt: -1 });
  });

  it("supports price and name sorts", () => {
    expect(sortSpec("price-asc")).toEqual({ basePrice: 1 });
    expect(sortSpec("price-desc")).toEqual({ basePrice: -1 });
    expect(sortSpec("name-az")).toEqual({ name: 1 });
  });
});
