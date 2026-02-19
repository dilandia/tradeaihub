import { Metadata } from "next";
import { ZellaScoreContent } from "./zella-score-content";

export const metadata: Metadata = {
  title: "Takerz Score – TakeZ",
  description: "Entenda como o Takerz Score avalia sua performance de trading.",
};

export default function ZellaScorePage() {
  return <ZellaScoreContent />;
}
