/**
 * TDR-11: Pagination utilities
 * Prevents loading entire datasets into memory
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
}

/**
 * Calculate pagination offset
 */
export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

/**
 * Build paginated result
 */
export function buildPaginatedResult<T>(
  data: T[],
  totalCount: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasMore = page < totalPages;

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalPages,
      totalCount,
      hasMore,
    },
  };
}

/**
 * Get safe page number (ensure it's valid)
 */
export function getSafePage(page: number | string | undefined, pageSize: number, totalCount: number): number {
  let safePageNum = 1;

  if (page !== undefined) {
    const parsed = typeof page === "string" ? parseInt(page, 10) : page;
    if (!isNaN(parsed) && parsed > 0) {
      safePageNum = parsed;
    }
  }

  // Ensure page doesn't exceed total pages
  const totalPages = Math.ceil(totalCount / pageSize);
  return Math.min(safePageNum, Math.max(1, totalPages));
}

/**
 * Get safe page size (validate bounds)
 */
export function getSafePageSize(pageSize: number | string | undefined, min = 10, max = 100): number {
  let size = 20; // default

  if (pageSize !== undefined) {
    const parsed = typeof pageSize === "string" ? parseInt(pageSize, 10) : pageSize;
    if (!isNaN(parsed) && parsed > 0) {
      size = parsed;
    }
  }

  return Math.max(min, Math.min(size, max));
}
