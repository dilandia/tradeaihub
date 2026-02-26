import type { DocSection } from "@/components/docs/docs-page";

export const DOCS_CONTENT_EN: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "BookOpen" as never,
    articles: [
      {
        id: "create-account",
        title: "Creating Your Account",
        content: `<p>Getting started with Trade AI Hub is quick and easy:</p>
<ol>
<li>Go to <strong>app.tradeaihub.com/register</strong></li>
<li>Enter your email address and create a password (minimum 6 characters)</li>
<li>Click <strong>Sign Up</strong></li>
<li>Check your email inbox for a confirmation link</li>
<li>Click the confirmation link to verify your account</li>
<li>You're ready to go! Log in and start exploring</li>
</ol>
<p><strong>Tip:</strong> If you don't see the confirmation email, check your spam/junk folder. You can also resend it from the login page.</p>`,
      },
      {
        id: "password-recovery",
        title: "Password Recovery",
        content: `<p>Forgot your password? Here's how to reset it:</p>
<ol>
<li>Go to the login page and click <strong>Forgot password?</strong></li>
<li>Enter the email address associated with your account</li>
<li>Click <strong>Send Reset Link</strong></li>
<li>Check your email for the reset link</li>
<li>Click the link and enter your new password</li>
<li>Log in with your new password</li>
</ol>
<p>The reset link expires after 24 hours. If it expires, simply request a new one.</p>`,
      },
      {
        id: "dashboard-overview",
        title: "Understanding the Dashboard",
        content: `<p>Your dashboard is the central hub for all your trading analytics:</p>
<ul>
<li><strong>Key Metrics Bar:</strong> Total P&L, Win Rate, Profit Factor, and more at a glance</li>
<li><strong>Calendar View:</strong> See daily performance with color-coded profit/loss</li>
<li><strong>Trades List:</strong> Browse all your trades with filtering options</li>
<li><strong>Data Source Selector:</strong> Switch between different trading accounts and imports</li>
<li><strong>AI Hub:</strong> Access all AI analysis tools from the sidebar</li>
</ul>
<p>Use the toolbar at the top to filter by date range, tags, and strategies.</p>`,
      },
      {
        id: "choosing-plan",
        title: "Choosing Your Plan",
        content: `<p>Trade AI Hub offers three plans to fit your needs:</p>
<h3>Free Plan</h3>
<ul>
<li>1 manual account, 5 imports/month</li>
<li>3 tags and 3 strategies</li>
<li>Basic dashboard and calendar</li>
</ul>
<h3>Pro Plan — $14.90/month</h3>
<ul>
<li>5 MetaAPI accounts + unlimited manual accounts</li>
<li>Unlimited imports, 50 tags, 20 strategies</li>
<li>60 AI credits/month, PDF export, email reports</li>
</ul>
<h3>Elite Plan — $24.90/month</h3>
<ul>
<li>Everything in Pro + unlimited everything</li>
<li>150 AI credits/month, AI Copilot chat</li>
<li>API access, dedicated support</li>
</ul>
<p><strong>Save ~17%</strong> with annual billing!</p>`,
      },
    ],
  },
  {
    id: "importing-trades",
    title: "Importing Trades",
    icon: "Upload" as never,
    articles: [
      {
        id: "import-mt5",
        title: "Importing from MT5",
        content: `<p>Follow these steps to import your MetaTrader 5 trading history:</p>
<ol>
<li>Open <strong>MetaTrader 5</strong> on your computer</li>
<li>Go to the <strong>History</strong> tab at the bottom of the terminal</li>
<li>Right-click on the history area</li>
<li>Select the <strong>date range</strong> you want to export (Custom Period recommended)</li>
<li>Right-click again and select <strong>Report</strong> → <strong>HTML</strong></li>
<li>Save the file to your computer</li>
<li>Go to Trade AI Hub → <strong>Import</strong> page</li>
<li>Click <strong>Upload</strong> and select your HTML file</li>
<li>Wait for the import to complete — your trades will appear in the dashboard</li>
</ol>
<p><strong>Important:</strong> Always export as <strong>HTML</strong> (not CSV). Our multilingual parser supports MT5 reports in 15+ languages.</p>`,
      },
      {
        id: "import-troubleshooting",
        title: "Troubleshooting Import Issues",
        content: `<h3>Common Issues</h3>
<p><strong>"No trades found"</strong></p>
<ul>
<li>Make sure you selected the correct date range in MT5</li>
<li>The exported file must contain at least one closed trade</li>
</ul>
<p><strong>"File too large"</strong></p>
<ul>
<li>Export a smaller date range (e.g., 1 month at a time)</li>
</ul>
<p><strong>"Parsing error"</strong></p>
<ul>
<li>Ensure you exported as HTML, not CSV or XML</li>
<li>Try re-exporting from MT5 with a different date range</li>
</ul>
<p><strong>"Duplicate trades detected"</strong></p>
<ul>
<li>The system automatically detects and skips duplicate trades</li>
<li>This is normal when importing overlapping date ranges</li>
</ul>`,
      },
      {
        id: "import-history",
        title: "Managing Import History",
        content: `<p>View and manage all your imports in <strong>Settings → Import History</strong>:</p>
<ul>
<li>See file name, trade count, and import date for each import</li>
<li>Delete individual imports (this removes all associated trades)</li>
<li>Track your monthly import usage (Free plan: 5/month, Pro/Elite: unlimited)</li>
</ul>`,
      },
    ],
  },
  {
    id: "trading-features",
    title: "Trading Features",
    icon: "BarChart3" as never,
    articles: [
      {
        id: "calendar-view",
        title: "Calendar View",
        content: `<p>The calendar provides a visual overview of your daily trading performance:</p>
<ul>
<li><strong>Green days:</strong> Profitable trading days</li>
<li><strong>Red days:</strong> Losing trading days</li>
<li><strong>Click any day</strong> to see detailed trades for that day</li>
<li>Each day shows the total P&L amount</li>
<li>Navigate between months using the arrows</li>
</ul>
<p>The day detail view shows all trades with entry/exit prices, P&L, tags, and strategy.</p>`,
      },
      {
        id: "tags-strategies",
        title: "Tags & Strategies",
        content: `<p><strong>Tags</strong> help you categorize trades (e.g., "Scalping", "News Trade", "London Session"):</p>
<ul>
<li>Add tags to trades in the day detail modal</li>
<li>Create and manage tags in <strong>Settings → Tags</strong></li>
<li>Assign colors to tags for visual identification</li>
<li>Filter trades by tags in the toolbar</li>
</ul>
<p><strong>Strategies</strong> let you track which trading strategy you used:</p>
<ul>
<li>Create strategies in <strong>Settings → Strategies</strong></li>
<li>Assign strategies to trades</li>
<li>Analyze performance by strategy</li>
</ul>
<p><strong>Plan limits:</strong> Free: 3 tags/3 strategies | Pro: 50/20 | Elite: unlimited</p>`,
      },
      {
        id: "pdf-export",
        title: "PDF Export",
        content: `<p>Export your performance report as a PDF (Pro/Elite only):</p>
<ol>
<li>Navigate to any dashboard view</li>
<li>Click the <strong>Export PDF</strong> button in the toolbar</li>
<li>The report includes key metrics, charts, and trade summary</li>
<li>The PDF is generated and downloaded automatically</li>
</ol>
<p>Great for sharing with mentors, prop firms, or for your own records.</p>`,
      },
    ],
  },
  {
    id: "ai-features",
    title: "AI Features",
    icon: "Sparkles" as never,
    articles: [
      {
        id: "ai-agents",
        title: "AI Agents Overview",
        content: `<p>Trade AI Hub includes 7 AI-powered analysis agents:</p>
<ol>
<li><strong>Performance Insights:</strong> Summary of your trading performance with strengths and areas for improvement</li>
<li><strong>Pattern Detection:</strong> Identifies recurring patterns in your trading behavior</li>
<li><strong>Risk Analysis:</strong> Evaluates your risk management practices</li>
<li><strong>TakeZ Score:</strong> A proprietary score (0-100) rating your overall trading quality</li>
<li><strong>Compare Analysis:</strong> Compare performance between two time periods</li>
<li><strong>Report Summary:</strong> Generates a text summary for PDF reports</li>
<li><strong>AI Copilot:</strong> Interactive chat assistant for deep analysis (Elite only)</li>
</ol>
<p>Each analysis costs <strong>1 AI credit</strong>. Copilot messages cost <strong>2 credits</strong>.</p>`,
      },
      {
        id: "ai-credits",
        title: "Understanding AI Credits",
        content: `<p>AI credits are used each time you run an AI analysis:</p>
<ul>
<li><strong>Pro plan:</strong> 60 credits/month (auto-renewed)</li>
<li><strong>Elite plan:</strong> 150 credits/month (auto-renewed)</li>
<li><strong>Free plan:</strong> No AI credits</li>
</ul>
<h3>Buying Extra Credits</h3>
<p>Need more? Purchase credit packs in <strong>Settings → Subscription</strong>:</p>
<ul>
<li>20 credits — $2.99</li>
<li>50 credits — $5.99</li>
<li>100 credits — $9.99</li>
</ul>
<p>Purchased credits are added to your balance immediately and never expire.</p>`,
      },
    ],
  },
  {
    id: "account-management",
    title: "Account Management",
    icon: "Settings" as never,
    articles: [
      {
        id: "profile-settings",
        title: "Profile Settings",
        content: `<p>Customize your profile in <strong>Settings → Profile</strong>:</p>
<ul>
<li><strong>Name:</strong> Your display name across the platform</li>
<li><strong>Avatar:</strong> Upload a profile picture</li>
<li><strong>Timezone:</strong> Set your local timezone for accurate trade timestamps</li>
<li><strong>Currency:</strong> Choose your preferred display currency</li>
<li><strong>Language:</strong> Switch between English and Portuguese</li>
</ul>`,
      },
      {
        id: "connected-accounts",
        title: "Connected Trading Accounts",
        content: `<p>Connect your MT5 accounts for automatic trade syncing (Pro/Elite):</p>
<ol>
<li>Go to <strong>Settings → Accounts</strong></li>
<li>Click <strong>Add Account</strong></li>
<li>Enter your MT5 broker, server name, and login credentials</li>
<li>The system connects securely via MetaAPI</li>
<li>Trades will sync automatically in the background</li>
</ol>
<p><strong>Troubleshooting:</strong></p>
<ul>
<li>Verify your MT5 server name is correct (e.g., "ICMarkets-MT5-2")</li>
<li>Ensure your MT5 account credentials are valid</li>
<li>Check that the account type matches (demo vs live)</li>
</ul>`,
      },
      {
        id: "notifications",
        title: "Email Notifications",
        content: `<p>Manage your email preferences in <strong>Settings → Notifications</strong>:</p>
<ul>
<li><strong>Weekly Reports:</strong> Performance summary every Monday</li>
<li><strong>Monthly Reports:</strong> Detailed analysis on the 1st of each month</li>
<li><strong>Trade Alerts:</strong> Notifications about your trading activity</li>
<li><strong>Plan Limit Warnings:</strong> Alerts when approaching plan limits</li>
<li><strong>Security Notifications:</strong> Login alerts and security events</li>
</ul>
<p>All notifications are opt-in — enable only what you want.</p>`,
      },
    ],
  },
  {
    id: "billing-plans",
    title: "Billing & Plans",
    icon: "CreditCard" as never,
    articles: [
      {
        id: "manage-subscription",
        title: "Managing Your Subscription",
        content: `<p>Manage everything about your subscription in <strong>Settings → Subscription</strong>:</p>
<ul>
<li><strong>View your current plan</strong> and billing information</li>
<li><strong>See your active payment method</strong> (card brand, last 4 digits, expiry)</li>
<li><strong>Check next billing date</strong> and amount</li>
<li><strong>Upgrade or downgrade</strong> your plan anytime</li>
<li><strong>Manage on Stripe:</strong> Update payment method, view invoices, cancel</li>
</ul>
<h3>Upgrading</h3>
<p>Click the upgrade button on the plan you want. You'll be redirected to a secure Stripe checkout.</p>
<h3>Downgrading</h3>
<p>Click "Manage on Stripe" to access the Stripe portal where you can change or cancel your plan. When downgrading, you keep access to premium features until the end of your current billing period.</p>
<h3>Cancellation</h3>
<p>You can cancel anytime. Your premium access continues until the end of your paid period. No partial refunds.</p>`,
      },
    ],
  },
  {
    id: "referral-program",
    title: "Referral Program",
    icon: "Users" as never,
    articles: [
      {
        id: "how-referrals-work",
        title: "How Referrals Work",
        content: `<p>Earn AI credits by inviting friends to Trade AI Hub:</p>
<ol>
<li><strong>Share your unique referral link</strong> (found in the Referrals page)</li>
<li>Your friend signs up using your link and gets <strong>10 bonus AI credits</strong></li>
<li>When your friend subscribes to a paid plan, you earn <strong>20 AI credits</strong></li>
</ol>
<p>Track all your referrals, conversions, and rewards in real-time from the Referrals page.</p>`,
      },
    ],
  },
  {
    id: "faq",
    title: "FAQ",
    icon: "HelpCircle" as never,
    articles: [
      {
        id: "common-questions",
        title: "Common Questions",
        content: `<h3>Can I use Trade AI Hub on mobile?</h3>
<p>Yes! The web app is fully responsive and works on all devices. There's no native app yet, but the web experience is optimized for mobile.</p>
<h3>Is my data secure?</h3>
<p>Yes. We use industry-standard encryption, Row Level Security (RLS) on all database tables, and never store trading credentials in plain text. MetaAPI connections are encrypted end-to-end.</p>
<h3>Can I export my data?</h3>
<p>Pro and Elite users can export performance reports as PDF. We're working on CSV export for raw trade data.</p>
<h3>What happens if I cancel my subscription?</h3>
<p>You keep access to premium features until the end of your billing period. After that, your account reverts to the Free plan. Your data is never deleted.</p>
<h3>How do AI agents work?</h3>
<p>Our AI agents analyze your trading data using advanced models. Each analysis costs 1 credit (2 for Copilot). The AI never gives financial advice — it only analyzes your past performance.</p>
<h3>I can't log in. What should I do?</h3>
<ol>
<li>Make sure you confirmed your email (check spam folder)</li>
<li>Try the "Forgot password" flow</li>
<li>Clear your browser cache and cookies</li>
<li>Try an incognito/private window</li>
<li>If nothing works, open a support ticket</li>
</ol>`,
      },
    ],
  },
];

