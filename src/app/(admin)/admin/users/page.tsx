import { unstable_cache } from "next/cache";
import { Users } from "lucide-react";
import { getServiceClient } from "@/lib/admin-auth";
import { UserSearch } from "@/components/admin/user-search";
import { UsersTable } from "@/components/admin/users-table";

const getUsers = unstable_cache(
  async (
    page: number,
    search: string,
    plan: string,
    sortBy: string,
    sortDir: string
  ) => {
    const supabase = getServiceClient();
    const { data, error } = await supabase.rpc("admin_get_users_paginated", {
      p_page: page,
      p_per_page: 20,
      p_search: search || "",
      p_plan_filter: plan === "all" ? "" : (plan || ""),
      p_sort_by: sortBy,
      p_sort_dir: sortDir,
    });

    if (error) {
      console.error("Failed to fetch users:", error);
      return { users: [], total: 0, page: 1, per_page: 20, total_pages: 0 };
    }

    return data;
  },
  ["admin-users"],
  { revalidate: 30 }
);

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const search = String(params.search ?? "");
  const plan = String(params.plan ?? "all");
  const sortBy = String(params.sort ?? "created_at");
  const sortDir = String(params.dir ?? "desc");

  const data = await getUsers(page, search, plan, sortBy, sortDir);

  const currentSearchParams: Record<string, string> = {};
  if (search) currentSearchParams.search = search;
  if (plan && plan !== "all") currentSearchParams.plan = plan;
  if (sortBy !== "created_at") currentSearchParams.sort = sortBy;
  if (sortDir !== "desc") currentSearchParams.dir = sortDir;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-indigo-500/15 p-2">
          <Users className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">
            {data.total.toLocaleString("en-US")} registered users
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <UserSearch />

      {/* Table */}
      <UsersTable
        users={data.users ?? []}
        total={data.total ?? 0}
        page={data.page ?? page}
        perPage={data.per_page ?? 20}
        totalPages={data.total_pages ?? 0}
        currentSort={sortBy}
        currentDir={sortDir}
        searchParams={currentSearchParams}
      />
    </div>
  );
}
