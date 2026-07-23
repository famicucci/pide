import { redirect } from "next/navigation";
import UserManager from "@/components/admin/UserManager";
import { requireRole } from "@/lib/session";

export default async function AdminUsersPage() {
  const session = await requireRole("admin");
  if (!session) redirect("/login");

  return <UserManager currentUserId={session.userId} />;
}
