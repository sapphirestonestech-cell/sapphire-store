import { connection } from "next/server";
import { getSettings } from "@/lib/settings";
import {
  SettingsManager,
  type SettingsState,
} from "@/components/admin/settings-manager";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await connection();
  const settings = await getSettings();
  const initial: SettingsState = {
    baseCurrency: settings.baseCurrency,
    usdToNgn: settings.usdToNgn,
    usdDecimals: settings.rounding.usdDecimals,
    ngnNearest: settings.rounding.ngnNearest,
    tagline: settings.tagline,
    storeName: settings.storeName,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-heading-lg">Settings</h1>
        <p className="mt-1 text-body text-soft-taupe">
          The exchange rate and currency rules that drive every price on the
          storefront.
        </p>
      </div>
      <SettingsManager initial={initial} />
    </div>
  );
}
