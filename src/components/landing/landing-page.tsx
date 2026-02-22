"use client"

import { LandingNavbar } from "@/components/landing/sections/landing-navbar"
import { LandingHero } from "@/components/landing/sections/landing-hero"
import { LandingSocialProof } from "@/components/landing/sections/landing-social-proof"
import { LandingProblem } from "@/components/landing/sections/landing-problem"
import { LandingFeaturesCore } from "@/components/landing/sections/landing-features-core"
import { LandingProductDemo } from "@/components/landing/sections/landing-product-demo"
import { LandingFeaturesAdv } from "@/components/landing/sections/landing-features-adv"
import { LandingTestimonials } from "@/components/landing/sections/landing-testimonials"
import { LandingPricing } from "@/components/landing/sections/landing-pricing"
import { LandingFaq } from "@/components/landing/sections/landing-faq"
import { LandingCtaFinal } from "@/components/landing/sections/landing-cta-final"
import { LandingFooter } from "@/components/landing/sections/landing-footer"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#121212]">
      <LandingNavbar />
      <LandingHero />
      <LandingSocialProof />
      <LandingProblem />
      <LandingFeaturesCore />
      <LandingProductDemo />
      <LandingFeaturesAdv />
      <LandingTestimonials />
      <LandingPricing />
      <LandingFaq />
      <LandingCtaFinal />
      <LandingFooter />
    </div>
  )
}
