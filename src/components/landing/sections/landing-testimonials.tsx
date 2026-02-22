"use client"

import { motion, useReducedMotion, type Variants } from "framer-motion"
import { Star } from "lucide-react"

import { useLanguage } from "@/contexts/language-context"
import { LandingSectionWrapper } from "@/components/landing/shared/landing-section-wrapper"
import { LandingSectionHeader } from "@/components/landing/shared/landing-section-header"
import { LandingGlassCard } from "@/components/landing/shared/landing-glass-card"

/* ---- Static data (outside component) ---- */
const TESTIMONIALS = [
  {
    quoteKey: "landing.testimonial1",
    authorKey: "landing.testimonial1Author",
    roleKey: "landing.testimonial1Role",
    initials: "AM",
  },
  {
    quoteKey: "landing.testimonial2",
    authorKey: "landing.testimonial2Author",
    roleKey: "landing.testimonial2Role",
    initials: "SK",
  },
  {
    quoteKey: "landing.testimonial3",
    authorKey: "landing.testimonial3Author",
    roleKey: "landing.testimonial3Role",
    initials: "JL",
  },
] as const

const STAR_COUNT = 5

/* ---- Animation variants ---- */
const containerVariant: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
}

/* ---- Testimonials Section ---- */
export function LandingTestimonials() {
  const { t } = useLanguage()
  const prefersReducedMotion = useReducedMotion()

  return (
    <LandingSectionWrapper
      id="testimonials"
      className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <LandingSectionHeader
          label={t("landing.testimonialsLabel")}
          title={t("landing.testimonialsTitle")}
          subtitle={t("landing.testimonialsSubtitle")}
        />

        {prefersReducedMotion ? (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map(({ quoteKey, authorKey, roleKey, initials }) => (
              <TestimonialCard
                key={quoteKey}
                quote={t(quoteKey)}
                author={t(authorKey)}
                role={t(roleKey)}
                initials={initials}
              />
            ))}
          </div>
        ) : (
          <motion.div
            className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {TESTIMONIALS.map(({ quoteKey, authorKey, roleKey, initials }) => (
              <motion.div key={quoteKey} variants={itemVariant}>
                <TestimonialCard
                  quote={t(quoteKey)}
                  author={t(authorKey)}
                  role={t(roleKey)}
                  initials={initials}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </LandingSectionWrapper>
  )
}

/* ---- Testimonial Card ---- */
interface TestimonialCardProps {
  quote: string
  author: string
  role: string
  initials: string
}

function TestimonialCard({ quote, author, role, initials }: TestimonialCardProps) {
  return (
    <LandingGlassCard hover className="flex h-full flex-col p-6 sm:p-8">
      {/* Stars */}
      <div className="flex gap-0.5">
        {Array.from({ length: STAR_COUNT }).map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4 fill-amber-400 text-amber-400"
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="mt-4 flex-1 text-base leading-relaxed text-gray-300">
        &ldquo;{quote}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="mt-6 flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white"
          aria-hidden="true"
        >
          {initials}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{author}</p>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
      </div>
    </LandingGlassCard>
  )
}
