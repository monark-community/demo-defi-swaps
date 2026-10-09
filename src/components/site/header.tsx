"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { DemoChip } from "@/components/ui/demo-chip"
import { HeaderAction } from "@/components/ui/header-action"
import { LocaleSwitch } from "@/components/ui/locale-switch"
import { SiteBrand } from "@/components/ui/site-brand"
import { SiteHeader as MonarkSiteHeader } from "@/components/ui/site-header"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import type { Dictionary } from "@/i18n"
import { href, locales, switchLocalePath, type Locale } from "@/i18n/config"
import { useDemo } from "@/lib/demo/store"
import { connectWallet, disconnectWallet } from "@/lib/demo/wallet"

/**
 * The standard Monark shell header (brand guidelines §10), from @monark/ui:
 * [mark] {Product}  links…            (• Demo) (EN|FR) (☾) [Primary action]
 */
export function SiteHeader({
  locale,
  common: c,
  wallet: w,
}: {
  locale: Locale
  common: Dictionary["common"]
  wallet: Dictionary["app"]["wallet"]
}) {
  const pathname = usePathname() ?? `/${locale}`
  const demo = useDemo()
  const appHref = href(locale, "/app")

  return (
    <MonarkSiteHeader
      brand={<SiteBrand name={c.product} href={href(locale)} aria-label={c.homeLabel} LinkComponent={Link} />}
      links={[
        { href: href(locale), label: c.nav.overview, exact: true },
        { href: href(locale, "/how-it-works"), label: c.nav.how },
        { href: appHref, label: c.nav.exchange },
      ]}
      pathname={pathname}
      LinkComponent={Link}
      labels={{ nav: c.nav.label, openMenu: c.menu, closeMenu: c.closeMenu, menu: c.menuTitle }}
      actions={
        <>
          <DemoChip label={c.demoChip} description={c.demoBadge} />
          <LocaleSwitch
            locales={locales}
            current={locale}
            hrefFor={(l) => switchLocalePath(pathname, l)}
            labels={{ label: c.language.label, names: { en: c.language.en, fr: c.language.fr }, short: c.language.short }}
            LinkComponent={Link}
            linkProps={{ prefetch: false }}
          />
          <ThemeToggle label={c.theme.toggle} />
        </>
      }
      primaryAction={
        <HeaderAction
          appHref={appHref}
          pathname={pathname}
          launchLabel={c.launchDemo}
          LinkComponent={Link}
          loading={!demo}
          wallet={{
            status: demo?.wallet.status ?? "disconnected",
            address: demo?.wallet.address,
            name: w.name,
            connectLabel: w.connect,
            connectingLabel: w.connecting,
            disconnectLabel: w.disconnect,
            onConnect: () =>
              void connectWallet({
                title: w.signIn,
                rows: [{ label: w.signInRow, value: w.signInValue }],
                movesValue: false,
                noFee: true,
              }),
            onDisconnect: disconnectWallet,
          }}
        />
      }
    />
  )
}
