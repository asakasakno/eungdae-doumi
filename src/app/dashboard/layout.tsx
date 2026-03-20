import { Sidebar } from "@/components/dashboard/sidebar";
import { env } from "@/lib/env";
import { getOrCreateProfile, requireUserPage } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUserPage();
  const profile = await getOrCreateProfile(supabase, user.id);

  return (
    <div className="app-shell">
      <Sidebar profile={profile} appName={env.appName} />
      <main className="content-area">{children}</main>
    </div>
  );
}
