"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ZellaScoreHexagonProps {
  score: number;
  max?: number;
  title?: string;
  className?: string;
  privacy?: boolean;
}

export function ZellaScoreHexagon({
  score,
  max = 100,
  title = "Takerz Score",
  className,
  privacy = false,
}: ZellaScoreHexagonProps) {
  const pct = Math.min(100, Math.max(0, (score / max) * 100));

  return (
    <Card className={className}>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div
          className="relative flex h-24 w-24 items-center justify-center"
          role="img"
          aria-label={`Score: ${score} de ${max}`}
        >
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full"
            aria-hidden
          >
            <defs>
              <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--score)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--profit)" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <polygon
              points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5"
              fill="url(#hexGrad)"
              stroke="var(--score)"
              strokeWidth="2"
            />
          </svg>
          <span className="absolute text-xl font-bold text-score">{privacy ? "•••" : score}</span>
        </div>
      </CardContent>
    </Card>
  );
}
