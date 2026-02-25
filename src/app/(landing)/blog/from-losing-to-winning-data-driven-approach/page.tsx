"use client"

import { ArrowLeft, Calendar, Clock } from "lucide-react"
import Image from "next/image"
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
    date: "Feb 15, 2026",
    intro1:
      "There is a statistic that gets repeated so often in trading circles that it has become almost cliche: 90% of retail traders lose money. Some studies put the number even higher. But instead of accepting this as an inevitable reality, it is more productive to ask a different question: what do the 10% who win do differently? The answer, across nearly every study and interview with consistently profitable traders, comes back to one thing. Data.",
    intro2:
      "Winning traders do not rely on gut feelings, hot tips, or the latest indicator. They treat trading as a business and their trade history as the most important business intelligence they have. They track everything, analyze relentlessly, and make decisions based on evidence rather than emotion. This article lays out a five-step framework for making that transformation.",
    step1Title: "Step 1: Start Tracking Everything",
    step1P1:
      "The first step is deceptively simple but critically important: record every single trade you take. Not just the winners, not just the big trades, every single one. Import your MT4 or MT5 history. Connect your broker. Leave no trade undocumented.",
    step1P2:
      "But raw trade data is just the beginning. The real power comes from adding context. Tag each trade with the strategy you used: was it a breakout, a pullback, a range trade, a news play? Add notes about market conditions. Were you trading during a trending market or a choppy one? Was there a major news event? Were you feeling confident or anxious?",
    step1P3:
      "This enriched data becomes the foundation for everything that follows. Without it, you are trying to diagnose a problem without any symptoms. Most traders resist this step because it forces accountability. It is much easier to forget about losing trades than to look at them documented in detail. But that discomfort is exactly where growth begins.",
    step1CardLabel: "Getting started:",
    step1Card:
      "Import at least 3 months of trade history to establish a baseline. Tag every trade with a strategy name and at least one contextual tag. The more data you provide, the more meaningful your analysis becomes.",
    step2Title: "Step 2: Identify Your Patterns",
    step2P1:
      "Once you have at least 50 to 100 tracked trades, patterns will start to emerge. Some will confirm what you already suspected. Others will surprise you. Both are valuable.",
    step2P2:
      "Start by breaking down your performance across different dimensions. Which currency pairs are you most profitable on? Most traders have two or three pairs where they consistently perform well and several where they consistently underperform. Look at time of day. Many traders find that their best results come during one specific session, and their worst results come when they trade outside their sweet spot.",
    step2P3:
      "Examine your strategies. If you trade multiple setups, compare their individual metrics. You might discover that your breakout trades have a 60% win rate with a 1:3 risk-reward, while your counter-trend trades have a 35% win rate with a 1:1.5 risk-reward. The data makes it obvious which one to focus on, even though both might feel equally good in the moment.",
    step2List: [
      "Performance by currency pair: find your best and worst pairs",
      "Performance by time of day and trading session",
      "Performance by strategy or setup type",
      "Performance by day of week",
      "Performance by trade duration (scalps vs. swings)",
      "Performance by direction (long vs. short bias)",
    ],
    step3Title: "Step 3: Eliminate Losing Behaviors",
    step3P1:
      "This is where the transformation truly begins. Once you have identified your patterns, the next step is to systematically eliminate the behaviors that are costing you money. This is not about finding new strategies or learning new indicators. It is about stopping the things that are already proven, by your own data, to lose.",
    step3P2:
      'The most common losing behaviors in forex trading are well known. Revenge trading: taking impulsive trades after a loss to "make it back." The data typically shows that trades taken within 30 minutes of a losing trade have dramatically lower win rates. Overtrading: taking too many trades per session, diluting your edge with low-quality setups. Moving stop-losses: adjusting your stop further from entry to avoid being stopped out, which turns small manageable losses into account-threatening ones. Trading the wrong sessions: forcing trades during low-volatility periods when your strategy requires momentum.',
    step3P3:
      'The key is to quantify these behaviors. Do not just say "I think I overtrade." Calculate your win rate and profit factor when you take more than 5 trades per day versus fewer than 5. Do not just suspect that revenge trading hurts you. Measure the performance of trades taken within 30 minutes of a loss versus trades taken with a clean slate. When the numbers are in front of you, the path forward becomes clear.',
    step4Title: "Step 4: Double Down on What Works",
    step4P1:
      "Most traders spend all their energy trying to fix weaknesses. While eliminating losing behaviors is essential, the other half of the equation is equally important: do more of what is already working. This is where the data becomes your biggest ally.",
    step4P2:
      "If your data shows that EUR/USD breakout trades during the London-New York overlap have a profit factor of 2.5, that is your edge. Lean into it. Trade that setup more frequently. Refine your entry and exit criteria for it. Consider increasing your position size slightly, within your risk parameters, when that specific setup presents itself.",
    step4P3:
      "Conversely, if your data shows that your counter-trend GBP/JPY trades have a profit factor of 0.8, stop taking them. It does not matter how good they feel in the moment or how many YouTube videos say it is a great strategy. Your data says it does not work for you, and your data is the only opinion that matters.",
    step4CardLabel: "The 80/20 rule in trading:",
    step4Card:
      "For most traders, 20% of their setups produce 80% of their profits. Finding and focusing on that 20% is the fastest path to consistent profitability.",
    step5Title: "Step 5: Review Weekly",
    step5P1:
      "Improvement is not a one-time event. It is a continuous process that requires regular review. The most effective cadence for most traders is a weekly review, with a deeper monthly analysis.",
    step5P2:
      "Your weekly review should answer three questions: What went right this week? What went wrong? What will I do differently next week? Keep it focused and action-oriented. Do not spend two hours reliving every trade. Spend 30 minutes looking at the data, identifying one thing to improve, and committing to that change for the following week.",
    step5P3:
      "Monthly reviews should zoom out further. Look at how your key metrics have trended over the past 30 days. Is your win rate improving or declining? Is your drawdown growing? Has your profit factor changed? AI-generated weekly and monthly reports automate this process, surfacing the trends and changes that matter most so you can focus on making decisions rather than crunching numbers.",
    realWorldTitle: "A Real-World Transformation",
    realWorldP1:
      "Consider the journey of a trader who was consistently losing 12% of their account per month. After three months of dedicated journaling and data analysis, the pattern became clear. They were taking 15 to 20 trades per day, well beyond the optimal range for their strategy. Their revenge trading after losses was severe, with 40% of their trades coming within minutes of a losing trade. And they were trading five different currency pairs, despite being consistently profitable on only two of them.",
    realWorldP2:
      "The fix was not a new strategy or indicator. It was discipline backed by data. They limited themselves to a maximum of 6 trades per day. They implemented a mandatory 30-minute cooldown after any losing trade. They narrowed their focus to EUR/USD and GBP/USD exclusively. Within two months, they went from -12% per month to +4% per month. Not because they became a better analyst, but because they stopped doing the things that were costing them money.",
    takeawayLabel: "The takeaway:",
    takeaway:
      "The path from losing to winning is rarely about adding something new. It is about removing the habits, the pairs, the sessions, and the emotional patterns that your data proves are working against you. Your trade history already contains the answers. You just need the tools to find them.",
  },
  "pt-BR": {
    date: "15 Fev, 2026",
    intro1:
      "Existe uma estatistica que se repete com tanta frequencia nos circulos de trading que ja se tornou quase um cliche: 90% dos traders de varejo perdem dinheiro. Alguns estudos colocam esse numero ainda mais alto. Mas em vez de aceitar isso como uma realidade inevitavel, e mais produtivo fazer uma pergunta diferente: o que os 10% que lucram fazem de diferente? A resposta, em praticamente todos os estudos e entrevistas com traders consistentemente lucrativos, se resume a uma coisa. Dados.",
    intro2:
      "Traders vencedores nao dependem de intuicao, dicas quentes ou do indicador da moda. Eles tratam o trading como um negocio e seu historico de operacoes como a inteligencia de negocios mais importante que possuem. Eles rastreiam tudo, analisam incansavelmente e tomam decisoes baseadas em evidencias, nao em emocoes. Este artigo apresenta um framework de cinco passos para realizar essa transformacao.",
    step1Title: "Passo 1: Comece a Registrar Tudo",
    step1P1:
      "O primeiro passo e enganosamente simples, mas criticamente importante: registre cada operacao que voce faz. Nao apenas as vencedoras, nao apenas as grandes operacoes, absolutamente todas. Importe seu historico do MT4 ou MT5. Conecte sua corretora. Nao deixe nenhuma operacao sem registro.",
    step1P2:
      "Mas os dados brutos das operacoes sao apenas o comeco. O verdadeiro poder vem de adicionar contexto. Marque cada operacao com a estrategia utilizada: foi um rompimento, uma retracaao, uma operacao de faixa, uma operacao de noticia? Adicione notas sobre as condicoes do mercado. Voce estava operando em um mercado de tendencia ou em um mercado lateral? Havia algum evento de noticias importante? Voce estava se sentindo confiante ou ansioso?",
    step1P3:
      "Esses dados enriquecidos se tornam a base de tudo que vem a seguir. Sem eles, voce esta tentando diagnosticar um problema sem nenhum sintoma. A maioria dos traders resiste a esse passo porque ele exige responsabilidade. E muito mais facil esquecer as operacoes perdedoras do que olhar para elas documentadas em detalhes. Mas esse desconforto e exatamente onde o crescimento comeca.",
    step1CardLabel: "Para comecar:",
    step1Card:
      "Importe pelo menos 3 meses de historico de operacoes para estabelecer uma linha de base. Marque cada operacao com o nome de uma estrategia e pelo menos uma tag contextual. Quanto mais dados voce fornecer, mais significativa sera sua analise.",
    step2Title: "Passo 2: Identifique Seus Padroes",
    step2P1:
      "Depois de ter pelo menos 50 a 100 operacoes registradas, padroes comecarao a surgir. Alguns confirmarao o que voce ja suspeitava. Outros vao surpreende-lo. Ambos sao valiosos.",
    step2P2:
      "Comece analisando seu desempenho em diferentes dimensoes. Em quais pares de moedas voce e mais lucrativo? A maioria dos traders tem dois ou tres pares onde performam consistentemente bem e varios onde consistentemente perdem. Olhe o horario do dia. Muitos traders descobrem que seus melhores resultados vem durante uma sessao especifica, e seus piores resultados vem quando operam fora de sua zona ideal.",
    step2P3:
      "Examine suas estrategias. Se voce opera multiplos setups, compare suas metricas individuais. Voce pode descobrir que suas operacoes de rompimento tem uma taxa de acerto de 60% com risco-retorno de 1:3, enquanto suas operacoes contra-tendencia tem uma taxa de acerto de 35% com risco-retorno de 1:1.5. Os dados tornam obvio em qual focar, mesmo que ambos parecam igualmente bons no momento.",
    step2List: [
      "Desempenho por par de moedas: encontre seus melhores e piores pares",
      "Desempenho por horario do dia e sessao de trading",
      "Desempenho por estrategia ou tipo de setup",
      "Desempenho por dia da semana",
      "Desempenho por duracao da operacao (scalps vs. swings)",
      "Desempenho por direcao (vies comprado vs. vendido)",
    ],
    step3Title: "Passo 3: Elimine Comportamentos Perdedores",
    step3P1:
      "E aqui que a transformacao realmente comeca. Uma vez identificados seus padroes, o proximo passo e eliminar sistematicamente os comportamentos que estao custando dinheiro. Nao se trata de encontrar novas estrategias ou aprender novos indicadores. Trata-se de parar de fazer as coisas que ja estao comprovadas, pelos seus proprios dados, como perdedoras.",
    step3P2:
      'Os comportamentos perdedores mais comuns no trading de forex sao bem conhecidos. Revenge trading: fazer operacoes impulsivas apos uma perda para "recuperar o prejuizo". Os dados tipicamente mostram que operacoes feitas dentro de 30 minutos de uma operacao perdedora tem taxas de acerto dramaticamente menores. Overtrading: fazer operacoes demais por sessao, diluindo sua vantagem com setups de baixa qualidade. Mover stop-losses: ajustar seu stop para mais longe da entrada para evitar ser estopado, transformando perdas pequenas e gerenciaveis em perdas que ameacam a conta. Operar nas sessoes erradas: forcar operacoes durante periodos de baixa volatilidade quando sua estrategia exige momentum.',
    step3P3:
      'A chave e quantificar esses comportamentos. Nao diga apenas "acho que opero demais". Calcule sua taxa de acerto e fator de lucro quando voce faz mais de 5 operacoes por dia versus menos de 5. Nao apenas suspeite que o revenge trading prejudica voce. Meca o desempenho de operacoes feitas dentro de 30 minutos de uma perda versus operacoes feitas com a mente limpa. Quando os numeros estao diante de voce, o caminho a seguir fica claro.',
    step4Title: "Passo 4: Dobre a Aposta no que Funciona",
    step4P1:
      "A maioria dos traders gasta toda sua energia tentando corrigir fraquezas. Embora eliminar comportamentos perdedores seja essencial, a outra metade da equacao e igualmente importante: faca mais do que ja esta funcionando. E aqui que os dados se tornam seu maior aliado.",
    step4P2:
      "Se seus dados mostram que operacoes de rompimento em EUR/USD durante a sobreposicao Londres-Nova York tem um fator de lucro de 2.5, essa e a sua vantagem. Apoie-se nela. Opere esse setup com mais frequencia. Refine seus criterios de entrada e saida para ele. Considere aumentar ligeiramente o tamanho da sua posicao, dentro dos seus parametros de risco, quando esse setup especifico se apresentar.",
    step4P3:
      "Por outro lado, se seus dados mostram que suas operacoes contra-tendencia em GBP/JPY tem um fator de lucro de 0.8, pare de faze-las. Nao importa quao bem elas parecam no momento ou quantos videos no YouTube digam que e uma otima estrategia. Seus dados dizem que nao funciona para voce, e seus dados sao a unica opiniao que importa.",
    step4CardLabel: "A regra 80/20 no trading:",
    step4Card:
      "Para a maioria dos traders, 20% de seus setups produzem 80% de seus lucros. Encontrar e focar nesses 20% e o caminho mais rapido para a lucratividade consistente.",
    step5Title: "Passo 5: Revise Semanalmente",
    step5P1:
      "Melhoria nao e um evento unico. E um processo continuo que requer revisao regular. A cadencia mais eficaz para a maioria dos traders e uma revisao semanal, com uma analise mensal mais profunda.",
    step5P2:
      "Sua revisao semanal deve responder tres perguntas: O que deu certo esta semana? O que deu errado? O que farei diferente na proxima semana? Mantenha o foco e a orientacao para acao. Nao gaste duas horas revivendo cada operacao. Gaste 30 minutos olhando os dados, identificando uma coisa para melhorar e se comprometendo com essa mudanca para a semana seguinte.",
    step5P3:
      "Revisoes mensais devem ter uma visao mais ampla. Veja como suas metricas-chave evoluiram nos ultimos 30 dias. Sua taxa de acerto esta melhorando ou piorando? Seu drawdown esta crescendo? Seu fator de lucro mudou? Relatorios semanais e mensais gerados por IA automatizam esse processo, destacando as tendencias e mudancas mais importantes para que voce possa focar em tomar decisoes em vez de processar numeros.",
    realWorldTitle: "Uma Transformacao no Mundo Real",
    realWorldP1:
      "Considere a jornada de um trader que estava perdendo consistentemente 12% de sua conta por mes. Apos tres meses de registro dedicado e analise de dados, o padrao ficou claro. Ele estava fazendo 15 a 20 operacoes por dia, muito alem da faixa ideal para sua estrategia. Seu revenge trading apos perdas era severo, com 40% de suas operacoes ocorrendo minutos apos uma operacao perdedora. E ele estava operando cinco pares de moedas diferentes, apesar de ser consistentemente lucrativo em apenas dois deles.",
    realWorldP2:
      "A solucao nao foi uma nova estrategia ou indicador. Foi disciplina respaldada por dados. Ele se limitou a um maximo de 6 operacoes por dia. Implementou um intervalo obrigatorio de 30 minutos apos qualquer operacao perdedora. Restringiu seu foco exclusivamente a EUR/USD e GBP/USD. Em dois meses, ele saiu de -12% por mes para +4% por mes. Nao porque se tornou um analista melhor, mas porque parou de fazer as coisas que estavam custando dinheiro.",
    takeawayLabel: "A conclusao:",
    takeaway:
      "O caminho de perdedor para vencedor raramente envolve adicionar algo novo. Trata-se de remover os habitos, os pares, as sessoes e os padroes emocionais que seus dados comprovam estar trabalhando contra voce. Seu historico de operacoes ja contem as respostas. Voce so precisa das ferramentas certas para encontra-las.",
  },
} as const

