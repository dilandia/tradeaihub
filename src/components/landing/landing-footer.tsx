import { APP_URL } from "@/lib/site-config"

const productLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
]

export function LandingFooter() {
  return (
    <footer className="border-t border-white/5 bg-[#0a0a0f]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              <span className="text-lg font-bold text-white tracking-tight">
                TakeZ Plan
              </span>
            </div>
            <p className="text-sm text-gray-500 max-w-xs">
              The AI-powered trading journal built for Forex traders who want to
              trade smarter and journal better.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Account
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={`${APP_URL}/login`}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Login
                </a>
              </li>
              <li>
                <a
                  href={`${APP_URL}/register`}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Register
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            &copy; 2026 TakeZ Plan. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Built for traders, by traders.
          </p>
        </div>
      </div>
    </footer>
  )
}
