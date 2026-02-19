Visão Geral do Projeto: SaaS de Journaling e Análise de Métricas para Traders de Forex
O app que quero criar é um SaaS (Software as a Service) focado em traders de forex (principalmente iniciantes e intermediários), inspirado diretamente no TradeZella e em plataformas semelhantes como TraderSync, Edgewonk, TradesViz, Tradervue, Myfxbook e Trademetria.
Objetivo Principal
Criar uma ferramenta "all-in-one" para journaling de trades, análise automática de desempenho e melhoria contínua, ajudando o trader a identificar forças, fraquezas, padrões emocionais e métricas chave para aumentar a consistência e o lucro no forex. O foco é nichado em forex (pares de moedas, pips, sessões de mercado, volatilidade), mas pode suportar multi-ativos no futuro.
O que o TradeZella oferece (inspiração principal – 2026)
TradeZella é uma plataforma moderna de journaling com:

Journaling automatizado (sync com brokers, upload CSV/Excel, entrada manual).
+50 relatórios e métricas automáticas (win rate, risco/recompensa, average pips, holding time, erros comuns, análise por setup/estratégia, performance por sessão – ex.: Londres vs. NY, drawdown, psychology analytics).
Ferramentas avançadas: Playbooks (estratégias), Backtesting 2.0, Trade Replay (revisão histórica com velocidade ajustável), tags para erros/setups.
Integrações: MT4/MT5 e brokers forex.
Comunidade, educação (Zella University), mobile app.
Preços: Basic ~$29/mês ($288/ano), Pro ~$49/mês ($399/ano) – sem free tier robusto.
Pontos fortes: Automação, replay visual, foco em day trading e mindset.
Pontos fracos: Caro, features premium limitadas no basic, menos foco exclusivo em forex comparado a algumas alternativas.

Plataformas Semelhantes e Lições para o Meu App

TraderSync: AI coach (insights automáticos), backtesting hiper-realista com tick data, +900 brokers, bom para forex (layout MT-like). Preço similar ou mais alto.
Edgewonk: Foco em psicologia, risco e padrões comportamentais; import rápido MT4/MT5/cTrader; preço acessível (~$169-197/ano); sem mobile.
TradesViz: 600+ charts/estatísticas, free tier generoso (3.000 trades/mês), dashboards custom, pip analysis por sessão/volatilidade. Preço baixo (~$18-26/mês).
Tradervue: Simples, comunidade forte, bom para sharing; free tier limitado.
Myfxbook: 100% forex/CFD, gratuito com ads, equity curve, drawdown, community feedback.
Trademetria: Multi-moeda, simulador, preço ~$249/ano.

Tendências 2026: Mais AI para insights comportamentais, mobile, integrações com prop firms, free tiers para atrair usuários, foco em visualizações (charts, heatmaps).
O que Meu SaaS Deve Ser (Visão Final)

Nome/conceito: Um "TradeZella acessível e forex-first" – mais barato, com free tier inicial, foco puro em métricas forex (pips, sessões, volatilidade por par, risco por trade, win rate por setup).
Diferenciais pretendidos: Preço competitivo ($9-19/mês pago), IA simples para insights (futuro), import fácil MT4/MT5 via CSV/manual (sync automático depois), relatórios em PDF/email, dashboard clean e mobile-friendly.
Evitar: Over-engineering no início – nada de backtesting/replay/community no MVP.

MVP Específico (Minimum Viable Product – o que criar primeiro)

Funcionalidades chave do MVP:
Autenticação segura (email/senha, JWT).
Import de trades: Upload CSV/Excel de MT4/MT5 + entrada manual (campos: data, par ex. EURUSD, entry/exit price, pips, win/loss, risk/reward, tags).
Journaling básico: Listar trades, adicionar tags (setup, erro emocional etc.).
Métricas essenciais exibidas no dashboard: total trades, win rate (%), avg pips por trade/win/loss, risco/recompensa médio, drawdown simples, performance por par/sessão.
Gráficos básicos (pie chart win/loss, line pips ao longo do tempo).
Geração e envio de relatórios: PDF com métricas + envio por email.

Stack Recomendado (fácil para agents/IA gerar):
Frontend: Next.js (ou React) + Tailwind + Chart.js/Recharts + Axios/Formik.
Backend/DB: Supabase (Postgres + auth integrada) ou Node.js/Express + MongoDB.
Deploy: Vercel (frontend + serverless) + Supabase.
Outros: Stripe para pagamentos, Nodemailer/SendGrid para emails, PapaParse/XLSX para parse CSV/Excel.

Escala inicial: 100-500 usuários, free tier limitado, monetização via planos pagos.

Resumo em uma frase para o agente
"Crie um SaaS inspirado no TradeZella, mas mais acessível e focado em forex: app web com login, import/upload de trades MT4/MT5, dashboard de métricas (win rate, pips, risco etc.), relatórios PDF/email, usando Next.js + Supabase + Vercel, começando pelo MVP essencial sem features avançadas."