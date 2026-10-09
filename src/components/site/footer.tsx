import Link from "next/link"

import { MONARK_SOCIALS, SiteFooter as MonarkSiteFooter } from "@/components/ui/site-footer"
import type { Dictionary } from "@/i18n"
import { href, REPO_URL, type Locale } from "@/i18n/config"

/** Standard Monark three-band footer (brand guidelines §10), from @monark/ui. */
export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const c = dict.common
  const f = c.footer
  const social = f.social as Record<string, string>

  return (
    <MonarkSiteFooter
      product={c.product}
      description={f.product}
      links={[
        { href: href(locale), label: c.nav.overview },
        { href: href(locale, "/how-it-works"), label: c.nav.how },
        { href: href(locale, "/app"), label: c.nav.exchange },
        { href: href(locale, "/credits"), label: c.nav.credits },
      ]}
      resources={[
        { href: `https://www.monark.io/${locale}/project/defi-swaps`, label: f.projectPage },
        { href: REPO_URL, label: f.repo },
      ]}
      socials={MONARK_SOCIALS.map((s) => ({ ...s, label: social[s.key] ?? s.label }))}
      copyright={`© ${new Date().getFullYear()} ${f.legal}`}
      demoNotice={c.demoBadge}
      legalLinks={[{ href: href(locale, "/credits"), label: f.photos }]}
      LinkComponent={Link}
      labels={{
        productNav: f.productNav,
        builtBy: f.builtBy,
        monarkHome: f.monarkHome,
        tagline: f.tagline,
        socials: f.socialLabel,
      }}
    >
      <p className="eyebrow text-muted-foreground">{f.family}</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        {f.siblings.map((s) => (
          <li key={s.name}>
            <a
              href={s.url}
              className="group flex min-h-11 flex-col justify-center rounded-2xl border px-4 py-2.5 transition-colors hover:bg-muted"
            >
              <span className="text-sm font-bold text-foreground group-hover:underline group-hover:underline-offset-4">{s.name}</span>
              <span className="text-xs text-muted-foreground">{s.role}</span>
            </a>
          </li>
        ))}
      </ul>
    </MonarkSiteFooter>
  )
}
