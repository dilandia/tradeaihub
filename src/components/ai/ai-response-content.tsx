"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";

/** Regex para métricas: %, R$, $, +$, -$, números decimais */
const METRIC_REGEX =
  /(\d+[.,]?\d*%|-?R\$\s*[\d,.]+|\+\$[\d,.]+|-\$[\d,.]+|\$[\d,.]+|\d+[.,]\d+)/g;

/** Pre-processa o conteúdo inserindo spans HTML para destacar métricas (garante que funcione em qualquer estrutura) */
function preprocessMetrics(content: string): string {
  return content.replace(METRIC_REGEX, (value) => {
    const isLoss = value.startsWith("-$") || value.startsWith("-R$");
    const isProfit =
      value.startsWith("+$") ||
      (value.startsWith("$") && !value.startsWith("-$")) ||
      (value.startsWith("R$") && !value.startsWith("-R$"));
    const isPct = value.includes("%");
    const isDecimal = /^\d+[.,]\d+$/.test(value);
    const cls =
      isLoss
        ? "metric-loss"
        : isProfit
          ? "metric-profit"
          : isPct || isDecimal
            ? "metric-pct"
            : "metric-neutral";
    return `<span class="ai-metric ai-metric-${cls}">${value}</span>`;
  });
}

/** Destaca métricas (%, $, +$, -$, números decimais) com cores no texto */
function TextWithMetrics({ text }: { text: string }): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = METRIC_REGEX;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    const value = match[1];
    parts.push(text.slice(lastIndex, match.index));
    const isLoss = value.startsWith("-$");
    const isProfit = value.startsWith("+$") || (value.startsWith("$") && !value.startsWith("-$"));
    const isPct = value.includes("%");
    const isDecimal = /^\d+[.,]\d+$/.test(value);
    const style = isLoss
      ? "bg-red-500/20 text-red-700 dark:text-red-300"
      : isProfit
        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
        : (isPct || isDecimal)
          ? "bg-violet-500/20 text-violet-700 dark:text-violet-300"
          : "bg-muted text-muted-foreground";
    parts.push(
      <span key={key++} className={cn("inline-flex rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums", style)}>
        {value}
      </span>
    );
    lastIndex = match.index + value.length;
  }
  parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}

/** Processa filhos e aplica destaque em métricas; evita [object Object] */
function highlightMetricsInChildren(children: React.ReactNode): React.ReactNode {
  if (children === null || children === undefined) return null;
  if (typeof children === "string") return <TextWithMetrics text={children} />;
  if (typeof children === "number") return <TextWithMetrics text={String(children)} />;
  if (Array.isArray(children)) {
    return children.map((c, i) => (
      <React.Fragment key={i}>{highlightMetricsInChildren(c)}</React.Fragment>
    ));
  }
  if (React.isValidElement(children)) {
    const props = children.props as { children?: React.ReactNode };
    if (props?.children != null) {
      return React.cloneElement(children, {
        children: highlightMetricsInChildren(props.children),
      } as Record<string, unknown>);
    }
    return children;
  }
  // Nunca renderizar objetos (evita [object Object])
  if (typeof children === "object") return null;
  return null;
}

const markdownComponents = {
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-3 last:mb-0 text-foreground/90 leading-relaxed" {...props}>
      {highlightMetricsInChildren(children)}
    </p>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-4 space-y-2 pl-4 list-disc marker:text-violet-500/70" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-4 space-y-2 pl-4 list-decimal marker:text-violet-500/70 marker:font-semibold" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="pl-1 text-foreground/90 leading-relaxed" {...props}>
      {highlightMetricsInChildren(children)}
    </li>
  ),
  h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mb-3 mt-4 first:mt-0 text-lg font-bold text-foreground border-b border-violet-500/20 pb-2" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mb-2 mt-4 first:mt-0 text-base font-semibold text-foreground" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text =
      typeof children === "string"
        ? children
        : Array.isArray(children)
          ? children.map((c) => (typeof c === "string" ? c : "")).join("")
          : "";
    const isFinalInsight = /insight final|final insight/i.test(text);
    return (
      <h3
        className={cn(
          "mb-1.5 mt-3 text-sm font-semibold text-foreground",
          isFinalInsight &&
            "mt-6 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-violet-700 dark:text-violet-300"
        )}
        {...props}
      >
        {children}
      </h3>
    );
  },
};

type Props = {
  content: string;
  className?: string;
};

const metricStyles = `
  .ai-metric { display: inline-flex; align-items: center; border-radius: 0.25rem; padding: 0.125rem 0.375rem; font-size: 0.75rem; font-weight: 600; font-variant-numeric: tabular-nums; }
  .ai-metric-pct { background: rgb(139 92 246 / 0.2); color: rgb(126 34 206); }
  .dark .ai-metric-pct { color: rgb(196 181 253); }
  .ai-metric-profit { background: rgb(16 185 129 / 0.2); color: rgb(4 120 87); }
  .dark .ai-metric-profit { color: rgb(110 231 183); }
  .ai-metric-loss { background: rgb(239 68 68 / 0.2); color: rgb(185 28 28); }
  .dark .ai-metric-loss { color: rgb(252 165 165); }
  .ai-metric-neutral { background: rgb(0 0 0 / 0.05); color: inherit; }
  .dark .ai-metric-neutral { background: rgb(255 255 255 / 0.05); }
`;

export function AiResponseContent({ content, className }: Props) {
  const raw = typeof content === "string" ? content : String(content ?? "");
  const text = preprocessMetrics(raw);
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert ai-response-content",
        "prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90",
        "prose-strong:text-foreground",
        className
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: metricStyles }} />
      <ReactMarkdown rehypePlugins={[rehypeRaw]} components={markdownComponents}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
