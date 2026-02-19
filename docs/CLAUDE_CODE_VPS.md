# Claude Code no VPS — TakeZ Plan

Instalação do Claude Code **no servidor** (Linux), sem usar `sudo`.

---

## Instalação (no terminal do VPS via SSH)

Conecte ao VPS e rode:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Esse script instala em `~/.local/bin` (sua pasta de usuário) e **não precisa de sudo**.

---

## Adicionar ao PATH (se precisar)

Se o comando `claude` não for encontrado após a instalação:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

---

## Usar no projeto

```bash
cd ~/TakeZ-Plan
claude
```

Na primeira vez, vai pedir autenticação (abre o navegador ou mostra um link para login na conta Claude).

---

## Alternativa: npx (sem instalar)

Se preferir não instalar, use direto:

```bash
cd ~/TakeZ-Plan
npx @anthropic-ai/claude-code
```

Roda sem instalação global, mas pode ser mais lento na primeira execução.
