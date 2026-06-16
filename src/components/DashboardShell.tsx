"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ConfirmModal from "@/components/ConfirmModal";
import { signOut } from "next-auth/react";

export default function DashboardShell({ user, children }: { user: any; children: React.ReactNode }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const performSignOut = async () => {
    setShowLogoutModal(false);
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg-base)" }}>
      <Sidebar user={user} onLogoutRequest={() => setShowLogoutModal(true)} />
      <main className="flex-1 md:ml-64 min-h-screen transition-all" style={{ backgroundColor: "var(--bg-base)" }}>
        <div className="p-4 sm:p-6 md:p-8 pt-16 md:pt-8">{children}</div>
      </main>

      <ConfirmModal
        open={showLogoutModal}
        title="Konfirmasi Keluar"
        description="Anda akan keluar dari aplikasi. Lanjutkan?"
        confirmLabel="Keluar"
        cancelLabel="Batal"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={performSignOut}
      />
    </div>
  );
}
