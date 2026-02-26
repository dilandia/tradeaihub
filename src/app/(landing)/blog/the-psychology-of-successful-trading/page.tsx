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

export default function PsychologyArticlePage() {
  const { t, locale } = useLanguage()
  const appUrl = useAppUrl()
  const isPt = locale === "pt-BR"

  const content = {
    date: isPt ? "25 Fev, 2026" : "Feb 25, 2026",

    intro1: isPt
      ? "A maioria dos traders iniciantes pensa que falha por falta de conhecimento técnico. Eles estudam chart patterns, moving averages, suporte e resistência. Eles constroem estratégias que parecem invencíveis em backtests. Mas quando colocam dinheiro real em risco, algo estranho acontece: o medo congela suas ações, a ganância os faz segrar posições vencedoras por muito tempo, e a frustração os leva a fazer trades desesperados. No fim, eles culpam o mercado. A verdade é mais dura: eles falharam não por falta de técnica, mas por falta de domínio emocional."
      : "Most novice traders think they fail because of lack of technical knowledge. They study chart patterns, moving averages, support and resistance. They build strategies that look foolproof in backtests. But when they put real money at risk, something strange happens: fear freezes their actions, greed makes them hold winning positions too long, and frustration drives them to make desperate trades. In the end, they blame the market. The harder truth is: they failed not for lack of technique, but for lack of emotional mastery.",

    intro2: isPt
      ? "Neste artigo, exploraremos as armadilhas psicológicas que destroem contas de traders e como você pode vencê-las. Porque aqui está a boa notícia: trading psychology é uma habilidade que pode ser treinada, e um trading journal com insights baseados em IA pode ser sua arma secreta."
      : "In this article, we will explore the psychological pitfalls that destroy trading accounts and how you can overcome them. Because here is the good news: trading psychology is a skill that can be trained, and a trading journal with AI-powered insights can be your secret weapon.",

    heading1: isPt ? "1. Medo vs. Ganância: Os Dois Vilões" : "1. Fear vs. Greed: The Two Villains",

    psych1: isPt
      ? "Medo e ganância são as duas emoções primárias que controlam os mercados. O medo faz traders vender no pior momento possível (quando os preços caem), porque estão assustados de perder mais. Ganância faz traders comprar no pior momento possível (quando os preços sobem), porque estão animados com os lucros potenciais. Ambas as emoções são o oposto do que você precisa para ganhar dinheiro consistentemente."
      : "Fear and greed are the two primary emotions that control markets. Fear makes traders sell at the worst possible time (when prices are falling) because they are scared of losing more. Greed makes traders buy at the worst possible time (when prices are rising) because they are excited about potential profits. Both emotions are the opposite of what you need to make money consistently.",

    psych2: isPt
      ? "A pesquisa neurocientífica mostra que a dor de uma perda é sentida cerca de 2.5 vezes mais intensamente que a alegria de um ganho equivalente. Isto é chamado de aversão a perdas. Se você arrisca R$100, perder R$100 dói mais do que ganhar R$100 alegra. Isto explica por que traders seguram posições perdedoras esperando \"recuperar\", mesmo quando a probabilidade sugere que deveriam sair. O medo de confirmar a perda é maior que a lógica."
      : "Neuroscience research shows that the pain of a loss is felt about 2.5 times more intensely than the joy of an equivalent gain. This is called loss aversion. If you risk $100, losing $100 hurts more than winning $100 brings pleasure. This explains why traders hold losing positions hoping to \"recover,\" even when the probability suggests they should exit. The fear of confirming the loss is greater than logic.",

    psychBox1: isPt
      ? { label: "O Antídoto:", text: "Implemente regras rígidas antes de operar. Defina seu stop-loss ANTES de entrar no trade, e tenha a disciplina de respeitá-lo. Isto remove a emoção da decisão. Você não está escolhendo em tempo real; você está executando um plano." }
      : { label: "The Antidote:", text: "Implement strict rules before trading. Set your stop-loss BEFORE you enter the trade, and have the discipline to respect it. This removes emotion from the decision. You are not choosing in real-time; you are executing a plan." },

    heading2: isPt ? "2. Overconfidence: O Vilão Silencioso" : "2. Overconfidence: The Silent Killer",

    psych3: isPt
      ? "Overconfidence é a tendência de superestimar suas habilidades e a precisão de sua análise. Um trader tem uma sequência de 5 vitórias e subitamente acredita que descobriu o \"holy grail\" do trading. Começam a aumentar o tamanho das posições. A próxima perda é maior e mais dolorosa. Ou, pior ainda, têm uma sequência de perdas e pensar \"eu estava certo, apenas fui infeliz\" é muito mais confortável que admitir que sua estratégia não funciona."
      : "Overconfidence is the tendency to overestimate your abilities and the accuracy of your analysis. A trader has a winning streak of 5 trades and suddenly believes they have discovered the \"holy grail\" of trading. They start increasing position sizes. The next loss is bigger and more painful. Or worse, they have a losing streak and thinking \"I was right, I was just unlucky\" is much more comfortable than admitting your strategy doesn't work.",

    psych4: isPt
      ? "O problema com overconfidence é que ele te cega para o risco real. Você constrói uma narrativa na sua cabeça: \"Este trade está ganhando porque eu sou inteligente\". A verdade frequentemente é: \"Este trade está ganhando por sorte ou condições de mercado favoráveis\". Quando essas condições mudam, você é pego de surpresa."
      : "The problem with overconfidence is that it blinds you to real risk. You construct a narrative in your head: \"This trade is winning because I am smart.\" The truth is often: \"This trade is winning because of luck or favorable market conditions.\" When those conditions change, you are caught off guard.",

    psychBox2: isPt
      ? { label: "A Cura:", text: "Revise seus trades regularmente com dados, não emoções. Olhe seu profit factor, win rate, e expectancy. Deixe os números decidirem se sua estratégia é realmente boa. Um trading journal com IA automatiza isto e você vê a verdade em tempo real." }
      : { label: "The Cure:", text: "Review your trades regularly with data, not emotions. Look at your profit factor, win rate, and expectancy. Let the numbers decide if your strategy is really good. An AI-powered trading journal automates this and shows you the truth in real-time." },

    heading3: isPt ? "3. Revenge Trading: O Caminho Para o Desastre" : "3. Revenge Trading: The Path to Ruin",

    psych5: isPt
      ? "Você acaba de ter uma sequência de 3 perdas seguidas. Seu saldo caiu 15%. A frustração é real. Você está irritado consigo mesmo. E aqui vem o impulso destrutivo: você quer \"recuperar\" rapidamente. Você aumenta o tamanho de suas posições. Você pega trades de menor qualidade. Você arrisca mais do que planejava. Isto é revenge trading, e é uma das formas mais rápidas de explodir uma conta."
      : "You just had a streak of 3 consecutive losses. Your balance dropped 15%. The frustration is real. You are angry at yourself. And here comes the destructive impulse: you want to \"recover\" quickly. You increase your position sizes. You take lower-quality trades. You risk more than planned. This is revenge trading, and it is one of the fastest ways to blow up an account.",

    psych6: isPt
      ? "Quando você está em estado emocional negativo, seu julgamento se deteriora. Seu prefrontal cortex (a parte do cérebro responsável pela tomada racional de decisões) está menos ativo. Você está operando a partir da amígdala, o centro emocional do seu cérebro. Neste estado, você é basicamente um jogador compulsivo, não um trader racional."
      : "When you are in a negative emotional state, your judgment deteriorates. Your prefrontal cortex (the part of your brain responsible for rational decision-making) is less active. You are operating from your amygdala, the emotional center of your brain. In this state, you are basically a compulsive gambler, not a rational trader.",

    psychBox3: isPt
      ? { label: "Prevenção:", text: "Após 3 perdas seguidas, PARE de operar por aquele dia. Vá caminhar. Medite. Desligue-se. Revise suas operações com cabeça fria no dia seguinte. Uma regra que funciona: máximo 2% de drawdown por dia dispara uma pausa automática." }
      : { label: "Prevention:", text: "After 3 consecutive losses, STOP trading for that day. Go for a walk. Meditate. Disconnect. Review your trades with a cool head the next day. A rule that works: maximum 2% drawdown per day triggers an automatic pause." },

    heading4: isPt ? "4. Anchoring Bias: Preso ao Passado" : "4. Anchoring Bias: Stuck in the Past",

    psych7: isPt
      ? "Você comprou uma moeda no nível 1.2000 e ela caiu para 1.1500. Você está esperando que suba de volta para 1.2000 para \"recuperar\". Está \"ancorado\" ao preço em que entrou. O mercado não se importa onde você entrou. O que importa é a estrutura atual do mercado. Mas seu ego está envolvido. Você quer estar certo, quer \"recuperar\", então mantém uma posição perdedora muito tempo."
      : "You bought a currency at 1.2000 and it dropped to 1.1500. You are waiting for it to bounce back to 1.2000 to \"recover.\" You are anchored to the price where you entered. The market doesn't care where you got in. What matters is the current market structure. But your ego is involved. You want to be right, you want to \"recover,\" so you hold a losing position way too long.",

    psych8: isPt
      ? "O anchoring bias também funciona ao contrário. Se uma ação subiu de R$50 para R$100, você pensa \"Não pode ir mais alto, já subiu muito\". Você vende na metade da tendência porque está ancorado na visão anterior do preço. Novamente, o mercado não se importa com o que você acha que é \"caro\" ou \"barato\" em termos absolutos. Só se importa com estrutura e fluxo."
      : "Anchoring bias also works in reverse. If a stock rose from $50 to $100, you think \"It can't go higher, it has already risen too much.\" You sell halfway through the trend because you are anchored to the previous price view. Again, the market doesn't care what you think is \"expensive\" or \"cheap\" in absolute terms. It only cares about structure and flow.",

    psychBox4: isPt
      ? { label: "A Solução:", text: "Cada vez que você revisar uma operação, pergunte: \"Se eu visse esse preço agora, entraria?\" Se a resposta for não, SAIA. Deixe o passado no passado. Trade o que você vê agora, não o que você esperava." }
      : { label: "The Solution:", text: "Every time you review a trade, ask: \"If I saw this price now, would I enter?\" If the answer is no, EXIT. Leave the past in the past. Trade what you see now, not what you hoped for." },

    heading5: isPt ? "5. Como um Journal com IA Ajuda" : "5. How an AI-Powered Journal Helps",

    psych9: isPt
      ? "A verdade é que você não pode eliminar as emoções do trading. Mas você pode registrá-las, analisá-las e aprender com elas. É aqui que entra a IA."
      : "The truth is you cannot eliminate emotions from trading. But you can record them, analyze them, and learn from them. This is where AI comes in.",

    psych10: isPt
      ? "Um trading journal moderno como Trade AI Hub permite que você:"
      : "A modern trading journal like Trade AI Hub allows you to:",

    psychList: isPt
      ? [
          "Registre sua emoção ANTES e DEPOIS de cada trade (medo, ganância, confiança, frustração)",
          "Visualize padrões: 'Quando estou frustrado, minha win rate cai 15%. Quando estou confiante, aumento o tamanho e perco mais.'",
          "Analise via IA: O agente de Análise de Risco identifica quando você está tomando decisões baseadas em emoção",
          "Saiba quando PARAR: O relatório semanal mostra quantas perdas você cometeu sob stress emocional",
          "Revise com distância: Você vê a verdade dos seus dados, não sua narrativa emocional",
        ]
      : [
          "Record your emotion BEFORE and AFTER each trade (fear, greed, confidence, frustration)",
          "Visualize patterns: 'When I am frustrated, my win rate drops 15%. When I am overconfident, I increase size and lose more.'",
          "Analyze via AI: The Risk Analysis agent identifies when you are making emotional decisions",
          "Know when to STOP: Your weekly report shows how many losses you made under emotional stress",
          "Review with distance: You see the truth of your data, not your emotional narrative",
        ],

    heading6: isPt ? "O Que Fazer Agora" : "The Path Forward",

    psych11: isPt
      ? "Trading psychology não é \"soft skills\". É a diferença entre prosperar e perder tudo. A boa notícia é que cada dia você operando, você está treinando seu cérebro. Cada perda é uma aula. Cada sequência de vitórias é um teste de sua humildade."
      : "Trading psychology is not \"soft skills.\" It is the difference between thriving and losing everything. The good news is that every day you trade, you are training your brain. Every loss is a lesson. Every winning streak is a test of your humility.",

    psych12: isPt
      ? "Comece hoje a registrar suas emoções com seu trading journal. Analise seus dados. Veja seus padrões. E então, mude o comportamento. Não procure perfection; procure por melhoria consistente. Os traders que ganham não têm mais sorte que os outros. Eles têm mais disciplina emocional."
      : "Start today recording your emotions with your trading journal. Analyze your data. See your patterns. And then, change the behavior. Do not seek perfection; seek consistent improvement. Traders who win don't have more luck than others. They have more emotional discipline.",

    cta: isPt
      ? "Comece a rastrear sua psicologia de trading com Trade AI Hub. Registre suas emoções, veja seus padrões, e tome controle do seu destiny."
      : "Start tracking your trading psychology with Trade AI Hub. Record your emotions, see your patterns, and take control of your destiny.",
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
              src="/blog/blog-trading-psychology.png"
              alt="Trading Psychology"
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              {t("landing.blogArticle4Title")}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-gray-400">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {content.date}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" />
                10 {t("landing.blogMinRead")}
              </span>
            </div>
          </div>
        </div>
      </LandingSectionWrapper>

      {/* Content */}
      <LandingSectionWrapper className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="max-w-none">
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
              {content.psych1}
            </p>

            <p className="text-gray-300 mb-6 leading-relaxed">
              {content.psych2}
            </p>

            <LandingGlassCard className="p-6 mb-8 border border-blue-500/30 bg-blue-500/10">
              <p className="font-semibold text-blue-300 mb-2">
                {content.psychBox1.label}
              </p>
              <p className="text-gray-300">{content.psychBox1.text}</p>
            </LandingGlassCard>

            <h2 className="text-3xl font-bold text-white mt-12 mb-6">
              {content.heading2}
            </h2>

            <p className="text-gray-300 mb-4 leading-relaxed">
              {content.psych3}
            </p>

            <p className="text-gray-300 mb-6 leading-relaxed">
              {content.psych4}
            </p>

            <LandingGlassCard className="p-6 mb-8 border border-amber-500/30 bg-amber-500/10">
              <p className="font-semibold text-amber-300 mb-2">
                {content.psychBox2.label}
              </p>
              <p className="text-gray-300">{content.psychBox2.text}</p>
            </LandingGlassCard>

            <h2 className="text-3xl font-bold text-white mt-12 mb-6">
              {content.heading3}
            </h2>

            <p className="text-gray-300 mb-4 leading-relaxed">
              {content.psych5}
            </p>

            <p className="text-gray-300 mb-6 leading-relaxed">
              {content.psych6}
            </p>

            <LandingGlassCard className="p-6 mb-8 border border-red-500/30 bg-red-500/10">
              <p className="font-semibold text-red-300 mb-2">
                {content.psychBox3.label}
              </p>
              <p className="text-gray-300">{content.psychBox3.text}</p>
            </LandingGlassCard>

            <h2 className="text-3xl font-bold text-white mt-12 mb-6">
              {content.heading4}
            </h2>

            <p className="text-gray-300 mb-4 leading-relaxed">
              {content.psych7}
            </p>

            <p className="text-gray-300 mb-6 leading-relaxed">
              {content.psych8}
            </p>

            <LandingGlassCard className="p-6 mb-8 border border-purple-500/30 bg-purple-500/10">
              <p className="font-semibold text-purple-300 mb-2">
                {content.psychBox4.label}
              </p>
              <p className="text-gray-300">{content.psychBox4.text}</p>
            </LandingGlassCard>

            <h2 className="text-3xl font-bold text-white mt-12 mb-6">
              {content.heading5}
            </h2>

            <p className="text-gray-300 mb-4 leading-relaxed">
              {content.psych9}
            </p>

            <p className="text-gray-300 mb-4 leading-relaxed">
              {content.psych10}
            </p>

            <ul className="list-disc list-inside text-gray-300 mb-8 space-y-2">
              {content.psychList.map((item: string, idx: number) => (
                <li key={idx} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>

            <h2 className="text-3xl font-bold text-white mt-12 mb-6">
              {content.heading6}
            </h2>

            <p className="text-gray-300 mb-4 leading-relaxed">
              {content.psych11}
            </p>

            <p className="text-gray-300 mb-8 leading-relaxed">
              {content.psych12}
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
