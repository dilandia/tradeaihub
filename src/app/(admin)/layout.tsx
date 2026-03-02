import { verifyAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await verifyAdmin();

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar userEmail={user.email ?? ""} />
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 pt-16 lg:p-8 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
