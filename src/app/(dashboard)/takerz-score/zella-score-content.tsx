"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Target, TrendingUp, BarChart3, Shield, Activity, RefreshCcw, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAiApiParams } from "@/hooks/use-ai-api";
import { fetchAiTakerzScore } from "@/hooks/use-ai-api";
import { useLanguage } from "@/contexts/language-context";
import { AiAgentCard } from "@/components/ai/ai-agent-card";

/* ─── Types ─── */

type MetricSection = {
  id: string;
  icon: React.ReactNode;
  title: string;
  weight: string;
  description: string;
  why: string;
  formula: string;
  ranges: { range: string; score: string }[];
  color: string;
};

/* ─── Data ─── */

const METRICS: MetricSection[] = [
  {
    id: "avg-win-loss",
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Average Win/Loss Ratio",
    weight: "20%",
    description:
      "Mede o tamanho médio dos seus trades vencedores comparado com os perdedores.",
    why: "Um ratio mais alto demonstra gerenciamento de risco eficaz e lucratividade em trades individuais.",
    formula: "Avg Win / Avg Loss",
    ranges: [
      { range: "≥ 2.6", score: "100" },
      { range: "2.4 – 2.59", score: "90 – 99" },
      { range: "2.2 – 2.39", score: "80 – 89" },
      { range: "2.0 – 2.19", score: "70 – 79" },
      { range: "1.9 – 1.99", score: "60 – 69" },
      { range: "1.8 – 1.89", score: "50 – 59" },
      { range: "< 1.8", score: "20" },
    ],
    color: "text-blue-400",
  },
  {
    id: "win-pct",
    icon: <Target className="h-5 w-5" />,
    title: "Trade Win Percentage",
    weight: "15%",
    description:
      "Porcentagem de trades vencedores sobre o total de trades realizados.",
    why: "Consistência é chave para o sucesso de longo prazo e complementa o ratio de Avg Win/Loss.",
    formula: "(Win% / 60) × 100 — limitado a 100",
    ranges: [
      { range: "≥ 60%", score: "100" },
      { range: "50%", score: "83" },
      { range: "40%", score: "67" },
      { range: "30%", score: "50" },
      { range: "25%", score: "42" },
    ],
    color: "text-emerald-400",
  },
  {
    id: "max-drawdown",
    icon: <Shield className="h-5 w-5" />,
    title: "Maximum Drawdown",
    weight: "20%",
    description:
      "A maior queda no saldo da conta a partir de um pico do P&L acumulado.",
    why: "Drawdowns menores refletem gerenciamento de risco eficaz e uma estratégia de trading mais segura.",
    formula:
      "Max DD% = (Maior Queda Pico-ao-Vale / P&L Acumulado Máx antes da Queda) × 100\nScore = 100 – Max DD%",
    ranges: [
      { range: "0% DD", score: "100" },
      { range: "10% DD", score: "90" },
      { range: "25% DD", score: "75" },
      { range: "50% DD", score: "50" },
      { range: "75% DD", score: "25" },
    ],
    color: "text-red-400",
  },
  {
    id: "profit-factor",
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Profit Factor",
    weight: "25%",
    description:
      "Razão entre o lucro bruto total e o prejuízo bruto total.",
    why: "Um profit factor acima de 1 indica lucratividade; valores mais altos significam melhor performance.",
    formula: "Lucro Bruto Total / Prejuízo Bruto Total",
    ranges: [
      { range: "≥ 2.6", score: "100" },
      { range: "2.4 – 2.59", score: "90 – 99" },
      { range: "2.2 – 2.39", score: "80 – 89" },
      { range: "2.0 – 2.19", score: "70 – 79" },
      { range: "1.9 – 1.99", score: "60 – 69" },
      { range: "1.8 – 1.89", score: "50 – 59" },
      { range: "< 1.8", score: "20" },
    ],
    color: "text-purple-400",
  },
  {
    id: "recovery-factor",
    icon: <RefreshCcw className="h-5 w-5" />,
    title: "Recovery Factor",
    weight: "10%",
    description:
      "Capacidade de recuperação após drawdowns, comparando lucro líquido com o drawdown máximo.",
    why: "Um recovery factor mais alto mostra resiliência e capacidade de se recuperar de perdas.",
    formula: "Lucro Líquido / Drawdown Máximo",
    ranges: [
      { range: "≥ 3.5", score: "100" },
      { range: "3.0 – 3.49", score: "70 – 89" },
      { range: "2.5 – 2.99", score: "60 – 69" },
      { range: "2.0 – 2.49", score: "50 – 59" },
      { range: "1.5 – 1.99", score: "30 – 49" },
      { range: "1.0 – 1.49", score: "1 – 29" },
      { range: "< 1.0", score: "0" },
    ],
    color: "text-amber-400",
  },
  {
    id: "consistency",
    icon: <Activity className="h-5 w-5" />,
    title: "Consistency Score",
    weight: "10%",
    description:
      "Rastreia a variação no desempenho diário de trading.",
    why: "Consistência indica hábitos estáveis de trading e reduz decisões impulsivas.",
    formula:
      "Se lucro médio < 0 → 0\nSenão: Desvio Padrão dos lucros / Lucro Total\nScore = 100 – Resultado",
    ranges: [
      { range: "Variação mínima", score: "~100" },
      { range: "Variação moderada", score: "~60 – 80" },
      { range: "Alta variação", score: "~20 – 40" },
      { range: "Prejuízo médio", score: "0" },
    ],
    color: "text-cyan-400",
  },
];

