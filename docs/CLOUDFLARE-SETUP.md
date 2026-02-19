# Configuração Cloudflare – TakeZ Plan / Trade AI Hub

Guia para configurar o Cloudflare no plano **gratuito** para deixar o site rápido e seguro em todas as localizações.

> **Importante:** A integração é feita **100% no painel do Cloudflare**. Não é preciso instalar nada no código do Next.js. O Cloudflare é um proxy CDN na frente do seu VPS.

---

## 1. Aguardar propagação dos nameservers

Após apontar o domínio para o Cloudflare, o painel mostra "Waiting for your registrar to propagate your new nameservers". Geralmente leva de 1 a 2 horas (até 24h em alguns casos).

- Use **"Check nameservers now"** para verificar se já propagou.
- Quando terminar, o status do site mudará para "Active".

---

## 2. DNS – Apontar para o VPS

Quando o site estiver ativo no Cloudflare:

1. Vá em **DNS** → **Records**.
2. Crie ou edite o registro:
   - **Type:** `A`
   - **Name:** `app` (para app.tradeaihub.com) ou `@` (para o domínio raiz)
   - **IPv4 address:** `116.203.190.102`
   - **Proxy status:** Proxied (nuvem laranja)

O proxy (nuvem laranja) é obrigatório para CDN, cache e segurança.

---

## 3. SSL/TLS (segurança)

1. Vá em **SSL/TLS** → **Overview**.
2. Escolha o modo de criptografia:

| Modo | Quando usar |
|------|-------------|
| **Flexible** | Se o VPS não tiver HTTPS (porta 443). |
| **Full** | Se o VPS tiver HTTPS mas com certificado autoassinado. |
| **Full (strict)** | Se o VPS tiver HTTPS com certificado válido (Let's Encrypt). |

**Recomendação:** Use **Full (strict)** se o nginx no VPS já tiver certificado Let's Encrypt. Caso contrário, use **Flexible** temporariamente.

---

## 4. Velocidade (plano gratuito)

1. Vá em **Speed** → **Optimization**.
2. Ative:
   - **Auto Minify:** HTML, CSS, JavaScript
   - **Brotli:** compressão mais eficiente que gzip

3. Em **Cache** → **Configuration**:
   - **Caching Level:** Standard
   - **Browser Cache TTL:** Respect Existing Headers (ou 4 horas)

4. Em **Cache** → **Cache Rules** (opcional):
   - Crie regras para cachear assets estáticos (ex.: `/_next/static/*`, `*.js`, `*.css`).

---

## 5. Segurança (plano gratuito)

1. **Security** → **Settings**:
   - **Security Level:** Medium (ou High para mais proteção)
   - **Bot Fight Mode:** On (proteção contra bots)

2. **Security** → **WAF**:
   - O Managed Ruleset está ativo por padrão.
   - Mantenha o Cloudflare Managed Ruleset em **Block** ou **Log**.

3. **DDoS protection:** já ativada automaticamente.

---

## 6. Resumo – checklist

| Etapa | Onde | Status |
|-------|------|--------|
| Nameservers propagados | Dashboard | ⏳ |
| Registro A para app.tradeaihub.com | DNS → Records | |
| Proxy ativado (nuvem laranja) | DNS | |
| SSL/TLS (Full ou Full strict) | SSL/TLS → Overview | |
| Auto Minify | Speed → Optimization | |
| Brotli | Speed → Optimization | |
| Security Level | Security → Settings | |
| Bot Fight Mode | Security → Settings | |

---

## 7. VPS – HTTPS

Para usar **Full (strict)** no Cloudflare, o VPS precisa de HTTPS com certificado válido:

- Se usar Let's Encrypt no nginx, o Cloudflare já aceita.
- Se ainda não tiver:

```bash
# No VPS (exemplo com certbot)
sudo certbot --nginx -d app.tradeaihub.com
```

---

## 8. Resultado esperado

- CDN global: o site é servido por datacenters próximos ao usuário.
- Cache: menos requisições ao VPS.
- Compressão: menos dados transferidos.
- SSL: HTTPS entre cliente e Cloudflare.
- Proteção: DDoS, bots e WAF.
- IP do VPS oculto: o tráfego passa pelo Cloudflare.

---

## 9. Troubleshooting – Landing vs Login

Se ao acessar `tradeaihub.com` ou `www.tradeaihub.com` você for redirecionado para a página de login em vez da landing:

1. **Purge do cache do Cloudflare**
   - Vá em **Caching** → **Configuration** → **Purge Cache** → **Purge Everything**
   - Ou ative **Development Mode** (temporariamente) em **Caching** → **Configuration** para ignorar o cache durante testes

2. **Nginx no VPS**
   - O `server_name` deve incluir: `tradeaihub.com www.tradeaihub.com app.tradeaihub.com`
   - Execute no VPS: `bash scripts/5-nginx-app-tradeaihub.sh` (ou edite manualmente e faça `sudo nginx -t && sudo systemctl reload nginx`)

3. **Teste em aba anônima**
   - Cookies antigos podem causar redirecionamentos inesperados

---

## Links úteis

- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [DNS Records](https://dash.cloudflare.com/?to=/:account/:zone/dns/records)
- [SSL/TLS](https://dash.cloudflare.com/?to=/:account/:zone/ssl-tls)
- [Speed Optimization](https://dash.cloudflare.com/?to=/:account/:zone/speed/optimization)
- [Security](https://dash.cloudflare.com/?to=/:account/:zone/security)
