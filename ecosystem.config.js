// PM2 Ecosystem Config — TradeAI Hub
// Uso: pm2 start ecosystem.config.js
// Docs: https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [
    {
      name: "takez-plan",
      script: "npm",
      args: "start",
      cwd: "/home/takez/TakeZ-Plan",

      // Limitar memória do Node.js a 512MB para evitar OOM kill
      node_args: "--max-old-space-size=512",

      // Auto-restart se memória ultrapassar 600MB
      max_memory_restart: "600M",

      // Variáveis de ambiente
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      // Logs
      error_file: "/home/takez/.pm2/logs/takez-plan-error.log",
      out_file: "/home/takez/.pm2/logs/takez-plan-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",

      // Restart policy
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 5000,

      // Não usar watch em produção
      watch: false,
    },
  ],
};
