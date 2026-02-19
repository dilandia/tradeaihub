"use client";

import { Card, CardContent } from "@/components/ui/card";

export function CompareContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Compare</h1>
      <Card>
        <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">
            Em breve: compare períodos ou contas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
