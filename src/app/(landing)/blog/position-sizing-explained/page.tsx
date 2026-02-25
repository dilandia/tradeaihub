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

export default function PositionSizingArticlePage() {
  const { t, locale } = useLanguage()
  const appUrl = useAppUrl()
  const isPt = locale === "pt-BR"

  const content = {
    date: isPt ? "25 Fev, 2026" : "Feb 25, 2026",

    intro1: isPt
      ? "Aqui está uma estatística assustadora: 90% dos traders perdem dinheiro. Quando você investiga por quê, raras vezes é por falta de uma boa estratégia. Frequentemente é porque eles arriscam demais por trade. Um trader com uma estratégia mediocre mas gestão de risco excelente vence um trader com uma estratégia excelente mas gestão de risco pobre. Sempre. Position sizing é tão importante que poderia ser chamado de \"O Seguro do Trader\"."
      : "Here is a sobering statistic: 90% of traders lose money. When you investigate why, it is rarely because of a poor strategy. Often it is because they risk too much per trade. A trader with a mediocre strategy but excellent risk management beats a trader with an excellent strategy but poor risk management. Always. Position sizing could be called \"The Trader's Insurance Policy.\"",

    intro2: isPt
      ? "Neste artigo, você aprenderá a regra dos 2%, por que ela funciona, como calculá-la, e como usá-la para transformar uma conta perdedora em uma conta vencedora. Porque aqui está a verdade: position sizing correta é frequentemente a diferença entre traders que chegam a 2026 ainda com conta, e traders que perderam tudo em 2025."
      : "In this article, you will learn the 2% rule, why it works, how to calculate it, and how to use it to transform a losing account into a winning one. Because here is the truth: proper position sizing is often the difference between traders who are still here in 2026 with an account, and traders who lost everything in 2025.",

    heading1: isPt ? "1. Por Que 90% dos Traders Falham" : "1. Why 90% of Traders Fail",

    pos1: isPt
      ? "A pergunta não é \"Por que minha estratégia não funciona?\" A pergunta é \"Por que estou arriscando minha conta inteira em uma estratégia que só acerta 50% das vezes?\" Muitos traders iniciantes veem uma oportunidade de trade, entram com uma posição massiva (talvez 10%, 20% ou até 50% de seu capital), e esperam pelo melhor. Quando a operação vai contra eles (e frequentemente vai), a perda é devastadora."
      : "The question is not \"Why doesn't my strategy work?\" The question is \"Why am I risking my entire account on a strategy that is only right 50% of the time?\" Many novice traders see a trading opportunity, enter with a massive position (maybe 10%, 20%, or even 50% of their capital), and hope for the best. When the trade goes against them (and often it does), the loss is devastating.",

    pos2: isPt
      ? "Aqui está o problema matemático: se você começa com R$10.000 e perde 50%, você fica com R$5.000. Para retornar ao R$10.000, você precisa ganhar 100% em R$5.000. Perder 50% é mais fácil que ganhar 100%. Isto é chamado assimetria de risco. Quanto maior o seu risco por trade, mais assimétrica a situação se torna contra você."
      : "Here is the mathematical problem: if you start with $10,000 and lose 50%, you are left with $5,000. To get back to $10,000, you need to make 100% on $5,000. Losing 50% is easier than making 100%. This is called risk asymmetry. The bigger your risk per trade, the more asymmetrical the situation becomes against you.",

    posBox1: isPt
      ? { label: "Exemplo de Assimetria:", text: "Começa com R$10k → perde 20% → tem R$8k → precisa ganhar 25% para retornar. Começa com R$10k → perde 50% → tem R$5k → precisa ganhar 100% para retornar." }
      : { label: "Asymmetry Example:", text: "Start with $10k → lose 20% → left with $8k → need to gain 25% to get back. Start with $10k → lose 50% → left with $5k → need to gain 100% to get back." },

    heading2: isPt ? "2. A Regra dos 2%: O Ouro Líquido" : "2. The 2% Rule: The Golden Standard",

    pos3: isPt
      ? "A regra dos 2% é simples: nunca arriske mais de 2% do seu saldo total em um único trade. Se você tem R$10.000, o máximo que pode arriscar é R$200. Se você tem R$100.000, o máximo que pode arriscar é R$2.000."
      : "The 2% rule is simple: never risk more than 2% of your total balance on a single trade. If you have $10,000, the maximum you can risk is $200. If you have $100,000, the maximum you can risk is $2,000.",

    pos4: isPt
      ? "Por que 2% especificamente? Porque com 2% por trade, mesmo uma sequência de 10 perdas seguidas resulta em apenas um drawdown de 18% (não é 20% porque o percentual é aplicado ao saldo decrescente). Isto deixa você ainda com 82% de seu capital, suficiente para se recuperar. Mais importante ainda, você pode sobreviver a longas sequências de perdas e continuar operando."
      : "Why specifically 2%? Because with 2% per trade, even a streak of 10 consecutive losses results in only an 18% drawdown (not 20% because the percentage is applied to the declining balance). This leaves you with still 82% of your capital, enough to recover. Most importantly, you can survive long losing streaks and keep trading.",

    pos5: isPt
      ? "Compare isto com alguém que arrisca 10% por trade: 10 perdas seguidas = 65% drawdown. Você perdeu praticamente 2/3 de sua conta. Compare isto com alguém que arrisca 20% por trade: 10 perdas seguidas = 89% drawdown. Você está quase zerado. É por isso que começar pequeno é tão crítico. Você não está tentando enriquecer rápido. Você está tentando SOBREVIVER e crescer consistentemente."
      : "Compare this to someone risking 10% per trade: 10 consecutive losses = 65% drawdown. You lost nearly 2/3 of your account. Compare to someone risking 20% per trade: 10 consecutive losses = 89% drawdown. You are nearly wiped out. This is why starting small is so critical. You are not trying to get rich quick. You are trying to SURVIVE and grow consistently.",

    posBox2: isPt
      ? { label: "A Matemática da Recuperação:", text: "18% drawdown necessita 22% de ganho para recuperar. 50% drawdown necessita 100% de ganho para recuperar. 70% drawdown necessita 233% de ganho para recuperar. Quanto mais você arrisca, mais impossível fica recuperar." }
      : { label: "The Math of Recovery:", text: "18% drawdown requires 22% gains to recover. 50% drawdown requires 100% gains to recover. 70% drawdown requires 233% gains to recover. The more you risk, the harder it becomes to recover." },

    heading3: isPt ? "3. Como Calcular Seu Tamanho de Posição" : "3. How to Calculate Your Position Size",

    pos6: isPt
      ? "A fórmula é simples:"
      : "The formula is simple:",

    pos7: isPt
      ? "Tamanho da Posição = (Saldo x 2%) / (Entrada - Stop Loss em pips)"
      : "Position Size = (Account Balance x 2%) / (Entry Price - Stop Loss in pips)",

    pos8: isPt
      ? "Exemplo: Você tem R$10.000. EUR/USD está em 1.0850. Seu stop loss é 1.0750 (100 pips abaixo). Você quer arriscar 2% (R$200). Quantas unidades deve comprar?"
      : "Example: You have $10,000. EUR/USD is at 1.0850. Your stop loss is 1.0750 (100 pips below). You want to risk 2% ($200). How many units should you buy?",

    pos9: isPt
      ? "Tamanho da Posição = (10.000 x 0.02) / 100 pips = R$200 / 100 = 2 micro-lotes (ou 20.000 unidades)"
      : "Position Size = ($10,000 x 0.02) / 100 pips = $200 / 100 = 2 micro-lots (or 20,000 units)",

    pos10: isPt
      ? "Se EUR/USD subir para 1.0900 (50 pips de ganho), você ganha R$100. Se cair para 1.0750, você perde R$200 (exatamente 2% da sua conta). Isso é disciplina."
      : "If EUR/USD rises to 1.0900 (50 pips profit), you make $100. If it falls to 1.0750, you lose $200 (exactly 2% of your account). That is discipline.",

    posBox3: isPt
      ? { label: "Dica Profissional:", text: "Use uma calculadora de posição sizing. A maioria das plataformas de trading tem uma integrada. Você insere seu saldo, seu nível de stop loss, e ela calcula automaticamente quantas unidades comprar." }
      : { label: "Pro Tip:", text: "Use a position size calculator. Most trading platforms have one built-in. You enter your balance, your stop-loss level, and it automatically calculates how many units to buy." },

    heading4: isPt ? "4. Ajustes Para Volatilidade" : "4. Adjustments for Volatility",

    pos11: isPt
      ? "A regra dos 2% é um baseline. Mas a volatilidade muda. Quando há um evento econômico importante (NFP, reunião do Banco Central, etc.), a volatilidade sobe, os spreads alargam, e seus stops podem ser batidos mais facilmente. Nestes momentos, alguns traders reduzem para 1% de risco ou até ficam fora do mercado."
      : "The 2% rule is a baseline. But volatility changes. When there is a major economic event (NFP, Central Bank meeting, etc.), volatility rises, spreads widen, and your stops can be hit more easily. In these moments, some traders reduce to 1% risk or even stay out of the market.",

    pos12: isPt
      ? "O oposto também é verdade: quando a volatilidade é muito baixa e sua estratégia é muito alta-winning (>60% win rate), você pode aumentar para 2.5% ou até 3%. Mas isto requer dados históricos sólidos e experiência. Para iniciantes, fique nos 2%."
      : "The opposite is also true: when volatility is very low and your strategy is very high-winning (>60% win rate), you can increase to 2.5% or even 3%. But this requires solid historical data and experience. For beginners, stick to 2%.",

    heading5: isPt ? "5. O Erro da Sobredimensionagem: Kelly Criterion vs. Fixed %" : "5. The Over-Sizing Trap: Kelly Criterion vs. Fixed %",

    pos13: isPt
      ? "Alguns traders avançados usam o Kelly Criterion, uma fórmula matemática que calcula o tamanho de posição \"ótimo\" baseado em sua edge (win rate e RRR). A fórmula é: f* = (win% x RRR - loss%) / RRR"
      : "Some advanced traders use the Kelly Criterion, a mathematical formula that calculates the \"optimal\" position size based on your edge (win rate and risk-reward). The formula is: f* = (win% x RRR - loss%) / RRR",

    pos14: isPt
      ? "O problema com Kelly é que ele assume que seus dados históricos são perfeitos. Na realidade, a maioria dos traders sobrestima sua win rate e subestima a volatilidade. O Kelly Criterion pode sobredimensionar sua posição e explodir sua conta. Por isso, traders profissionais frequentemente usam \"half-Kelly\" ou \"quarter-Kelly\" (metade ou um quarto do tamanho de Kelly). Para iniciantes, a regra dos 2% é muito melhor. É simples, não presume que você tem uma edge perfeita, e é conservador o suficiente para sobreviver."
      : "The problem with Kelly is that it assumes your historical data is perfect. In reality, most traders overestimate their win rate and underestimate volatility. Kelly Criterion can over-size your position and blow up your account. This is why professional traders often use \"half-Kelly\" or \"quarter-Kelly\" (half or a quarter of Kelly size). For beginners, the 2% rule is far better. It is simple, does not presume you have a perfect edge, and is conservative enough to survive.",

    posBox4: isPt
      ? { label: "Recomendação:", text: "Use a regra dos 2% enquanto você está validando sua estratégia. Quando você tiver 100+ trades com dados sólidos, você pode explorar Kelly ou outras metodologias. Mas não comece com Kelly." }
      : { label: "Recommendation:", text: "Use the 2% rule while you are validating your strategy. When you have 100+ trades with solid data, you can explore Kelly or other methodologies. But do not start with Kelly." },

    heading6: isPt ? "6. Rastreando Seu Position Sizing" : "6. Tracking Your Position Sizing",

    pos15: isPt
      ? "A melhor maneira de certificar-se de que você está seguindo a regra dos 2% é registrar cada trade em um journal detalhado. Para cada trade, registre: saldo inicial, tamanho de posição em unidades, risco em $ ou R$, stop loss, take profit, resultado. Depois, você pode analisar: 'Eu estava realmente seguindo minha regra de 2%? Em quais trades eu desviei?'"
      : "The best way to ensure you are following the 2% rule is to record each trade in a detailed journal. For each trade, record: starting balance, position size in units, risk in $ or R$, stop loss, take profit, result. Then you can analyze: 'Was I really following my 2% rule? On which trades did I deviate?'",

    pos16: isPt
      ? "Um trading journal moderno como Trade AI Hub automatiza isto. Ele calcula seu risco/recompensa, mostra seu drawdown máximo, e alerta quando você está sobredimensionando suas posições. Não é luxo, é necessário."
      : "A modern trading journal like Trade AI Hub automates this. It calculates your risk/reward, shows your maximum drawdown, and alerts when you are over-sizing your positions. It is not a luxury, it is a necessity.",

    heading7: isPt ? "O Que Fazer Agora" : "The Path Forward",

    pos17: isPt
      ? "Position sizing é a primeira linha de defesa contra o desastre. Não é glamoroso. Não é sexy. Mas é mais importante que qualquer indicator, padrão de gráfico, ou estratégia. Comece hoje com a regra dos 2%. Se você começou com uma regra maior (5%, 10%), comece a reduzir gradualmente. Seus futuros eu (e sua conta) vai agradecer."
      : "Position sizing is your first line of defense against disaster. It is not glamorous. It is not sexy. But it is more important than any indicator, chart pattern, or strategy. Start today with the 2% rule. If you started with a bigger rule (5%, 10%), start gradually reducing. Your future self (and your account) will thank you.",

    pos18: isPt
      ? "Porque aqui está a verdade que ninguém quer ouvir: a maioria dos traders não fracassa por falta de análise técnica. Fracassa por falta de disciplina. E disciplina começa com position sizing. Não arrisque tudo para ganhar tudo. Arriske pouco para ganhar consistentemente. Este é o caminho."
      : "Because here is the truth nobody wants to hear: most traders do not fail from lack of technical analysis. They fail from lack of discipline. And discipline starts with position sizing. Do not risk everything to gain everything. Risk little to gain consistently. This is the way.",

    cta: isPt
      ? "Use Trade AI Hub para rastrear seu position sizing, calcular seu risco por trade, e garantir que você está seguindo a regra dos 2%. A ferramenta faz o cálculo para você."
      : "Use Trade AI Hub to track your position sizing, calculate your risk per trade, and ensure you are following the 2% rule. The tool does the calculation for you.",
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      <LandingPageNavbar />

      {/* Hero with Image */}
      <LandingSectionWrapper className="px-4 pt-20 pb-0 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("landing.blogBackToBlog")}
          </Link>
        </div>
      </LandingSectionWrapper>

      <LandingSectionWrapper className="px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="relative h-80 overflow-hidden rounded-2xl mb-8">
            <Image
              src="/blog/blog-position-sizing.png"
              alt="Position Sizing"
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              {t("landing.blogArticle5Title")}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-gray-400">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {content.date}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" />
                8 {t("landing.blogMinRead")}
              </span>
            </div>
          </div>
        </div>
      </LandingSectionWrapper>

      {/* Content */}
      <LandingSectionWrapper className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
              {content.intro1}
            </p>

            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              {content.intro2}
            </p>

            <h2 className="text-3xl font-bold text-white mt-12 mb-6">
              {content.heading1}
            </h2>

            <p className="text-gray-300 mb-4 leading-relaxed">
              {content.pos1}
            </p>

            <p className="text-gray-300 mb-6 leading-relaxed">
              {content.pos2}
            </p>

            <LandingGlassCard className="p-6 mb-8 border border-red-500/30 bg-red-500/10">
              <p className="font-semibold text-red-300 mb-2">
                {content.posBox1.label}
              </p>
              <p className="text-gray-300">{content.posBox1.text}</p>
            </LandingGlassCard>

            <h2 className="text-3xl font-bold text-white mt-12 mb-6">
              {content.heading2}
            </h2>

            <p className="text-gray-300 mb-4 leading-relaxed">
              {content.pos3}
            </p>

            <p className="text-gray-300 mb-4 leading-relaxed">
              {content.pos4}
            </p>

            <p className="text-gray-300 mb-6 leading-relaxed">
              {content.pos5}
            </p>

            <LandingGlassCard className="p-6 mb-8 border border-green-500/30 bg-green-500/10">
              <p className="font-semibold text-green-300 mb-2">
                {content.posBox2.label}
              </p>
              <p className="text-gray-300">{content.posBox2.text}</p>
            </LandingGlassCard>

            <h2 className="text-3xl font-bold text-white mt-12 mb-6">
              {content.heading3}
            </h2>

            <p className="text-gray-300 mb-4 leading-relaxed">
              {content.pos6}
            </p>

            <LandingGlassCard className="p-4 mb-6 border border-gray-600 bg-gray-600/10 font-mono text-sm">
              <p className="text-gray-300">{content.pos7}</p>
            </LandingGlassCard>

            <p className="text-gray-300 mb-4 leading-relaxed">
              {content.pos8}
            </p>

            <LandingGlassCard className="p-4 mb-6 border border-gray-600 bg-gray-600/10 font-mono text-sm">
              <p className="text-gray-300">{content.pos9}</p>
            </LandingGlassCard>

            <p className="text-gray-300 mb-6 leading-relaxed">
              {content.pos10}
            </p>

            <LandingGlassCard className="p-6 mb-8 border border-blue-500/30 bg-blue-500/10">
              <p className="font-semibold text-blue-300 mb-2">
                {content.posBox3.label}
              </p>
              <p className="text-gray-300">{content.posBox3.text}</p>
            </LandingGlassCard>

            <h2 className="text-3xl font-bold text-white mt-12 mb-6">
              {content.heading4}
            </h2>

            <p className="text-gray-300 mb-4 leading-relaxed">
              {content.pos11}
            </p>

            <p className="text-gray-300 mb-8 leading-relaxed">
              {content.pos12}
            </p>

            <h2 className="text-3xl font-bold text-white mt-12 mb-6">
              {content.heading5}
            </h2>

            <p className="text-gray-300 mb-4 leading-relaxed">
              {content.pos13}
            </p>

            <p className="text-gray-300 mb-6 leading-relaxed">
              {content.pos14}
            </p>

            <LandingGlassCard className="p-6 mb-8 border border-yellow-500/30 bg-yellow-500/10">
              <p className="font-semibold text-yellow-300 mb-2">
                {content.posBox4.label}
              </p>
              <p className="text-gray-300">{content.posBox4.text}</p>
            </LandingGlassCard>

            <h2 className="text-3xl font-bold text-white mt-12 mb-6">
              {content.heading6}
            </h2>

            <p className="text-gray-300 mb-4 leading-relaxed">
              {content.pos15}
            </p>

            <p className="text-gray-300 mb-8 leading-relaxed">
              {content.pos16}
            </p>

            <h2 className="text-3xl font-bold text-white mt-12 mb-6">
              {content.heading7}
            </h2>

            <p className="text-gray-300 mb-4 leading-relaxed">
              {content.pos17}
            </p>

            <p className="text-gray-300 mb-8 leading-relaxed">
              {content.pos18}
            </p>
          </div>

          {/* CTA */}
          <LandingGlassCard className="mt-12 p-8 sm:p-10">
            <h3 className="text-2xl font-bold text-white mb-4">
              {t("landing.blogArticleCTA")}
            </h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              {content.cta}
            </p>
            <Link href={`${appUrl}/auth/signup`}>
              <LandingGradientButton className="w-full sm:w-auto">
                {t("landing.blogGetStarted")}
              </LandingGradientButton>
            </Link>
          </LandingGlassCard>
        </div>
      </LandingSectionWrapper>

      <LandingFooter />
    </div>
  )
}
