"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import type { CalendarTrade } from "@/lib/calendar-utils";

type Props = { trades: CalendarTrade[] };

export function OptionsDayTillExpirationContent({ trades }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Options: Days till expiration
        </h1>
        <p className="text-sm text-muted-foreground">
          Análise de performance por dias até expiração de opções.
        </p>
      </div>

      <Card>
        <CardContent className="flex min-h-[280px] flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-center text-sm font-medium text-foreground">
            Em breve
          </p>
          <p className="mt-1 max-w-sm text-center text-xs text-muted-foreground">
            Esta análise requer dados de expiração de opções. Quando você
            importar ou registrar trades de opções com data de expiração,
            os relatórios serão exibidos aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
