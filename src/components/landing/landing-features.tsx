import {
  Sparkles,
  Shield,
  Trophy,
  RefreshCw,
  BarChart3,
  Calendar,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: Sparkles,
    title: "AI-powered Insights",
    description:
      "Automatically detect patterns in your trading behavior. Our AI identifies recurring mistakes and highlights your most profitable setups.",
  },
  {
    icon: Shield,
    title: "Smart Risk Analysis",
    description:
      "Real-time risk exposure tracking across all accounts. Get alerts before you over-leverage and protect your capital.",
  },
  {
    icon: Trophy,
    title: "TakeZ Score",
    description:
      "A proprietary composite metric that scores your trading performance across risk, consistency, and profitability on a 0-100 scale.",
  },
  {
    icon: RefreshCw,
    title: "Multi-account Sync",
    description:
      "Connect MT4, MT5, or import CSV reports. All your accounts in one unified dashboard with cross-account analytics.",
  },
  {
    icon: BarChart3,
    title: "Advanced Reports",
    description:
      "Detailed breakdowns by pair, session, day of week, and strategy. Understand exactly where your edge comes from.",
  },
  {
    icon: Calendar,
    title: "Economic Calendar",
    description:
      "Built-in economic events calendar integrated with your trades. See how news impacts your performance over time.",
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Everything you need to trade at your best
          </h2>
          <p className="mt-4 text-gray-400">
            From automated journaling to AI-powered insights — all the tools
            serious traders need in one platform.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group rounded-xl border border-white/5 bg-[#12121f] p-6 transition-all hover:border-primary/40 hover:shadow-[0_0_24px_rgba(99,102,241,0.08)]"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
