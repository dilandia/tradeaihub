import { getServerSession } from "@/lib/get-session";
import { getPool } from "@/lib/db";
import { redirect } from "next/navigation";

export async function verifyAdmin() {
  const { user } = await getServerSession();

  if (!user) {
    redirect("/login");
  }

  // Verificar role de admin na tabela better_auth_user (fonte da verdade para roles)
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT role FROM better_auth_user WHERE id = $1`,
    [user.id]
  );
  const authUser = rows[0];
  const isAdmin =
    authUser?.role === "admin" || authUser?.role === "super_admin";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return user;
}

export function getServiceClient() {
  // Para operações admin que precisam de acesso direto ao pg sem RLS
  return getPool();
}
