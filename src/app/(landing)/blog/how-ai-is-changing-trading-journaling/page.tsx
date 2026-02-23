"use client"

import { ArrowLeft, Calendar, Clock } from "lucide-react"
import Link from "next/link"

import { useLanguage } from "@/contexts/language-context"
import { useAppUrl } from "@/contexts/app-url-context"
import { LandingPageNavbar } from "@/components/landing/shared/landing-page-navbar"
import { LandingSectionWrapper } from "@/components/landing/shared/landing-section-wrapper"
import { LandingGlassCard } from "@/components/landing/shared/landing-glass-card"
import { LandingGradientButton } from "@/components/landing/shared/landing-gradient-button"
import { LandingFooter } from "@/components/landing/sections/landing-footer"

const content = {
  en: {
    date: "Feb 18, 2026",
    readTime: "7",
    intro1:
      "For decades, the trading journal lived in one of two places: a leather notebook on the desk or a sprawling spreadsheet with dozens of tabs. Disciplined traders swore by them. They would meticulously record every entry, exit, lot size, and emotional state after each session. And it worked, for those who stuck with it. But the reality is that most traders abandoned their journals within weeks. The process was tedious, the analysis was manual, and the insights, if they came at all, required hours of review.",
    intro2:
      "Artificial intelligence is changing all of that. Today, AI-powered trading journals do not just store data. They understand it, find patterns in it, and deliver insights that would take a human analyst hours or days to uncover. This is not a marginal improvement. It is a fundamental shift in how traders interact with their own performance data.",
    patternTitle: "Pattern Recognition at Scale",
    pattern1:
      "Human beings are remarkably good at seeing patterns, even when they do not exist. This is called apophenia, and it is one of a trader\u2019s worst enemies. You might think you perform better on Fridays, or that GBP/JPY is your best pair, but without rigorous statistical analysis across hundreds of trades, you are just guessing.",
    pattern2:
      "AI pattern recognition changes this by analyzing your entire trade history objectively. It examines every variable: time of day, day of week, currency pair, session (London, New York, Tokyo), trade duration, lot size, direction (long vs short), and market conditions at the time of entry. From this multidimensional analysis, genuine patterns emerge.",
    pattern3:
      "For example, an AI might discover that your win rate on EUR/USD is 62% during the London session but drops to 38% during Asian hours. Or that your trades taken within 15 minutes of a high-impact news event have a profit factor of 0.7, meaning they are actively losing money. These are not vague observations. They are actionable insights backed by your actual data.",
    keyAdvantageLabel: "Key advantage:",
    keyAdvantage:
      ' AI analyzes all variables simultaneously across your entire history. A human reviewing a spreadsheet might check one variable at a time and miss multivariate patterns like "long trades on GBP/USD during New York overlap with position sizes above 1 lot have a 73% win rate."',
    behaviorTitle: "Behavioral Analysis: Your Trading Psychology Revealed",
    behavior1:
      "The most destructive patterns in trading are not technical. They are behavioral. Revenge trading after a loss. Overtrading on volatile days. Moving stop-losses to avoid being stopped out. Closing winning trades too early out of fear. These behaviors are well-documented in trading psychology, but identifying them in your own trading is incredibly difficult because you are too close to see clearly.",
    behavior2:
      "AI behavioral analysis detects these patterns by examining the sequence and timing of your trades. It can identify when you take multiple trades in rapid succession after a losing trade, a classic revenge trading signature. It can flag sessions where your position sizes increase after losses, indicating emotional decision-making. It can even detect when you consistently exit profitable trades earlier than your planned target, revealing a fear-based closing pattern.",
    behavior3:
      "What makes this transformative is that the AI presents these findings without judgment or emotion. It is simply reporting what the data shows. This objectivity helps traders accept feedback that they might reject from a mentor or trading coach. The numbers do not lie, and when you see that your post-loss trades have a win rate of 28% compared to your normal 52%, the case for stepping away after a loss becomes impossible to ignore.",
    insightsTitle: "Automated Insights: Hours of Analysis in Seconds",
    insights1:
      "Traditional trade review is a weekend ritual. You sit down with your journal, scroll through the week\u2019s trades, try to calculate your metrics, and attempt to draw conclusions. If you are disciplined, this takes one to two hours. Most traders skip it entirely.",
    insights2:
      'AI-powered journals generate insights automatically after every trade or session. The moment you import your trades or close a position, the AI analyzes your performance, updates your metrics, compares them to historical baselines, and highlights anything noteworthy. You might get a notification that says "Your risk-reward ratio has improved 15% this week compared to your 30-day average" or "You are 3 trades into a losing streak. Historically, your 4th trade after 3 consecutive losses has a 22% win rate."',
    insightsList: [
      "Real-time performance summaries after each trading session",
      "Weekly and monthly report generation with trend analysis",
      "Anomaly detection when your performance deviates from your baseline",
      "Strategy comparison showing which approaches are working best",
      "Risk alerts when your drawdown approaches historical limits",
    ],
    riskTitle: "AI-Powered Risk Management",
    risk1:
      "Risk management is where most traders fail, and it is also where AI can add the most value. Traditional risk management is static: risk 1% per trade, set a stop loss, do not overleverage. These rules are a good starting point, but they do not adapt to your actual performance data.",
    risk2:
      "An AI risk analysis agent can evaluate your current drawdown, recent win/loss streaks, volatility of your chosen pairs, and historical performance under similar conditions to provide a dynamic risk assessment. It might suggest reducing position sizes during a losing streak, or highlight that your risk per trade has been creeping up without you noticing. It can score your overall risk profile on a scale and track it over time, giving you a concrete measure of whether you are becoming more or less disciplined.",
    thinkLabel: "Think of it this way:",
    thinkText:
      " A traditional journal tells you what happened. An AI journal tells you what happened, why it happened, what is likely to happen next, and what you should do about it.",
    copilotTitle: "The Copilot Approach: Chat With Your Data",
    copilot1:
      "Perhaps the most exciting development in AI-powered trading journals is the ability to have a conversation with your data. Instead of building complex filters, writing formulas, or creating pivot tables, you can simply ask a question in natural language.",
    copilot2:
      '"What was my best performing pair last month?" "How do my Monday trades compare to my Friday trades?" "Show me my performance when I trade during high-impact news events." "What would my results look like if I had cut my losses at 1% instead of 2%?"',
    copilot3:
      "This conversational interface democratizes data analysis. You do not need to know SQL, Python, or advanced Excel formulas. You just need to be curious about your own performance. The AI copilot becomes a personal trading coach that knows every single trade you have ever taken and can recall and analyze any of them instantly.",
    copilot4:
      "The shift from static journals to AI-powered analysis platforms represents the biggest leap forward in retail trading tools in over a decade. Traders who adopt these tools early gain a significant edge, not because the AI trades for them, but because it helps them understand themselves better. And in trading, self-knowledge is the ultimate edge.",
  },
  "pt-BR": {
    date: "18 Fev, 2026",
    readTime: "7",
    intro1:
      "Por décadas, o diário de trading viveu em um de dois lugares: um caderno de couro sobre a mesa ou uma planilha interminável com dezenas de abas. Traders disciplinados juravam por eles. Registravam meticulosamente cada entrada, saída, tamanho de lote e estado emocional após cada sessão. E funcionava — para quem conseguia manter o hábito. Mas a realidade é que a maioria dos traders abandonava seus diários em poucas semanas. O processo era tedioso, a análise era manual, e os insights, quando apareciam, exigiam horas de revisão.",
    intro2:
      "A inteligência artificial está mudando tudo isso. Hoje, diários de trading com IA não apenas armazenam dados. Eles entendem, encontram padrões e entregam insights que levariam horas ou dias para um analista humano descobrir. Não se trata de uma melhoria marginal. É uma mudança fundamental na forma como traders interagem com seus próprios dados de desempenho.",
    patternTitle: "Reconhecimento de Padrões em Escala",
    pattern1:
      "Seres humanos são notavelmente bons em enxergar padrões, mesmo quando eles não existem. Isso se chama apofenia, e é um dos piores inimigos do trader. Você pode achar que performa melhor às sextas-feiras, ou que GBP/JPY é o seu melhor par, mas sem uma análise estatística rigorosa de centenas de operações, você está apenas adivinhando.",
    pattern2:
      "O reconhecimento de padrões por IA muda esse cenário ao analisar todo o seu histórico de operações de forma objetiva. Examina cada variável: horário do dia, dia da semana, par de moedas, sessão (Londres, Nova York, Tóquio), duração da operação, tamanho do lote, direção (compra vs venda) e condições de mercado no momento da entrada. A partir dessa análise multidimensional, padrões genuínos emergem.",
    pattern3:
      "Por exemplo, uma IA pode descobrir que sua taxa de acerto no EUR/USD é de 62% durante a sessão de Londres, mas cai para 38% no horário asiático. Ou que suas operações realizadas dentro de 15 minutos de uma notícia de alto impacto têm um fator de lucro de 0,7 — ou seja, estão ativamente perdendo dinheiro. Não são observações vagas. São insights acionáveis respaldados pelos seus dados reais.",
    keyAdvantageLabel: "Vantagem principal:",
    keyAdvantage:
      " A IA analisa todas as variáveis simultaneamente em todo o seu histórico. Um humano revisando uma planilha pode verificar uma variável por vez e perder padrões multivariados como \"operações de compra em GBP/USD durante a sobreposição de Nova York com tamanhos de posição acima de 1 lote têm 73% de taxa de acerto.\"",
    behaviorTitle: "Análise Comportamental: Sua Psicologia de Trading Revelada",
    behavior1:
      "Os padrões mais destrutivos no trading não são técnicos. São comportamentais. Trading de vingança após uma perda. Overtrading em dias voláteis. Mover stop-losses para evitar ser estopado. Fechar operações vencedoras cedo demais por medo. Esses comportamentos são bem documentados na psicologia de trading, mas identificá-los nas suas próprias operações é incrivelmente difícil porque você está perto demais para enxergar com clareza.",
    behavior2:
      "A análise comportamental por IA detecta esses padrões examinando a sequência e o timing das suas operações. Pode identificar quando você faz múltiplas operações em rápida sucessão após uma perda — uma assinatura clássica de trading de vingança. Pode sinalizar sessões em que seus tamanhos de posição aumentam após perdas, indicando tomada de decisão emocional. Pode até detectar quando você consistentemente sai de operações lucrativas antes do alvo planejado, revelando um padrão de fechamento baseado em medo.",
    behavior3:
      "O que torna isso transformador é que a IA apresenta essas descobertas sem julgamento ou emoção. Está simplesmente reportando o que os dados mostram. Essa objetividade ajuda traders a aceitar feedback que poderiam rejeitar de um mentor ou coach de trading. Os números não mentem, e quando você vê que suas operações após perdas têm uma taxa de acerto de 28% comparada aos seus 52% normais, o argumento para se afastar após uma perda se torna impossível de ignorar.",
    insightsTitle: "Insights Automatizados: Horas de Análise em Segundos",
    insights1:
      "A revisão tradicional de trades é um ritual de fim de semana. Você senta com seu diário, percorre as operações da semana, tenta calcular suas métricas e tentar tirar conclusões. Se você é disciplinado, isso leva de uma a duas horas. A maioria dos traders simplesmente pula essa etapa.",
    insights2:
      "Diários com IA geram insights automaticamente após cada operação ou sessão. No momento em que você importa suas operações ou fecha uma posição, a IA analisa seu desempenho, atualiza suas métricas, compara com baselines históricos e destaca qualquer coisa relevante. Você pode receber uma notificação dizendo \"Sua relação risco-retorno melhorou 15% esta semana comparada à sua média de 30 dias\" ou \"Você está com 3 operações consecutivas de perda. Historicamente, sua 4a operação após 3 perdas consecutivas tem 22% de taxa de acerto.\"",
    insightsList: [
      "Resumos de desempenho em tempo real após cada sessão de trading",
      "Geração de relatórios semanais e mensais com análise de tendências",
      "Detecção de anomalias quando seu desempenho diverge da sua baseline",
      "Comparação de estratégias mostrando quais abordagens estão funcionando melhor",
      "Alertas de risco quando seu drawdown se aproxima de limites históricos",
    ],
    riskTitle: "Gestão de Risco com IA",
    risk1:
      "A gestão de risco é onde a maioria dos traders falha, e também é onde a IA pode agregar mais valor. A gestão de risco tradicional é estática: arriscar 1% por operação, definir um stop loss, não alavancar demais. Essas regras são um bom ponto de partida, mas não se adaptam aos seus dados reais de desempenho.",
    risk2:
      "Um agente de análise de risco com IA pode avaliar seu drawdown atual, sequências recentes de ganhos/perdas, volatilidade dos pares escolhidos e desempenho histórico em condições similares para fornecer uma avaliação de risco dinâmica. Pode sugerir reduzir tamanhos de posição durante uma sequência de perdas, ou destacar que seu risco por operação tem aumentado gradualmente sem que você perceba. Pode pontuar seu perfil de risco geral em uma escala e acompanhar ao longo do tempo, dando a você uma medida concreta de se está se tornando mais ou menos disciplinado.",
    thinkLabel: "Pense da seguinte forma:",
    thinkText:
      " Um diário tradicional conta o que aconteceu. Um diário com IA conta o que aconteceu, por que aconteceu, o que provavelmente vai acontecer a seguir e o que você deveria fazer a respeito.",
    copilotTitle: "A Abordagem Copilot: Converse com Seus Dados",
    copilot1:
      "Talvez o avanço mais empolgante nos diários de trading com IA seja a capacidade de ter uma conversa com seus dados. Em vez de construir filtros complexos, escrever fórmulas ou criar tabelas dinâmicas, você pode simplesmente fazer uma pergunta em linguagem natural.",
    copilot2:
      "\"Qual foi meu par com melhor desempenho no mês passado?\" \"Como minhas operações de segunda-feira se comparam às de sexta-feira?\" \"Mostre meu desempenho quando opero durante notícias de alto impacto.\" \"Como seriam meus resultados se eu tivesse cortado minhas perdas em 1% ao invés de 2%?\"",
    copilot3:
      "Essa interface conversacional democratiza a análise de dados. Você não precisa saber SQL, Python ou fórmulas avançadas de Excel. Basta ter curiosidade sobre seu próprio desempenho. O copilot de IA se torna um coach pessoal de trading que conhece cada operação que você já fez e pode acessar e analisar qualquer uma delas instantaneamente.",
    copilot4:
      "A transição de diários estáticos para plataformas de análise com IA representa o maior salto em ferramentas de trading para o varejo em mais de uma década. Traders que adotam essas ferramentas cedo ganham uma vantagem significativa — não porque a IA opera por eles, mas porque os ajuda a se entender melhor. E no trading, autoconhecimento é a vantagem definitiva.",
  },
} as const

