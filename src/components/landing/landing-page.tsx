"use client";

import {
  LandingHeader,
  LandingHero,
  LandingStats,
  LandingDashboardPreview,
  LandingProcess,
  LandingTrackAnalyze,
  LandingSegments,
  LandingTestimonials,
  LandingPricing,
  LandingFaq,
  LandingCta,
  LandingFooter,
} from "@/components/landing/landing-sections";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <LandingHeader />
      <LandingHero />
      <LandingStats />
      <LandingDashboardPreview />
      <LandingProcess />
      <LandingTrackAnalyze />
      <LandingSegments />
      <LandingTestimonials />
      <LandingPricing />
      <LandingFaq />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
