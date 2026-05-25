import { getServerSession } from "@/lib/get-session";
import { getPool } from "@/lib/db";
import { redirect } from "next/navigation";

export async function verifyAdmin() {
  const { user } = await getServerSession();

  if (!user) {
    redirect("/login");
  }

  // Verificar role de admin diretamente no banco
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT role FROM profiles WHERE id = $1`,
    [user.id]
  );
  const profile = rows[0];
  const isAdmin =
    profile?.role === "admin" || profile?.role === "super_admin";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return user;
}

export function getServiceClient() {
  // Para operações admin que precisam de acesso direto ao pg sem RLS
  return getPool();
}