/* ─── Weight bar chart ─── */

function WeightBar({ label, weight, color }: { label: string; weight: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${weight}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold text-foreground">{weight}%</span>
    </div>
  );
}

/* ─── Main ─── */

export function ZellaScoreContent() {
  const { t } = useLanguage();
  const params = useAiApiParams();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao Dashboard
      </Link>

      {/* Hero */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-score/10">
          <Target className="h-8 w-8 text-score" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Takerz Score
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
          O <strong>Takerz Score</strong> é o seu tracker definitivo de performance.
          Combina as métricas mais essenciais do trading em um score único de{" "}
          <span className="font-semibold text-score">0 a 100</span>, destacando
          áreas para melhoria e guiando sua evolução.
        </p>
      </div>

      {/* How it works */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Como funciona
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            O Takerz Score é construído sobre <strong>6 métricas-chave</strong> de
            trading. Cada métrica é avaliada individualmente em uma escala de{" "}
            <strong>0 a 100</strong>, ponderada por importância, e combinada em
            um score geral. Seja seu objetivo maior consistência, melhor
            gerenciamento de risco ou lucratividade, o Takerz Score guia você.
          </p>

          {/* Weight breakdown */}
          <div className="space-y-2.5">
            <WeightBar label="Profit Factor" weight={25} color="bg-purple-500" />
            <WeightBar label="Avg Win/Loss" weight={20} color="bg-blue-500" />
            <WeightBar label="Max Drawdown" weight={20} color="bg-red-500" />
            <WeightBar label="Win %" weight={15} color="bg-emerald-500" />
            <WeightBar label="Recovery Factor" weight={10} color="bg-amber-500" />
            <WeightBar label="Consistência" weight={10} color="bg-cyan-500" />
          </div>
        </CardContent>
      </Card>

      {/* AI Explanation */}
      <div className="mb-8">
        <AiAgentCard
          title={t("aiHub.takerzScoreExplanation")}
          description={t("aiHub.takerzScoreExplanationDesc")}
          icon={<Gauge className="h-5 w-5" />}
          onGenerate={() => fetchAiTakerzScore(params)}
          loadingMessageKeys={["common.aiAnalyzing", "common.aiGeneratingInsights", "common.aiIdentifyingTrends"]}
        />
      </div>

      {/* Each metric */}
      <div className="space-y-6">
        {METRICS.map((m, idx) => (
          <Card key={m.id} className="overflow-hidden">
            <CardContent className="p-0">
              {/* Header stripe */}
              <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-5 py-3">
                <span className={cn("shrink-0", m.color)}>{m.icon}</span>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    {idx + 1}. {m.title}
                  </h3>
                </div>
                <span className="rounded-full bg-score/10 px-2.5 py-0.5 text-xs font-semibold text-score">
                  Peso: {m.weight}
                </span>
              </div>

              <div className="space-y-4 px-5 py-4">
                {/* What it measures */}
                <div>
                  <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    O que mede
                  </h4>
                  <p className="text-sm leading-relaxed text-foreground">
                    {m.description}
                  </p>
                </div>

                {/* Why it matters */}
                <div>
                  <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Por que importa
                  </h4>
                  <p className="text-sm leading-relaxed text-foreground">
                    {m.why}
                  </p>
                </div>

                {/* Formula */}
                <div>
                  <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Fórmula
                  </h4>
                  <pre className="rounded-md bg-muted/50 px-3 py-2 text-xs text-foreground">
                    {m.formula}
                  </pre>
                </div>

                {/* Score ranges */}
                <div>
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Faixas de score
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                    {m.ranges.map((r) => (
                      <div
                        key={r.range}
                        className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-1.5"
                      >
                        <span className="text-xs text-muted-foreground">{r.range}</span>
                        <span className="text-xs font-semibold text-foreground">{r.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-10 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          O Takerz Score fornece uma métrica única e acionável para avaliar e melhorar
          sua performance de trading. Comece a usar hoje!
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-score px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-score/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
