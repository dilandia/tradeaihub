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

export default function MetricsArticlePage() {
  const { t, locale } = useLanguage()
  const appUrl = useAppUrl()
  const isPt = locale === "pt-BR"

  const content = {
    date: isPt ? "20 Fev, 2026" : "Feb 20, 2026",

    intro1: isPt
      ? "Pergunte a maioria dos traders de forex como medem sucesso e voce vai ouvir a mesma resposta: \"Estou ganhando dinheiro ou nao?\" Embora lucro e prejuizo sejam obviamente o resultado final, focar exclusivamente no seu P&L e como dirigir um carro olhando apenas para o velocimetro. Voce pode saber a que velocidade esta indo, mas nao tem ideia se o motor esta superaquecendo, o combustivel acabando ou os freios falhando. Para realmente entender seu desempenho no trading e construir uma vantagem sustentavel, voce precisa acompanhar as metricas que revelam o que esta acontecendo abaixo da superficie."
      : "Ask most forex traders how they measure success and you will hear the same answer: \"Am I making money or not?\" While profit and loss is obviously the bottom line, focusing exclusively on your P&L is like driving a car while only watching the speedometer. You might know how fast you are going, but you have no idea if the engine is overheating, the fuel is running low, or the brakes are failing. To truly understand your trading performance and build a sustainable edge, you need to track the metrics that reveal what is happening beneath the surface.",

    intro2: isPt
      ? "Neste artigo, detalhamos cinco metricas essenciais que todo trader de forex serio deve monitorar. Estes sao os numeros que traders profissionais e mesas proprietarias acompanham religiosamente, e podem fazer a diferenca entre um trader que sobrevive e um que prospera."
      : "In this article, we break down five essential metrics that every serious forex trader should monitor. These are the numbers that professional traders and prop firms track religiously, and they can make the difference between a trader who survives and one who thrives.",

    heading1: isPt ? "1. Taxa de Acerto (Win Rate)" : "1. Win Rate",

    winRate1: isPt
      ? "Sua taxa de acerto e a porcentagem de operacoes que fecham no lucro em relacao ao numero total de operacoes. Se voce faz 100 operacoes e 55 sao vencedoras, sua taxa de acerto e 55%. Simples o suficiente. Mas aqui e onde a maioria dos traders erra: eles assumem que uma taxa de acerto alta equivale a lucratividade."
      : "Your win rate is the percentage of trades that close in profit out of your total number of trades. If you take 100 trades and 55 are winners, your win rate is 55%. Simple enough. But here is where most traders get it wrong: they assume a high win rate equals profitability.",

    winRate2: isPt
      ? "A verdade e que uma taxa de acerto de 40% pode ser extremamente lucrativa se seus ganhos forem significativamente maiores que suas perdas. Muitas estrategias de tendencia bem-sucedidas operam com taxas de acerto abaixo de 50%, capturando alguns grandes movimentos que mais do que compensam as perdas menores e frequentes. Por outro lado, uma taxa de acerto de 70% nao significa nada se sua perda media for tres vezes maior que seu ganho medio."
      : "The truth is, a 40% win rate can be extremely profitable if your winners are significantly larger than your losers. Many successful trend-following strategies operate with win rates below 50%, catching a few large moves that more than compensate for the smaller, frequent losses. Conversely, a 70% win rate means nothing if your average loss is three times your average win.",

    winRateBox: isPt
      ? { label: "Como calcular:", text: "Taxa de Acerto = (Numero de Operacoes Vencedoras / Total de Operacoes) x 100. Acompanhe mensalmente e compare entre diferentes estrategias, pares e condicoes de mercado." }
      : { label: "How to calculate:", text: "Win Rate = (Number of Winning Trades / Total Trades) x 100. Track this monthly and compare it across different strategies, pairs, and market conditions." },

    winRate3: isPt
      ? "O ponto-chave e que a taxa de acerto e insignificante isoladamente. Ela deve sempre ser avaliada junto com sua relacao risco-retorno e ganho medio versus perda media. Um scalper pode ter uma taxa de acerto de 75% com risco-retorno de 1:0,5, enquanto um swing trader pode ter 35% de acerto com risco-retorno de 1:4. Ambos podem ser lucrativos. O que importa e a combinacao."
      : "The key insight is that win rate is meaningless in isolation. It must always be evaluated alongside your risk-reward ratio and average win versus average loss. A scalper might have a 75% win rate with a 1:0.5 risk-reward, while a swing trader might have a 35% win rate with a 1:4 risk-reward. Both can be profitable. What matters is the combination.",

    heading2: isPt ? "2. Relacao Risco-Retorno" : "2. Risk-Reward Ratio",

    rrr1: isPt
      ? "A relacao risco-retorno (RRR) mede quanto voce pode ganhar em relacao ao quanto esta arriscando em cada operacao. Um risco-retorno de 1:2 significa que voce esta arriscando R$100 para potencialmente ganhar R$200. Um de 1:3 significa arriscar R$100 para ganhar R$300."
      : "The risk-reward ratio (RRR) measures how much you stand to gain relative to how much you are risking on each trade. A 1:2 risk-reward means you are risking $100 to potentially make $200. A 1:3 means risking $100 to make $300.",

    rrr2: isPt
      ? "Por que mirar em pelo menos 1:2 muda tudo? Porque isso te da uma margem matematica. Com um risco-retorno de 1:2, voce so precisa acertar 34% das operacoes para empatar. Com 1:3, apenas 25%. Isso muda completamente a carga psicologica. Voce nao precisa mais estar certo na maioria das vezes. Voce so precisa deixar os lucros correrem e cortar as perdas rapidamente, que e a mais antiga e poderosa sabedoria do trading."
      : "Why does aiming for at least 1:2 change everything? Because it gives you a mathematical cushion. With a 1:2 risk-reward, you only need to win 34% of your trades to break even. At 1:3, you only need 25%. This completely shifts the psychological burden. You no longer need to be right most of the time. You just need to let your winners run and cut your losers short, which is the oldest and most powerful trading wisdom there is.",

    rrr3: isPt
      ? "Considere este exemplo: Trader A faz 100 operacoes com risco-retorno de 1:1 e taxa de acerto de 55%. Ele ganha 55 x R$100 = R$5.500 e perde 45 x R$100 = R$4.500. Lucro liquido: R$1.000. Trader B faz 100 operacoes com risco-retorno de 1:2 e taxa de acerto de 40%. Ele ganha 40 x R$200 = R$8.000 e perde 60 x R$100 = R$6.000. Lucro liquido: R$2.000. O Trader B acerta menos, mas ganha o dobro."
      : "Consider this example: Trader A takes 100 trades with a 1:1 risk-reward and a 55% win rate. They make 55 x $100 = $5,500 and lose 45 x $100 = $4,500. Net profit: $1,000. Trader B takes 100 trades with a 1:2 risk-reward and a 40% win rate. They make 40 x $200 = $8,000 and lose 60 x $100 = $6,000. Net profit: $2,000. Trader B wins less often but makes twice as much money.",

    rrrBox: isPt
      ? { label: "Dica profissional:", text: "Sempre defina seu take-profit antes de entrar em uma operacao. Se voce nao consegue encontrar um setup com pelo menos 1:1,5 de risco-retorno, pule. Os melhores setups virao, e sua paciencia sera recompensada." }
      : { label: "Pro tip:", text: "Always set your take-profit before entering a trade. If you cannot find a setup with at least 1:1.5 risk-reward, skip it. The best setups will come, and your patience will be rewarded." },

    heading3: isPt ? "3. Fator de Lucro (Profit Factor)" : "3. Profit Factor",

    pf1: isPt
      ? "O fator de lucro e uma das metricas mais poderosas e subutilizadas no trading de varejo. Ele e calculado dividindo seus lucros brutos pelas suas perdas brutas. Um fator de lucro de 1,0 significa que voce esta empatando. Acima de 1,0 significa que voce esta lucrando. Abaixo de 1,0 significa que voce esta perdendo dinheiro."
      : "Profit factor is one of the most powerful yet underused metrics in retail trading. It is calculated by dividing your gross profits by your gross losses. A profit factor of 1.0 means you are breaking even. Above 1.0 means you are profitable. Below 1.0 means you are losing money.",

    pf2: isPt
      ? "O que torna o fator de lucro tao valioso e que ele combina taxa de acerto e risco-retorno em um unico numero que indica se voce tem uma vantagem real. Traders profissionais e hedge funds geralmente buscam um fator de lucro de pelo menos 1,5, e qualquer coisa acima de 2,0 e considerada excelente. Se seu fator de lucro cai abaixo de 1,2, e um sinal de alerta de que sua vantagem e fragil e pode desaparecer com algumas operacoes ruins."
      : "What makes profit factor so valuable is that it combines win rate and risk-reward into a single number that tells you whether you have a real edge. Professional traders and hedge funds typically look for a profit factor of at least 1.5, and anything above 2.0 is considered excellent. If your profit factor drops below 1.2, it is a warning sign that your edge is thin and could disappear with a few bad trades.",

    pfList: isPt
      ? [
          { label: "Abaixo de 1,0:", text: "Voce esta perdendo dinheiro. Pare de operar e revise sua estrategia." },
          { label: "1,0 a 1,5:", text: "Vantagem marginal. Taxas e slippage podem consumir seus lucros." },
          { label: "1,5 a 2,0:", text: "Vantagem solida. Sua estrategia esta funcionando, continue otimizando." },
          { label: "Acima de 2,0:", text: "Vantagem forte. Foque em consistencia e gestao de risco." },
        ]
      : [
          { label: "Below 1.0:", text: "You are losing money. Stop trading and review your strategy." },
          { label: "1.0 to 1.5:", text: "Marginal edge. Fees and slippage could eat your profits." },
          { label: "1.5 to 2.0:", text: "Solid edge. Your strategy is working, keep optimizing." },
          { label: "Above 2.0:", text: "Strong edge. Focus on consistency and risk management." },
        ],

    pf3: isPt
      ? "Acompanhe seu fator de lucro mensalmente e entre diferentes estrategias. Se voce opera com multiplas estrategias, o fator de lucro mostra instantaneamente quais estao sustentando o portfolio e quais estao prejudicando."
      : "Track your profit factor monthly and across different strategies. If you run multiple strategies, profit factor instantly tells you which ones are carrying the portfolio and which ones are dragging it down.",

    heading4: isPt ? "4. Drawdown Maximo" : "4. Maximum Drawdown",

    dd1: isPt
      ? "O drawdown maximo mede a maior queda do pico ao vale no saldo da sua conta. Se sua conta cresceu de R$10.000 para R$15.000 e depois caiu para R$12.000 antes de se recuperar, seu drawdown maximo foi de R$3.000 ou 20% do pico."
      : "Maximum drawdown measures the largest peak-to-trough decline in your account balance. If your account grew from $10,000 to $15,000 and then dropped to $12,000 before recovering, your maximum drawdown was $3,000 or 20% from the peak.",

    dd2: isPt
      ? "Esta metrica importa por duas razoes criticas. Primeiro, ela mostra seu pior cenario. Se voce ja experimentou um drawdown de 30% no passado, deve esperar que isso aconteca novamente, e provavelmente pior. Seu dimensionamento de posicao e gestao de risco devem levar isso em conta. Se um drawdown de 30% faria voce entrar em panico e abandonar sua estrategia, voce esta operando com lotes muito grandes."
      : "This metric matters for two critical reasons. First, it tells you your worst-case scenario. If you have experienced a 30% drawdown in the past, you should expect it to happen again, and probably worse. Your position sizing and risk management should account for this. If a 30% drawdown would cause you to panic and abandon your strategy, you are trading too large.",

    dd3: isPt
      ? "Segundo, o drawdown tem uma relacao nao-linear com a recuperacao. Um drawdown de 10% exige um ganho de 11% para recuperar. Um drawdown de 20% exige 25%. Um drawdown de 50% exige 100%, dobrando seu capital restante apenas para voltar ao ponto de equilibrio. E por isso que a preservacao de capital nao e apenas importante, e tudo. Os traders que sobrevivem tempo suficiente para compor seus ganhos sao os que mantem seus drawdowns gerenciaveis."
      : "Second, drawdown has a non-linear relationship with recovery. A 10% drawdown requires an 11% gain to recover. A 20% drawdown requires 25%. A 50% drawdown requires 100%, doubling your remaining capital just to get back to break even. This is why capital preservation is not just important, it is everything. The traders who survive long enough to compound their gains are the ones who keep their drawdowns manageable.",

    ddBox: isPt
      ? { label: "Regra pratica:", text: "Se seu drawdown maximo exceder 20% da sua conta, reduza o tamanho das suas posicoes imediatamente. A maioria das mesas proprietarias estabelece um limite de drawdown maximo de 10% a 12% por uma razao." }
      : { label: "Rule of thumb:", text: "If your maximum drawdown exceeds 20% of your account, reduce your position sizes immediately. Most prop firms set a maximum drawdown limit of 10% to 12% for a reason." },

    heading5: isPt ? "5. Expectativa Matematica (Expectancy)" : "5. Expectancy",

    exp1: isPt
      ? "A expectativa matematica e provavelmente a metrica mais importante para um trader, porque informa o valor medio que voce pode esperar ganhar (ou perder) por operacao a longo prazo. Ela combina sua taxa de acerto, ganho medio e perda media em um unico numero definitivo."
      : "Expectancy is arguably the single most important metric for a trader because it tells you the average amount you can expect to make (or lose) per trade over the long run. It combines your win rate, average win, and average loss into one definitive number.",

    expBox: isPt
      ? { label: "Formula:", text: "Expectativa = (Taxa de Acerto x Ganho Medio) - (Taxa de Erro x Perda Media). Por exemplo, se voce acerta 45% das vezes com ganho medio de R$250 e perde 55% das vezes com perda media de R$150, sua expectativa e (0,45 x R$250) - (0,55 x R$150) = R$112,50 - R$82,50 = ", result: "R$30 por operacao" }
      : { label: "Formula:", text: "Expectancy = (Win Rate x Average Win) - (Loss Rate x Average Loss). For example, if you win 45% of the time with an average win of $250 and lose 55% of the time with an average loss of $150, your expectancy is (0.45 x $250) - (0.55 x $150) = $112.50 - $82.50 = ", result: "$30 per trade" },

    exp2: isPt
      ? "Uma expectativa positiva significa que, ao longo de uma amostra grande o suficiente de operacoes, voce ganhara dinheiro. Uma expectativa negativa significa que nenhum dimensionamento de posicao, gestao de capital ou coaching psicologico vai salvar voce. O sistema em si esta quebrado. E por isso que a expectativa e a metrica definitiva: ela e a prova matematica de que sua estrategia funciona."
      : "A positive expectancy means that, over a large enough sample of trades, you will make money. A negative expectancy means no amount of position sizing, money management, or psychological coaching will save you. The system itself is broken. This is why expectancy is the ultimate metric: it is the mathematical proof that your strategy works.",

    exp3: isPt
      ? "A ressalva e o tamanho da amostra. Voce precisa de pelo menos 100 operacoes para obter uma leitura confiavel de expectativa. Qualquer coisa menor e a variacao aleatoria pode criar uma imagem enganosa. Acompanhe a expectativa em todo o seu portfolio e para cada estrategia individual para ver onde esta sua vantagem real."
      : "The caveat is sample size. You need at least 100 trades to get a reliable expectancy reading. Anything less and random variance can create a misleading picture. Track expectancy across your entire portfolio and for each individual strategy to see where your real edge lies.",

    heading6: isPt ? "Unindo Tudo: O TakeZ Score" : "Bringing It All Together: The TakeZ Score",

    takeZ1: isPt
      ? "Cada uma dessas cinco metricas conta parte da historia. A taxa de acerto mostra frequencia. O risco-retorno mostra magnitude. O fator de lucro mostra vantagem. O drawdown mostra risco. A expectativa mostra o resultado matematico. A abordagem mais poderosa e acompanhar todas as cinco simultaneamente e entender como elas interagem."
      : "Each of these five metrics tells part of the story. Win rate shows frequency. Risk-reward shows magnitude. Profit factor shows edge. Drawdown shows risk. Expectancy shows the mathematical outcome. The most powerful approach is to track all five simultaneously and understand how they interact.",

    takeZ2: isPt
      ? "E exatamente isso que o TakeZ Score no Trade AI Hub faz. Ele combina essas metricas e mais em um unico score composto que oferece uma leitura instantanea da saude geral do seu trading. Em vez de pular entre planilhas e calcular formulas manualmente, voce tem um dashboard em tempo real que atualiza automaticamente conforme voce registra operacoes. Os agentes de IA ate analisam tendencias nas suas metricas ao longo do tempo e alertam quando algo muda, seja uma melhoria para celebrar ou uma deterioracao para investigar."
      : "That is exactly what the TakeZ Score in Trade AI Hub does. It combines these metrics and more into a single composite score that gives you an instant read on your overall trading health. Instead of jumping between spreadsheets and manually calculating formulas, you get a real-time dashboard that updates automatically as you log trades. The AI agents even analyze trends in your metrics over time and alert you when something changes, whether it is an improvement to celebrate or a deterioration to investigate.",
  }

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
          <div className="mb-6 h-48 sm:h-64 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 opacity-80" />
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {content.date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              8 {t("landing.blogMinRead")}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            {t("landing.blogArticle1Title")}
          </h1>
        </div>
      </LandingSectionWrapper>

      {/* Article Body */}
      <LandingSectionWrapper className="px-4 pb-16 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-3xl">
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.intro1}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.intro2}
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            {content.heading1}
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.winRate1}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.winRate2}
          </p>
          <LandingGlassCard className="p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">{content.winRateBox.label}</span> {content.winRateBox.text}
            </p>
          </LandingGlassCard>
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.winRate3}
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            {content.heading2}
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.rrr1}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.rrr2}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.rrr3}
          </p>
          <LandingGlassCard className="p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">{content.rrrBox.label}</span> {content.rrrBox.text}
            </p>
          </LandingGlassCard>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            {content.heading3}
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.pf1}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.pf2}
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 mb-6 ml-4">
            {content.pfList.map((item, i) => (
              <li key={i}><span className="font-semibold text-white">{item.label}</span> {item.text}</li>
            ))}
          </ul>
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.pf3}
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            {content.heading4}
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.dd1}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.dd2}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.dd3}
          </p>
          <LandingGlassCard className="p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">{content.ddBox.label}</span> {content.ddBox.text}
            </p>
          </LandingGlassCard>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            {content.heading5}
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.exp1}
          </p>
          <LandingGlassCard className="p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">{content.expBox.label}</span> {content.expBox.text}<span className="font-semibold text-white">{content.expBox.result}</span>.
            </p>
          </LandingGlassCard>
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.exp2}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.exp3}
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            {content.heading6}
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.takeZ1}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {content.takeZ2}
          </p>
        </article>
      </LandingSectionWrapper>

      {/* CTA */}
      <LandingSectionWrapper className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 p-8 sm:p-12 text-center">
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
