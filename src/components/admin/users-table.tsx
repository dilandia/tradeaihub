import Link from "next/link";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PlanBadge } from "@/components/admin/plan-badge";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  plan_id: string | null;
  sub_status: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  trade_count: number;
  ai_credits: number;
}

interface UsersTableProps {
  users: User[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  currentSort: string;
  currentDir: string;
  searchParams: Record<string, string>;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatNumber(num: number | null): string {
  if (num == null) return "0";
  return num.toLocaleString("en-US");
}

function getInitial(name: string | null, email: string): string {
  if (name) return name.charAt(0).toUpperCase();
  return email.charAt(0).toUpperCase();
}

interface SortHeaderProps {
  label: string;
  column: string;
  currentSort: string;
  currentDir: string;
  searchParams: Record<string, string>;
}

function SortHeader({
  label,
  column,
  currentSort,
  currentDir,
  searchParams,
}: SortHeaderProps) {
  const isActive = currentSort === column;
  const nextDir = isActive && currentDir === "asc" ? "desc" : "asc";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value) params.set(key, value);
  }
  params.set("sort", column);
  params.set("dir", nextDir);
  params.set("page", "1");

  const href = `/admin/users?${params.toString()}`;

  return (
    <Link href={href} className="group inline-flex items-center gap-1">
      {label}
      {isActive ? (
        currentDir === "asc" ? (
          <ChevronUp className="h-3.5 w-3.5 text-indigo-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-indigo-400" />
        )
      ) : (
        <ChevronsUpDown className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </Link>
  );
}

function StatusDot({ status }: { status: string }) {
  const isActive = status === "active" || status === "confirmed";
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span
        className={`h-2 w-2 rounded-full ${
          isActive ? "bg-emerald-400" : "bg-slate-500"
        }`}
      />
      <span className="capitalize">{status}</span>
    </span>
  );
}

export function UsersTable({
  users,
  total,
  page,
  perPage,
  totalPages,
  currentSort,
  currentDir,
  searchParams,
}: UsersTableProps) {
  const sortProps = { currentSort, currentDir, searchParams };

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
        <p className="text-lg font-medium text-foreground">No users found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">
                <SortHeader label="Name" column="full_name" {...sortProps} />
              </th>
              <th className="px-4 py-3">
                <SortHeader label="Email" column="email" {...sortProps} />
              </th>
              <th className="px-4 py-3">
                <SortHeader label="Plan" column="plan" {...sortProps} />
              </th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">
                <SortHeader label="Signup" column="created_at" {...sortProps} />
              </th>
              <th className="hidden px-4 py-3 lg:table-cell">
                <SortHeader
                  label="Last Active"
                  column="last_sign_in_at"
                  {...sortProps}
                />
              </th>
              <th className="hidden px-4 py-3 md:table-cell">
                <SortHeader
                  label="Trades"
                  column="trade_count"
                  {...sortProps}
                />
              </th>
              <th className="hidden px-4 py-3 md:table-cell">
                <SortHeader
                  label="AI Credits"
                  column="ai_credits_balance"
                  {...sortProps}
                />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="group transition-colors hover:bg-muted/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-400">
                      {getInitial(user.full_name, user.email)}
                    </div>
                    <span className="font-medium text-foreground group-hover:text-indigo-400">
                      {user.full_name || "--"}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <Link href={`/admin/users/${user.id}`}>
                    {user.email}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <PlanBadge plan={user.sub_status === "active" ? (user.plan_id ?? "free") : "free"} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <StatusDot status={user.sub_status ?? "free"} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(user.created_at)}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                  {formatDate(user.last_sign_in_at)}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {formatNumber(user.trade_count)}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {formatNumber(user.ai_credits)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Showing {(page - 1) * perPage + 1}--
          {Math.min(page * perPage, total)} of {formatNumber(total)} users
        </p>
        <div className="flex items-center gap-1">
          <PaginationLink
            page={page - 1}
            disabled={page <= 1}
            searchParams={searchParams}
            label={<ChevronLeft className="h-4 w-4" />}
          />
          {generatePageNumbers(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="px-2 text-xs text-muted-foreground"
              >
                ...
              </span>
            ) : (
              <PaginationLink
                key={p}
                page={p as number}
                disabled={false}
                searchParams={searchParams}
                label={p}
                isActive={p === page}
              />
            )
          )}
          <PaginationLink
            page={page + 1}
            disabled={page >= totalPages}
            searchParams={searchParams}
            label={<ChevronRight className="h-4 w-4" />}
          />
        </div>
      </div>
    </div>
  );
}

function PaginationLink({
  page,
  disabled,
  searchParams,
  label,
  isActive,
}: {
  page: number;
  disabled: boolean;
  searchParams: Record<string, string>;
  label: React.ReactNode;
  isActive?: boolean;
}) {
  if (disabled) {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-md text-xs text-muted-foreground/40">
        {label}
      </span>
    );
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value) params.set(key, value);
  }
  params.set("page", String(page));

  return (
    <Link
      href={`/admin/users?${params.toString()}`}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors ${
        isActive
          ? "bg-indigo-500/15 text-indigo-400"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

function generatePageNumbers(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (
    let i = Math.max(2, current - 1);
    i <= Math.min(total - 1, current + 1);
    i++
  ) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
