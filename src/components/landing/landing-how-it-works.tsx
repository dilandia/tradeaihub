import { ArrowRight } from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Connect your account",
    description:
      "Link your MT4 or MT5 account in seconds, or upload a CSV trade report. Your data stays encrypted and private.",
  },
  {
    number: "02",
    title: "Trade as usual",
    description:
      "Keep trading your strategy. TakeZ Plan automatically syncs and journals every trade with full context.",
  },
  {
    number: "03",
    title: "Get insights",
    description:
      "Review AI-generated insights, track your TakeZ Score, and discover patterns that improve your edge.",
  },
]

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-[#0d0d15]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            How it works
          </h2>
          <p className="mt-4 text-gray-400">
            Get started in under 2 minutes. No complex setup required.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((step, index) => (
            <div key={step.number} className="relative flex flex-col items-center text-center md:items-start md:text-left">
              {/* Arrow connector (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex absolute top-8 right-0 translate-x-1/2 z-10 items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-primary/40" />
                </div>
              )}

              {/* Number */}
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 mb-5">
                <span className="text-lg font-bold text-primary">
                  {step.number}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-400 max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