export default function AiJournalingArticlePage() {
  const { t, locale } = useLanguage()
  const appUrl = useAppUrl()
  const c = locale === "pt-BR" ? content["pt-BR"] : content.en

  return (
    <div className="min-h-screen bg-[#121212]">
      <LandingPageNavbar />

      {/* Hero */}
      <LandingSectionWrapper className="px-4 pb-12 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-indigo-400"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("landing.blogLabel")}
          </Link>
          <div className="mb-6 h-48 sm:h-64 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 opacity-80" />
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {c.date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {c.readTime} {t("landing.blogMinRead")}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            {t("landing.blogArticle2Title")}
          </h1>
        </div>
      </LandingSectionWrapper>

      {/* Article Body */}
      <LandingSectionWrapper className="px-4 pb-16 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-3xl">
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.intro1}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.intro2}
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            {c.patternTitle}
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.pattern1}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.pattern2}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.pattern3}
          </p>
          <LandingGlassCard className="p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">{c.keyAdvantageLabel}</span>{c.keyAdvantage}
            </p>
          </LandingGlassCard>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            {c.behaviorTitle}
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.behavior1}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.behavior2}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.behavior3}
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            {c.insightsTitle}
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.insights1}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.insights2}
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 mb-6 ml-4">
            {c.insightsList.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            {c.riskTitle}
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.risk1}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.risk2}
          </p>
          <LandingGlassCard className="p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">{c.thinkLabel}</span>{c.thinkText}
            </p>
          </LandingGlassCard>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            {c.copilotTitle}
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.copilot1}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.copilot2}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.copilot3}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.copilot4}
          </p>
        </article>
      </LandingSectionWrapper>

      {/* CTA */}
      <LandingSectionWrapper className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 p-8 sm:p-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              {t("landing.blogCta")}
            </h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              {t("landing.blogCtaSubtitle")}
            </p>
            <LandingGradientButton href={`${appUrl}/register`} size="lg">
              {t("landing.ctaStart")}
            </LandingGradientButton>
          </div>
        </div>
      </LandingSectionWrapper>

      <LandingFooter />
    </div>
  )
}
