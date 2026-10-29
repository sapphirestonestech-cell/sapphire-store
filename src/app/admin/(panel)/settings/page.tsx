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
import { DataScopeToggle } from "@/components/admin/data-scope-toggle";
import { getAdminDataScope } from "@/lib/admin/data-scope.server";

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
  const scope = await getAdminDataScope();
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
          Store details, currency rules, payment gateways and back-office data.
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
      ) : tab === "data" ? (
        <section className="max-w-2xl rounded-md bg-card p-6 shadow-card">
          <h2 className="font-sans text-subheading">Back-office data</h2>
          <p className="mt-1 text-body text-muted">
            Choose whether the dashboard, orders and payments show live or test
            data. This is separate from each gateway&apos;s test or live mode.
          </p>
          <div className="mt-4">
            <DataScopeToggle scope={scope} />
          </div>
        </section>
      ) : (
        <SettingsManager initial={initial} section={tab} />
      )}
    </div>
  );
}