export default function DataDrivenArticlePage() {
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
          <div className="relative mb-6 h-48 sm:h-64 overflow-hidden rounded-2xl">
            <Image
              src="/blog/blog-data-driven.png"
              alt="From Losing to Winning: A Data-Driven Approach"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {c.date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              9 {t("landing.blogMinRead")}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            {t("landing.blogArticle3Title")}
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
            {c.step1Title}
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.step1P1}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.step1P2}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.step1P3}
          </p>
          <LandingGlassCard className="p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">{c.step1CardLabel}</span> {c.step1Card}
            </p>
          </LandingGlassCard>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            {c.step2Title}
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.step2P1}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.step2P2}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.step2P3}
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 mb-6 ml-4">
            {c.step2List.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            {c.step3Title}
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.step3P1}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.step3P2}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.step3P3}
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            {c.step4Title}
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.step4P1}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.step4P2}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.step4P3}
          </p>
          <LandingGlassCard className="p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">{c.step4CardLabel}</span> {c.step4Card}
            </p>
          </LandingGlassCard>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            {c.step5Title}
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.step5P1}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.step5P2}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.step5P3}
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            {c.realWorldTitle}
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.realWorldP1}
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            {c.realWorldP2}
          </p>
          <LandingGlassCard className="p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">{c.takeawayLabel}</span> {c.takeaway}
            </p>
          </LandingGlassCard>
        </article>
      </LandingSectionWrapper>

      {/* CTA */}
      <LandingSectionWrapper className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 border border-fuchsia-500/20 p-8 sm:p-12 text-center">
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
