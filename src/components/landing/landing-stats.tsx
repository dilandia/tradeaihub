const stats = [
  { value: "2,400+", label: "Active traders" },
  { value: "1.2M", label: "Trades analyzed" },
  { value: "4.8\u2605", label: "Average rating" },
  { value: "99.9%", label: "Uptime" },
]

export function LandingStats() {
  return (
    <section className="border-y border-white/5 bg-[#0d0d15]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl sm:text-4xl font-bold text-white">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
