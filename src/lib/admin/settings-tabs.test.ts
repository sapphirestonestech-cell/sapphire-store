import { describe, expect, it } from "vitest";
import { parseSettingsTab, SETTINGS_TABS } from "@/lib/admin/settings-tabs";

describe("settings tabs", () => {
  it("lists the settings groups in order", () => {
    expect(SETTINGS_TABS.map((tab) => tab.value)).toEqual([
      "store",
      "currency",
      "payments",
    ]);
  });

  it("accepts a known tab", () => {
    expect(parseSettingsTab("currency")).toBe("currency");
    expect(parseSettingsTab(["payments"])).toBe("payments");
  });

  it("falls back to the store tab", () => {
    expect(parseSettingsTab(undefined)).toBe("store");
    expect(parseSettingsTab("nonsense")).toBe("store");
    expect(parseSettingsTab([])).toBe("store");
  });
});
