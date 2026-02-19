"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Tag as TagIcon,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createTag,
  updateTag,
  deleteTag,
  type UserTag,
} from "@/app/actions/tags";

/* ─── Constants ─── */

const TAG_COLORS = [
  "#7C3AED", // purple (score)
  "#10B981", // green (profit)
  "#EF4444", // red (loss)
  "#3B82F6", // blue
  "#F59E0B", // amber
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#8B5CF6", // violet
  "#F97316", // orange
  "#14B8A6", // teal
  "#6366F1", // indigo
  "#84CC16", // lime
];

const SUGGESTED_TAGS = [
  "Scalping",
  "Swing",
  "Day Trade",
  "Breakout",
  "Reversão",
  "Tendência",
  "Suporte",
  "Resistência",
  "Fibonacci",
  "Emocional",
  "Overtrading",
  "Notícias",
  "London Open",
  "NY Open",
  "Erro de gestão",
  "Setup A+",
];

/* ─── Tag Badge ─── */

function TagBadge({
  color,
  name,
  count,
}: {
  color: string;
  name: string;
  count?: number;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
      style={{
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
      {count !== undefined && (
        <span className="ml-1 opacity-70">({count})</span>
      )}
    </span>
  );
}

/* ─── Color Picker ─── */

function ColorPicker({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TAG_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
            selected === c ? "border-white scale-110" : "border-transparent"
          )}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

/* ─── Main Component ─── */

type Props = { tags: UserTag[] };

export function TagsManager({ tags: initialTags }: Props) {
  const [isPending, startTransition] = useTransition();
  const [tags, setTags] = useState(initialTags);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  /* Form state */
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(TAG_COLORS[0]);
  const [formDescription, setFormDescription] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function resetForm() {
    setFormName("");
    setFormColor(TAG_COLORS[0]);
    setFormDescription("");
    setIsCreating(false);
    setEditingId(null);
  }

  function startEdit(tag: UserTag) {
    setIsCreating(false);
    setEditingId(tag.id);
    setFormName(tag.name);
    setFormColor(tag.color);
    setFormDescription(tag.description ?? "");
  }

  function handleCreate() {
    setStatus("idle");
    startTransition(async () => {
      const result = await createTag(formName, formColor, formDescription);
      if (result.success) {
        setTags((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: formName.trim(),
            color: formColor,
            description: formDescription.trim() || null,
            created_at: new Date().toISOString(),
            trade_count: 0,
          },
        ]);
        resetForm();
        setStatus("success");
        setStatusMsg("Tag criada!");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setStatusMsg(result.error ?? "Erro ao criar tag.");
      }
    });
  }

  function handleUpdate() {
    if (!editingId) return;
    setStatus("idle");
    startTransition(async () => {
      const result = await updateTag(editingId, formName, formColor, formDescription);
      if (result.success) {
        setTags((prev) =>
          prev.map((t) =>
            t.id === editingId
              ? { ...t, name: formName.trim(), color: formColor, description: formDescription.trim() || null }
              : t
          )
        );
        resetForm();
        setStatus("success");
        setStatusMsg("Tag atualizada!");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setStatusMsg(result.error ?? "Erro ao atualizar.");
      }
    });
  }

  function handleDelete(id: string) {
    setStatus("idle");
    startTransition(async () => {
      const result = await deleteTag(id);
      if (result.success) {
        setTags((prev) => prev.filter((t) => t.id !== id));
        setDeleteConfirm(null);
        setStatus("success");
        setStatusMsg("Tag removida!");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setStatusMsg(result.error ?? "Erro ao deletar.");
      }
    });
  }

  function handleSuggested(name: string) {
    setFormName(name);
    setIsCreating(true);
    setEditingId(null);
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-score transition-colors";

  return (
    <div className="space-y-6">
      {/* ─── Status ─── */}
      {status !== "idle" && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-3 text-sm",
            status === "success" ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
          )}
        >
          {status === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {statusMsg}
        </div>
      )}

      {/* ─── Tags List ─── */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Suas tags ({tags.length})
            </h3>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsCreating(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-score px-3 py-1.5 text-xs font-medium text-white hover:bg-score/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova tag
            </button>
          </div>

          {tags.length === 0 ? (
            <div className="py-8 text-center">
              <TagIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Nenhuma tag criada ainda.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tags ajudam a categorizar suas operações e identificar padrões.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between rounded-lg bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <TagBadge color={tag.color} name={tag.name} />
                    {tag.description && (
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {tag.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {tag.trade_count} trade{tag.trade_count !== 1 ? "s" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(tag)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    {deleteConfirm === tag.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(tag.id)}
                          disabled={isPending}
                          className="rounded bg-loss px-2 py-1 text-xs text-white hover:bg-loss/90"
                        >
                          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sim"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(null)}
                          className="rounded bg-muted px-2 py-1 text-xs text-foreground"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(tag.id)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-loss/10 hover:text-loss transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Create / Edit Form ─── */}
      {(isCreating || editingId) && (
        <Card className="border-score/30">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {editingId ? "Editar tag" : "Nova tag"}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Nome da tag
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Scalping, Breakout, Setup A+"
                  className={inputClass}
                  maxLength={30}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Cor
                </label>
                <ColorPicker selected={formColor} onChange={setFormColor} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Breve descrição para referência"
                  className={inputClass}
                  maxLength={100}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Preview:</span>
                <TagBadge color={formColor} name={formName || "tag"} />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={editingId ? handleUpdate : handleCreate}
                  disabled={isPending || !formName.trim()}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all",
                    formName.trim() && !isPending
                      ? "bg-score hover:bg-score/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {editingId ? "Salvar" : "Criar tag"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Suggested Tags ─── */}
      {!isCreating && !editingId && (
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Tags sugeridas
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Clique para adicionar rapidamente.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TAGS.filter(
                (s) => !tags.some((t) => t.name.toLowerCase() === s.toLowerCase())
              ).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggested(s)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-score hover:text-score"
                >
                  <Hash className="h-3 w-3" />
                  {s}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
