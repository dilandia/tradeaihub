import { unstable_cache } from "next/cache";
import {
  MessageSquare,
  Inbox,
  Eye,
  CheckCircle2,
  Star,
} from "lucide-react";
import { getServiceClient } from "@/lib/admin-auth";
import { StatCard } from "@/components/admin/stat-card";
import { FeedbackList } from "@/components/admin/feedback-list";

interface FeedbackItem {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  type: string;
  rating: number | null;
  message: string;
  page_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface FeedbackData {
  total: number;
  new_count: number;
  reviewed_count: number;
  resolved_count: number;
  avg_rating: number;
  by_type: Array<{ type: string; count: number }>;
  items: FeedbackItem[];
}

function getFeedbackData(status: string, type: string) {
  return unstable_cache(
    async (): Promise<FeedbackData | null> => {
      const supabase = getServiceClient();
      const { data, error } = await supabase.rpc("admin_get_feedback_list", {
        p_status: status,
        p_type: type,
      });

      if (error) {
        console.error("[admin/feedback] RPC error:", error);
        return null;
      }

      return data as FeedbackData;
    },
    ["admin-feedback", status, type],
    { revalidate: 30 }
  )();
}

interface PageProps {
  searchParams: Promise<{ status?: string; type?: string }>;
}

export default async function AdminFeedbackPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status || "";
  const type = params.type || "";

  const data = await getFeedbackData(status, type);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">
          Failed to load feedback data. Check server logs.
        </p>
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Feedback",
      value: data.total,
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: "New",
      value: data.new_count,
      icon: <Inbox className="h-5 w-5" />,
    },
    {
      title: "Reviewed",
      value: data.reviewed_count,
      icon: <Eye className="h-5 w-5" />,
    },
    {
      title: "Resolved",
      value: data.resolved_count,
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      title: "Avg Rating",
      value: data.avg_rating > 0 ? data.avg_rating.toFixed(1) : "--",
      icon: <Star className="h-5 w-5" />,
      subtitle:
        data.avg_rating > 0
          ? `out of 5`
          : "No ratings yet",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Feedback
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          User feedback and feature requests
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            subtitle={kpi.subtitle}
          />
        ))}
      </div>

      <FeedbackList
        items={data.items}
        currentStatus={status}
        currentType={type}
      />
    </div>
  );
}
