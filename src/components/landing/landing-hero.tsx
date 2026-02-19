import { TrendingUp, ArrowRight } from "lucide-react"
import { APP_URL } from "@/lib/site-config"

function MockDashboardCard() {
  const bars = [35, 52, 28, 65, 48, 72, 60, 45, 80, 55, 68, 42]

  return (
    <div className="relative mx-auto mt-12 max-w-2xl">
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-purple-500/10 to-primary/20 rounded-2xl blur-xl" />
      <div className="relative rounded-xl border border-white/10 bg-[#12121f]/90 backdrop-blur-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              Portfolio Performance
            </p>
            <p className="text-2xl font-bold text-white mt-1">
              +$4,832.50
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-profit/15 px-3 py-1">
            <TrendingUp className="h-3.5 w-3.5 text-profit" />
            <span className="text-xs font-medium text-profit">+12.4%</span>
          </div>
        </div>

        {/* Chart mock */}
        <div className="flex items-end gap-1.5 h-28">
          {bars.map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all"
              style={{
                height: `${height}%`,
                background:
                  height > 50
                    ? "linear-gradient(to top, #10b981, #10b98180)"
                    : "linear-gradient(to top, #6366f1, #6366f180)",
              }}
            />
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/5">
          <div>
            <p className="text-xs text-gray-500">Win Rate</p>
            <p className="text-sm font-semibold text-white">67.8%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Profit Factor</p>
            <p className="text-sm font-semibold text-white">2.14</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">TakeZ Score</p>
            <p className="text-sm font-semibold text-score">84</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-[300px] w-[400px] rounded-full bg-purple-600/10 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 mb-8">
          <span className="text-sm">Join 2,400+ forex traders</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
          Stop guessing.
          <br />
          <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Start knowing.
          </span>
        </h1>

        {/* Subtext */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 leading-relaxed">
          TakeZ Plan is the AI-powered trading journal that transforms every
          trade into actionable insights. Built for serious Forex traders.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={`${APP_URL}/register`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
          >
            Start Free — No credit card
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-6 py-3 text-sm font-medium text-gray-300 hover:text-white hover:border-white/25 transition-colors"
          >
            See how it works
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Trust text */}
        <p className="mt-6 text-xs text-gray-500">
          Free forever plan available &middot; 7-day money-back guarantee
        </p>

        {/* Mock dashboard */}
        <MockDashboardCard />
      </div>
    </section>
  )
}
