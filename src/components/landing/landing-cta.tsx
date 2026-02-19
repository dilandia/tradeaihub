import { ArrowRight } from "lucide-react"
import { APP_URL } from "@/lib/site-config"

export function LandingCta() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-primary px-8 py-16 sm:px-16 sm:py-20 text-center">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-[400px] w-[400px] rounded-full bg-white/10 blur-[100px]" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 h-[300px] w-[300px] rounded-full bg-purple-900/30 blur-[80px]" />

          <div className="relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Ready to become a better trader?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
              Join thousands of traders who use TakeZ Plan to journal smarter,
              manage risk, and grow their accounts.
            </p>
            <div className="mt-8">
              <a
                href={`${APP_URL}/register`}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors shadow-lg"
              >
                Start Free Today
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <p className="mt-4 text-xs text-white/50">
              No credit card required. Free plan available forever.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
