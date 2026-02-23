"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import type { UserTag } from "@/app/actions/tags";

interface TagAutocompleteProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  userTags: UserTag[];
  maxTags?: number;
}

export function TagAutocomplete({ tags, onTagsChange, userTags, maxTags }: TagAutocompleteProps) {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const tagColorMap = new Map(userTags.map((ut) => [ut.name.toLowerCase(), ut.color]));

  const getTagColor = useCallback(
    (tagName: string): string => {
      return tagColorMap.get(tagName.toLowerCase()) ?? "#7C3AED";
    },
    [tagColorMap]
  );

  const filteredSuggestions = userTags.filter(
    (ut) =>
      ut.name.toLowerCase().includes(input.toLowerCase()) &&
      !tags.includes(ut.name)
  );

  const addTag = useCallback(
    (tagName: string) => {
      const trimmed = tagName.trim();
      if (!trimmed) return;
      if (tags.includes(trimmed)) return;
      if (maxTags && tags.length >= maxTags) return;
      onTagsChange([...tags, trimmed]);
      setInput("");
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
    [tags, onTagsChange, maxTags]
  );

  const removeTag = useCallback(
    (tagName: string) => {
      onTagsChange(tags.filter((t) => t !== tagName));
    },
    [tags, onTagsChange]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && input === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: getTagColor(tag) }}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-full p-0.5 hover:bg-white/20"
              aria-label={`${t("common.delete")} ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? t("trades.selectTag") : ""}
          className="min-w-[80px] flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
          disabled={maxTags !== undefined && tags.length >= maxTags}
        />
      </div>

      {showSuggestions && input.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          <div className="max-h-40 overflow-y-auto py-1">
            {filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((ut) => (
                <button
                  key={ut.id}
                  type="button"
                  onClick={() => addTag(ut.name)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: ut.color }}
                  />
                  <span>{ut.name}</span>
                </button>
              ))
            ) : (
              <button
                type="button"
                onClick={() => addTag(input)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                {t("trades.createTag", { name: input })}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
