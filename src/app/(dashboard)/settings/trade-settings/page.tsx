import { Metadata } from "next";
import { getTradePreferences } from "@/app/actions/trade-settings";
import { TradeSettingsForm } from "@/components/settings/trade-settings-form";

export const metadata: Metadata = {
  title: "Configurações de Trade – TakeZ",
};

export default async function TradeSettingsPage() {
  const preferences = await getTradePreferences();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Configurações de trade
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina suas preferências de visualização, gestão de risco e cálculos.
        </p>
      </div>
      <TradeSettingsForm preferences={preferences} />
    </div>
  );
}
