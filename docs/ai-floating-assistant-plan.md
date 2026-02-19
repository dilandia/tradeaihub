# Plano: Assistente Flutuante de IA (Botão + Janelinha Chat)

> Manter o botão flutuante "Agentes de IA" como está. Ao clicar, abre uma janelinha flutuante (estilo chat) com opções e chat do Copilot inline.

---

## 1. Visão Geral

**Objetivo:** O botão flutuante permanece igual (pill com ícone + texto). Ao ser clicado:
1. Abre uma **janelinha flutuante** (estilo chat/widget)
2. A janela mostra um "agente" perguntando se o usuário quer ir para a Central de IA ou falar com o AI Copilot
3. Ao clicar em "AI Copilot", o chat abre ali mesmo dentro da janela, sem navegar

**Não é uma barra** – é o botão flutuante atual que, ao clicar, abre a janela.

---

## 2. Estados da Interface

| Estado | Descrição |
|--------|-----------|
| **Fechado** | Só o botão flutuante visível (como hoje) |
| **Aberto – Menu** | Janelinha flutuante com mensagem do agente e botões: "Central de IA" e "AI Copilot" |
| **Aberto – Copilot** | Chat do AI Copilot dentro da mesma janela, sem navegação |

---

## 3. Arquitetura e Componentes

### 3.1 Componente: `AiFloatingAssistant`

Substituir `AiFloatingPill` por um componente que:

- **Botão:** Mantém o mesmo visual do pill atual (gradiente violeta, ícone Sparkles, "Agentes IA")
- **Posição:** Pode ser mantida (ex.: bottom-right) ou movida para o canto esquerdo conforme preferência
- **Janela:** Ao clicar, abre uma janelinha flutuante ao lado/above do botão, estilo chat (bordas arredondadas, sombra, cabeçalho)

### 3.2 Estado interno

```ts
type AssistantView = "closed" | "menu" | "copilot";
```

- `closed`: só o botão visível
- `menu`: janela aberta com a mensagem e os dois botões
- `copilot`: janela aberta com o chat do Copilot (reutilizar `AiCopilotContent` ou versão compacta)

### 3.3 Onde renderizar

No `DashboardShell` – visível em todas as páginas do dashboard. O painel atual está no `dashboard-content`; mover para o shell para que fique sempre visível.

---

## 4. Fluxo de UI

```
[Botão clicado] → Janela abre em estado "menu"
                    → Mensagem: "Onde você quer ir? Central de IA ou AI Copilot?"
                    → Botão "Central de IA" → Link para /ai-hub
                    → Botão "AI Copilot" → Muda para estado "copilot" (chat inline na janela)

[Botão X ou clique fora] → Janela fecha (volta para "closed")
```

---

## 5. Detalhes de Implementação

### 5.1 Botão flutuante

- **Manter:** Mesmo visual do pill atual (`rounded-full`, gradiente, ícone Sparkles, "Agentes IA")
- **Posição:** Pode manter `bottom-6 right-6` ou ajustar para `bottom-6 left-6` (canto esquerdo)
- **Comportamento:** `onClick` abre a janela em vez de navegar para `/ai-hub`

### 5.2 Janelinha flutuante (estilo chat)

- **Posição:** `fixed`, próxima ao botão (ex.: abaixo ou ao lado do botão, como um popover de chat)
- **Dimensões:** `w-96` ou `max-w-md` em menu; `w-[420px]` ou `min-[400px]` em modo Copilot
- **Altura:** `max-h-[calc(100vh-8rem)]` ou similar para não ocupar a tela toda
- **Estilo:** Bordas arredondadas, sombra, cabeçalho com título e botão de fechar
- **Animação:** `framer-motion` para abrir/fechar (scale + fade)

### 5.3 Parâmetros do Copilot inline

O Copilot usa `useAiApiParams()` que lê `import` e `account` da URL. O assistente deve ser renderizado dentro do `DataSourceProvider` para que os parâmetros sejam os mesmos da página atual.

---

## 6. Checklist de Implementação

| # | Tarefa | Arquivo(s) |
|---|--------|------------|
| 1 | Criar `AiFloatingAssistant` com botão (igual ao pill) + janela | `ai-floating-assistant.tsx` |
| 2 | Implementar estado `menu` com mensagem do agente e botões | `ai-floating-assistant.tsx` |
| 3 | Implementar estado `copilot` com chat inline (reutilizar `AiCopilotContent`) | `ai-floating-assistant.tsx` |
| 4 | Adicionar animações de abertura/fechamento (framer-motion) | `ai-floating-assistant.tsx` |
| 5 | Integrar no `DashboardShell` (substituir `AiFloatingPill`) | `dashboard-shell.tsx`, `dashboard-content.tsx` |
| 6 | Remover `AiFloatingPill` do dashboard-content | `dashboard-content.tsx` |
| 7 | Garantir que o assistente fique visível em todas as páginas do dashboard | `dashboard-shell.tsx` |
| 8 | Adicionar textos de i18n (mensagem do agente, botões) | `en.json`, `pt-BR.json` |
| 9 | Ajustar responsividade (janela em mobile) | `ai-floating-assistant.tsx` |
| 10 | Testar fluxo: menu → Central IA (navega) e menu → Copilot (chat inline) | Manual |

---

## 7. Textos e i18n

```json
// Nova chave: aiAssistant
{
  "aiAssistant": {
    "barLabel": "Agentes IA",
    "welcomeMessage": "Onde você quer ir? Posso te levar à Central de IA ou abrir o chat com o AI Copilot.",
    "goToHub": "Central de IA",
    "openCopilot": "AI Copilot"
  }
}
```

---

## 8. Considerações

- **Plan gate:** Se o usuário não tiver plano Pro/Elite, ao clicar em "AI Copilot" pode mostrar o modal de upgrade.
- **Créditos:** O Copilot consome créditos; o `AiCopilotContent` já trata isso.
- **Z-index:** Botão e janela com `z-50` ou superior.
- **Acessibilidade:** Botão com `aria-label`, janela com `role="dialog"` quando aberta.

---

## 9. Ordem de Execução Sugerida

1. Criar `AiFloatingAssistant` com botão + janela em estado menu
2. Integrar no `DashboardShell` e remover `AiFloatingPill` do dashboard
3. Implementar estado Copilot (embed do `AiCopilotContent`)
4. i18n e responsividade
5. Testes e refinamentos