// Portuguese version
export const DOCS_CONTENT_PT: DocSection[] = [
  {
    id: "getting-started",
    title: "Primeiros Passos",
    icon: "BookOpen" as never,
    articles: [
      {
        id: "create-account",
        title: "Criando Sua Conta",
        content: `<p>Começar a usar o Trade AI Hub é rápido e fácil:</p>
<ol>
<li>Acesse <strong>app.tradeaihub.com/register</strong></li>
<li>Digite seu email e crie uma senha (mínimo 6 caracteres)</li>
<li>Clique em <strong>Cadastrar</strong></li>
<li>Verifique seu email para o link de confirmação</li>
<li>Clique no link para verificar sua conta</li>
<li>Pronto! Faça login e comece a explorar</li>
</ol>
<p><strong>Dica:</strong> Se não encontrar o email de confirmação, verifique a pasta de spam. Você também pode reenviar pela página de login.</p>`,
      },
      {
        id: "password-recovery",
        title: "Recuperação de Senha",
        content: `<p>Esqueceu sua senha? Veja como redefinir:</p>
<ol>
<li>Vá para a página de login e clique em <strong>Esqueceu a senha?</strong></li>
<li>Digite o email da sua conta</li>
<li>Clique em <strong>Enviar Link</strong></li>
<li>Verifique seu email para o link de redefinição</li>
<li>Clique no link e digite sua nova senha</li>
<li>Faça login com a nova senha</li>
</ol>
<p>O link expira em 24 horas. Se expirar, solicite um novo.</p>`,
      },
      {
        id: "dashboard-overview",
        title: "Entendendo o Dashboard",
        content: `<p>Seu dashboard é o centro de todas as suas análises de trading:</p>
<ul>
<li><strong>Barra de Métricas:</strong> P&L total, Win Rate, Profit Factor e mais</li>
<li><strong>Calendário:</strong> Veja o desempenho diário com cores de lucro/prejuízo</li>
<li><strong>Lista de Trades:</strong> Navegue por todos os trades com filtros</li>
<li><strong>Seletor de Fonte:</strong> Alterne entre contas e importações</li>
<li><strong>Hub de IA:</strong> Acesse todas as ferramentas de análise IA no menu lateral</li>
</ul>`,
      },
      {
        id: "choosing-plan",
        title: "Escolhendo Seu Plano",
        content: `<p>O Trade AI Hub oferece três planos:</p>
<h3>Plano Free</h3>
<ul><li>1 conta manual, 5 importações/mês, 3 tags e 3 estratégias</li></ul>
<h3>Plano Pro — $14.90/mês</h3>
<ul><li>5 contas MetaAPI, importações ilimitadas, 60 créditos IA/mês, PDF, relatórios</li></ul>
<h3>Plano Elite — $24.90/mês</h3>
<ul><li>Tudo do Pro + ilimitado, 150 créditos IA/mês, AI Copilot, acesso API</li></ul>
<p><strong>Economize ~17%</strong> com plano anual!</p>`,
      },
    ],
  },
  {
    id: "importing-trades",
    title: "Importando Trades",
    icon: "Upload" as never,
    articles: [
      {
        id: "import-mt5",
        title: "Importando do MT5",
        content: `<p>Siga estes passos para importar seu histórico do MetaTrader 5:</p>
<ol>
<li>Abra o <strong>MetaTrader 5</strong> no seu computador</li>
<li>Vá para a aba <strong>Histórico</strong> na parte inferior do terminal</li>
<li>Clique com o botão direito na área de histórico</li>
<li>Selecione o <strong>período</strong> desejado (Período Personalizado recomendado)</li>
<li>Clique com o botão direito novamente e selecione <strong>Relatório</strong> → <strong>HTML</strong></li>
<li>Salve o arquivo no seu computador</li>
<li>Vá para Trade AI Hub → página de <strong>Importação</strong></li>
<li>Clique em <strong>Upload</strong> e selecione o arquivo HTML</li>
<li>Aguarde a importação — seus trades aparecerão no dashboard</li>
</ol>
<p><strong>Importante:</strong> Sempre exporte como <strong>HTML</strong> (não CSV). Nosso parser suporta relatórios MT5 em 15+ idiomas.</p>`,
      },
      {
        id: "import-troubleshooting",
        title: "Resolvendo Problemas de Importação",
        content: `<h3>Problemas Comuns</h3>
<p><strong>"Nenhum trade encontrado"</strong> — Verifique o período selecionado no MT5.</p>
<p><strong>"Arquivo muito grande"</strong> — Exporte um período menor (ex: 1 mês por vez).</p>
<p><strong>"Erro de parsing"</strong> — Certifique-se de exportar como HTML, não CSV.</p>
<p><strong>"Trades duplicados"</strong> — O sistema detecta e ignora duplicatas automaticamente.</p>`,
      },
      {
        id: "import-history",
        title: "Gerenciando Histórico de Importação",
        content: `<p>Veja e gerencie importações em <strong>Configurações → Histórico de Importação</strong>:</p>
<ul>
<li>Nome do arquivo, quantidade de trades e data de importação</li>
<li>Deletar importações individuais (remove os trades associados)</li>
<li>Acompanhar uso mensal (Free: 5/mês, Pro/Elite: ilimitado)</li>
</ul>`,
      },
    ],
  },
  {
    id: "trading-features",
    title: "Recursos de Trading",
    icon: "BarChart3" as never,
    articles: [
      {
        id: "calendar-view",
        title: "Visualização de Calendário",
        content: `<p>O calendário mostra seu desempenho diário:</p>
<ul>
<li><strong>Dias verdes:</strong> Dias lucrativos</li>
<li><strong>Dias vermelhos:</strong> Dias com prejuízo</li>
<li><strong>Clique em qualquer dia</strong> para ver os trades detalhados</li>
</ul>`,
      },
      {
        id: "tags-strategies",
        title: "Tags & Estratégias",
        content: `<p><strong>Tags</strong> ajudam a categorizar trades (ex: "Scalping", "News Trade").</p>
<p><strong>Estratégias</strong> permitem rastrear qual método de trading você usou.</p>
<p>Gerencie em <strong>Configurações → Tags</strong> e <strong>Configurações → Estratégias</strong>.</p>
<p><strong>Limites:</strong> Free: 3/3 | Pro: 50/20 | Elite: ilimitado</p>`,
      },
      {
        id: "pdf-export",
        title: "Exportação PDF",
        content: `<p>Exporte relatórios como PDF (Pro/Elite):</p>
<ol>
<li>Navegue para qualquer vista do dashboard</li>
<li>Clique no botão <strong>Exportar PDF</strong></li>
<li>O relatório é gerado e baixado automaticamente</li>
</ol>`,
      },
    ],
  },
  {
    id: "ai-features",
    title: "Recursos de IA",
    icon: "Sparkles" as never,
    articles: [
      {
        id: "ai-agents",
        title: "Visão Geral dos Agentes IA",
        content: `<p>O Trade AI Hub inclui 7 agentes de análise com IA:</p>
<ol>
<li><strong>Performance Insights:</strong> Resumo do seu desempenho</li>
<li><strong>Detecção de Padrões:</strong> Identifica padrões recorrentes</li>
<li><strong>Análise de Risco:</strong> Avalia sua gestão de risco</li>
<li><strong>TakeZ Score:</strong> Nota de 0-100 da qualidade do seu trading</li>
<li><strong>Análise Comparativa:</strong> Compare dois períodos</li>
<li><strong>Resumo de Relatório:</strong> Gera texto para relatórios PDF</li>
<li><strong>AI Copilot:</strong> Chat interativo (somente Elite)</li>
</ol>
<p>Cada análise custa <strong>1 crédito</strong>. Mensagens do Copilot custam <strong>2 créditos</strong>.</p>`,
      },
      {
        id: "ai-credits",
        title: "Entendendo Créditos de IA",
        content: `<p>Créditos são usados a cada análise IA:</p>
<ul>
<li><strong>Pro:</strong> 60 créditos/mês</li>
<li><strong>Elite:</strong> 150 créditos/mês</li>
<li><strong>Free:</strong> Sem créditos</li>
</ul>
<h3>Comprando Créditos Extra</h3>
<ul><li>20 créditos — $2.99</li><li>50 créditos — $5.99</li><li>100 créditos — $9.99</li></ul>
<p>Créditos comprados não expiram.</p>`,
      },
    ],
  },
  {
    id: "account-management",
    title: "Gerenciamento de Conta",
    icon: "Settings" as never,
    articles: [
      {
        id: "profile-settings",
        title: "Configurações de Perfil",
        content: `<p>Personalize em <strong>Configurações → Perfil</strong>: nome, avatar, fuso horário, moeda e idioma.</p>`,
      },
      {
        id: "connected-accounts",
        title: "Contas de Trading Conectadas",
        content: `<p>Conecte contas MT5 para sincronização automática (Pro/Elite):</p>
<ol>
<li>Vá em <strong>Configurações → Contas</strong></li>
<li>Clique em <strong>Adicionar Conta</strong></li>
<li>Digite corretora, servidor e credenciais do MT5</li>
<li>O sistema conecta via MetaAPI com segurança</li>
</ol>`,
      },
      {
        id: "notifications",
        title: "Notificações por Email",
        content: `<p>Gerencie em <strong>Configurações → Notificações</strong>:</p>
<ul>
<li>Relatórios semanais (toda segunda)</li>
<li>Relatórios mensais (dia 1)</li>
<li>Alertas de trading, limites de plano, segurança</li>
</ul>`,
      },
    ],
  },
  {
    id: "billing-plans",
    title: "Pagamento & Planos",
    icon: "CreditCard" as never,
    articles: [
      {
        id: "manage-subscription",
        title: "Gerenciando Sua Assinatura",
        content: `<p>Gerencie em <strong>Configurações → Assinatura</strong>:</p>
<ul>
<li>Veja seu plano atual e informações de pagamento</li>
<li>Cartão ativo, próxima data de cobrança</li>
<li>Faça upgrade ou downgrade a qualquer momento</li>
<li>"Gerenciar no Stripe" para atualizar cartão ou cancelar</li>
</ul>
<p><strong>Cancelamento:</strong> Pode cancelar a qualquer momento. Acesso premium continua até o fim do período pago.</p>`,
      },
    ],
  },
  {
    id: "referral-program",
    title: "Programa de Indicação",
    icon: "Users" as never,
    articles: [
      {
        id: "how-referrals-work",
        title: "Como Funcionam as Indicações",
        content: `<p>Ganhe créditos IA convidando amigos:</p>
<ol>
<li>Compartilhe seu link único (na página de Indicações)</li>
<li>Seu amigo ganha <strong>10 créditos bônus</strong> ao se cadastrar</li>
<li>Quando ele assina um plano pago, você ganha <strong>20 créditos</strong></li>
</ol>`,
      },
    ],
  },
  {
    id: "faq",
    title: "Perguntas Frequentes",
    icon: "HelpCircle" as never,
    articles: [
      {
        id: "common-questions",
        title: "Perguntas Comuns",
        content: `<h3>Posso usar no celular?</h3>
<p>Sim! O app web é totalmente responsivo e funciona em todos os dispositivos.</p>
<h3>Meus dados estão seguros?</h3>
<p>Sim. Usamos criptografia, Row Level Security (RLS) em todas as tabelas, e credenciais nunca são armazenadas em texto puro.</p>
<h3>O que acontece se eu cancelar?</h3>
<p>Você mantém acesso premium até o fim do período pago. Seus dados nunca são deletados.</p>
<h3>Como funcionam os agentes IA?</h3>
<p>Nossos agentes analisam seus dados de trading com modelos avançados. Cada análise custa 1 crédito. A IA nunca dá conselhos financeiros.</p>
<h3>Não consigo fazer login</h3>
<ol>
<li>Confirme seu email (verifique spam)</li>
<li>Use "Esqueceu a senha?"</li>
<li>Limpe cache do navegador</li>
<li>Tente uma janela anônima</li>
<li>Se nada funcionar, abra um ticket de suporte</li>
</ol>`,
      },
    ],
  },
];
