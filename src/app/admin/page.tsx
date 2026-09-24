import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin-panel";

export const metadata: Metadata = {
  title: "Admin · Chá do Matias",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className="flex-1">
      <AdminPanel />
    </main>
  );
}
