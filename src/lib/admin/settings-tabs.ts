export const SETTINGS_TABS = [
  { value: "store", label: "Store" },
  { value: "currency", label: "Currency" },
  { value: "payments", label: "Payments" },
  { value: "data", label: "Data" },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]["value"];

/** Unknown or missing `?tab=` values open the first tab. */
export function parseSettingsTab(value: unknown): SettingsTab {
  const v = Array.isArray(value) ? value[0] : value;
  return SETTINGS_TABS.some((tab) => tab.value === v)
    ? (v as SettingsTab)
    : "store";
}
