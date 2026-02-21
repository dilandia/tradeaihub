/**
 * TDR-11: Pagination UI component
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  hasMore,
}: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", page.toString());
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handlePrevious = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasMore) {
      goToPage(currentPage + 1);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-4 py-6 border-t border-gray-200 dark:border-gray-700">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Página <span className="font-semibold">{currentPage}</span> de{" "}
        <span className="font-semibold">{totalPages}</span> •{" "}
        <span className="font-semibold">{totalCount}</span> registros
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          ← Anterior
        </button>

        {/* Page number input for quick navigation */}
        <input
          type="number"
          min="1"
          max={totalPages}
          value={currentPage}
          onChange={(e) => {
            const page = parseInt(e.target.value, 10);
            if (!isNaN(page) && page >= 1 && page <= totalPages) {
              goToPage(page);
            }
          }}
          className="w-16 px-2 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-center"
        />

        <button
          onClick={handleNext}
          disabled={!hasMore}
          className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          Próxima →
        </button>
      </div>
    </div>
  );
}
