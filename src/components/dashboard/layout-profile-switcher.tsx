"use client";

import { useState, useRef, useEffect } from "react";
import { LayoutGrid, ChevronDown, Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import type { useLayoutProfiles } from "@/hooks/use-layout-profiles";

type Props = {
  layoutProfiles: ReturnType<typeof useLayoutProfiles>;
  onApply: (order: string[], hidden: string[]) => void;
  onEditProfile?: (index: 1 | 2) => void;
  onOpenCustomize?: () => void;
};

export function LayoutProfileSwitcher({
  layoutProfiles,
  onApply,
  onEditProfile,
  onOpenCustomize,
}: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<1 | 2 | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  if (!layoutProfiles.loaded) return null;

  const hasAny = layoutProfiles.hasProfile(1) || layoutProfiles.hasProfile(2);
  const canCreate = !layoutProfiles.hasProfile(1) || !layoutProfiles.hasProfile(2);

  const handleSelect = (index: 1 | 2) => {
    const p = layoutProfiles.loadProfile(index);
    if (p) {
      onApply(p.order, p.hidden);
      setOpen(false);
    }
  };

  const handleEdit = (e: React.MouseEvent, index: 1 | 2) => {
    e.stopPropagation();
    onEditProfile?.(index);
    setOpen(false);
  };

  const handleCreate = () => {
    onOpenCustomize?.();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title={t("customize.switchLayoutDesc")}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        )}
      >
        <LayoutGrid className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">{t("customize.myTemplates")}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[220px] rounded-xl border border-border bg-popover py-2 shadow-xl">
          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("customize.myTemplates")}
          </p>

          <div className="py-1">
            {layoutProfiles.hasProfile(1) && (
              <button
                type="button"
                onClick={() => handleSelect(1)}
                onMouseEnter={() => setHovered(1)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                  hovered === 1
                    ? "bg-score/15 text-foreground"
                    : "text-foreground hover:bg-muted/80"
                )}
              >
                <span className="truncate font-medium">
                  {layoutProfiles.getProfileName(1) || t("customize.profile1")}
                </span>
                {onEditProfile && (
                  <button
                    type="button"
                    onClick={(e) => handleEdit(e, 1)}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={t("widgets.customize")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </button>
            )}
            {layoutProfiles.hasProfile(2) && (
              <button
                type="button"
                onClick={() => handleSelect(2)}
                onMouseEnter={() => setHovered(2)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                  hovered === 2
                    ? "bg-score/15 text-foreground"
                    : "text-foreground hover:bg-muted/80"
                )}
              >
                <span className="truncate font-medium">
                  {layoutProfiles.getProfileName(2) || t("customize.profile2")}
                </span>
                {onEditProfile && (
                  <button
                    type="button"
                    onClick={(e) => handleEdit(e, 2)}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={t("widgets.customize")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </button>
            )}
          </div>

          {canCreate && onOpenCustomize && (
            <>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={handleCreate}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-4 w-4 shrink-0" />
                {t("customize.createNewTemplate")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
