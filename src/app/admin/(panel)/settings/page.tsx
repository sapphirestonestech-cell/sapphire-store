import { connection } from "next/server";
import { getSettings } from "@/lib/settings";
import { getEnabledGateways } from "@/lib/payments/gateways";
import { gatewayKeysStatus } from "@/lib/payments/keys";
import {
  SettingsManager,
  type SettingsState,
} from "@/components/admin/settings-manager";
import { GatewaySettings } from "@/components/admin/gateway-settings";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await connection();
  const gateways = await getEnabledGateways().catch(() => ({
    paystack: true,
    bachs: true,
    alwaysPayInNaira: false,
    paystackMode: "live" as const,
    bachsMode: "live" as const,
  }));
  const keys = gatewayKeysStatus();
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
        <h1 className="font-sans text-heading-lg">Settings</h1>
        <p className="mt-1 text-body text-muted">
          The exchange rate, currency rules and payment gateways that drive the
          storefront.
        </p>
      </div>
      <SettingsManager initial={initial} />
      <GatewaySettings initial={gateways} keys={keys} />
    </div>
  );
}
