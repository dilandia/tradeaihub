import { Metadata } from "next";
import { EconomicEventsContent } from "./economic-events-content";

export const metadata: Metadata = {
  title: "Eventos Econômicos – TakeZ Plan",
  description: "Calendário econômico com eventos, pontuação de impacto e alertas personalizados.",
};

export default function EconomicEventsPage() {
  return <EconomicEventsContent />;
}
