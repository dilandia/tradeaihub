import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlanInfo } from "@/lib/plan";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/plan
 * Retorna o PlanInfo do usuário autenticado.
 * Usado pelo PlanContext no client.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planInfo = await getPlanInfo(user.id);
  if (!planInfo) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const res = NextResponse.json(planInfo);
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return res;
}
