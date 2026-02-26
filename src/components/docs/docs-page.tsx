"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import {
  Search,
  BookOpen,
  Upload,
  BarChart3,
  Sparkles,
  Settings,
  CreditCard,
  Users,
  HelpCircle,
  ChevronRight,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DOCS_CONTENT_EN, DOCS_CONTENT_PT } from "@/components/docs/docs-content";

export type DocSection = {
  id: string;
  title: string;
  icon: typeof BookOpen;
  articles: { id: string; title: string; content: string }[];
};

const SECTION_ICONS: Record<string, typeof BookOpen> = {
  "getting-started": BookOpen,
  "importing-trades": Upload,
  "trading-features": BarChart3,
  "ai-features": Sparkles,
  "account-management": Settings,
  "billing-plans": CreditCard,
  "referral-program": Users,
  faq: HelpCircle,
};

export function DocsPage() {
  const { locale } = useLanguage();
  const isPt = locale?.startsWith("pt");

  const sections: DocSection[] = isPt ? DOCS_CONTENT_PT : DOCS_CONTENT_EN;

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeArticle, setActiveArticle] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Search filter
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        articles: section.articles.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.content.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.articles.length > 0);
  }, [sections, searchQuery]);

  const currentSection = sections.find((s) => s.id === activeSection);
  const currentArticle = currentSection?.articles.find((a) => a.id === activeArticle);

  const handleArticleClick = (sectionId: string, articleId: string) => {
    setActiveSection(sectionId);
    setActiveArticle(articleId);
    setMobileSidebarOpen(false);
  };

  const handleBack = () => {
    if (activeArticle) {
      setActiveArticle(null);
    } else {
      setActiveSection(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted"
            >
              {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {(activeSection || activeArticle) && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}

            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">
                {isPt ? "Documentação" : "Documentation"}
              </h1>
              {currentArticle && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentSection?.title} / {currentArticle.title}
                </p>
              )}
            </div>

            {/* Search */}
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) {
                    setActiveSection(null);
                    setActiveArticle(null);
                  }
                }}
                placeholder={isPt ? "Buscar..." : "Search..."}
                className={cn(
                  "w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3",
                  "text-sm text-foreground placeholder:text-muted-foreground",
                  "focus:border-score focus:outline-none focus:ring-1 focus:ring-score"
                )}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside
            className={cn(
              "w-56 shrink-0 space-y-1",
              mobileSidebarOpen
                ? "fixed inset-0 top-[8rem] z-20 bg-background p-4 lg:static lg:bg-transparent lg:p-0"
                : "hidden lg:block"
            )}
          >
            {filteredSections.map((section) => {
              const Icon = SECTION_ICONS[section.id] ?? BookOpen;
              const isActive = activeSection === section.id;

              return (
                <div key={section.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection(isActive ? null : section.id);
                      setActiveArticle(null);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-score/10 text-score font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate text-left">{section.title}</span>
                  </button>

                  {isActive && (
                    <div className="ml-6 mt-1 space-y-0.5 border-l border-border pl-3">
                      {section.articles.map((article) => (
                        <button
                          key={article.id}
                          type="button"
                          onClick={() => handleArticleClick(section.id, article.id)}
                          className={cn(
                            "block w-full rounded px-2 py-1 text-left text-xs transition-colors",
                            activeArticle === article.id
                              ? "text-score font-medium"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {article.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </aside>

          {/* Content */}
          <main className="min-w-0 flex-1">
            {currentArticle ? (
              /* Article content */
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 text-xl font-bold text-foreground">
                  {currentArticle.title}
                </h2>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-foreground
                    prose-headings:text-foreground prose-p:text-foreground/90
                    prose-strong:text-foreground prose-li:text-foreground/90
                    prose-a:text-score prose-code:text-score prose-code:bg-muted/50
                    prose-code:px-1 prose-code:rounded"
                  dangerouslySetInnerHTML={{ __html: currentArticle.content }}
                />
              </div>
            ) : searchQuery ? (
              /* Search results */
              <div className="space-y-3">
                {filteredSections.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <Search className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      {isPt ? "Nenhum resultado encontrado." : "No results found."}
                    </p>
                  </div>
                ) : (
                  filteredSections.map((section) =>
                    section.articles.map((article) => (
                      <button
                        key={article.id}
                        type="button"
                        onClick={() => handleArticleClick(section.id, article.id)}
                        className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/30"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">{section.title}</p>
                          <p className="mt-0.5 font-medium text-foreground">{article.title}</p>
                        </div>
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50" />
                      </button>
                    ))
                  )
                )}
              </div>
            ) : (
              /* Section grid (home) */
              <div className="grid gap-4 sm:grid-cols-2">
                {sections.map((section) => {
                  const Icon = SECTION_ICONS[section.id] ?? BookOpen;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => {
                        setActiveSection(section.id);
                        setMobileSidebarOpen(false);
                      }}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-score"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-score/10">
                        <Icon className="h-5 w-5 text-score" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground">{section.title}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {section.articles.length} {isPt ? "artigos" : "articles"}
                        </p>
                      </div>
                      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/50" />
                    </button>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
