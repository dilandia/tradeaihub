# Claude Code + Cursor — TakeZ Plan

Você vai usar **Cursor** (não VS Code) e quer os agentes do AIOS no projeto. Esta é a ordem:

1. **Agora:** Instalar Claude Code
2. **Depois:** Instalar AIOS-core (adiciona os agentes ao projeto)

---

## Passo 1: Instalar Claude Code (CLI)

No **PowerShell** (como administrador ou usuário normal):

```powershell
irm https://claude.ai/install.ps1 | iex
```

**Alternativa (WinGet):**
```powershell
winget install Anthropic.ClaudeCode
```

**Requisito:** Git for Windows (para usar no Git Bash). Se não tiver: https://git-scm.com/downloads/win

---

## Passo 2: Autenticar

Depois da instalação, abra um **novo terminal** e rode:

```powershell
claude
```

Ou no **Git Bash**:
```bash
claude
```

Na primeira vez, vai abrir o navegador para você fazer login na sua conta Claude (Pro ou Max recomendado para Claude Code).

---

## Passo 3: Usar Claude Code no projeto TakeZ Plan

No terminal, na pasta do projeto:

```powershell
cd C:\Users\Diego\Documents\TakeZ-Plan
claude
```

O Claude Code vai carregar o contexto do projeto e você pode pedir ajuda para codar.

---

## Passo 4: Extensão Claude Code no Cursor (opcional)

Para integrar Claude Code ao Cursor como extensão:

1. Instale o Claude Code (Passo 1)
2. Localize o VSIX:
   ```
   %USERPROFILE%\.claude\local\node_modules\@anthropic-ai\claude-code\vendor\claude-code.vsix
   ```
3. No Cursor: **Ctrl+Shift+P** → "Extensions: Install from VSIX"
4. Selecione o arquivo `.vsix`
5. Reinicie o Cursor

---

## Passo 5: Instalar AIOS-core (depois)

Quando quiser os **agentes** (analyst, pm, architect, dev, qa) no projeto:

```powershell
cd C:\Users\Diego\Documents\TakeZ-Plan
npx aios-core@latest install
```

Responda:
- **Nome do projeto:** TakeZ Plan
- **Componentes:** Core + Agent System
- **Gerenciador:** npm
- **IDE:** Cursor

Isso adiciona `.aios-core`, `.aios`, `.claude`, `.cursor` ao projeto. Os agentes ficam disponíveis via `/dev`, `/architect`, `/qa`, etc.

---

## Resumo

| O que | Comando |
|-------|---------|
| Instalar Claude Code | `irm https://claude.ai/install.ps1 \| iex` |
| Abrir Claude Code | `claude` |
| No projeto | `cd TakeZ-Plan` → `claude` |
| AIOS (depois) | `npx aios-core@latest install` |
