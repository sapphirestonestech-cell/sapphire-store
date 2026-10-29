import Link from "next/link";
import { connection } from "next/server";
import { getSettings } from "@/lib/settings";
import { getEnabledGateways } from "@/lib/payments/gateways";
import { gatewayKeysStatus } from "@/lib/payments/keys";
import {
  parseSettingsTab,
  SETTINGS_TABS,
  type SettingsTab,
} from "@/lib/admin/settings-tabs";
import {
  SettingsManager,
  type SettingsState,
} from "@/components/admin/settings-manager";
import { GatewaySettings } from "@/components/admin/gateway-settings";

export const metadata = { title: "Settings" };

function tabHref(tab: SettingsTab) {
  return `/admin/settings?tab=${tab}`;
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const tab = parseSettingsTab((await searchParams).tab);
  const gateways = await getEnabledGateways().catch(() => ({
    paystack: true,
    bachs: true,
    allowUsdCheckout: false,
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
          Store details, currency rules and payment gateways.
        </p>
      </div>

      <nav
        aria-label="Settings sections"
        className="border-b border-border-subtle"
      >
        <ul className="-mb-px flex gap-1 overflow-x-auto">
          {SETTINGS_TABS.map((item) => {
            const active = item.value === tab;
            return (
              <li key={item.value}>
                <Link
                  href={tabHref(item.value)}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center whitespace-nowrap border-b-2 px-4 text-body transition-colors ${
                    active
                      ? "border-accent font-medium text-primary"
                      : "border-transparent text-muted hover:text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {tab === "payments" ? (
        <GatewaySettings
          initial={gateways}
          keys={keys}
          baseCurrency={settings.baseCurrency}
        />
      ) : (
        <SettingsManager initial={initial} section={tab} />
      )}
    </div>
  );
}
