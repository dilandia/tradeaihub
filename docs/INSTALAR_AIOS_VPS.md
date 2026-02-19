# Synkra AIOS — Software House Virtual no TakeZ Plan

O [Synkra AIOS](https://github.com/SynkraAI/aios-core) é um framework de desenvolvimento com agentes IA que funciona como uma **software house virtual** — analista, PM, arquiteto, Scrum Master, dev e QA colaboram via comandos e histórias. Você usa o **squad** de agentes para te ajudar a desenvolver o TakeZ Plan.

---

## O que é o AIOS (Software House Virtual)

| Conceito | Descrição |
|----------|-----------|
| **O que é** | Framework de desenvolvimento ágil dirigido por agentes IA (v4.x) |
| **Onde roda** | No seu ambiente de desenvolvimento (Cursor, Claude Code, etc.) |
| **Agentes** | analyst, pm, architect, sm, dev, qa, po, ux-expert, aios-master |
| **Fluxo** | PRD → Arquitetura → Histórias → Dev → QA |
| **IDE** | **Claude Code** (paridade completa), Cursor, Codex CLI, Gemini CLI |

**Importante:** O AIOS não roda 24/7 no servidor. Ele enriquece o **projeto** com agentes, regras e workflows. Quando você desenvolve (local ou via SSH no VPS), os agentes ficam disponíveis via Cursor/Claude Code.

---

## Quando instalar

**Ordem sugerida:**
1. ✅ Setup do VPS (Node, PostgreSQL, Nginx, PM2)
2. ✅ Deploy do TakeZ Plan
3. ✅ **Instalar AIOS no projeto TakeZ Plan**

---

## Instalação no projeto (VPS ou local)

### Opção A: No VPS (se você desenvolve via SSH)

Conecte ao servidor e vá até o projeto:

```bash
ssh -i ~/.ssh/hetzner_takez_new takez@116.203.190.102
cd /home/takez/TakeZ-Plan
```

Instale o AIOS:

```bash
npx aios-core@latest install
```

O instalador interativo vai perguntar:
- **Nome do projeto:** TakeZ Plan
- **Componentes:** Core + Agent System (mínimo)
- **Gerenciador de pacotes:** npm
- **IDE:** **Claude Code** (recomendado — paridade completa de hooks) ou Cursor

### Opção B: Localmente (recomendado)

No seu PC, na pasta do TakeZ Plan:

```powershell
cd C:\Users\Diego\Documents\TakeZ-Plan
npx aios-core@latest install
```

Depois envie as alterações para o VPS (git push + pull no servidor, ou SCP dos novos arquivos).

---

## O que o AIOS adiciona ao projeto

Após `npx aios-core install`, o projeto ganha:

| Pasta/Arquivo | Função |
|---------------|--------|
| `.aios-core/` | Framework, agentes, workflows |
| `.aios/` | Configurações AIOS |
| `.claude/` | Regras para Claude Code |
| `.cursor/rules/` | Regras para Cursor |
| `AGENTS.md` | Descrição dos agentes (Codex CLI) |

---

## Usar os agentes (Claude Code vs Cursor)

### Claude Code (recomendado)

- **Já configurado:** O arquivo `.claude/CLAUDE.md` é carregado automaticamente
- **Ativar agente:** Digite `/dev`, `/architect`, `/qa`, etc.
- **Comandos:** Digite `*help` para ver comandos disponíveis
- **Paridade completa** de hooks e automação

### Cursor

1. Após instalar, abra **Cursor Settings** → **User Rules**
2. Copie o conteúdo de `.cursor/global-rules.md` (se existir)
3. Cole nas regras e salve

Ou use as regras em `.cursor/rules/agents/` — o Cursor carrega automaticamente.

**Ativar um agente:** Digite `/dev` ou `@dev`. Use `*help` para ver comandos.

---

## Agentes disponíveis

| Agente | Função |
|--------|--------|
| **@analyst** | Análise de negócios, criação de PRD |
| **@pm** | Product Manager, priorização |
| **@architect** | Arquitetura e design técnico |
| **@sm** | Scrum Master, histórias de desenvolvimento |
| **@dev** | Desenvolvedor, implementação |
| **@qa** | Garantia de qualidade, testes |
| **@po** | Product Owner, backlog |
| **@ux-expert** | UX e usabilidade |

---

## Fluxo da Software House (Squad)

1. **@analyst** — Cria PRD e análise de negócios
2. **@pm** — Priorização e especificações
3. **@architect** — Arquitetura e design técnico
4. **@sm** — Transforma planos em histórias de desenvolvimento
5. **@dev** — Implementa o código
6. **@qa** — Revisa e testa

O fluxo elimina inconsistência de planejamento e perda de contexto — o agente dev recebe histórias com contexto completo.

---

## Comandos de manutenção

```bash
npx aios-core doctor      # Verificar instalação
npx aios-core info        # Informações do sistema
npx aios-core@latest install   # Atualizar AIOS (preserva customizações)
```

---

## Referências

- [Repositório AIOS](https://github.com/SynkraAI/aios-core)
- [Documentação oficial](https://synkra.ai)
- [Guia do usuário](https://github.com/SynkraAI/aios-core/blob/main/docs/guides/user-guide.md)
