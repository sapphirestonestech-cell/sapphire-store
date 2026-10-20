import { describe, it, expect, beforeEach } from "vitest";
import {
  addItem,
  getSnapshot,
  has,
  removeItem,
  replaceAll,
  subscribe,
  wishlistCount,
  WISHLIST_MAX,
} from "@/lib/wishlist";

beforeEach(() => {
  replaceAll([]);
});

describe("wishlist store", () => {
  it("adds a product id once", () => {
    expect(addItem("p1")).toBe(true);
    expect(addItem("p1")).toBe(false);
    expect(getSnapshot()).toEqual([{ productId: "p1" }]);
    expect(has("p1")).toBe(true);
  });

  it("removes a product id", () => {
    addItem("p1");
    removeItem("p1");
    expect(has("p1")).toBe(false);
    expect(wishlistCount(getSnapshot())).toBe(0);
  });

  it("removing something absent is a no-op", () => {
    addItem("p1");
    removeItem("p2");
    expect(getSnapshot()).toEqual([{ productId: "p1" }]);
  });

  it("refuses to grow past the maximum", () => {
    for (let i = 0; i < WISHLIST_MAX; i += 1) addItem(`p${i}`);
    expect(wishlistCount(getSnapshot())).toBe(WISHLIST_MAX);
    expect(addItem("overflow")).toBe(false);
    expect(has("overflow")).toBe(false);
  });

  it("replaceAll seeds the list and notifies subscribers", () => {
    let calls = 0;
    const unsubscribe = subscribe(() => {
      calls += 1;
    });
    replaceAll(["a", "b"]);
    expect(getSnapshot()).toEqual([{ productId: "a" }, { productId: "b" }]);
    expect(calls).toBe(1);
    unsubscribe();
  });
});
